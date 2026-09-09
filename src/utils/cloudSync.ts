import { database, auth, FirebaseUser, ref, get, set, update, remove, push, onValue, off } from './firebase';
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
  PrincipalBroadcast
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
    const cleanCode = schoolCode.trim().toUpperCase();

    try {
      const teacherRefPath = ref(database, `schools/${cleanCode}/teachers/${teacher.id}`);
      const sanitizedTeacherRecord = {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email || '',
        dob: teacher.dob || '',
        phone: teacher.phone || '',
        schoolName: teacher.schoolName || '',
        schoolCode: cleanCode,
        subject: teacher.subject || teacher.primarySubject || teacher.designation || 'General',
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

      await update(teacherRefPath, sanitizedTeacherRecord);
      return true;
    } catch (err) {
      console.warn('Error saving teacher to school code RTDB:', err);
      return false;
    }
  }

  public async deleteTeacherFromSchool(schoolCode: string, teacherId: string): Promise<boolean> {
    if (!schoolCode || !teacherId) return false;
    const cleanCode = schoolCode.trim().toUpperCase();

    try {
      const teacherRefPath = ref(database, `schools/${cleanCode}/teachers/${teacherId}`);
      await remove(teacherRefPath);
      return true;
    } catch (err) {
      console.warn('Error deleting teacher from school code RTDB:', err);
      return false;
    }
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
              if (t) remoteTeachers.push(t);
            });
          }

          const localTeachers = StorageService.getTeacherAccounts();
          let mutated = false;

          remoteTeachers.forEach(rt => {
            const idx = localTeachers.findIndex(lt => lt.id === rt.id || (lt.name === rt.name && lt.schoolCode === cleanCode));
            if (idx >= 0) {
              localTeachers[idx] = {
                ...localTeachers[idx],
                name: rt.name,
                dob: rt.dob || localTeachers[idx].dob,
                phone: rt.phone || localTeachers[idx].phone,
                schoolName: rt.schoolName || localTeachers[idx].schoolName,
                schoolCode: rt.schoolCode,
                subject: rt.subject || localTeachers[idx].subject,
                primarySubject: rt.primarySubject || localTeachers[idx].primarySubject,
                standard: rt.standard || localTeachers[idx].standard,
                stream: rt.stream || localTeachers[idx].stream,
                section: rt.section || localTeachers[idx].section,
                assignedClass: rt.assignedClass || localTeachers[idx].assignedClass,
                designation: rt.designation || localTeachers[idx].designation,
                avatar: rt.avatar || localTeachers[idx].avatar,
                photoUrl: rt.photoUrl || localTeachers[idx].photoUrl,
                lastActiveAt: rt.lastActiveAt || localTeachers[idx].lastActiveAt,
                recentActivity: rt.recentActivity || localTeachers[idx].recentActivity
              };
              mutated = true;
            } else {
              localTeachers.push({
                ...rt,
                email: rt.email || ''
              });
              mutated = true;
            }
          });

          if (mutated) {
            StorageService.saveTeacherAccounts(localTeachers);
          }

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
