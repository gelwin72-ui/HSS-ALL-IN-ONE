import {
  database,
  auth,
  FirebaseUser,
  ref,
  get,
  set,
  update,
  remove,
  push,
  onValue,
  off,
  firestore,
  fsDoc,
  fsGetDoc,
  fsSetDoc,
  fsUpdateDoc,
  fsDeleteDoc,
  fsCollection,
  fsQuery,
  fsWhere,
  fsGetDocs,
  fsOnSnapshot,
  storeCredentialsInRTDB
} from './firebase';
import {
  SchoolProfile,
  ClassInfo,
  ClassItem,
  TeacherInfo,
  Student,
  AttendanceRecord,
  Exam,
  ExamMarksRecord,
  Reminder,
  AppSettings,
  TeacherAccount,
  TeacherActivityItem,
  SchoolAdminAccount,
  TimetableSlot,
  PrincipalBroadcast,
  AuditLogItem
} from '../types';
import { StorageService, registerStorageMutationListener, setStorageMutationSilenced } from './storage';

export interface ClassScopedData {
  students: Student[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  examMarksMap: Record<string, ExamMarksRecord>;
}

export interface UserCloudBundle {
  version: string;
  lastSyncedAt: string;
  schoolProfile: SchoolProfile;
  teacherInfo: TeacherInfo;
  classesCatalog: ClassItem[];
  activeClassId: string;
  classInfo: ClassInfo;
  reminders: Reminder[];
  settings: AppSettings;
  teacherAccounts: TeacherAccount[];
  schoolAdmins?: SchoolAdminAccount[];
  timetables?: TimetableSlot[];
  classData: Record<string, ClassScopedData>;
  students?: Student[];
  attendance?: AttendanceRecord[];
  exams?: Exam[];
  examMarks?: Record<string, ExamMarksRecord>;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'quota-exceeded';

type SyncListener = (status: SyncStatus, lastSyncedAt?: string, userEmail?: string) => void;

class CloudSyncManager {
  private currentStatus: SyncStatus = 'idle';
  private lastSyncedAt: string | undefined = undefined;
  private listeners: Set<SyncListener> = new Set();
  private debounceTimer: any = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  private unsubscribeEmailSnapshot: (() => void) | null = null;
  private unsubscribeBroadcastsSnapshot: (() => void) | null = null;
  private isApplyingRemoteUpdate = false;
  private lastSavedPayloadHash: string = '';
  private quotaExhaustedUntil: number = 0;
  private activeSyncEmail: string | undefined = undefined;

  constructor() {
    this.lastSyncedAt = localStorage.getItem('hss_last_cloud_sync') || undefined;
    this.activeSyncEmail = localStorage.getItem('hss_active_sync_email') || undefined;
  }

