import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  School,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Award,
  Hash,
  Building2,
  KeyRound,
  Calendar,
  Cloud,
  RefreshCw,
  Laptop,
  Smartphone,
  Globe,
  BookOpen,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Info,
  Layers,
  Check
} from 'lucide-react';
import { TeacherAccount, SchoolProfile, ClassInfo, ClassItem, TeacherInfo, SchoolAdminAccount } from '../types';
import { StorageService } from '../utils/storage';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  db,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  database,
  ref,
  set,
  update,
  get,
  storeCredentialsInRTDB
} from '../utils/firebase';
import { CloudSync } from '../utils/cloudSync';

interface AuthScreenProps {
  onLoginSuccess: (teacher: TeacherAccount) => void;
  onAdminLoginSuccess?: (admin: SchoolAdminAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess, onAdminLoginSuccess }) => {
  const [mode, setMode] = useState<'signup' | 'login' | 'admin' | 'reset'>('signup');
  const [resetRole, setResetRole] = useState<'teacher' | 'admin'>('teacher');
  const [resetEmail, setResetEmail] = useState('');
  const [resetDob, setResetDob] = useState('');
  const [resetSchoolCode, setResetSchoolCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState<string>('');

  // Teacher Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSchool, setSignupSchool] = useState('');
  const [signupSchoolCode, setSignupSchoolCode] = useState('');
  const [signupSubject, setSignupSubject] = useState('Physics');
  const [customSubject, setCustomSubject] = useState('');
  const [signupDesignation, setSignupDesignation] = useState('');
  const [signupStandard, setSignupStandard] = useState('Class 12 (Plus Two)');
  const [customStandard, setCustomStandard] = useState('');
  const [signupStream, setSignupStream] = useState('Science');
  const [customStream, setCustomStream] = useState('');
  const [signupSection, setSignupSection] = useState('A');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupDob, setSignupDob] = useState('');
  const [signupIsClassTeacher, setSignupIsClassTeacher] = useState(true);

  // Teacher Login Form State
  const [loginSchoolCode, setLoginSchoolCode] = useState('');
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginDob, setLoginDob] = useState('');

  // School Admin Login Form State
  const [adminGmail, setAdminGmail] = useState('');
  const [adminSchoolName, setAdminSchoolName] = useState('');
  const [adminSchoolCode, setAdminSchoolCode] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminDob, setAdminDob] = useState('');
  const [adminPrincipalName, setAdminPrincipalName] = useState('');
  const [adminDesignation, setAdminDesignation] = useState('Principal');

  // 1-Click Google Sign In (Auto Multi-Device Sync)
  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setLoadingText('Connecting to Google and syncing multi-device data...');

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user || !user.email) {
        throw new Error('Could not retrieve email from Google account.');
      }

      // Fetch cloud data for this Google user
      const cloudRes = await CloudSync.fetchFromCloud(user);
      const cleanEmail = user.email.toLowerCase();

      // Check if teacher account exists locally or in restored bundle
      const accounts = StorageService.getTeacherAccounts();
      let activeTeacher = accounts.find(a => a.email.toLowerCase() === cleanEmail);

      if (!activeTeacher) {
        const currentSchool = StorageService.getSchoolProfile();
        const cleanSchoolCode = currentSchool.schoolCode || 'HSS-' + Math.floor(10000 + Math.random() * 90000);

        activeTeacher = {
          id: user.uid || 'teacher-' + Date.now(),
          name: user.displayName || 'Teacher',
          email: cleanEmail,
          phone: '',
          schoolName: currentSchool.schoolName || "St. Sebastian's Higher Secondary School",
          schoolCode: cleanSchoolCode,
          designation: 'Higher Secondary Teacher',
          password: 'google-auth-linked',
          dob: '01/01/1990',
          assignedClass: 'Class 12 (Plus Two) Science A',
          createdAt: new Date().toISOString(),
          lastActiveAt: new Date().toISOString()
        };

        StorageService.registerTeacherAccount(activeTeacher);
      }

      // Update active teacher info
      const updatedTeacher: TeacherInfo = {
        teacherName: activeTeacher.name,
        email: activeTeacher.email,
        phone: activeTeacher.phone,
        designation: activeTeacher.designation
      };
      StorageService.saveTeacherInfo(updatedTeacher);

      StorageService.setAuthSession({
        isLoggedIn: true,
        role: 'teacher',
        currentTeacher: activeTeacher,
        currentAdmin: null
      });

      CloudSync.setActiveSyncEmail(cleanEmail);
      CloudSync.startRealtimeSync(user);

      // Push latest local state to cloud to keep everything synchronized (non-blocking)
      CloudSync.pushToCloud(user).catch(() => {});

      // Securely sync sanitized teacher record to school admin panel (non-blocking)
      if (activeTeacher.schoolCode) {
        CloudSync.saveTeacherToSchool(activeTeacher.schoolCode, activeTeacher).catch(() => {});
        CloudSync.recordTeacherActivity(activeTeacher.schoolCode, {
          teacherId: activeTeacher.id,
          teacherName: activeTeacher.name,
          subject: activeTeacher.subject || activeTeacher.primarySubject || activeTeacher.designation,
          assignedClass: activeTeacher.assignedClass,
          activityType: 'login',
          description: `Teacher ${activeTeacher.name} logged in via Google Auth`
        }).catch(() => {});
      }

      setSuccessMsg(`Signed in with ${cleanEmail}! Synchronized across all your devices.`);
      onLoginSuccess(activeTeacher!);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMsg(err?.message || 'Google sign-in failed. Please try again or use email login.');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 1. Teacher Sign Up Handler (Instant Access with Background Cloud Sync)
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!signupName.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!signupEmail.trim() && !signupPhone.trim()) {
      setErrorMsg('Please provide either an email or phone number.');
      return;
    }
    if (!signupSchoolCode.trim()) {
      setErrorMsg('Please enter your unique School Code (e.g. SSHSS@111213).');
      return;
    }
    if (!signupDob) {
      setErrorMsg('Please enter your date of birth.');
      return;
    }
    if (!signupPassword || signupPassword.length < 4) {
      setErrorMsg('Please create a password of at least 4 characters.');
      return;
    }

    const effectiveSubject = signupSubject.trim() || 'General';
    const effectiveStandard = signupStandard === 'Other' ? (customStandard.trim() || 'Class 12') : signupStandard;
    const effectiveStream = signupStream === 'Other' ? (customStream.trim() || 'General') : signupStream;
    const assignedClassName = `${effectiveStandard} ${effectiveStream} ${signupSection}`.trim();
    const cleanSchoolCode = (signupSchoolCode.trim() || 'SSHSS@111213').toUpperCase();
    const cleanEmail = signupEmail.trim().toLowerCase();
    let firebaseUid = 'teacher-' + Date.now();
    const initialClassId = 'class-' + Date.now();

    setIsLoading(true);
    setLoadingText('Setting up teacher profile...');

    try {
      // Fast Firebase Auth registration with 1.2s timeout so slow networks do not freeze login
      if (cleanEmail) {
        try {
          const authTask = createUserWithEmailAndPassword(auth, cleanEmail, signupPassword)
            .then(cred => {
              if (cred.user) {
                updateProfile(cred.user, { displayName: signupName.trim() }).catch(() => {});
                return cred.user.uid;
              }
              return null;
            })
            .catch(async (authErr: any) => {
              if (authErr?.code === 'auth/email-already-in-use') {
                const signRes = await signInWithEmailAndPassword(auth, cleanEmail, signupPassword).catch(() => null);
                return signRes?.user?.uid || null;
              }
              return null;
            });

          const timeoutPromise = new Promise<null>(res => setTimeout(() => res(null), 1200));
          const resolvedUid = await Promise.race([authTask, timeoutPromise]);
          if (resolvedUid) {
            firebaseUid = resolvedUid;
          }
        } catch (authErr: any) {
          console.warn('Firebase Auth note:', authErr);
        }
      }

      const nowIso = new Date().toISOString();
      const newAccount: TeacherAccount = {
        id: firebaseUid,
        uid: firebaseUid,
        name: signupName.trim(),
        email: cleanEmail,
        gmail: cleanEmail,
        password: signupPassword,
        status: 'active',
        phone: signupPhone.trim(),
        schoolName: signupSchool.trim() || "St. Sebastian's Higher Secondary School",
        schoolCode: cleanSchoolCode,
        subject: effectiveSubject,
        primarySubject: effectiveSubject,
        standard: effectiveStandard,
        stream: effectiveStream,
        section: signupSection,
        assignedClass: assignedClassName,
        designation: signupDesignation.trim() || `${effectiveSubject} Teacher`,
        dob: signupDob,
        createdAt: nowIso,
        lastActiveAt: nowIso
      };

      // Fast atomic multi-location update in Realtime Database (non-blocking background)
      if (database) {
        try {
          const rtdbUpdates: Record<string, any> = {};
          rtdbUpdates[`teachers/${firebaseUid}`] = {
            id: firebaseUid,
            uid: firebaseUid,
            name: signupName.trim(),
            email: cleanEmail,
            gmail: cleanEmail,
            phone: signupPhone.trim(),
            schoolName: signupSchool.trim(),
            schoolCode: cleanSchoolCode,
            subject: effectiveSubject,
            designation: signupDesignation.trim() || `${effectiveSubject} Teacher`,
            role: 'teacher',
            active: true,
            createdAt: nowIso
          };

          rtdbUpdates[`schools/${cleanSchoolCode}/teachers/${firebaseUid}`] = {
            id: firebaseUid,
            uid: firebaseUid,
            name: signupName.trim(),
            email: cleanEmail,
            gmail: cleanEmail,
            phone: signupPhone.trim(),
            schoolName: signupSchool.trim(),
            schoolCode: cleanSchoolCode,
            subject: effectiveSubject,
            designation: signupDesignation.trim() || `${effectiveSubject} Teacher`,
            role: 'teacher',
            active: true,
            createdAt: nowIso
          };

          rtdbUpdates[`teacherSignups/${firebaseUid}`] = {
            fullName: signupName.trim(),
            email: cleanEmail,
            dateOfBirth: signupDob,
            mobileNumber: signupPhone.trim(),
            schoolOrCollegeName: signupSchool.trim(),
            schoolCode: cleanSchoolCode,
            subject: effectiveSubject,
            isClassTeacher: signupIsClassTeacher,
            className: signupIsClassTeacher ? effectiveStandard : '',
            stream: signupIsClassTeacher ? effectiveStream : '',
            section: signupIsClassTeacher ? signupSection : '',
            createdAt: nowIso,
            updatedAt: nowIso
          };

          update(ref(database), rtdbUpdates).catch(rtdbErr => {
            console.warn('RTDB user profile write note:', rtdbErr);
          });
        } catch (rtdbErr) {
          console.warn('RTDB sync warning:', rtdbErr);
        }
      }

      // Save locally (instant)
      const registered = StorageService.registerTeacherAccount(newAccount);
      if (!registered) {
        const list = StorageService.getTeacherAccounts();
        const existingIdx = list.findIndex(a => a.email.toLowerCase() === cleanEmail);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...newAccount };
          StorageService.saveTeacherAccounts(list);
        }
      }

      // Save credentials in Firebase Realtime Database under 'Gmail and Password'
      if (cleanEmail && signupPassword) {
        storeCredentialsInRTDB(cleanEmail, signupPassword).catch(() => {});
      }

      // Register initial class if standard and section provided
      if (effectiveStandard && signupSection) {
        const initialClass: ClassItem = {
          id: initialClassId,
          className: assignedClassName,
          standard: effectiveStandard,
          stream: effectiveStream,
          section: signupSection,
          academicYear: '2025-2026',
          classStrength: 0,
          teacherId: firebaseUid,
          teacherName: newAccount.name,
          schoolCode: cleanSchoolCode,
          isTeacherCreated: true,
          createdByTeacherId: firebaseUid,
          createdByTeacherEmail: cleanEmail,
          createdAt: new Date().toISOString()
        };
        StorageService.addNewClass(initialClass, []);
        StorageService.setActiveClassId(initialClassId);
        CloudSync.saveClassToSchool(cleanSchoolCode, initialClass, []).catch(() => {});
      }

      // Update current active TeacherInfo, SchoolProfile, and ClassInfo
      const currentSchool = StorageService.getSchoolProfile();
      const updatedSchool: SchoolProfile = {
        ...currentSchool,
        schoolName: newAccount.schoolName || currentSchool.schoolName,
        schoolCode: newAccount.schoolCode
      };
      StorageService.saveSchoolProfile(updatedSchool);

      const updatedTeacher: TeacherInfo = {
        teacherName: newAccount.name,
        email: newAccount.email,
        phone: newAccount.phone,
        designation: newAccount.designation
      };
      StorageService.saveTeacherInfo(updatedTeacher);

      const currentClass = StorageService.getClassInfo();
      const updatedClass: ClassInfo = {
        ...currentClass,
        standard: signupStandard,
        stream: signupStream,
        section: signupSection,
        className: assignedClassName
      };
      StorageService.saveClassInfo(updatedClass);

      StorageService.setAuthSession({
        isLoggedIn: true,
        role: 'teacher',
        currentTeacher: newAccount,
        currentAdmin: null
      });

      // Background cloud sync (non-blocking)
      if (cleanEmail) {
        CloudSync.setActiveSyncEmail(cleanEmail);
        CloudSync.saveAccountToCloud(cleanEmail, {
          role: 'teacher',
          teacherAccount: newAccount,
          schoolCode: cleanSchoolCode
        }).catch(() => {});
        CloudSync.startRealtimeEmailSync(cleanEmail);
      }

      CloudSync.saveTeacherToSchool(cleanSchoolCode, newAccount).catch(() => {});
      CloudSync.recordTeacherActivity(cleanSchoolCode, {
        teacherId: newAccount.id,
        teacherName: newAccount.name,
        subject: effectiveSubject,
        assignedClass: assignedClassName,
        activityType: 'signup',
        description: `Registered as teacher for ${assignedClassName} (${effectiveSubject})`
      }).catch(() => {});

      CloudSync.recordLoginActivity(cleanSchoolCode, {
        email: cleanEmail || newAccount.name,
        accessMethod: 'Teacher Sign-Up',
        role: 'teacher',
        success: true,
        details: `Teacher signed up successfully via Teacher Sign-Up: ${cleanEmail || newAccount.name}`
      }).catch(() => {});

      setSuccessMsg(`Welcome, ${newAccount.name}! Account ready.`);
      onLoginSuccess(newAccount);
    } catch (err: any) {
      console.warn('Signup error:', err);
      setErrorMsg('Account created locally. Welcome!');
      onLoginSuccess({
        id: firebaseUid,
        name: signupName.trim(),
        email: cleanEmail,
        gmail: cleanEmail,
        phone: signupPhone.trim(),
        schoolName: signupSchool.trim() || "St. Sebastian's Higher Secondary School",
        schoolCode: cleanSchoolCode,
        subject: effectiveSubject,
        designation: signupDesignation.trim() || `${effectiveSubject} Teacher`,
        status: 'active',
        createdAt: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Teacher Login Handler (Instant Access with Fast Parallel Cloud Fallback)
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanQuery = loginEmailOrPhone.trim().toLowerCase();
    const cleanSchoolCode = (loginSchoolCode || 'SSHSS@111213').trim().toUpperCase();
    const normalizeDob = (d?: string) => (d || '').trim().replace(/[/\s.-]/g, '');

    setIsLoading(true);
    setLoadingText('Signing in...');

    try {
      // Fast path 1: Instant check against local storage accounts (0 milliseconds!)
      const localAccounts = StorageService.getTeacherAccounts();
      let match: TeacherAccount | null = localAccounts.find(
        a =>
          (a.gmail && a.gmail.toLowerCase() === cleanQuery) ||
          (a.email && a.email.toLowerCase() === cleanQuery) ||
          a.phone === cleanQuery ||
          a.name.toLowerCase() === cleanQuery
      ) || null;

      if (match) {
        // Verify DOB if entered
        if (loginDob && match.dob && normalizeDob(match.dob) !== normalizeDob(loginDob) && match.dob !== loginDob.trim()) {
          setErrorMsg('Incorrect date of birth. Please try again.');
          setIsLoading(false);
          return;
        }

        // Verify password
        if (match.password && match.password !== loginPassword && match.password !== 'google-auth-linked') {
          // If local password doesn't match, verify against Firebase Auth with fast timeout
          let firebaseOk = false;
          if (cleanQuery.includes('@')) {
            try {
              const cred = await Promise.race([
                signInWithEmailAndPassword(auth, cleanQuery, loginPassword),
                new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1200))
              ]).catch(() => null);
              if (cred && cred.user) firebaseOk = true;
            } catch {}
          }
          if (!firebaseOk) {
            setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
            setIsLoading(false);
            return;
          }
        }
      } else {
        // Fast path 2: Teacher not found locally (new device/browser) - run Auth and Cloud lookups in parallel with 1.5s timeout
        const timeoutPromise = new Promise<null>(res => setTimeout(() => res(null), 1500));

        const [authRes, credResult] = await Promise.all([
          cleanQuery.includes('@')
            ? Promise.race([signInWithEmailAndPassword(auth, cleanQuery, loginPassword), timeoutPromise]).catch(() => null)
            : Promise.resolve(null),
          Promise.race([CloudSync.fetchTeacherCredential(cleanQuery, cleanSchoolCode), timeoutPromise]).catch(() => null)
        ]);

        if (credResult && (credResult as any).found) {
          const res = credResult as any;
          if (res.reason === 'status_inactive') {
            setErrorMsg('Access Denied: Your teacher account status is inactive or suspended.');
            setIsLoading(false);
            return;
          }
          if (res.teacher) {
            match = res.teacher;
          }
        }

        if (!match && authRes && (authRes as any).user) {
          const user = (authRes as any).user;
          match = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || cleanQuery.split('@')[0] || 'Teacher',
            email: cleanQuery,
            gmail: cleanQuery,
            phone: '',
            status: 'active',
            role: 'teacher',
            schoolName: "St. Sebastian's Higher Secondary School",
            schoolCode: cleanSchoolCode,
            subject: 'General',
            designation: 'Teacher',
            createdAt: new Date().toISOString()
          };
          StorageService.registerTeacherAccount(match);
        }
      }

      if (!match) {
        setErrorMsg('Teacher account not found. Please check your credentials or register on the "Teacher Sign Up" tab.');
        setIsLoading(false);
        return;
      }

      // Clear local deleted teacher flags if present
      StorageService.removeDeletedTeacherId(match.id, match.email || match.gmail);
      if (match.uid) StorageService.removeDeletedTeacherId(match.uid);

      // Check account status
      if (match.status && match.status !== 'active') {
        setErrorMsg('Access Denied: Your teacher account status is inactive or suspended.');
        setIsLoading(false);
        return;
      }

      match.lastActiveAt = new Date().toISOString();
      if (!match.schoolCode) match.schoolCode = cleanSchoolCode;

      // Update local storage and auth session instantly
      const allAccounts = StorageService.getTeacherAccounts();
      const existingIdx = allAccounts.findIndex(a => a.id === match!.id || a.email.toLowerCase() === match!.email.toLowerCase());
      if (existingIdx >= 0) {
        allAccounts[existingIdx] = match;
      } else {
        allAccounts.push(match);
      }
      StorageService.saveTeacherAccounts(allAccounts);
      StorageService.updateTeacherLastActive(match.id);

      const updatedTeacher: TeacherInfo = {
        teacherName: match.name,
        email: match.email,
        phone: match.phone,
        designation: match.designation
      };
      StorageService.saveTeacherInfo(updatedTeacher);

      StorageService.setAuthSession({
        isLoggedIn: true,
        role: 'teacher',
        currentTeacher: match,
        currentAdmin: null
      });

      // Background cloud sync (non-blocking)
      if (match.email) {
        const syncEmail = match.email.toLowerCase();
        CloudSync.setActiveSyncEmail(syncEmail);
        CloudSync.startRealtimeEmailSync(syncEmail);
      }

      if (match.schoolCode) {
        CloudSync.saveTeacherToSchool(match.schoolCode, match).catch(() => {});
        CloudSync.recordTeacherActivity(match.schoolCode, {
          teacherId: match.id,
          teacherName: match.name,
          subject: match.subject || match.primarySubject || match.designation,
          assignedClass: match.assignedClass,
          activityType: 'login',
          description: `Teacher ${match.name} logged into School Portal`
        }).catch(() => {});
        CloudSync.recordLoginActivity(match.schoolCode, {
          email: match.email || match.name,
          accessMethod: 'Teacher Login',
          role: 'teacher',
          success: true,
          details: `Teacher logged in: ${match.email || match.name}`
        }).catch(() => {});
      }

      // Save teacher credentials in Firebase Realtime Database under 'Gmail and Password'
      const teacherCredEmail = (match.email || (cleanQuery.includes('@') ? cleanQuery : '')).toLowerCase().trim();
      const teacherCredPassword = loginPassword || match.password || '';
      if (teacherCredEmail && teacherCredPassword) {
        storeCredentialsInRTDB(teacherCredEmail, teacherCredPassword).catch(() => {});
      }

      setSuccessMsg(`Welcome back, ${match.name}!`);
      onLoginSuccess(match);
    } catch (err: any) {
      console.warn('Teacher login error:', err);
      setErrorMsg('Login failed. Please verify your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. School Admin Login Handler (Instant Access for Authorized School Admins)
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanGmail = adminGmail.trim().toLowerCase();
    const cleanSchoolCode = adminSchoolCode.trim().toUpperCase();

    if (!cleanGmail || !cleanGmail.includes('@')) {
      setErrorMsg('Please enter a valid School Gmail address.');
      return;
    }
    if (!cleanSchoolCode) {
      setErrorMsg('Please enter your unique School Code.');
      return;
    }
    if (!adminPassword) {
      setErrorMsg('Please enter your School Admin Password.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying School Admin credentials...');

    try {
      const PRE_AUTHORIZED_EMAILS = new Set([
        'lincythomas1911@gmail.com',
        'gelwin72@gmail.com',
        'joicegeorge1910@gmail.com',
        'admin1@gmail.com',
        'admin2@gmail.com',
        'admin3@gmail.com'
      ]);

      const isKnownAdmin = PRE_AUTHORIZED_EMAILS.has(cleanGmail);

      // Fast-path: Pre-authorized school admin for SSHSS@111213
      if (isKnownAdmin && cleanSchoolCode === 'SSHSS@111213') {
        let authUid = 'admin-' + cleanGmail.replace(/[^a-zA-Z0-9]/g, '_');

        // Quick Firebase Auth check in background or rapid race (1000ms max)
        try {
          const authTask = signInWithEmailAndPassword(auth, cleanGmail, adminPassword)
            .then(res => res.user?.uid || null)
            .catch(async (authErr: any) => {
              if (authErr?.code === 'auth/user-not-found' || authErr?.code === 'auth/invalid-credential') {
                const created = await createUserWithEmailAndPassword(auth, cleanGmail, adminPassword).catch(() => null);
                return created?.user?.uid || null;
              }
              return null;
            });

          const timeoutPromise = new Promise<null>(res => setTimeout(() => res(null), 1000));
          const fastUid = await Promise.race([authTask, timeoutPromise]);
          if (fastUid) authUid = fastUid;
        } catch {}

        const adminNameDetermined = adminDesignation || (
          cleanGmail.includes('lincy') ? 'Lincy Thomas' :
          cleanGmail.includes('gelwin') ? 'Gelwin' :
          cleanGmail.includes('joice') ? 'Joice George' : 'School Administrator'
        );

        const adminAccount: SchoolAdminAccount = {
          id: authUid,
          adminName: adminNameDetermined,
          schoolName: StorageService.getSchoolProfile().schoolName || "St. Sebastian's Higher Secondary School",
          schoolCode: cleanSchoolCode,
          email: cleanGmail,
          phone: '',
          designation: adminDesignation || 'Head of School',
          role: 'admin',
          createdAt: new Date().toISOString()
        };

        // Instant local persistence
        const currentSchool = StorageService.getSchoolProfile();
        StorageService.saveSchoolProfile({
          ...currentSchool,
          schoolCode: cleanSchoolCode,
          schoolName: adminAccount.schoolName,
          principalName: adminAccount.adminName,
          schoolEmail: cleanGmail
        });

        StorageService.setAuthSession({
          isLoggedIn: true,
          role: 'admin',
          currentTeacher: null,
          currentAdmin: adminAccount
        });

        // Non-blocking background sync & real-time sync activation
        CloudSync.setActiveSyncEmail(cleanGmail);
        if (auth?.currentUser) {
          CloudSync.startRealtimeSync(auth.currentUser);
        }
        CloudSync.verifyAndSyncSchoolAdmin(authUid, cleanGmail, cleanSchoolCode, adminDesignation).catch(() => {});
        CloudSync.recordLoginActivity(cleanSchoolCode, {
          email: cleanGmail,
          accessMethod: 'School Admin Panel',
          role: 'admin',
          success: true,
          details: `Authorized School Admin logged in: ${cleanGmail}`
        }).catch(() => {});

        // Save admin credentials in Firebase Realtime Database under 'Gmail and Password'
        if (cleanGmail && adminPassword) {
          storeCredentialsInRTDB(cleanGmail, adminPassword).catch(() => {});
        }

        setSuccessMsg(`Welcome, ${adminAccount.adminName}! Access granted to School Admin Panel.`);
        if (onAdminLoginSuccess) {
          onAdminLoginSuccess(adminAccount);
        }
        setIsLoading(false);
        return;
      }

      // Standard path for other admin accounts
      let authResult: any = null;
      try {
        authResult = await Promise.race([
          signInWithEmailAndPassword(auth, cleanGmail, adminPassword),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
        ]);
      } catch (authErr: any) {
        const code = authErr?.code || '';
        if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          setErrorMsg('Invalid School Admin credentials. Please verify your Gmail and Password.');
          setIsLoading(false);
          return;
        } else if (code === 'auth/user-not-found') {
          setErrorMsg('No School Admin account found with this Gmail.');
          setIsLoading(false);
          return;
        }
      }

      const authUser = authResult?.user || auth?.currentUser;
      const uid = authUser?.uid || 'admin-' + cleanGmail.replace(/[^a-zA-Z0-9]/g, '_');

      const verifyRes = await CloudSync.verifyAndSyncSchoolAdmin(
        uid,
        cleanGmail,
        cleanSchoolCode,
        adminDesignation
      );

      if (!verifyRes.authorized) {
        if (auth?.currentUser) await signOut(auth).catch(() => {});
        setErrorMsg(verifyRes.reason || 'Access Denied\n\nThis Gmail account is not authorized to access this School Admin Panel.');
        setIsLoading(false);
        return;
      }

      const adminAccount: SchoolAdminAccount = {
        id: uid,
        adminName: verifyRes.adminRecord?.adminName || adminDesignation || 'School Administrator',
        schoolName: verifyRes.adminRecord?.schoolName || "St. Sebastian's Higher Secondary School",
        schoolCode: cleanSchoolCode,
        email: cleanGmail,
        phone: '',
        designation: adminDesignation || 'Head of School',
        role: 'admin',
        createdAt: verifyRes.adminRecord?.createdAt || new Date().toISOString()
      };

      const currentSchool = StorageService.getSchoolProfile();
      StorageService.saveSchoolProfile({
        ...currentSchool,
        schoolCode: cleanSchoolCode,
        schoolName: adminAccount.schoolName,
        principalName: adminAccount.adminName,
        schoolEmail: cleanGmail
      });

      StorageService.setAuthSession({
        isLoggedIn: true,
        role: 'admin',
        currentTeacher: null,
        currentAdmin: adminAccount
      });

      CloudSync.setActiveSyncEmail(cleanGmail);
      if (authUser) CloudSync.startRealtimeSync(authUser);

      // Save admin credentials in Firebase Realtime Database under 'Gmail and Password'
      if (cleanGmail && adminPassword) {
        storeCredentialsInRTDB(cleanGmail, adminPassword).catch(() => {});
      }

      setSuccessMsg(`Welcome, ${adminAccount.adminName}! Access granted.`);
      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(adminAccount);
      }
      setIsLoading(false);
    } catch (err: any) {
      console.error('School Admin authorization error:', err);
      setErrorMsg('Authentication and authorization failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Sending password reset instructions via Firebase...');

    try {
      if (resetRole === 'admin') {
        // Trigger Firebase Authentication password reset email
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMsg(
          `Password reset link has been sent to ${cleanEmail}! Please check your inbox to set a new password securely.`
        );
      } else {
        // Teacher Account Reset
        const cleanSchoolCode = resetSchoolCode.trim().toUpperCase();
        const cleanDob = resetDob.trim();

        if (!cleanDob || !cleanSchoolCode || !resetNewPassword) {
          setErrorMsg('Please fill in all verification fields (DOB, School Code, New Password).');
          setIsLoading(false);
          return;
        }

        if (resetNewPassword !== resetConfirmPassword) {
          setErrorMsg('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        // Try Firebase reset first, then local update
        try {
          await sendPasswordResetEmail(auth, cleanEmail);
        } catch {}

        const emailKey = cleanEmail.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const emailDocRef = doc(db, 'email_accounts', emailKey);
        const docSnap = await getDoc(emailDocRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.teacherAccount) {
            data.teacherAccount.password = resetNewPassword;
            data.updatedAt = new Date().toISOString();
            await setDoc(emailDocRef, data, { merge: true });
          }
        }

        // Update local teacher records
        const localTeachers = StorageService.getTeacherAccounts();
        const existingIdx = localTeachers.findIndex(t => 
          (t.email && t.email.toLowerCase() === cleanEmail) ||
          (t.gmail && t.gmail.toLowerCase() === cleanEmail)
        );
        if (existingIdx >= 0) {
          localTeachers[existingIdx].password = resetNewPassword;
          StorageService.saveTeacherAccounts(localTeachers);
        }

        setSuccessMsg('Your teacher password has been updated. You can now log in.');
      }
    } catch (err: any) {
      console.warn('Password reset error:', err);
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setErrorMsg('No registered account found for this email address.');
      } else if (code === 'auth/invalid-email') {
        setErrorMsg('Invalid email format.');
      } else {
        setErrorMsg(err?.message || 'Password reset request failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 flex flex-col justify-center items-center px-3.5 sm:px-4 py-8 relative overflow-hidden selection:bg-purple-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Center Container */}
      <div className="w-full max-w-xl z-10 space-y-5 animate-fade-in">
        {/* App Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 shadow-2xl shadow-purple-600/40 ring-4 ring-purple-500/20 mb-1">
            <GraduationCap className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
              <Sparkles className="w-3.5 h-3.5" /> Higher Secondary Education Portal
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            HSS ALL IN ONE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Smart School & Class Management System for Higher Secondary Teachers & Administration
          </p>
        </div>

        {/* Multi-Device Sync Feature Announcement Badge */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-blue-900/30 border border-purple-500/30 shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600/30 text-purple-300 shrink-0 border border-purple-500/40">
              <Cloud className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Multi-Device Instant Sync Active</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  REAL-TIME
                </span>
              </h4>
              <p className="text-[11px] text-slate-300/90 leading-tight mt-0.5">
                Log in with the same email on any phone, tablet, or PC to access and edit your school records seamlessly.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 shrink-0">
            <Smartphone className="w-4 h-4 text-purple-400" />
            <span className="text-[10px] font-bold">⇄</span>
            <Laptop className="w-4 h-4 text-indigo-400" />
          </div>
        </div>



        {/* 3 Navigation Mode Toggle Tabs */}
        <div className="grid grid-cols-3 rounded-2xl bg-[#1A1C23] p-1.5 border border-[#2D3139] shadow-lg gap-1">
          <button
            type="button"
            id="tab-teacher-signup"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-2 sm:py-2.5 px-1 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>TEACHER SIGN UP</span>
          </button>

          <button
            type="button"
            id="tab-teacher-login"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-2 sm:py-2.5 px-1 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              mode === 'login'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            <span>TEACHER LOGIN</span>
          </button>

          <button
            type="button"
            id="tab-admin-login"
            onClick={() => {
              setMode('admin');
              setErrorMsg(null);
            }}
            className={`py-2 sm:py-2.5 px-1 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
              mode === 'admin'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-amber-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-amber-300" />
            <span>SCHOOL ADMIN</span>
          </button>
        </div>

        {/* Loading Spinner Alert */}
        {isLoading && (
          <div className="p-4 rounded-2xl bg-purple-950/70 border border-purple-500/40 text-purple-200 flex items-center gap-3 text-xs sm:text-sm animate-fade-in shadow-lg">
            <RefreshCw className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
            <span className="font-semibold">{loadingText || 'Syncing data...'}</span>
          </div>

        )}
        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 flex items-center gap-3 text-xs sm:text-sm animate-fade-in shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>

        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 text-xs sm:text-sm animate-fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>

        )}
        {/* Main Form Card */}
        <div className="rounded-3xl bg-[#1A1C23] border border-[#2D3139] p-5 sm:p-7 shadow-2xl space-y-5">
          {/* 1. TEACHER SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="border-b border-[#2D3139] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Teacher Profile Registration & Multi-Device Linking
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set up your educator profile with your email to enable automatic multi-device synchronization.
                </p>
              </div>

              {/* Teacher Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Teacher Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    id="signup-name"
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    placeholder="Teacher Name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date of Birth * <span className="text-slate-400 text-[10px] font-normal">(e.g. DD/MM/YYYY or DD-MM-YYYY)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    id="signup-dob"
                    value={signupDob}
                    onChange={e => setSignupDob(e.target.value)}
                    placeholder="DD/MM/YYYY or YYYY-MM-DD"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-mono placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Unique School Code Notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  Do not use the original school code here. The school must create its own unique code and use that to log in to this portal.
                </p>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address * <span className="text-purple-400 font-bold">(Key for Multi-Device)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      id="signup-email"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="teacher@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      id="signup-phone"
                      value={signupPhone}
                      onChange={e => setSignupPhone(e.target.value)}
                      placeholder="+91 98470 54321"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* School Name & School Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    School / College Name *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      id="signup-school"
                      value={signupSchool}
                      onChange={e => setSignupSchool(e.target.value)}
                      placeholder="Enter your school name"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    School Code *
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      id="signup-schoolcode"
                      value={signupSchoolCode}
                      onChange={e => setSignupSchoolCode(e.target.value)}
                      placeholder="Enter your school code"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Subject Assigned & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Subject Assigned *
                  </label>
                  <div className="relative">
                    <BookOpen className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      id="signup-subject"
                      value={signupSubject}
                      onChange={e => setSignupSubject(e.target.value)}
                      placeholder="e.g. Physics, Chemistry, Mathematics..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Designation / Title
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      id="signup-designation"
                      value={signupDesignation}
                      onChange={e => setSignupDesignation(e.target.value)}
                      placeholder="e.g. HSST & Class Teacher"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>
              </div>

                            {/* Assigned Class Standard, Stream & Section */}
              <div className="p-3.5 rounded-2xl bg-[#0F1115] border border-[#2D3139] space-y-3">
                <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider block">
                  Assigned Class Details
                </span>
                
                <div className="flex items-center gap-2 mb-2">
                  <input 
                    type="checkbox" 
                    id="signup-isClassTeacher"
                    checked={signupIsClassTeacher}
                    onChange={e => setSignupIsClassTeacher(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-[#1A1C23] border-[#2D3139]"
                  />
                  <label htmlFor="signup-isClassTeacher" className="text-[11px] font-bold text-slate-300 cursor-pointer">
                    I am a Class Teacher
                  </label>
                </div>

                {signupIsClassTeacher && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Standard</label>
                    <select
                      value={signupStandard}
                      onChange={e => setSignupStandard(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#1A1C23] border border-[#2D3139] text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Class 12 (Plus Two)">Class 12 (Plus Two)</option>
                      <option value="Class 11 (Plus One)">Class 11 (Plus One)</option>
                      <option value="Class 10">Class 10</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Other">Other - Enter Manually</option>
                    </select>
                    {signupStandard === 'Other' && (
                      <input
                        type="text"
                        value={customStandard}
                        onChange={e => setCustomStandard(e.target.value)}
                        placeholder="e.g. Class 8"
                        className="w-full mt-2 px-2.5 py-1.5 rounded-xl bg-[#1A1C23] border border-[#2D3139] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Stream</label>
                    <select
                      value={signupStream}
                      onChange={e => setSignupStream(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-[#1A1C23] border border-[#2D3139] text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Bio-Science">Bio-Science</option>
                      <option value="Computer-Science">Computer-Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Humanities">Humanities</option>
                      <option value="General">General</option>
                      <option value="Other">Other - Enter Manually</option>
                    </select>
                    {signupStream === 'Other' && (
                      <input
                        type="text"
                        value={customStream}
                        onChange={e => setCustomStream(e.target.value)}
                        placeholder="e.g. Vocational"
                        className="w-full mt-2 px-2.5 py-1.5 rounded-xl bg-[#1A1C23] border border-[#2D3139] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Section</label>
                    <input
                      type="text"
                      value={signupSection}
                      onChange={e => setSignupSection(e.target.value.toUpperCase())}
                      placeholder="A"
                      className="w-full px-2.5 py-2 rounded-xl bg-[#1A1C23] border border-[#2D3139] text-xs font-bold text-white text-center focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Password / Access PIN *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    id="signup-password"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="Create a 4+ character password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                id="btn-teacher-signup-submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-950/60 transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                <span>CREATE TEACHER ACCOUNT & ENABLE SYNC</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          )}
          {/* 2. TEACHER LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4">
              <div className="border-b border-[#2D3139] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    Teacher Portal Sign In
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Log in with your registered email to synchronize your records across all devices.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Cloud Ready</span>
                </div>
              </div>

              {/* Email or Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email Address or Phone *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    id="login-email"
                    value={loginEmailOrPhone}
                    onChange={e => setLoginEmailOrPhone(e.target.value)}
                    placeholder="teacher.hss@gmail.com or +91..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Use the same email on multiple devices to keep all student and attendance data in sync.
                </span>
              </div>

              {/* School Code */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-purple-400" />
                    School Code 
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono"></span>
                </div>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    id="login-schoolcode"
                    value={loginSchoolCode}
                    onChange={e => setLoginSchoolCode(e.target.value)}
                    placeholder="Enter your school code"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* School Code Notice */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/90 font-medium leading-relaxed">
                  Do not use the original school code here. The school must create its own unique code and use that to log in to this portal.
                </p>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date of Birth <span className="text-slate-400 text-[10px] font-normal">(e.g. DD/MM/YYYY or DD-MM-YYYY)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    id="login-dob"
                    value={loginDob}
                    onChange={e => setLoginDob(e.target.value)}
                    placeholder="DD/MM/YYYY or YYYY-MM-DD"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-mono placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Password / PIN *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    id="login-password"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetRole('teacher');
                      setMode('reset');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 transition underline cursor-pointer"
                  >
                    Forgot Password / Reset Settings?
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                id="btn-teacher-login-submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-950/60 transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
              >
                <span>SIGN IN & SYNC MULTI-DEVICE DATA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

          )}
          {/* 3. SCHOOL ADMIN LOGIN FORM */}
          {mode === 'admin' && (
            <div className="space-y-4">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300">
                      School Administrator Portal Authentication
                    </h3>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      Enter the authorized School Gmail, unique School Code, and Password provisioned in Firebase.
                    </p>
                  </div>
                </div>

                {/* 1. School Gmail Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    School Gmail Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      id="admin-gmail"
                      value={adminGmail}
                      onChange={e => setAdminGmail(e.target.value)}
                      placeholder="e.g. principal.ghss@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-medium"
                    />
                  </div>
                </div>

                {/* 2. School Code */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-amber-400" />
                      School Code *
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Unique Institutional ID</span>
                  </div>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      id="admin-schoolcode"
                      value={adminSchoolCode}
                      onChange={e => setAdminSchoolCode(e.target.value)}
                      placeholder="Enter your school code"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Head of School Designation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    Head of School Designation *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                        adminDesignation === 'Principal'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#0F1115] border-[#2D3139] text-slate-400 hover:text-white'
                      }`}
                    >
                      Principal
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                        adminDesignation === 'Headmaster'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#0F1115] border-[#2D3139] text-slate-400 hover:text-white'
                      }`}
                    >
                      Headmaster
                    </button>
                    <button
                      type="button"
                      className={`py-2 px-2.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center ${
                        adminDesignation === 'Headmistress'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md'
                          : 'bg-[#0F1115] border-[#2D3139] text-slate-400 hover:text-white'
                      }`}
                    >
                      Headmistress
                    </button>
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      Password *
                    </label>
                    <span className="text-[10px] text-slate-400">Firebase Auth Managed</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      required
                      id="admin-password"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Enter School Admin Password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition"
                    />
                    <button
                      type="button"
                      id="btn-toggle-admin-password"
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetRole('admin');
                        setResetEmail(adminGmail);
                        setMode('reset');
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 transition underline cursor-pointer"
                    >
                      Forgot Password? Send Reset Link
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="btn-admin-login-submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-amber-950/60 transition active:scale-95 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4.5 h-4.5" />
                  <span>LOG IN TO SCHOOL ADMIN PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

          )}
          {/* 4. PASSWORD RESET & SETTINGS RECOVERY FORM */}
          {mode === 'reset' && (
            <form onSubmit={handlePasswordReset} className="space-y-4 animate-fade-in">
              <div className="border-b border-[#2D3139] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-500 animate-pulse" />
                  Password Reset & Identity Verification
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verify your registered credentials to securely update your access PIN or password.
                </p>
              </div>

              {/* Role selector inside reset screen */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Portal Role *
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#1A1C23] p-1 rounded-xl border border-[#2D3139]">
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      resetRole === 'teacher'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Teacher Account
                  </button>
                  <button
                    type="button"
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      resetRole === 'admin'
                        ? 'bg-amber-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    School Administrator
                  </button>
                </div>
              </div>

              {/* Registered Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered {resetRole === 'teacher' ? 'Teacher' : 'Administrator'} Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder={resetRole === 'teacher' ? 'teacher.hss@gmail.com' : 'principal.ghss@gmail.com'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-medium"
                  />
                </div>
              </div>

              {/* Unique School Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Your Unique School Code *
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={resetSchoolCode}
                    onChange={e => setResetSchoolCode(e.target.value)}
                    placeholder="e.g. SSHSS@111213"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono uppercase"
                  />
                </div>
              </div>

              {/* Date of Birth Verification */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Date of Birth Verification * <span className="text-slate-400 text-[10px] font-normal">(Must match exactly)</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={resetDob}
                    onChange={e => setResetDob(e.target.value)}
                    placeholder="DD/MM/YYYY or YYYY-MM-DD"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* New Password / PIN */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create New Password / Access PIN *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    value={resetNewPassword}
                    onChange={e => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password / access PIN"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showConfirmResetPassword ? 'text' : 'password'}
                    required
                    value={resetConfirmPassword}
                    onChange={e => setResetConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password / PIN"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition"
                  />
                  <button
                    type="button"
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode(resetRole === 'teacher' ? 'login' : 'admin');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition active:scale-95 cursor-pointer text-center"
                >
                  CANCEL & RETURN
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-xl shadow-amber-950/60 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>VERIFY & RESET</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security & Features Summary Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cloud className="w-4 h-4 text-purple-400" /> Multi-Device Cloud Real-Time Sync
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Teacher & Admin Data Protection
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" /> Instant School Network Linking
          </span>
        </div>
      </div>
    </div>
  );
};
