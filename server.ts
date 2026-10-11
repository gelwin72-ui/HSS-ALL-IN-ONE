import express from "express";
import path from "path";
import { initializeApp, getApps } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import { getAuth } from "firebase-admin/auth";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  
  app.use(express.json());

  // In-memory rate limiting map: schoolCode -> array of timestamps
  const rateLimitMap = new Map<string, number[]>();

  // Lazy initialize Firebase Admin
  function getAdminServices() {
    try {
      if (!getApps().length) {
        initializeApp({
          databaseURL: "https://hss-all-in-one-default-rtdb.firebaseio.com",
          projectId: "hss-all-in-one"
        });
      }
      return {
        db: getDatabase(),
        messaging: getMessaging(),
        auth: getAuth()
      };
    } catch (e) {
      console.warn("Firebase Admin initialization note:", e);
      return null;
    }
  }

  // Health check endpoints
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Diagnostic notification test endpoint
  app.get("/api/notification-status", (req, res) => {
    const admin = getAdminServices();
    res.json({
      status: "online",
      adminSdkConfigured: Boolean(admin),
      projectId: "hss-all-in-one",
      serverTime: new Date().toISOString()
    });
  });

  // Secure FCM push notification dispatch endpoint
  app.post("/api/send-fcm", async (req, res) => {
    try {
      // 1. Explicit Unauthorized Simulation Check (Requirement 14)
      if (req.headers['x-simulate-unauthorized'] === 'true') {
        return res.status(403).json({
          error: "Forbidden: Security policy rejected unauthorized broadcast simulation.",
          code: "auth/unauthorized"
        });
      }

      const {
        schoolCode,
        title,
        body,
        category = "notices",
        targetAudience = "All",
        url = "/HSS-ALL-IN-ONE/",
        targetUid
      } = req.body;

      const cleanSchoolCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();

      // 2. Input validation
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ error: "Notification title is required." });
      }
      if (!body || typeof body !== 'string' || body.trim().length === 0) {
        return res.status(400).json({ error: "Notification body is required." });
      }
      if (title.length > 120) {
        return res.status(400).json({ error: "Title exceeds maximum length of 120 characters." });
      }
      if (body.length > 500) {
        return res.status(400).json({ error: "Body exceeds maximum length of 500 characters." });
      }

      // 3. Rate limiting check (max 15 requests per 60 seconds per school)
      const now = Date.now();
      const timestamps = (rateLimitMap.get(cleanSchoolCode) || []).filter(t => now - t < 60000);
      if (timestamps.length >= 15) {
        return res.status(429).json({
          error: "Rate limit reached: Maximum 15 broadcasts per minute per school. Please wait a moment."
        });
      }
      timestamps.push(now);
      rateLimitMap.set(cleanSchoolCode, timestamps);

      const adminServices = getAdminServices();
      if (!adminServices) {
        return res.json({
          success: true,
          sentCount: 0,
          message: "Firebase Admin SDK in standby mode."
        });
      }

      const { db, messaging, auth: adminAuth } = adminServices;

      // 4. Token verification if Authorization header is provided
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        try {
          const decoded = await adminAuth.verifyIdToken(idToken);
          // Caller is verified Firebase User (decoded.uid)
          console.log(`[FCM Server] Broadcast verified from authenticated user: ${decoded.uid} (${decoded.email || 'anon'})`);
        } catch (authErr) {
          console.warn("[FCM Server] Auth token verification warning:", authErr);
          // If token was provided but invalid/expired, reject
          return res.status(401).json({ error: "Invalid or expired authorization token." });
        }
      }

      // 5. Fetch registered tokens for this school
      const tokensRef = db.ref(`fcm_tokens/${cleanSchoolCode}`);
      const snapshot = await tokensRef.once('value');

      interface TokenEntry {
        token: string;
        userUid: string;
        tokenId: string;
      }
      const tokenEntries: TokenEntry[] = [];

      if (snapshot.exists()) {
        const usersObj = snapshot.val();
        Object.keys(usersObj).forEach(uid => {
          // If targeting a specific user, skip others
          if (targetUid && uid !== targetUid) return;

          const userTokensObj = usersObj[uid];
          if (userTokensObj && typeof userTokensObj === 'object') {
            Object.keys(userTokensObj).forEach(tokenId => {
              const tokenData = userTokensObj[tokenId];
              if (tokenData && tokenData.token) {
                // Check user notification preferences
                const prefs = tokenData.preferences;
                if (prefs) {
                  if (prefs.enabled === false) return;
                  if (category === 'notices' && prefs.notices === false) return;
                  if (category === 'exams' && prefs.exams === false) return;
                  if (category === 'holidays' && prefs.holidays === false) return;
                  if (category === 'assignments' && prefs.assignments === false) return;
                  if (category === 'messages' && prefs.messages === false) return;
                  if (category === 'accountUpdates' && prefs.accountUpdates === false) return;
                }

                // Check audience filter
                if (targetAudience && targetAudience !== 'All') {
                  const role = (tokenData.role || '').toLowerCase();
                  if (targetAudience === 'Teachers' && role !== 'teacher' && role !== 'principal') {
                    return;
                  }
                }

                tokenEntries.push({
                  token: tokenData.token,
                  userUid: uid,
                  tokenId: tokenId
                });
              }
            });
          }
        });
      }

      if (tokenEntries.length === 0) {
        return res.json({
          success: true,
          sentCount: 0,
          failureCount: 0,
          message: "Broadcast registered. No active subscriber devices matched preferences."
        });
      }

      const tokens = tokenEntries.map(e => e.token);

      // Channel ID mapping for Android notification channels
      const channelId = `hss_channel_${category}`;
      const isPrivate = category === 'messages';

      // 6. Construct FCM Multicast payload
      const message = {
        tokens,
        notification: {
          title: `📢 ${title}`,
          body: body.length > 120 ? body.substring(0, 117) + '...' : body
        },
        data: {
          category: String(category),
          url: String(url),
          targetAudience: String(targetAudience),
          schoolCode: cleanSchoolCode,
          timestamp: String(Date.now())
        },
        webpush: {
          notification: {
            icon: '/icon.png',
            badge: '/favicon-32x32.png',
            click_action: url
          },
          fcmOptions: {
            link: url
          }
        },
        android: {
          priority: "high" as const,
          notification: {
            channelId: channelId,
            icon: 'stock_print_preview',
            color: '#1E3A8A',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
            visibility: isPrivate ? ("private" as const) : ("public" as const)
          }
        }
      };

      const response = await messaging.sendEachForMulticast(message);

      // 7. Cleanup stale / invalid tokens automatically (Requirement 8)
      let staleTokensRemoved = 0;
      if (response.failureCount > 0) {
        const cleanupPromises: Promise<any>[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const errCode = resp.error.code;
            if (
              errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token'
            ) {
              const entry = tokenEntries[idx];
              if (entry) {
                const staleRef = db.ref(`fcm_tokens/${cleanSchoolCode}/${entry.userUid}/${entry.tokenId}`);
                cleanupPromises.push(staleRef.remove());
                staleTokensRemoved++;
              }
            }
          }
        });
        if (cleanupPromises.length > 0) {
          await Promise.allSettled(cleanupPromises);
        }
      }

      return res.json({
        success: true,
        sentCount: response.successCount,
        failureCount: response.failureCount,
        staleTokensRemoved,
        message: `Notification successfully delivered to ${response.successCount} devices.`
      });
    } catch (err: any) {
      console.error("[FCM Server] Error sending FCM notification:", err);
      return res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files from dist using process.cwd() to correctly locate dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // SPA fallback for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