  public sanitizeEmailKey(email: string): string {
    return (email || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  public getStatus(): SyncStatus {
    if (this.quotaExhaustedUntil > Date.now()) {
      return 'quota-exceeded';
    }
    return this.currentStatus;
  }

  public getLastSyncedAt(): string | undefined {
    return this.lastSyncedAt;
  }

  public getActiveSyncEmail(): string | undefined {
    return this.activeSyncEmail || localStorage.getItem('hss_active_sync_email') || auth?.currentUser?.email || undefined;
  }

  public setActiveSyncEmail(email?: string) {
    if (email) {
      const clean = email.trim().toLowerCase();
      this.activeSyncEmail = clean;
      localStorage.setItem('hss_active_sync_email', clean);
    } else {
      this.activeSyncEmail = undefined;
      localStorage.removeItem('hss_active_sync_email');
    }
    this.notify(this.getStatus());
  }

  public addListener(listener: SyncListener) {
    this.listeners.add(listener);
    listener(this.getStatus(), this.lastSyncedAt, this.getActiveSyncEmail());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(status: SyncStatus, error?: any) {
    this.currentStatus = status;
    const userEmail = this.getActiveSyncEmail();
    this.listeners.forEach(fn => fn(this.getStatus(), this.lastSyncedAt, userEmail));
  }

  public gatherAllLocalData(): UserCloudBundle {
    const classes = StorageService.getClassesList();
    const activeClassId = StorageService.getActiveClassId();
    const classData: Record<string, ClassScopedData> = {};

    classes.forEach(c => {
      classData[c.id] = {
        students: StorageService.getStudents(c.id),
        attendance: StorageService.getAttendance(c.id),
        exams: StorageService.getExams(c.id),
        examMarksMap: StorageService.getExamMarksMap(c.id)
      };
    });

    const activeStudents = StorageService.getStudents(activeClassId);
    const activeAttendance = StorageService.getAttendance(activeClassId);
    const activeExams = StorageService.getExams(activeClassId);
    const activeMarks = StorageService.getExamMarksMap(activeClassId);

    return {
      version: '2.5.0',
      lastSyncedAt: new Date().toISOString(),
      schoolProfile: StorageService.getSchoolProfile(),
      teacherInfo: StorageService.getTeacherInfo(),
      classesCatalog: classes,
      activeClassId: activeClassId,
      classInfo: StorageService.getClassInfo(activeClassId),
      reminders: StorageService.getReminders(),
      settings: StorageService.getSettings(),
      teacherAccounts: StorageService.getTeacherAccounts(),
      schoolAdmins: StorageService.getSchoolAdmins(),
      timetables: StorageService.getTimetables(),
      classData,
      students: activeStudents,
      attendance: activeAttendance,
      exams: activeExams,
      examMarks: activeMarks
    };
  }

  public applyCloudBundle(bundle: Partial<UserCloudBundle>) {
    this.isApplyingRemoteUpdate = true;
    setStorageMutationSilenced(true);
    try {
      if (bundle.schoolProfile) {
        StorageService.saveSchoolProfile(bundle.schoolProfile);
      }
      if (bundle.teacherInfo) {
        StorageService.saveTeacherInfo(bundle.teacherInfo);
      }
      if (bundle.classesCatalog && Array.isArray(bundle.classesCatalog) && bundle.classesCatalog.length > 0) {
        StorageService.saveClassesList(bundle.classesCatalog);
      }
      if (bundle.activeClassId) {
        StorageService.setActiveClassId(bundle.activeClassId);
      }
      if (bundle.classInfo) {
        StorageService.saveClassInfo(bundle.classInfo, bundle.activeClassId);
      }
      if (bundle.reminders && Array.isArray(bundle.reminders)) {
        StorageService.saveReminders(bundle.reminders);
      }
      if (bundle.settings) {
        StorageService.saveSettings(bundle.settings);
      }
      if (bundle.teacherAccounts && Array.isArray(bundle.teacherAccounts) && bundle.teacherAccounts.length > 0) {
        StorageService.saveTeacherAccounts(bundle.teacherAccounts);
      }
      if (bundle.schoolAdmins && Array.isArray(bundle.schoolAdmins) && bundle.schoolAdmins.length > 0) {
        StorageService.saveSchoolAdmins(bundle.schoolAdmins);
      }
      if (bundle.timetables && Array.isArray(bundle.timetables) && bundle.timetables.length > 0) {
        StorageService.saveTimetables(bundle.timetables);
      }

      if (bundle.classData && typeof bundle.classData === 'object') {
        Object.entries(bundle.classData).forEach(([classId, data]) => {
          if (data) {
            if (Array.isArray(data.students)) StorageService.saveStudents(data.students, classId);
            if (Array.isArray(data.attendance)) StorageService.saveAttendance(data.attendance, classId);
            if (Array.isArray(data.exams)) StorageService.saveExams(data.exams, classId);
            if (data.examMarksMap) StorageService.saveExamMarksMap(data.examMarksMap, classId);
          }
        });
      } else {
        if (Array.isArray(bundle.students)) StorageService.saveStudents(bundle.students);
        if (Array.isArray(bundle.attendance)) StorageService.saveAttendance(bundle.attendance);
        if (Array.isArray(bundle.exams)) StorageService.saveExams(bundle.exams);
        if (bundle.examMarks) StorageService.saveExamMarksMap(bundle.examMarks);
      }

      if (bundle.lastSyncedAt) {
        this.lastSyncedAt = bundle.lastSyncedAt;
        localStorage.setItem('hss_last_cloud_sync', bundle.lastSyncedAt);
      }

      const currentBundle = this.gatherAllLocalData();
      this.lastSavedPayloadHash = this.computeBundleHash(currentBundle);
    } finally {
      setTimeout(() => {
        setStorageMutationSilenced(false);
        this.isApplyingRemoteUpdate = false;
      }, 250);
    }
  }

  private computeBundleHash(bundle: UserCloudBundle): string {
    return JSON.stringify({
      classes: bundle.classesCatalog,
      teacher: bundle.teacherInfo,
      school: bundle.schoolProfile,
      classData: bundle.classData,
      reminders: bundle.reminders,
      timetables: bundle.timetables
    });
  }

  public async pushToCloud(user?: FirebaseUser | null): Promise<boolean> {
    const currentUser = user || auth?.currentUser;
    const syncEmail = this.getActiveSyncEmail();

    if (!currentUser && !syncEmail) {
      this.notify('offline');
      return false;
    }

    try {
      const bundle = this.gatherAllLocalData();
      const currentHash = this.computeBundleHash(bundle);

      if (currentHash === this.lastSavedPayloadHash && this.currentStatus === 'synced') {
        return true;
      }

      this.notify('syncing');

      if (currentUser) {
        if (database) {
          const userRefPath = ref(database, 'users/' + currentUser.uid);
          await set(userRefPath, {
            userId: currentUser.uid,
            email: currentUser.email || syncEmail || '',
            displayName: currentUser.displayName || bundle.teacherInfo.teacherName || 'Teacher',
            photoURL: currentUser.photoURL || '',
            lastSyncedAt: bundle.lastSyncedAt,
            appData: bundle
          });
        }

        if (firestore) {
          try {
            const userDocRef = fsDoc(firestore, 'users', currentUser.uid);
            await fsSetDoc(userDocRef, {
              userId: currentUser.uid,
              email: currentUser.email || syncEmail || '',
              displayName: currentUser.displayName || bundle.teacherInfo.teacherName || 'Teacher',
              lastSyncedAt: bundle.lastSyncedAt,
              schoolCode: bundle.schoolProfile.schoolCode || '',
              role: 'teacher',
              appData: bundle
            }, { merge: true });

            const schoolCode = (bundle.schoolProfile.schoolCode || '').trim().toUpperCase();
            if (schoolCode && bundle.classesCatalog && bundle.classesCatalog.length > 0) {
              for (const cls of bundle.classesCatalog) {
                const classDocRef = fsDoc(firestore, 'schools', schoolCode, 'classes', cls.id);
                const classPayload = {
                  ...cls,
                  teacherId: cls.teacherId || currentUser.uid,
                  teacherName: cls.teacherName || bundle.teacherInfo.teacherName,
                  schoolCode: schoolCode,
                  updatedAt: new Date().toISOString()
                };
                await fsSetDoc(classDocRef, classPayload, { merge: true });

                const clsStudents = bundle.classData?.[cls.id]?.students || [];
                for (const s of clsStudents) {
                  const studDocRef = fsDoc(firestore, 'schools', schoolCode, 'classes', cls.id, 'students', s.id);
                  await fsSetDoc(studDocRef, {
                    ...s,
                    classId: cls.id,
                    teacherId: cls.teacherId || currentUser.uid,
                    schoolCode
                  }, { merge: true });
                }
              }
            }
          } catch (fsErr) {
            console.warn('Firestore pushToCloud warning:', fsErr);
          }
        }
      }

      if (syncEmail) {
        const emailKey = this.sanitizeEmailKey(syncEmail);
        const emailRefPath = ref(database, 'email_accounts/' + emailKey);
        const activeSession = StorageService.getAuthSession();
        await set(emailRefPath, {
          email: syncEmail,
          schoolCode: bundle.schoolProfile.schoolCode || '',
          role: activeSession.role || 'teacher',
          teacherAccount: activeSession.currentTeacher || (bundle.teacherAccounts.find(t => t.email?.toLowerCase() === syncEmail.toLowerCase()) || null),
          adminAccount: activeSession.currentAdmin || (bundle.schoolAdmins?.find(a => a.email?.toLowerCase() === syncEmail.toLowerCase()) || null),
          lastSyncedAt: bundle.lastSyncedAt,
          updatedAt: new Date().toISOString(),
          appData: bundle
        });
      }

      this.lastSavedPayloadHash = currentHash;
      this.lastSyncedAt = bundle.lastSyncedAt;
      localStorage.setItem('hss_last_cloud_sync', bundle.lastSyncedAt);
      this.notify('synced');
      return true;
    } catch (err: any) {
      console.warn('Sync status notice:', err);
      this.notify('error', err);
      return false;
    }
  }

  public async fetchAccountByUid(
    uid: string
  ): Promise<{
    found: boolean;
    role?: 'teacher' | 'admin';
    teacherAccount?: TeacherAccount;
    adminAccount?: SchoolAdminAccount;
    appData?: UserCloudBundle;
    lastSyncedAt?: string;
  }> {
    if (!uid) return { found: false };

    if (firestore) {
      try {
        const userDocRef = fsDoc(firestore, 'users', uid);
        const snap = await fsGetDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data) {
            return {
              found: true,
              role: data.role || 'teacher',
              teacherAccount: data.teacherAccount || {
                id: uid,
                name: data.displayName || data.name || 'Teacher',
                email: data.email || '',
                phone: data.phone || '',
                schoolName: data.schoolName || '',
                schoolCode: data.schoolCode || '',
                subject: data.subject || '',
                designation: data.designation || 'Class Teacher',
                createdAt: data.createdAt || new Date().toISOString()
              },
              adminAccount: data.adminAccount,
              appData: data.appData,
              lastSyncedAt: data.lastSyncedAt
            };
          }
        }
      } catch (err) {
        console.warn('Firestore fetchAccountByUid error:', err);
      }
    }

    if (database) {
      try {
        const userRefPath = ref(database, 'users/' + uid);
        const snap = await get(userRefPath);
        if (snap.exists()) {
          const data = snap.val();
          if (data) {
            return {
              found: true,
              role: data.role || 'teacher',
              teacherAccount: data.teacherAccount || data.appData?.teacherAccounts?.find((t: any) => t.id === uid),
              adminAccount: data.adminAccount,
              appData: data.appData,
              lastSyncedAt: data.lastSyncedAt
            };
          }
        }
      } catch (err) {
        console.warn('RTDB fetchAccountByUid error:', err);
      }
    }

    return { found: false };
  }

  public async fetchAccountByEmail(
    email: string,
    schoolCode?: string
  ): Promise<{
    found: boolean;
    role?: 'teacher' | 'admin';
    teacherAccount?: TeacherAccount;
    adminAccount?: SchoolAdminAccount;
    appData?: UserCloudBundle;
    lastSyncedAt?: string;
  }> {
    if (!email || !email.trim()) return { found: false };
    const cleanEmail = email.trim().toLowerCase();

    if (firestore) {
      try {
        const usersCol = fsCollection(firestore, 'users');
        const q = fsQuery(usersCol, fsWhere('email', '==', cleanEmail));
        const querySnap = await fsGetDocs(q);
        if (!querySnap.empty && querySnap.docs.length > 0) {
          const docData = querySnap.docs[0].data();
          if (docData) {
            return {
              found: true,
              role: docData.role || 'teacher',
              teacherAccount: docData.teacherAccount || {
                id: querySnap.docs[0].id,
                name: docData.displayName || docData.name || 'Teacher',
                email: cleanEmail,
                phone: docData.phone || '',
                schoolName: docData.schoolName || '',
                schoolCode: docData.schoolCode || '',
                subject: docData.subject || '',
                designation: docData.designation || 'Class Teacher',
                createdAt: docData.createdAt || new Date().toISOString()
              },
              adminAccount: docData.adminAccount,
              appData: docData.appData,
              lastSyncedAt: docData.lastSyncedAt
            };
          }
        }
      } catch (e) {
        console.warn('Firestore fetchAccountByEmail error:', e);
      }
    }

    try {
      this.notify('syncing');
      const emailKey = this.sanitizeEmailKey(cleanEmail);
      const emailRefPath = ref(database, 'email_accounts/' + emailKey);
      const snap = await get(emailRefPath);

      if (snap.exists()) {
        const data = snap.val();
        if (data) {
          const appData = data.appData as UserCloudBundle | undefined;
          this.notify('synced');
          return {
            found: true,
            role: data.role || 'teacher',
            teacherAccount: data.teacherAccount,
            adminAccount: data.adminAccount,
            appData,
            lastSyncedAt: data.lastSyncedAt
          };
        }
      }
      this.notify('synced');
      return { found: false };
    } catch (err) {
      console.warn('Error fetching account by email from RTDB:', err);
      this.notify('error', err);
      return { found: false };
    }
  }

  public async saveAccountToCloud(
    email: string,
    payload: {
      role: 'teacher' | 'admin';
      teacherAccount?: TeacherAccount;
      adminAccount?: SchoolAdminAccount;
      schoolCode?: string;
      appData?: UserCloudBundle;
    }
  ): Promise<boolean> {
    if (!email || !email.trim()) return false;
    const cleanEmail = email.trim().toLowerCase();

    try {
      this.notify('syncing');
      const emailKey = this.sanitizeEmailKey(cleanEmail);
      const emailRefPath = ref(database, 'email_accounts/' + emailKey);
      const bundle = payload.appData || this.gatherAllLocalData();
      const now = new Date().toISOString();

      await set(emailRefPath, {
        email: cleanEmail,
        schoolCode: payload.schoolCode || bundle.schoolProfile.schoolCode || '',
        role: payload.role,
        teacherAccount: payload.teacherAccount || null,
        adminAccount: payload.adminAccount || null,
        lastSyncedAt: now,
        updatedAt: now,
        appData: bundle
      });

      this.setActiveSyncEmail(cleanEmail);
      this.lastSyncedAt = now;
      localStorage.setItem('hss_last_cloud_sync', now);
      this.notify('synced');
      return true;
    } catch (err) {
      console.warn('Error saving account to cloud:', err);
      this.notify('error', err);
      return false;
    }
  }

  public async fetchFromCloud(user: FirebaseUser): Promise<{ found: boolean; data?: UserCloudBundle }> {
    try {
      this.notify('syncing');
      const userRefPath = ref(database, 'users/' + user.uid);
      const snap = await get(userRefPath);

      if (snap.exists()) {
        const remote = snap.val();
        if (remote && remote.appData) {
          const cloudBundle = remote.appData as UserCloudBundle;
          this.applyCloudBundle(cloudBundle);
          this.lastSyncedAt = remote.lastSyncedAt || cloudBundle.lastSyncedAt;
          if (user.email) {
            this.setActiveSyncEmail(user.email);
          }
          this.notify('synced');
          return { found: true, data: cloudBundle };
        }
      }

      if (user.email) {
        const emailRes = await this.fetchAccountByEmail(user.email);
        if (emailRes.found && emailRes.appData) {
          this.applyCloudBundle(emailRes.appData);
          this.setActiveSyncEmail(user.email);
          this.lastSyncedAt = emailRes.lastSyncedAt;
          this.notify('synced');
          return { found: true, data: emailRes.appData };
        }
      }

      if (user.email) {
        this.setActiveSyncEmail(user.email);
      }
      await this.pushToCloud(user);
      this.notify('synced');
      return { found: false };
    } catch (err: any) {
      console.warn('Cloud sync fetch note:', err);
      this.notify('error', err);
      return { found: false };
    }
  }

  public startRealtimeSync(user: FirebaseUser, onDataRefreshed?: () => void) {
    this.stopRealtimeSync();
    if (user.email) {
      this.setActiveSyncEmail(user.email);
    }

    const userRefPath = ref(database, 'users/' + user.uid);
    try {
      this.unsubscribeSnapshot = onValue(
        userRefPath,
        snapshot => {
          if (this.isApplyingRemoteUpdate) return;
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.appData) {
              const incomingTimestamp = data.lastSyncedAt || data.appData.lastSyncedAt;
              if (incomingTimestamp && incomingTimestamp !== this.lastSyncedAt) {
                this.applyCloudBundle(data.appData);
                this.lastSyncedAt = incomingTimestamp;
                this.notify('synced');
                if (onDataRefreshed) {
                  onDataRefreshed();
                }
              }
            }
          }
        },
        error => {
          console.warn('RTDB snapshot listener note:', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish RTDB snapshot listener', e);
    }

    if (user.email) {
      this.startRealtimeEmailSync(user.email, onDataRefreshed);
    }
  }

  public startRealtimeEmailSync(email: string, onDataRefreshed?: () => void) {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();
    this.setActiveSyncEmail(cleanEmail);

    if (this.unsubscribeEmailSnapshot) {
      try {
        this.unsubscribeEmailSnapshot();
      } catch (e) {}
      this.unsubscribeEmailSnapshot = null;
    }

    const emailKey = this.sanitizeEmailKey(cleanEmail);
    const emailRefPath = ref(database, 'email_accounts/' + emailKey);
    try {
      this.unsubscribeEmailSnapshot = onValue(
        emailRefPath,
        snapshot => {
          if (this.isApplyingRemoteUpdate) return;
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data && data.appData) {
              const incomingTimestamp = data.lastSyncedAt || data.appData.lastSyncedAt;
              if (incomingTimestamp && incomingTimestamp !== this.lastSyncedAt) {
                this.applyCloudBundle(data.appData);
                this.lastSyncedAt = incomingTimestamp;
                this.notify('synced');
                if (onDataRefreshed) {
                  onDataRefreshed();
                }
              }
            }
          }
        },
        error => {
          console.warn('RTDB email snapshot note:', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish RTDB email snapshot listener', e);
    }
  }

  public stopRealtimeSync() {
    if (this.unsubscribeSnapshot) {
      try {
        this.unsubscribeSnapshot();
      } catch (e) {}
      this.unsubscribeSnapshot = null;
    }
    if (this.unsubscribeEmailSnapshot) {
      try {
        this.unsubscribeEmailSnapshot();
      } catch (e) {}
      this.unsubscribeEmailSnapshot = null;
    }
    this.stopRealtimeBroadcasts();
  }

  public startRealtimeBroadcasts(schoolCode: string, onBroadcastsUpdated?: () => void) {
    if (!schoolCode) return;
    const cleanCode = schoolCode.trim().toUpperCase();

    if (this.unsubscribeBroadcastsSnapshot) {
      try {
        this.unsubscribeBroadcastsSnapshot();
      } catch (e) {}
      this.unsubscribeBroadcastsSnapshot = null;
    }

    try {
      const broadcastsRefPath = ref(database, 'broadcasts');
      this.unsubscribeBroadcastsSnapshot = onValue(
        broadcastsRefPath,
        snapshot => {
          const remoteBroadcasts: PrincipalBroadcast[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
              const b = childSnap.val() as PrincipalBroadcast;
              if (b && (!b.schoolCode || b.schoolCode.toUpperCase() === cleanCode)) {
                remoteBroadcasts.push(b);
              }
            });
          }

          remoteBroadcasts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

          const localBroadcasts = StorageService.getPrincipalBroadcasts();
          const localIds = new Set(localBroadcasts.map(b => b.id));
          let changed = false;

          remoteBroadcasts.forEach(rb => {
            if (!localIds.has(rb.id)) {
              StorageService.addPrincipalBroadcast(rb);
              changed = true;
            }
          });

          if (changed && onBroadcastsUpdated) {
            onBroadcastsUpdated();
          }
        },
        error => {
          console.warn('Error syncing real-time broadcasts:', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish real-time broadcasts listener', e);
    }
  }

  public stopRealtimeBroadcasts() {
    if (this.unsubscribeBroadcastsSnapshot) {
      try {
        this.unsubscribeBroadcastsSnapshot();
      } catch (e) {}
      this.unsubscribeBroadcastsSnapshot = null;
    }
  }

  private unsubscribeSchoolTeachersSnapshot: (() => void) | null = null;
  private unsubscribeSchoolActivitiesSnapshot: (() => void) | null = null;

  public clearActiveSyncEmail() {
    this.setActiveSyncEmail(undefined);
    this.stopRealtimeSync();
    this.stopRealtimeBroadcasts();
    this.stopRealtimeSchoolSync();
  }

  public stopRealtimeSchoolSync() {
    if (this.unsubscribeSchoolTeachersSnapshot) {
      try {
        this.unsubscribeSchoolTeachersSnapshot();
      } catch (e) {}
      this.unsubscribeSchoolTeachersSnapshot = null;
    }
    if (this.unsubscribeSchoolActivitiesSnapshot) {
      try {
        this.unsubscribeSchoolActivitiesSnapshot();
      } catch (e) {}
      this.unsubscribeSchoolActivitiesSnapshot = null;
    }
  }

  public async saveTeacherToSchool(schoolCode: string, teacher: TeacherAccount): Promise<boolean> {
    if (!schoolCode || !teacher || !teacher.id) return false;
    const cleanCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();
    const cleanGmail = (teacher.gmail || teacher.email || '').trim().toLowerCase();

    // Check if permanently deleted by School Admin
    if (StorageService.isTeacherPermanentlyDeleted(teacher.id, cleanGmail) || (teacher.uid && StorageService.isTeacherPermanentlyDeleted(teacher.uid))) {
      console.log('Teacher is permanently deleted for this school; ignoring re-entry save');
      return false;
    }

    // Clear temporary deletion status from local storage
    StorageService.removeTemporarilyDeletedTeacherId(teacher.id, cleanGmail);
    if (teacher.uid) StorageService.removeTemporarilyDeletedTeacherId(teacher.uid);

    const sanitizedTeacherRecord = {
      id: teacher.id,
      uid: teacher.uid || teacher.id,
      name: teacher.name,
      gmail: cleanGmail,
      email: cleanGmail,
      status: 'active',
      dob: teacher.dob || '',
      phone: teacher.phone || '',
      schoolName: teacher.schoolName || "St. Sebastian's Higher Secondary School",
      schoolCode: cleanCode,
      subject: teacher.subject || teacher.primarySubject || teacher.designation || '',
      primarySubject: teacher.primarySubject || teacher.subject || '',
      standard: teacher.standard || '',
      stream: teacher.stream || '',
      section: teacher.section || '',
      assignedClass: teacher.assignedClass || '',
      designation: teacher.designation || 'Class Teacher',
      avatar: teacher.avatar || '👨‍🏫',
      photoUrl: teacher.photoUrl || '',
      createdAt: teacher.createdAt || new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      recentActivity: teacher.recentActivity || `Active in ${teacher.assignedClass || 'Classroom'}`,
      studentCount: teacher.studentCount || 0,
      attendanceCount: teacher.attendanceCount || 0,
      examCount: teacher.examCount || 0
    };

    if (database) {
      try {
        // Clear deleted flags in RTDB
        const tempDeletedRef = ref(database, `schools/${cleanCode}/temporarilyDeletedTeachers/${teacher.id}`);
        await remove(tempDeletedRef).catch(() => {});
        const deletedTeacherRef = ref(database, `schools/${cleanCode}/deletedTeachers/${teacher.id}`);
        await remove(deletedTeacherRef).catch(() => {});
        if (teacher.uid) {
          const deletedTeacherUidRef = ref(database, `schools/${cleanCode}/deletedTeachers/${teacher.uid}`);
          await remove(deletedTeacherUidRef).catch(() => {});
        }
        if (cleanGmail) {
          const sanitizedEmail = this.sanitizeEmailKey(cleanGmail);
          const deletedEmailRef = ref(database, `schools/${cleanCode}/deletedTeacherEmails/${sanitizedEmail}`);
          await remove(deletedEmailRef).catch(() => {});
        }

        // 1. Write to dedicated teachers/ collection in Realtime Database
        const dedicatedTeacherRef = ref(database, `teachers/${teacher.id}`);
        await update(dedicatedTeacherRef, sanitizedTeacherRecord);

        // 2. Write to schools/{schoolCode}/teachers/{teacher.id} for active Admin Panel list
        const schoolTeacherRef = ref(database, `schools/${cleanCode}/teachers/${teacher.id}`);
        await update(schoolTeacherRef, sanitizedTeacherRecord);
      } catch (err) {
        console.warn('Error saving teacher to RTDB:', err);
      }
    }

    if (firestore) {
      try {
        // Clear deleted flag in Firestore
        const deletedDocRef = fsDoc(firestore, `schools/${cleanCode}/deletedTeachers/${teacher.id}`);
        await fsDeleteDoc(deletedDocRef).catch(() => {});
        if (teacher.uid) {
          const deletedUidDocRef = fsDoc(firestore, `schools/${cleanCode}/deletedTeachers/${teacher.uid}`);
          await fsDeleteDoc(deletedUidDocRef).catch(() => {});
        }

        const teacherDocRef = fsDoc(firestore, `schools/${cleanCode}/teachers/${teacher.id}`);
        await fsSetDoc(teacherDocRef, sanitizedTeacherRecord, { merge: true });
        const userDocRef = fsDoc(firestore, `users/${teacher.id}`);
        await fsSetDoc(userDocRef, { ...sanitizedTeacherRecord, role: 'teacher' }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore saveTeacherToSchool warning:', fsErr);
      }
    }

    return true;
  }

  public async temporaryDeleteTeacherFromSchool(schoolCode: string, teacherId: string, teacherEmail?: string): Promise<boolean> {
    if (!schoolCode || !teacherId) return false;
    const cleanCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();
    const cleanEmail = (teacherEmail || '').trim().toLowerCase();

    // Track temporary delete in local storage
    StorageService.addTemporarilyDeletedTeacherId(teacherId, cleanEmail);

    if (database) {
      try {
        // Remove from active school teacher list
        const schoolTeacherRef = ref(database, `schools/${cleanCode}/teachers/${teacherId}`);
        await remove(schoolTeacherRef);

        // Mark temporary deletion in RTDB
        const tempDeletedRef = ref(database, `schools/${cleanCode}/temporarilyDeletedTeachers/${teacherId}`);
        await set(tempDeletedRef, { temporarilyDeleted: true, deletedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Error temporarily deleting teacher in RTDB:', err);
      }
    }

    if (firestore) {
      try {
        const teacherDocRef = fsDoc(firestore, `schools/${cleanCode}/teachers/${teacherId}`);
        await fsDeleteDoc(teacherDocRef);
        const tempDeletedDocRef = fsDoc(firestore, `schools/${cleanCode}/temporarilyDeletedTeachers/${teacherId}`);
        await fsSetDoc(tempDeletedDocRef, { temporarilyDeleted: true, deletedAt: new Date().toISOString() });
      } catch (fsErr) {
        console.warn('Firestore temporaryDeleteTeacherFromSchool warning:', fsErr);
      }
    }

    return true;
  }

  public async permanentDeleteTeacherFromSchool(schoolCode: string, teacherId: string, teacherEmail?: string): Promise<boolean> {
    if (!schoolCode || !teacherId) return false;
    const cleanCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();
    const cleanEmail = (teacherEmail || '').trim().toLowerCase();
    const sanitizedEmail = cleanEmail ? this.sanitizeEmailKey(cleanEmail) : '';

    // Track permanent delete in local storage
    StorageService.addPermanentlyDeletedTeacherId(teacherId, cleanEmail);

    if (database) {
      try {
        const dedicatedTeacherRef = ref(database, `teachers/${teacherId}`);
        await remove(dedicatedTeacherRef);

        const schoolTeacherRef = ref(database, `schools/${cleanCode}/teachers/${teacherId}`);
        await remove(schoolTeacherRef);

        const userRefPath = ref(database, `users/${teacherId}`);
        await remove(userRefPath);

        const permDeletedRef = ref(database, `schools/${cleanCode}/permanentlyDeletedTeachers/${teacherId}`);
        await set(permDeletedRef, true);

        const deletedTeacherRef = ref(database, `schools/${cleanCode}/deletedTeachers/${teacherId}`);
        await set(deletedTeacherRef, true);

        if (sanitizedEmail) {
          const deletedEmailRef = ref(database, `schools/${cleanCode}/deletedTeacherEmails/${sanitizedEmail}`);
          await set(deletedEmailRef, true);

          const emailAccountRef = ref(database, `email_accounts/${sanitizedEmail}`);
          await remove(emailAccountRef);

          const gmailPasswordRef = ref(database, `Gmail and Password/${sanitizedEmail}`);
          await remove(gmailPasswordRef);
        }
      } catch (err) {
        console.warn('Error permanently deleting teacher from RTDB:', err);
      }
    }

    if (firestore) {
      try {
        const teacherDocRef = fsDoc(firestore, `schools/${cleanCode}/teachers/${teacherId}`);
        await fsDeleteDoc(teacherDocRef);
        const userDocRef = fsDoc(firestore, `users/${teacherId}`);
        await fsDeleteDoc(userDocRef);
        const permDeletedDocRef = fsDoc(firestore, `schools/${cleanCode}/permanentlyDeletedTeachers/${teacherId}`);
        await fsSetDoc(permDeletedDocRef, { permanentlyDeleted: true, deletedAt: new Date().toISOString() });
        const deletedTeacherDocRef = fsDoc(firestore, `schools/${cleanCode}/deletedTeachers/${teacherId}`);
        await fsSetDoc(deletedTeacherDocRef, { deleted: true, deletedAt: new Date().toISOString() });
      } catch (fsErr) {
        console.warn('Firestore permanentDeleteTeacherFromSchool warning:', fsErr);
      }
    }

    return true;
  }

  public async deleteTeacherFromSchool(
    schoolCode: string,
    teacherId: string,
    teacherEmail?: string,
    isPermanent: boolean = true
  ): Promise<boolean> {
    if (isPermanent) {
      return this.permanentDeleteTeacherFromSchool(schoolCode, teacherId, teacherEmail);
    } else {
      return this.temporaryDeleteTeacherFromSchool(schoolCode, teacherId, teacherEmail);
    }
  }

  public async saveClassToSchool(schoolCode: string, classItem: ClassItem, students?: Student[]): Promise<boolean> {
    if (!schoolCode || !classItem || !classItem.id) return false;
    const cleanCode = schoolCode.trim().toUpperCase();

    if (database) {
      try {
        const classRefPath = ref(database, `schools/${cleanCode}/classes/${classItem.id}`);
        await set(classRefPath, { ...classItem, schoolCode: cleanCode });
        if (students && students.length > 0) {
          const studsRefPath = ref(database, `schools/${cleanCode}/classes/${classItem.id}/students`);
          await set(studsRefPath, students);
        }
      } catch (e) {
        console.warn('RTDB saveClassToSchool warning:', e);
      }
    }

    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/classes/${classItem.id}`);
        await fsSetDoc(docRef, { ...classItem, schoolCode: cleanCode }, { merge: true });
        if (students && students.length > 0) {
          for (const s of students) {
            const sRef = fsDoc(firestore, `schools/${cleanCode}/classes/${classItem.id}/students/${s.id}`);
            await fsSetDoc(sRef, { ...s, classId: classItem.id, schoolCode: cleanCode }, { merge: true });
          }
        }
      } catch (e) {
        console.warn('Firestore saveClassToSchool warning:', e);
      }
    }

    return true;
  }

  public async deleteClassFromSchool(schoolCode: string, classId: string): Promise<boolean> {
    if (!schoolCode || !classId) return false;
    const cleanCode = schoolCode.trim().toUpperCase();

    if (database) {
      try {
        const classRefPath = ref(database, `schools/${cleanCode}/classes/${classId}`);
        await remove(classRefPath);
      } catch (e) {}
    }

    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/classes/${classId}`);
        await fsDeleteDoc(docRef);
      } catch (e) {}
    }

    return true;
  }

  public listenToSchoolClasses(
    schoolCode: string,
    onClassesUpdated: (classes: ClassItem[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubFs: (() => void) | null = null;
    if (firestore) {
      try {
        const colRef = fsCollection(firestore, `schools/${cleanCode}/classes`);
        unsubFs = fsOnSnapshot(colRef, (snapshot) => {
          const list: ClassItem[] = [];
          snapshot.forEach((d: any) => {
            const val = d.data();
            if (val) list.push({ ...val, id: val.id || d.id });
          });
          StorageService.saveClassesList(list);
          onClassesUpdated(list);
        }, err => console.warn('Firestore listenToSchoolClasses warning:', err));
      } catch (e) {
        console.warn('Firestore listenToSchoolClasses setup error:', e);
      }
    }

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const classesRefPath = ref(database, `schools/${cleanCode}/classes`);
        unsubRtdb = onValue(classesRefPath, snapshot => {
          const list: ClassItem[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              const c = child.val();
              if (c) list.push(c);
            });
          }
          StorageService.saveClassesList(list);
          onClassesUpdated(list);
        });
      } catch (e) {}
    }

    return () => {
      if (unsubFs) unsubFs();
      if (unsubRtdb) unsubRtdb();
    };
  }

  public async storeCredentials(gmail: string, password: string): Promise<void> {
    await storeCredentialsInRTDB(gmail, password);
  }

  public async recordTeacherActivity(
    schoolCode: string,
    activity: {
      teacherId: string;
      teacherName: string;
      subject?: string;
      assignedClass?: string;
      activityType: TeacherActivityItem['activityType'];
      description: string;
    }
  ): Promise<void> {
    if (!schoolCode) return;
    const cleanCode = schoolCode.trim().toUpperCase();
    const actId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const activityItem: TeacherActivityItem = {
      id: actId,
      schoolCode: cleanCode,
      teacherId: activity.teacherId,
      teacherName: activity.teacherName,
      subject: activity.subject,
      assignedClass: activity.assignedClass,
      activityType: activity.activityType,
      description: activity.description,
      timestamp: now
    };

    try {
      const actRefPath = ref(database, `schools/${cleanCode}/activities/${actId}`);
      await set(actRefPath, activityItem);

      if (activity.teacherId) {
        const teacherRefPath = ref(database, `schools/${cleanCode}/teachers/${activity.teacherId}`);
        await update(teacherRefPath, {
          lastActiveAt: now,
          recentActivity: activity.description
        });
      }
    } catch (e) {
      console.warn('Error logging real-time teacher activity to RTDB:', e);
    }
  }

  public listenToSchoolTeachers(
    schoolCode: string,
    onTeachersUpdated: (teachers: TeacherAccount[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    if (this.unsubscribeSchoolTeachersSnapshot) {
      try {
        this.unsubscribeSchoolTeachersSnapshot();
      } catch (e) {}
      this.unsubscribeSchoolTeachersSnapshot = null;
    }

    try {
      const teachersRefPath = ref(database, `schools/${cleanCode}/teachers`);
      this.unsubscribeSchoolTeachersSnapshot = onValue(
        teachersRefPath,
        snapshot => {
          const remoteTeachers: TeacherAccount[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
              const t = childSnap.val() as TeacherAccount;
              if (t && !StorageService.isTeacherDeleted(t.id, t.email || t.gmail)) {
                remoteTeachers.push(t);
              }
            });
          }

          const localTeachers = StorageService.getTeacherAccounts();
          const otherSchoolTeachers = localTeachers.filter(lt => (lt.schoolCode || '').trim().toUpperCase() !== cleanCode);
          const updatedLocalTeachers = [...otherSchoolTeachers, ...remoteTeachers];
          StorageService.saveTeacherAccounts(updatedLocalTeachers);

          onTeachersUpdated(remoteTeachers);
        },
        error => {
          console.warn('Error listening to school teachers:', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish real-time school teachers listener:', e);
    }

    return () => {
      if (this.unsubscribeSchoolTeachersSnapshot) {
        this.unsubscribeSchoolTeachersSnapshot();
        this.unsubscribeSchoolTeachersSnapshot = null;
      }
    };
  }

  public async clearSchoolActivities(schoolCode: string): Promise<boolean> {
    if (!schoolCode) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    try {
      const activitiesRefPath = ref(database, `schools/${cleanCode}/activities`);
      await remove(activitiesRefPath);
      return true;
    } catch (e) {
      console.error('Error clearing school activities:', e);
      return false;
    }
  }

  public listenToSchoolActivities(
    schoolCode: string,
    onActivitiesUpdated: (activities: TeacherActivityItem[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    if (this.unsubscribeSchoolActivitiesSnapshot) {
      try {
        this.unsubscribeSchoolActivitiesSnapshot();
      } catch (e) {}
      this.unsubscribeSchoolActivitiesSnapshot = null;
    }

    try {
      const activitiesRefPath = ref(database, `schools/${cleanCode}/activities`);
      this.unsubscribeSchoolActivitiesSnapshot = onValue(
        activitiesRefPath,
        snapshot => {
          const list: TeacherActivityItem[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(childSnap => {
              const act = childSnap.val() as TeacherActivityItem;
              if (act) list.push(act);
            });
          }

          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          onActivitiesUpdated(list.slice(0, 30));
        },
        error => {
          console.warn('Error listening to school activities:', error);
        }
      );
    } catch (e) {
      console.warn('Could not establish real-time school activities listener:', e);
    }

    return () => {
      if (this.unsubscribeSchoolActivitiesSnapshot) {
        this.unsubscribeSchoolActivitiesSnapshot();
        this.unsubscribeSchoolActivitiesSnapshot = null;
      }
    };
  }

  // ------------------ SCHOOL BROADCASTS ------------------
  public async saveBroadcastToSchool(schoolCode: string, broadcast: PrincipalBroadcast): Promise<boolean> {
    if (!schoolCode || !broadcast || !broadcast.id) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await set(ref(database, `schools/${cleanCode}/broadcasts/${broadcast.id}`), broadcast);
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/broadcasts/${broadcast.id}`);
        await fsSetDoc(docRef, broadcast, { merge: true });
      } catch (e) {}
    }
    return true;
  }

  public async deleteBroadcastFromSchool(schoolCode: string, broadcastId: string): Promise<boolean> {
    if (!schoolCode || !broadcastId) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await remove(ref(database, `schools/${cleanCode}/broadcasts/${broadcastId}`));
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/broadcasts/${broadcastId}`);
        await fsDeleteDoc(docRef);
      } catch (e) {}
    }
    return true;
  }

  public listenToSchoolBroadcasts(
    schoolCode: string,
    onBroadcastsUpdated: (broadcasts: PrincipalBroadcast[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const bRef = ref(database, `schools/${cleanCode}/broadcasts`);
        unsubRtdb = onValue(bRef, snapshot => {
          const list: PrincipalBroadcast[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              const b = child.val();
              if (b) list.push(b);
            });
          }
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          StorageService.savePrincipalBroadcasts(list);
          onBroadcastsUpdated(list);
        });
      } catch (e) {}
    }
    return () => {
      if (unsubRtdb) unsubRtdb();
    };
  }

  // ------------------ SCHOOL TIMETABLES ------------------
  public async saveTimetableSlotToSchool(schoolCode: string, slot: TimetableSlot): Promise<boolean> {
    if (!schoolCode || !slot || !slot.id) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await set(ref(database, `schools/${cleanCode}/timetables/${slot.id}`), slot);
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/timetables/${slot.id}`);
        await fsSetDoc(docRef, slot, { merge: true });
      } catch (e) {}
    }
    return true;
  }

  public async saveTimetablesToSchool(schoolCode: string, slots: TimetableSlot[]): Promise<boolean> {
    if (!schoolCode) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        const timetablesMap: Record<string, TimetableSlot> = {};
        slots.forEach(s => {
          if (s.id) timetablesMap[s.id] = s;
        });
        await set(ref(database, `schools/${cleanCode}/timetables`), timetablesMap);
      } catch (e) {}
    }
    return true;
  }

  public async deleteTimetableSlotFromSchool(schoolCode: string, slotId: string): Promise<boolean> {
    if (!schoolCode || !slotId) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await remove(ref(database, `schools/${cleanCode}/timetables/${slotId}`));
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/timetables/${slotId}`);
        await fsDeleteDoc(docRef);
      } catch (e) {}
    }
    return true;
  }

