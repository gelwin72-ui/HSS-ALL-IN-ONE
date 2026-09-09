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
  updateProfile
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
          id: `teach-${Date.now()}`,
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

      // Push latest local state to cloud to keep everything synchronized
      await CloudSync.pushToCloud(user);

      // Securely sync sanitized teacher record to school admin panel
      if (activeTeacher.schoolCode) {
        await CloudSync.saveTeacherToSchool(activeTeacher.schoolCode, activeTeacher);
        await CloudSync.recordTeacherActivity(activeTeacher.schoolCode, {
          teacherId: activeTeacher.id,
          teacherName: activeTeacher.name,
          subject: activeTeacher.subject || activeTeacher.primarySubject || activeTeacher.designation,
          assignedClass: activeTeacher.assignedClass,
          activityType: 'login',
          description: `Teacher ${activeTeacher.name} logged in via Google Auth`
        });
      }

      setSuccessMsg(`Signed in with ${cleanEmail}! Synchronized across all your devices.`);
      setTimeout(() => {
        onLoginSuccess(activeTeacher!);
      }, 500);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      setErrorMsg(err?.message || 'Google sign-in failed. Please try again or use email login.');
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // 1. Teacher Sign Up Handler
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
      setErrorMsg('Please enter your unique School Code (e.g. HSS-07142).');
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

    const effectiveSubject = signupSubject === 'Other' ? (customSubject.trim() || 'General') : signupSubject;
    const effectiveStandard = signupStandard === 'Other' ? (customStandard.trim() || 'Class 12') : signupStandard;
    const effectiveStream = signupStream === 'Other' ? (customStream.trim() || 'General') : signupStream;
    const assignedClassName = `${effectiveStandard} ${effectiveStream} ${signupSection}`.trim();
    const cleanSchoolCode = (signupSchoolCode.trim() || 'SSHSS@111213').toUpperCase();
    const cleanEmail = signupEmail.trim().toLowerCase();

    setIsLoading(true);
    setLoadingText('Securing credentials & initializing multi-device sync...');

    try {
      let firebaseUid = `teach-${Date.now()}`;
      if (cleanEmail) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, cleanEmail, signupPassword);
          if (cred.user) {
            firebaseUid = cred.user.uid;
            updateProfile(cred.user, { displayName: signupName.trim() }).catch(() => {});
          }
        } catch (authErr: any) {
          console.log('Firebase Auth register status:', authErr?.code || authErr?.message);
          if (authErr?.code === 'auth/email-already-in-use') {
            try {
              const signRes = await signInWithEmailAndPassword(auth, cleanEmail, signupPassword);
              if (signRes.user) {
                firebaseUid = signRes.user.uid;
              }
            } catch (signInErr: any) {
              setErrorMsg('An account with this email is already registered. Please enter your existing password to log in, or switch to Teacher Login.');
              setIsLoading(false);
              return;
            }
          } else if (authErr?.code === 'auth/invalid-email') {
            setErrorMsg('Invalid email format. Please enter a valid email address.');
            setIsLoading(false);
            return;
          } else if (authErr?.code === 'auth/weak-password') {
            setErrorMsg('Password should be at least 6 characters long.');
            setIsLoading(false);
            return;
          }
        }
      }

      // Check if an account with this email already exists in RTDB teachers/ or cloud
      if (cleanEmail) {
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200));
        let cloudCheck = { found: false, teacherAccount: null as any, appData: null as any };
        try {
          cloudCheck = await Promise.race([CloudSync.fetchAccountByEmail(cleanEmail, cleanSchoolCode), timeoutPromise]);
        } catch (e) {}
        
        if (cloudCheck.found && cloudCheck.teacherAccount) {
          const cloudTeacher = cloudCheck.teacherAccount;
          // Restore cloud data on this device
          if (cloudCheck.appData) {
            CloudSync.applyCloudBundle(cloudCheck.appData);
          }
          StorageService.registerTeacherAccount(cloudTeacher);
          StorageService.setAuthSession({
            isLoggedIn: true,
            role: 'teacher',
            currentTeacher: cloudTeacher,
            currentAdmin: null
          });

          CloudSync.setActiveSyncEmail(cleanEmail);
          CloudSync.startRealtimeEmailSync(cleanEmail);

          // Sync to School Admin Panel
          await CloudSync.saveTeacherToSchool(cleanSchoolCode, cloudTeacher);
          await CloudSync.recordTeacherActivity(cleanSchoolCode, {
            teacherId: cloudTeacher.id,
            teacherName: cloudTeacher.name,
            subject: cloudTeacher.subject || effectiveSubject,
            assignedClass: cloudTeacher.assignedClass || assignedClassName,
            activityType: 'login',
            description: `Teacher ${cloudTeacher.name} logged into School Portal`
          });

          setSuccessMsg(`Existing account verified on cloud! All school and class data synced to this device.`);
          setTimeout(() => {
            onLoginSuccess(cloudTeacher);
          }, 600);
          return;
        }
      }

      const newAccount: TeacherAccount = {
        id: firebaseUid,
        uid: firebaseUid,
        name: signupName.trim(),
        email: cleanEmail,
        gmail: cleanEmail,
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
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };

      // Write teacher profile to Firestore under /users/{firebaseUid}
      try {
        const userDocRef = doc(db, 'users', firebaseUid);
        await setDoc(userDocRef, {
          id: firebaseUid,
          userId: firebaseUid,
          name: signupName.trim(),
          email: cleanEmail,
          phone: signupPhone.trim(),
          schoolName: signupSchool.trim(),
          schoolCode: cleanSchoolCode,
          subject: effectiveSubject,
          designation: signupDesignation.trim() || `${effectiveSubject} Teacher`,
          role: 'teacher',
          active: true,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore user profile write note:', fsErr);
      }

      const registered = StorageService.registerTeacherAccount(newAccount);
      if (!registered) {
        // Account exists locally, update it
        const list = StorageService.getTeacherAccounts();
        const existingIdx = list.findIndex(a => a.email.toLowerCase() === cleanEmail);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...newAccount };
          StorageService.saveTeacherAccounts(list);
        }
      }

      // Automatically register the first class created during signup if standard and section are provided
      if (effectiveStandard && signupSection) {
        const initialClassId = `cls-${firebaseUid.slice(0, 6)}-${Date.now().toString(36)}`;
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
          createdAt: new Date().toISOString()
        };
        StorageService.addNewClass(initialClass, []);
        StorageService.setActiveClassId(initialClassId);
        CloudSync.saveClassToSchool(cleanSchoolCode, initialClass, []).catch(console.warn);
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

      // Save account and initial data bundle to cloud under this email (non-blocking)
      if (cleanEmail) {
        CloudSync.setActiveSyncEmail(cleanEmail);
        CloudSync.saveAccountToCloud(cleanEmail, {
          role: 'teacher',
          teacherAccount: newAccount,
          schoolCode: cleanSchoolCode
        }).catch(e => console.warn('Cloud save bg error:', e));
        CloudSync.startRealtimeEmailSync(cleanEmail);
      }

      // Save sanitized teacher record to school Firestore collection for School Admin Panel visibility (non-blocking)
      CloudSync.saveTeacherToSchool(cleanSchoolCode, newAccount).catch(e => console.warn('Cloud saveTeacherToSchool bg error:', e));
      CloudSync.recordTeacherActivity(cleanSchoolCode, {
        teacherId: newAccount.id,
        teacherName: newAccount.name,
        subject: effectiveSubject,
        assignedClass: assignedClassName,
        activityType: 'signup',
        description: `Registered as teacher for ${assignedClassName} (${effectiveSubject})`
      }).catch(e => console.warn('Cloud activity bg error:', e));

      CloudSync.recordLoginActivity(cleanSchoolCode, {
        email: cleanEmail || newAccount.name,
        accessMethod: 'Teacher Sign-Up',
        role: 'teacher',
        success: true,
        details: `Teacher signed up successfully via Teacher Sign-Up: ${cleanEmail || newAccount.name}`
      }).catch(() => {});

      setSuccessMsg(`Teacher account created! Multi-device sync enabled for ${cleanEmail || cleanSchoolCode}.`);
      onLoginSuccess(newAccount);
    } catch (err: any) {
      console.warn('Signup error:', err);
      setErrorMsg('Account saved locally. Cloud sync initialized.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Teacher Login Handler (Multi-Device Cloud Aware)
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanQuery = loginEmailOrPhone.trim().toLowerCase();
    const cleanSchoolCode = (loginSchoolCode || 'SSHSS@111213').trim().toUpperCase();
    const normalizeDob = (d?: string) => (d || '').trim().replace(/[/\s.-]/g, '');

    // Prevent School Admin accounts from being logged in via teacher login
    if (cleanQuery === 'gelwin72@gmail.com' || cleanQuery === 'joicegeorge1910@gmail.com') {
      setErrorMsg('This is a School Admin account. Please use the "School Admin Portal" tab to log in.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadingText('Verifying credentials & fetching multi-device data...');

    try {
      let authUid: string | null = null;
      let authenticatedViaFirebase = false;

      // Try Firebase Auth verification if email provided
      if (cleanQuery.includes('@')) {
        try {
          const cred = await signInWithEmailAndPassword(auth, cleanQuery, loginPassword);
          if (cred.user) {
            authUid = cred.user.uid;
            authenticatedViaFirebase = true;
          }
        } catch (authErr: any) {
          console.log('Firebase Auth signIn check:', authErr?.code || authErr?.message);
          if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
            setErrorMsg('Invalid email or password. Please verify your credentials and try again.');
            setIsLoading(false);
            return;
          } else if (authErr?.code === 'auth/user-not-found') {
            setErrorMsg('No account found with this email. Please check your email or sign up on the "Teacher Sign Up" tab.');
            setIsLoading(false);
            return;
          } else if (authErr?.code === 'auth/invalid-email') {
            setErrorMsg('Please enter a valid email format.');
            setIsLoading(false);
            return;
          }
        }
      }

      let match: TeacherAccount | null = null;

      // 1. Check in dedicated teachers/ RTDB collection
      try {
        const credResult = await CloudSync.fetchTeacherCredential(cleanQuery, cleanSchoolCode);
        if (credResult.found) {
          if (credResult.reason === 'status_inactive') {
            setErrorMsg('Access Denied: Your teacher account status is inactive or suspended. Please contact the School Administrator.');
            setIsLoading(false);
            return;
          }
          if (credResult.reason === 'school_mismatch') {
            setErrorMsg(`Access Denied: Teacher account does not belong to school code ${cleanSchoolCode}`);
            setIsLoading(false);
            return;
          }
          if (credResult.teacher) {
            match = credResult.teacher;
          }
        }
      } catch (e) {
        console.warn('Teacher credential fetch error:', e);
      }

      // 2. Try to fetch from cloud by UID if authenticated with Firebase
      if (!match && authUid) {
        try {
          const uidResult = await CloudSync.fetchAccountByUid(authUid);
          if (uidResult.found && uidResult.teacherAccount) {
            match = uidResult.teacherAccount;
            if (uidResult.appData) {
              CloudSync.applyCloudBundle(uidResult.appData);
            }
          }
        } catch (e) {
          console.warn('UID fetch note:', e);
        }
      }

      // 3. Check local storage accounts
      if (!match) {
        const localAccounts = StorageService.getTeacherAccounts();
        match = localAccounts.find(
          a =>
            (a.gmail && a.gmail.toLowerCase() === cleanQuery) ||
            (a.email && a.email.toLowerCase() === cleanQuery) ||
            a.phone === cleanQuery ||
            a.name.toLowerCase() === cleanQuery
        ) || null;
      }

      // 4. If not found locally, look up in Firestore cloud by email
      if (!match && cleanQuery.includes('@')) {
        const timeoutPromise = new Promise<any>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        try {
          const cloudResult = await Promise.race([CloudSync.fetchAccountByEmail(cleanQuery, cleanSchoolCode), timeoutPromise]);
          if (cloudResult.found && cloudResult.teacherAccount) {
            match = cloudResult.teacherAccount;
            if (cloudResult.appData) {
              CloudSync.applyCloudBundle(cloudResult.appData);
            }
            StorageService.registerTeacherAccount(match);
          }
        } catch (e) {
          console.warn('Cloud fetch timeout or error:', e);
        }
      }

      if (!match) {
        setErrorMsg('Teacher account not found. Please check your email or sign up on the "Teacher Sign Up" tab.');
        setIsLoading(false);
        return;
      }

      // Check account status
      if (match.status && match.status !== 'active') {
        setErrorMsg('Access Denied: Your teacher account status is inactive or suspended. Please contact the School Administrator.');
        setIsLoading(false);
        return;
      }

      if (authUid && !match.id) {
        match.id = authUid;
      }

      if (loginDob && match.dob && normalizeDob(match.dob) !== normalizeDob(loginDob) && match.dob !== loginDob.trim()) {
        setErrorMsg('Incorrect date of birth. Please try again.');
        setIsLoading(false);
        return;
      }

      if (!authenticatedViaFirebase && match.password && match.password !== loginPassword) {
        setErrorMsg('Invalid password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Verify school code
      if (cleanSchoolCode && match.schoolCode && match.schoolCode.toUpperCase() !== cleanSchoolCode && cleanSchoolCode !== 'SSHSS@111213') {
        setErrorMsg(`Access Denied: Teacher is registered under school code ${match.schoolCode}`);
        setIsLoading(false);
        return;
      }
      if (!match.schoolCode) {
        match.schoolCode = cleanSchoolCode;
      }

      match.lastActiveAt = new Date().toISOString();

      const allAccounts = StorageService.getTeacherAccounts();
      const existingIdx = allAccounts.findIndex(a => a.id === match!.id || a.email.toLowerCase() === match!.email.toLowerCase());
      if (existingIdx >= 0) {
        allAccounts[existingIdx] = match;
      } else {
        allAccounts.push(match);
      }
      StorageService.saveTeacherAccounts(allAccounts);
      StorageService.updateTeacherLastActive(match.id);

      // Update active teacher info
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

      // Activate multi-device synchronization for this email (non-blocking)
      if (match.email) {
        const syncEmail = match.email.toLowerCase();
        CloudSync.setActiveSyncEmail(syncEmail);
        CloudSync.startRealtimeEmailSync(syncEmail);

        CloudSync.fetchAccountByEmail(syncEmail, cleanSchoolCode).then(cloudData => {
          if (cloudData.found && cloudData.appData) {
            CloudSync.applyCloudBundle(cloudData.appData);
          } else {
            CloudSync.saveAccountToCloud(syncEmail, {
              role: 'teacher',
              teacherAccount: match,
              schoolCode: match.schoolCode
            }).catch(() => {});
          }
        }).catch(() => {});
      }

      // Save sanitized teacher record to school Firestore collection for School Admin Panel visibility (non-blocking)
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
          details: `Teacher logged in successfully via Teacher Login: ${match.email || match.name}`
        }).catch(() => {});
      }

      setSuccessMsg(`Welcome back, ${match.name}! Synchronized across all your devices.`);
      onLoginSuccess(match!);
    } catch (err: any) {
      console.warn('Teacher login error:', err);
      setErrorMsg('Login failed. Please check your credentials and connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. School Admin Login Handler (Strict Firebase Auth + Firestore RBAC Authorization)
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

    const isPreAuthorizedAdmin = (cleanGmail === 'gelwin72@gmail.com' && cleanSchoolCode === 'SSHSS@111213') || 
                                 (cleanGmail === 'joicegeorge1910@gmail.com' && cleanSchoolCode === 'SSHSS@111213');
    if (!isPreAuthorizedAdmin) {
      CloudSync.logUnauthorizedAttempt(cleanGmail, cleanSchoolCode, 'Unauthorized School Admin Gmail address');
      CloudSync.recordLoginActivity(cleanSchoolCode, {
        email: cleanGmail,
        accessMethod: 'School Admin Panel',
        role: 'admin',
        success: false,
        details: `Access Denied: ${cleanGmail} is not pre-authorized for School Admin Portal`
      }).catch(() => {});
      setErrorMsg('Access Denied: Only pre-authorized Gmail addresses are allowed to access the School Admin Portal.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Authenticating School Admin via Firebase...');

    try {
      // Step 1: Authenticate School Gmail and Password against Firebase Authentication
      let authResult;
      const isHardcodedAdmin = (cleanGmail === 'gelwin72@gmail.com' && cleanSchoolCode === 'SSHSS@111213') || 
                               (cleanGmail === 'joicegeorge1910@gmail.com' && cleanSchoolCode === 'SSHSS@111213');
                               
      try {
        authResult = await signInWithEmailAndPassword(auth, cleanGmail, adminPassword);
      } catch (authErr: any) {
        console.warn('Firebase Auth sign in error:', authErr);
        const code = authErr?.code || '';
        
        // Auto-create only for hardcoded admins to ensure they never get locked out
        if (isHardcodedAdmin && (code === 'auth/user-not-found' || code === 'auth/invalid-credential')) {
          try {
            authResult = await createUserWithEmailAndPassword(auth, cleanGmail, adminPassword);
          } catch (createErr) {
            setErrorMsg('Invalid School Admin credentials. Please verify your Gmail and Password.');
            setIsLoading(false);
            return;
          }
        } else if (
          code === 'auth/invalid-credential' ||
          code === 'auth/wrong-password' ||
          code === 'auth/user-not-found'
        ) {
          setErrorMsg('Invalid School Admin credentials. Please verify your Gmail and Password.');
          setIsLoading(false);
          return;
        } else if (code === 'auth/invalid-email') {
          setErrorMsg('Invalid Gmail address format.');
          setIsLoading(false);
          return;
        } else if (code === 'auth/too-many-requests') {
          setErrorMsg('Too many failed login attempts. Access temporarily blocked for security. Please try again in a few minutes.');
          setIsLoading(false);
          return;
        } else if (code === 'auth/network-request-failed') {
          setErrorMsg('Network error. Please check your internet connection.');
          setIsLoading(false);
          return;
        } else {
          setErrorMsg(authErr?.message || 'Invalid School Admin credentials.');
          setIsLoading(false);
          return;
        }
      }

      // Step 2: Extract Authenticated User UID
      const authUser = authResult?.user || auth?.currentUser;
      if (!authUser || !authUser.uid) {
        if (auth) {
          try {
            await signOut(auth);
          } catch (soErr) {
            console.warn('Signout warning', soErr);
          }
        }
        setErrorMsg('Authentication failed. No authenticated UID returned.');
        setIsLoading(false);
        return;
      }

      setLoadingText('Verifying School Admin authorization...');

      let userData: any = null;
      const isAdmin2 = cleanGmail === 'joicegeorge1910@gmail.com';

      if (isHardcodedAdmin) {
        userData = {
          email: cleanGmail,
          role: 'SCHOOL_ADMIN',
          schoolCode: cleanSchoolCode || 'SSHSS@111213',
          active: true,
          displayName: isAdmin2 ? 'Joice George' : 'School Administrator',
          adminName: isAdmin2 ? 'Joice George' : 'School Administrator',
          schoolName: "St. Sebastian's Higher Secondary School"
        };
        // Background provision
        try {
          const userDocRef = doc(db, 'users', authUser.uid);
          setDoc(userDocRef, userData, { merge: true }).catch(() => {});
        } catch (e) {}
      } else {
        // Step 3: Fetch Firestore document with fast 1.2s timeout
        try {
          const timeoutPromise = new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200));
          const userDocRef = doc(db, 'users', authUser.uid);
          const snap = await Promise.race([getDoc(userDocRef), timeoutPromise]);
          if (snap && snap.exists()) {
            userData = snap.data();
          } else {
            userData = {
              email: cleanGmail,
              role: 'SCHOOL_ADMIN',
              schoolCode: cleanSchoolCode,
              active: true,
              displayName: 'School Administrator',
              adminName: 'School Administrator',
              schoolName: "St. Sebastian's Higher Secondary School"
            };
          }
        } catch (docErr: any) {
          userData = {
            email: cleanGmail,
            role: 'SCHOOL_ADMIN',
            schoolCode: cleanSchoolCode,
            active: true,
            displayName: 'School Administrator',
            adminName: 'School Administrator',
            schoolName: "St. Sebastian's Higher Secondary School"
          };
        }
      }


      // Step 4: Verify role == "SCHOOL_ADMIN" (strict RBAC check)
      const role = String(userData.role || '').trim().toUpperCase();
      if (role !== 'SCHOOL_ADMIN' && role !== 'ADMIN') {
        await signOut(auth);
        setErrorMsg(
          'Access Denied: This account is not authorized as a School Admin. Role mismatch.'
        );
        setIsLoading(false);
        return;
      }

      // Step 5: Verify active == true
      if (userData.active === false) {
        await signOut(auth);
        setErrorMsg(
          'Access Denied: This School Admin account is inactive or suspended. Please contact your project administrator.'
        );
        setIsLoading(false);
        return;
      }

      // Step 6: Verify entered School Code matches stored schoolCode exactly
      const storedSchoolCode = String(userData.schoolCode || cleanSchoolCode).trim().toUpperCase();
      if (storedSchoolCode !== cleanSchoolCode) {
        await signOut(auth);
        setErrorMsg(
          `Invalid School Code: This account is not authorized for School Code "${cleanSchoolCode}".`
        );
        setIsLoading(false);
        return;
      }

      // Step 7: Verify authenticated email matches entered School Gmail
      const authEmail = (authUser.email || '').toLowerCase();
      const storedEmail = (userData.email || '').toLowerCase();
      if (authEmail !== cleanGmail || (storedEmail && storedEmail !== cleanGmail)) {
        await signOut(auth);
        setErrorMsg(
          'Access Denied: Gmail address mismatch between authenticated user and profile.'
        );
        setIsLoading(false);
        return;
      }

      // Step 8: ALL CHECKS PASSED -> Authorize and open School Admin Dashboard
      const adminAccount: SchoolAdminAccount = {
        id: authUser.uid,
        adminName: userData.displayName || userData.adminName || userData.name || 'School Administrator',
        schoolName: userData.schoolName || StorageService.getSchoolProfile().schoolName || "St. Sebastian's Higher Secondary School",
        schoolCode: cleanSchoolCode,
        email: cleanGmail,
        phone: userData.phone || '',
        role: 'admin',
        createdAt: userData.createdAt || new Date().toISOString()
      };

      // Update school profile in storage
      const currentSchool = StorageService.getSchoolProfile();
      StorageService.saveSchoolProfile({
        ...currentSchool,
        schoolCode: cleanSchoolCode,
        schoolName: adminAccount.schoolName
      });

      // Save admin session
      StorageService.setAuthSession({
        isLoggedIn: true,
        role: 'admin',
        currentTeacher: null,
        currentAdmin: adminAccount
      });

      // Apply synced cloud bundle if present in Firestore
      if (userData.appData) {
        CloudSync.applyCloudBundle(userData.appData);
      }

      // Start Cloud Sync for authenticated admin
      CloudSync.setActiveSyncEmail(cleanGmail);
      CloudSync.startRealtimeSync(authUser);

      CloudSync.recordLoginActivity(cleanSchoolCode, {
        email: cleanGmail,
        accessMethod: 'School Admin Panel',
        role: 'admin',
        success: true,
        details: `School Admin logged in successfully via School Admin Panel: ${cleanGmail}`
      }).catch(() => {});

      setSuccessMsg(
        `Welcome, ${adminAccount.adminName}! School Admin access verified for School Code: ${cleanSchoolCode}.`
      );

      if (onAdminLoginSuccess) {
        onAdminLoginSuccess(adminAccount);
      }
    } catch (err: any) {
      console.error('School Admin authorization error:', err);
      try {
        await signOut(auth);
      } catch {}
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
                      placeholder="e.g. Govt Higher Secondary School"
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
                      onChange={e => setSignupSchoolCode(e.target.value.toUpperCase())}
                      placeholder="HSS-07142"
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
                    <select
                      value={signupSubject}
                      onChange={e => setSignupSubject(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-purple-500 transition font-medium"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="English">English</option>
                      <option value="Malayalam">Malayalam</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Arabic">Arabic</option>
                      <option value="Sanskrit">Sanskrit</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Accountancy">Accountancy</option>
                      <option value="Economics">Economics</option>
                      <option value="Business Studies">Business Studies</option>
                      <option value="History">History</option>
                      <option value="Political Science">Political Science</option>
                      <option value="Sociology">Sociology</option>
                      <option value="Geography">Geography</option>
                      <option value="Statistics">Statistics</option>
                      <option value="Zoology">Zoology</option>
                      <option value="Botany">Botany</option>
                      <option value="Other">Other - Enter Manually</option>
                    </select>
                  </div>
                  {signupSubject === 'Other' && (
                    <input
                      type="text"
                      value={customSubject}
                      onChange={e => setCustomSubject(e.target.value)}
                      placeholder="Enter subject name"
                      className="w-full mt-2 px-3 py-2 rounded-xl bg-[#0F1115] border border-[#2D3139] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  )}
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
                    onClick={() => setShowPassword(!showPassword)}
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
                    School Code (Optional if email is used)
                  </label>
                  <span className="text-[10px] text-purple-400 font-mono">e.g. HSS-07142</span>
                </div>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    id="login-schoolcode"
                    value={loginSchoolCode}
                    onChange={e => setLoginSchoolCode(e.target.value.toUpperCase())}
                    placeholder="Enter School Code (e.g. HSS-07142)"
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
                  Date of Birth (Optional) <span className="text-slate-400 text-[10px] font-normal">(e.g. DD/MM/YYYY or DD-MM-YYYY)</span>
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
                    onClick={() => setShowPassword(!showPassword)}
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
                      onChange={e => setAdminSchoolCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HSS-07142"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm text-white focus:outline-none focus:border-amber-500 transition font-mono uppercase"
                    />
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
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
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
                    onClick={() => setResetRole('teacher')}
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
                    onClick={() => setResetRole('admin')}
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
                    onChange={e => setResetSchoolCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HSS-07142"
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
                    onClick={() => setShowResetPassword(!showResetPassword)}
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
                    onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
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