  public listenToSchoolTimetables(
    schoolCode: string,
    onTimetablesUpdated: (slots: TimetableSlot[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const tRef = ref(database, `schools/${cleanCode}/timetables`);
        unsubRtdb = onValue(tRef, snapshot => {
          const list: TimetableSlot[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              const s = child.val();
              if (s) list.push(s);
            });
          }
          StorageService.saveTimetables(list);
          onTimetablesUpdated(list);
        });
      } catch (e) {}
    }
    return () => {
      if (unsubRtdb) unsubRtdb();
    };
  }

  // ------------------ SCHOOL STUDENTS ------------------
  public async saveStudentToSchool(schoolCode: string, student: Student): Promise<boolean> {
    if (!schoolCode || !student || !student.id) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await set(ref(database, `schools/${cleanCode}/students/${student.id}`), student);
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/students/${student.id}`);
        await fsSetDoc(docRef, student, { merge: true });
      } catch (e) {}
    }
    return true;
  }

  public async deleteStudentFromSchool(schoolCode: string, studentId: string): Promise<boolean> {
    if (!schoolCode || !studentId) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await remove(ref(database, `schools/${cleanCode}/students/${studentId}`));
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/students/${studentId}`);
        await fsDeleteDoc(docRef);
      } catch (e) {}
    }
    return true;
  }

  public listenToSchoolStudents(
    schoolCode: string,
    onStudentsUpdated: (students: Student[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const sRef = ref(database, `schools/${cleanCode}/students`);
        unsubRtdb = onValue(sRef, snapshot => {
          const list: Student[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              const st = child.val();
              if (st) list.push(st);
            });
          }
          StorageService.saveStudents(list);
          onStudentsUpdated(list);
        });
      } catch (e) {}
    }
    return () => {
      if (unsubRtdb) unsubRtdb();
    };
  }

  // ------------------ SCHOOL PROFILE ------------------
  public async saveSchoolProfileToSchool(schoolCode: string, profile: SchoolProfile): Promise<boolean> {
    if (!schoolCode || !profile) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await set(ref(database, `schools/${cleanCode}/schoolProfile`), profile);
      } catch (e) {}
    }
    if (firestore) {
      try {
        const docRef = fsDoc(firestore, `schools/${cleanCode}/schoolProfile/info`);
        await fsSetDoc(docRef, profile, { merge: true });
      } catch (e) {}
    }
    return true;
  }

  public listenToSchoolProfile(
    schoolCode: string,
    onProfileUpdated: (profile: SchoolProfile) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const pRef = ref(database, `schools/${cleanCode}/schoolProfile`);
        unsubRtdb = onValue(pRef, snapshot => {
          if (snapshot.exists()) {
            const prof = snapshot.val() as SchoolProfile;
            if (prof && prof.schoolName) {
              StorageService.saveSchoolProfile(prof);
              onProfileUpdated(prof);
            }
          }
        });
      } catch (e) {}
    }
    return () => {
      if (unsubRtdb) unsubRtdb();
    };
  }

  // ------------------ AUDIT LOGS ------------------
  public async saveAuditLogToSchool(schoolCode: string, logItem: AuditLogItem): Promise<boolean> {
    if (!schoolCode || !logItem || !logItem.id) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await set(ref(database, `schools/${cleanCode}/auditLogs/${logItem.id}`), logItem);
      } catch (e) {}
    }
    return true;
  }

  public async clearAuditLogsFromSchool(schoolCode: string): Promise<boolean> {
    if (!schoolCode) return false;
    const cleanCode = schoolCode.trim().toUpperCase();
    if (database) {
      try {
        await remove(ref(database, `schools/${cleanCode}/auditLogs`));
      } catch (e) {}
    }
    return true;
  }

  public listenToSchoolAuditLogs(
    schoolCode: string,
    onAuditLogsUpdated: (logs: AuditLogItem[]) => void
  ): () => void {
    if (!schoolCode) return () => {};
    const cleanCode = schoolCode.trim().toUpperCase();

    let unsubRtdb: (() => void) | null = null;
    if (database) {
      try {
        const aRef = ref(database, `schools/${cleanCode}/auditLogs`);
        unsubRtdb = onValue(aRef, snapshot => {
          const list: AuditLogItem[] = [];
          if (snapshot.exists()) {
            snapshot.forEach(child => {
              const item = child.val();
              if (item) list.push(item);
            });
          }
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          StorageService.saveAuditLogs(list);
          onAuditLogsUpdated(list);
        });
      } catch (e) {}
    }
    return () => {
      if (unsubRtdb) unsubRtdb();
    };
  }

  public async fetchSchoolTeachers(schoolCode: string): Promise<TeacherAccount[]> {
    if (!schoolCode) return [];
    const cleanCode = schoolCode.trim().toUpperCase();

    try {
      const teachersRefPath = ref(database, `schools/${cleanCode}/teachers`);
      const snap = await get(teachersRefPath);
      const list: TeacherAccount[] = [];
      if (snap.exists()) {
        snap.forEach(childSnap => {
          const t = childSnap.val() as TeacherAccount;
          if (t) list.push(t);
        });
      }
      return list;
    } catch (e) {
      console.warn('Error fetching school teachers from RTDB:', e);
      return [];
    }
  }

  public async fetchTeacherCredential(
    gmail: string,
    schoolCode?: string
  ): Promise<{
    found: boolean;
    valid: boolean;
    reason?: 'status_inactive' | 'school_mismatch' | 'not_found';
    teacher?: TeacherAccount;
  }> {
    if (!gmail || !gmail.trim()) return { found: false, valid: false, reason: 'not_found' };
    const cleanGmail = gmail.trim().toLowerCase();
    const cleanSchoolCode = schoolCode ? schoolCode.trim().toUpperCase() : '';

    // Fast local accounts check first (0ms)
    try {
      const localTeachers = StorageService.getTeacherAccounts();
      const localMatch = localTeachers.find(t => 
        (t.email && t.email.toLowerCase() === cleanGmail) || 
        (t.gmail && t.gmail.toLowerCase() === cleanGmail)
      );
      if (localMatch) {
        if (localMatch.status && localMatch.status !== 'active') {
          return { found: true, valid: false, reason: 'status_inactive', teacher: localMatch };
        }
        if (cleanSchoolCode && localMatch.schoolCode && localMatch.schoolCode.toUpperCase() !== cleanSchoolCode) {
          return { found: true, valid: false, reason: 'school_mismatch', teacher: localMatch };
        }
        return { found: true, valid: true, teacher: localMatch };
      }
    } catch (e) {}

    if (database) {
      try {
        const timeoutPromise = new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500));

        // 1. Check in dedicated teachers/ RTDB collection with timeout
        const teachersRef = ref(database, 'teachers');
        const snap = await Promise.race([get(teachersRef), timeoutPromise]).catch(() => null);
        if (snap && snap.exists()) {
          let matchedTeacher: TeacherAccount | null = null;
          snap.forEach(child => {
            const val = child.val() as TeacherAccount;
            const tEmail = (val.gmail || val.email || '').trim().toLowerCase();
            if (tEmail === cleanGmail) {
              matchedTeacher = val;
            }
          });

          if (matchedTeacher) {
            const t = matchedTeacher as TeacherAccount;
            if (t.status && t.status !== 'active') {
              return { found: true, valid: false, reason: 'status_inactive', teacher: t };
            }
            if (cleanSchoolCode && t.schoolCode && t.schoolCode.toUpperCase() !== cleanSchoolCode) {
              return { found: true, valid: false, reason: 'school_mismatch', teacher: t };
            }
            return { found: true, valid: true, teacher: t };
          }
        }

        // 2. Check in schools/{cleanSchoolCode}/teachers RTDB collection with timeout
        if (cleanSchoolCode) {
          const schoolTeachersRef = ref(database, `schools/${cleanSchoolCode}/teachers`);
          const schoolSnap = await Promise.race([get(schoolTeachersRef), timeoutPromise]).catch(() => null);
          if (schoolSnap && schoolSnap.exists()) {
            let matchedTeacher: TeacherAccount | null = null;
            schoolSnap.forEach(child => {
              const val = child.val() as TeacherAccount;
              const tEmail = (val.gmail || val.email || '').trim().toLowerCase();
              if (tEmail === cleanGmail) {
                matchedTeacher = val;
              }
            });

            if (matchedTeacher) {
              const t = matchedTeacher as TeacherAccount;
              if (t.status && t.status !== 'active') {
                return { found: true, valid: false, reason: 'status_inactive', teacher: t };
              }
              return { found: true, valid: true, teacher: t };
            }
          }
        }
      } catch (err) {
        console.warn('Error querying teachers collection in RTDB:', err);
      }
    }

    return { found: false, valid: false, reason: 'not_found' };
  }

  public async logUnauthorizedAttempt(email: string, schoolCode: string, reason: string) {
    try {
      const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const attemptRefPath = ref(database, `unauthorizedAttempts/${attemptId}`);
      await set(attemptRefPath, {
        attemptedEmail: email || 'unknown',
        enteredSchoolCode: schoolCode || 'unknown',
        reason,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Error logging unauthorized attempt:', e);
    }
  }

  public async verifyAndSyncSchoolAdmin(
    uid: string,
    email: string,
    schoolCode: string,
    designation?: string
  ): Promise<{
    authorized: boolean;
    reason?: string;
    adminRecord?: {
      id: string;
      email: string;
      schoolCode: string;
      role: string;
      status: string;
      adminName: string;
      schoolName: string;
      designation?: string;
      createdAt: string;
    };
  }> {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanSchoolCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();
    const nowIso = new Date().toISOString();

    if (!cleanEmail || !cleanSchoolCode) {
      return {
        authorized: false,
        reason: 'Access Denied\n\nThis Gmail account is not authorized to access this School Admin Panel.'
      };
    }

    // Pre-authorized Gmail accounts for SSHSS@111213
    const PRE_AUTHORIZED_EMAILS = new Set([
      'lincythomas1911@gmail.com',
      'gelwin72@gmail.com',
      'joicegeorge1910@gmail.com',
      'admin1@gmail.com',
      'admin2@gmail.com',
      'admin3@gmail.com'
    ]);

    const isPreAuthorized = PRE_AUTHORIZED_EMAILS.has(cleanEmail);

    // Fast path: Immediately grant access for pre-authorized admins under SSHSS@111213
    if (isPreAuthorized && cleanSchoolCode === 'SSHSS@111213') {
      const adminNameDetermined = designation || (
        cleanEmail.includes('lincy') ? 'Lincy Thomas' :
        cleanEmail.includes('gelwin') ? 'Gelwin' :
        cleanEmail.includes('joice') ? 'Joice George' : 'School Administrator'
      );

      const adminData = {
        id: uid || `admin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        uid: uid || `admin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
        email: cleanEmail,
        schoolCode: cleanSchoolCode,
        role: 'schoolAdmin',
        status: 'active',
        adminName: adminNameDetermined,
        schoolName: "St. Sebastian's Higher Secondary School",
        designation: designation || 'Head of School',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // Non-blocking background sync to RTDB & Firestore
      if (database && uid) {
        try {
          const updates: Record<string, any> = {};
          updates[`schoolAdmins/${uid}`] = adminData;
          updates[`schools/${cleanSchoolCode}/schoolAdmins/${uid}`] = adminData;
          updates[`schools/${cleanSchoolCode}/adminProfile`] = adminData;
          update(ref(database), updates).catch(e => console.warn('RTDB admin sync bg note:', e));
        } catch (e) {}
      }

      if (firestore && uid) {
        try {
          const docRef = fsDoc(firestore, `schoolAdmins/${uid}`);
          fsSetDoc(docRef, adminData, { merge: true }).catch(e => console.warn('Firestore admin sync bg note:', e));
          const schoolAdminRef = fsDoc(firestore, `schools/${cleanSchoolCode}/schoolAdmins/${uid}`);
          fsSetDoc(schoolAdminRef, adminData, { merge: true }).catch(e => console.warn('Firestore school admin sync bg note:', e));
        } catch (e) {}
      }

      return {
        authorized: true,
        adminRecord: {
          id: adminData.id,
          email: cleanEmail,
          schoolCode: cleanSchoolCode,
          role: 'schoolAdmin',
          status: 'active',
          adminName: adminData.adminName,
          schoolName: adminData.schoolName,
          designation: adminData.designation,
          createdAt: adminData.createdAt
        }
      };
    }

    let matchedRecord: any = null;

    // For non-pre-authorized emails, query with tight timeout
    if (database && uid) {
      try {
        const rootAdminRef = ref(database, `schoolAdmins/${uid}`);
        const snap = await Promise.race([
          get(rootAdminRef),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
        ]).catch(() => null);

        if (snap && snap.exists()) {
          matchedRecord = snap.val();
        }
      } catch (e) {}

      if (!matchedRecord) {
        try {
          const schoolAdminRef = ref(database, `schools/${cleanSchoolCode}/schoolAdmins/${uid}`);
          const snap = await Promise.race([
            get(schoolAdminRef),
            new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
          ]).catch(() => null);

          if (snap && snap.exists()) {
            matchedRecord = snap.val();
          }
        } catch (e) {}
      }
    }

    if (!matchedRecord && firestore && uid) {
      try {
        const docRef = fsDoc(firestore, `schoolAdmins/${uid}`);
        const docSnap = await Promise.race([
          fsGetDoc(docRef),
          new Promise<null>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1500))
        ]).catch(() => null);

        if (docSnap && docSnap.exists()) {
          matchedRecord = docSnap.data();
        }
      } catch (e) {}
    }

    if (!matchedRecord && !isPreAuthorized) {
      return {
        authorized: false,
        reason: 'Access Denied\n\nThis Gmail account is not authorized to access this School Admin Panel.'
      };
    }

    // Verify properties if record was found
    const targetCode = String(matchedRecord?.schoolCode || cleanSchoolCode).trim().toUpperCase();
    const targetRole = String(matchedRecord?.role || 'schoolAdmin').trim();
    const targetStatus = String(matchedRecord?.status || 'active').trim().toLowerCase();

    const isSchoolCodeMatch = targetCode === cleanSchoolCode;
    const isRoleValid = targetRole.toLowerCase() === 'schooladmin' || targetRole.toLowerCase() === 'admin' || targetRole.toUpperCase() === 'SCHOOL_ADMIN';
    const isActive = targetStatus === 'active' || targetStatus === 'true';

    if (!isSchoolCodeMatch || !isRoleValid || !isActive) {
      return {
        authorized: false,
        reason: 'Access Denied\n\nThis Gmail account is not authorized to access this School Admin Panel.'
      };
    }

    // Create / Sync authorized admin profile across RTDB & Firestore (non-blocking)
    const adminData = {
      id: uid,
      uid: uid,
      email: cleanEmail,
      schoolCode: cleanSchoolCode,
      role: 'schoolAdmin',
      status: 'active',
      adminName: designation || matchedRecord?.adminName || 'School Administrator',
      schoolName: matchedRecord?.schoolName || "St. Sebastian's Higher Secondary School",
      designation: designation || matchedRecord?.designation || 'Head of School',
      createdAt: matchedRecord?.createdAt || nowIso,
      updatedAt: nowIso
    };

    if (database && uid) {
      try {
        const updates: Record<string, any> = {};
        updates[`schoolAdmins/${uid}`] = adminData;
        updates[`schools/${cleanSchoolCode}/schoolAdmins/${uid}`] = adminData;
        updates[`schools/${cleanSchoolCode}/adminProfile`] = adminData;
        update(ref(database), updates).catch(e => console.warn('Error syncing schoolAdmin to RTDB:', e));
      } catch (e) {
        console.warn('Error syncing schoolAdmin to RTDB:', e);
      }
    }

    if (firestore && uid) {
      try {
        const docRef = fsDoc(firestore, `schoolAdmins/${uid}`);
        fsSetDoc(docRef, adminData, { merge: true }).catch(() => {});

        const schoolAdminRef = fsDoc(firestore, `schools/${cleanSchoolCode}/schoolAdmins/${uid}`);
        fsSetDoc(schoolAdminRef, adminData, { merge: true }).catch(() => {});
      } catch (e) {
        console.warn('Error syncing schoolAdmin to Firestore:', e);
      }
    }

    return {
      authorized: true,
      adminRecord: {
        id: uid,
        email: cleanEmail,
        schoolCode: cleanSchoolCode,
        role: 'schoolAdmin',
        status: 'active',
        adminName: adminData.adminName,
        schoolName: adminData.schoolName,
        designation: adminData.designation,
        createdAt: adminData.createdAt
      }
    };
  }

  public async recordLoginActivity(
    schoolCode: string,
    payload: {
      email: string;
      accessMethod: 'Teacher Sign-Up' | 'Teacher Login' | 'School Admin Panel';
      role: 'teacher' | 'admin';
      success: boolean;
      details?: string;
    }
  ): Promise<void> {
    const cleanCode = (schoolCode || 'SSHSS@111213').trim().toUpperCase();
    const actId = `login-act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const activityItem = {
      id: actId,
      schoolCode: cleanCode,
      email: payload.email,
      accessMethod: payload.accessMethod,
      role: payload.role,
      success: payload.success,
      details: payload.details || `${payload.email} accessed via ${payload.accessMethod}`,
      timestamp: now,
      activityType: 'login_access'
    };

    try {
      const actRefPath = ref(database, `schools/${cleanCode}/loginActivities/${actId}`);
      await set(actRefPath, activityItem);

      const generalActRefPath = ref(database, `schools/${cleanCode}/activities/${actId}`);
      await set(generalActRefPath, {
        id: actId,
        schoolCode: cleanCode,
        teacherId: payload.email,
        teacherName: payload.email,
        activityType: 'login',
        description: `[${payload.accessMethod}] ${payload.email} ${payload.success ? 'logged in successfully' : 'login failed'}`,
        timestamp: now
      });
    } catch (e) {
      console.warn('Error recording login activity to RTDB:', e);
    }
  }

  public scheduleAutoSync() {
    const syncEmail = this.getActiveSyncEmail();
    if (!auth?.currentUser && !syncEmail) return;
    if (this.isApplyingRemoteUpdate) return;
    if (this.quotaExhaustedUntil > Date.now()) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.pushToCloud();
    }, 2500);
  }
}

export const CloudSync = new CloudSyncManager();

registerStorageMutationListener(() => {
  CloudSync.scheduleAutoSync();
});
