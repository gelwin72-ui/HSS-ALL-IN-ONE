import React, { useState, useEffect } from 'react';
import { 
  School, 
  Teacher, 
  ClassRoom, 
  Student, 
  DailyAttendance, 
  Exam, 
  MarkRecord, 
  Timetable, 
  Reminder, 
  Directive, 
  AuditLog, 
  TeacherActivity, 
  AppReview,
  BlacklistedTeacher,
  TeacherCredentials,
  SchoolTeacherRecord,
  ActiveTab, 
  Role 
} from './types';
import { 
  subscribeCollection, 
  saveDocument, 
  removeDocument 
} from './lib/firebase';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AuthModal } from './components/AuthModal';
import { DashboardView } from './components/DashboardView';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { TimetableView } from './components/TimetableView';
import { ExamsView } from './components/ExamsView';
import { TrajectoryView } from './components/TrajectoryView';
import { ReportsView } from './components/ReportsView';
import { NoticesView } from './components/NoticesView';
import { ReviewsView } from './components/ReviewsView';
import { SettingsView } from './components/SettingsView';
import { AdminPortalView } from './components/AdminPortalView';
import { ClassModal } from './components/ClassModal';
import { RemindersModal } from './components/RemindersModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { SchoolProfileModal } from './components/SchoolProfileModal';

// Default initial seed data matching video showcase & user institutional setup
const defaultSchool: School = {
  id: 'SSHSS@111213',
  schoolName: 'St. Sebastain\'s Higher Secondary School',
  schoolCode: 'SSHSS@111213',
  address: 'Koodaranhi, Kozhikode, Kerala - 673604',
  phone: '+91 495 2200100',
  email: 'principal.ghss@gmail.com',
  principalName: 'Principal',
  principalPhone: '+91 94471 23456',
  adminPin: '1234',
  adminEmail: 'principal.ghss@gmail.com',
  createdAt: new Date().toISOString()
};

const defaultTeacher: Teacher = {
  id: 'teacher_1',
  name: 'Elwin george',
  email: 'ddd@gmail.com',
  phone: '+91 98470 54321',
  dob: '2008-01-01',
  schoolCode: 'SSHSS@111213',
  schoolName: 'St. Sebastain\'s Higher Secondary School',
  academicYear: '2026-2027',
  subject: 'Computer Science',
  designation: 'Class Teacher',
  isClassTeacher: true,
  standard: 'Class 11 (Plus One)',
  stream: 'Computer-Science',
  section: 'E',
  avatar: 'E',
  pin: '1234',
  status: 'active',
  createdAt: new Date().toISOString()
};

const defaultClass: ClassRoom = {
  id: 'class_1',
  schoolCode: 'SSHSS@111213',
  standard: 'Class 11 (Plus One)',
  stream: 'Computer-Science',
  section: 'E',
  academicYear: '2026-2027',
  teacherId: 'teacher_1',
  teacherName: 'Elwin george',
  createdAt: new Date().toISOString(),
  isDefault: true
};

const defaultStudents: Student[] = [
  {
    id: 'st_1',
    schoolCode: 'SSHSS@111213',
    classId: 'class_1',
    rollNumber: 1,
    admissionNumber: 'ADM-2026-001',
    fullName: 'Elwin George',
    studentPhone: '+918848684301',
    parentName: 'George',
    parentPhone: '+918848684301',
    gender: 'Male',
    dob: '2008-01-01',
    bloodGroup: 'O+',
    address: 'Koodaranhi',
    notes: 'Class Leader',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st_2',
    schoolCode: 'SSHSS@111213',
    classId: 'class_1',
    rollNumber: 2,
    admissionNumber: 'ADM-2026-002',
    fullName: 'werw',
    studentPhone: '+919847012345',
    parentName: 'Parent of werw',
    parentPhone: '+919847012345',
    gender: 'Male',
    dob: '2008-03-12',
    bloodGroup: 'A+',
    address: 'Koodaranhi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st_3',
    schoolCode: 'SSHSS@111213',
    classId: 'class_1',
    rollNumber: 3,
    admissionNumber: 'ADM-2026-003',
    fullName: 'jhfghfhg',
    studentPhone: '+919847054321',
    parentName: 'Parent of jhfghfhg',
    parentPhone: '+919847054321',
    gender: 'Female',
    dob: '2008-05-20',
    bloodGroup: 'B+',
    address: 'Koodaranhi',
    createdAt: new Date().toISOString()
  },
  {
    id: 'st_4',
    schoolCode: 'SSHSS@111213',
    classId: 'class_1',
    rollNumber: 4,
    admissionNumber: 'ADM-2026-004',
    fullName: 'Rahul Krishna',
    studentPhone: '+919847099887',
    parentName: 'Krishna Kumar',
    parentPhone: '+919847099887',
    gender: 'Male',
    dob: '2008-07-15',
    bloodGroup: 'AB+',
    address: 'Koodaranhi',
    createdAt: new Date().toISOString()
  }
];

const defaultReviews: AppReview[] = [
  {
    id: 'rev_1',
    authorName: 'Smt. Lakshmi Devi M.',
    role: 'Teacher',
    rating: 5,
    title: 'Outstanding School Management & PDF Tool!',
    comment: 'HSS ALL IN ONE is an absolute game changer for Higher Secondary Teachers in Kerala. The offline-first attendance marking, exam mark tabulation, and instantaneous PDF export make daily duties effortless.',
    date: '2026-11-05',
    schoolCode: 'FC',
    verified: true
  },
  {
    id: 'rev_2',
    authorName: 'Fr. Joseph Varghese',
    role: 'Principal',
    rating: 5,
    title: 'Superb Supervisory Console for Principals',
    comment: 'The Principal Broadcast Directives and Consolidated Institutional Audit Reports are top-notch. Multi-device sync works flawlessly across mobile and PC.',
    date: '2026-11-04',
    schoolCode: 'SSHS0111213',
    verified: true
  },
  {
    id: 'rev_3',
    authorName: 'K. V. Nair',
    role: 'Parent',
    rating: 5,
    title: 'Transparent Student Roster & Exam Progress',
    comment: 'As a parent, I love the clear progress cards and rapid absentee notification calls. Very reliable app.',
    date: '2026-11-03',
    schoolCode: 'FC',
    verified: true
  }
];

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>('TEACHER');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data
  const [school, setSchool] = useState<School>(defaultSchool);
  const [teacher, setTeacher] = useState<Teacher>(defaultTeacher);
  const [teachers, setTeachers] = useState<Teacher[]>([defaultTeacher]);
  const [teacherCredentials, setTeacherCredentials] = useState<TeacherCredentials[]>([]);
  const [schoolTeacherRecords, setSchoolTeacherRecords] = useState<SchoolTeacherRecord[]>([]);
  const [blacklistedTeachers, setBlacklistedTeachers] = useState<BlacklistedTeacher[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([defaultClass]);
  const [activeClass, setActiveClass] = useState<ClassRoom | null>(defaultClass);
  const [students, setStudents] = useState<Student[]>(defaultStudents);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendance[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [reviews, setReviews] = useState<AppReview[]>(defaultReviews);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activities, setActivities] = useState<TeacherActivity[]>([]);

  // Modals
  const [showClassModal, setShowClassModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showSchoolProfileModal, setShowSchoolProfileModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Firestore Realtime Subscriptions
  useEffect(() => {
    const unsubTeachers = subscribeCollection<Teacher>('teachers', (data) => {
      if (data.length > 0) setTeachers(data);
    });

    const unsubCredentials = subscribeCollection<TeacherCredentials>('teacherCredentials', (data) => {
      if (data.length > 0) setTeacherCredentials(data);
    });

    const unsubSchoolRecords = subscribeCollection<SchoolTeacherRecord>('schoolTeacherRecords', (data) => {
      if (data.length > 0) setSchoolTeacherRecords(data);
    });

    const unsubBlacklist = subscribeCollection<BlacklistedTeacher>('blacklistedTeachers', (data) => {
      if (data.length > 0) setBlacklistedTeachers(data);
    });

    const unsubClasses = subscribeCollection<ClassRoom>('classes', (data) => {
      if (data.length > 0) setClasses(data);
    });

    const unsubStudents = subscribeCollection<Student>('students', (data) => {
      if (data.length > 0) setStudents(data);
    });

    const unsubAttendance = subscribeCollection<DailyAttendance>('attendance', (data) => {
      if (data.length > 0) setAttendanceRecords(data);
    });

    const unsubExams = subscribeCollection<Exam>('exams', (data) => {
      if (data.length > 0) setExams(data);
    });

    const unsubMarks = subscribeCollection<MarkRecord>('marks', (data) => {
      if (data.length > 0) setMarks(data);
    });

    const unsubReminders = subscribeCollection<Reminder>('reminders', (data) => {
      if (data.length > 0) setReminders(data);
    });

    const unsubDirectives = subscribeCollection<Directive>('directives', (data) => {
      if (data.length > 0) setDirectives(data);
    });

    const unsubReviews = subscribeCollection<AppReview>('reviews', (data) => {
      if (data.length > 0) setReviews(data);
    });

    return () => {
      unsubTeachers();
      unsubCredentials();
      unsubSchoolRecords();
      unsubBlacklist();
      unsubClasses();
      unsubStudents();
      unsubAttendance();
      unsubExams();
      unsubMarks();
      unsubReminders();
      unsubDirectives();
      unsubReviews();
    };
  }, []);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  // Handlers
  const handleTeacherLogin = (t: Teacher) => {
    setTeacher(t);
    setRole('TEACHER');
    setIsLoggedIn(true);

    // 1. Save to teachers collection
    saveDocument('teachers', t.id, t);

    // 2. Save credentials to teacherCredentials section in Firestore
    const credId = `${t.schoolCode}_${t.email}`.toLowerCase();
    const credRecord: TeacherCredentials = {
      id: credId,
      email: t.email,
      password: t.pin || '1234',
      dob: t.dob || '2008-01-01',
      schoolCode: t.schoolCode,
      teacherName: t.name,
      createdAt: new Date().toISOString()
    };
    saveDocument('teacherCredentials', credId, credRecord);
    setTeacherCredentials(prev => {
      const idx = prev.findIndex(c => c.id === credId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = credRecord;
        return copy;
      }
      return [...prev, credRecord];
    });

    // 3. Save to schoolTeacherRecords section in Firestore under school code
    const schoolRec: SchoolTeacherRecord = {
      id: credId,
      schoolCode: t.schoolCode,
      email: t.email,
      password: t.pin || '1234',
      dob: t.dob || '2008-01-01',
      teacherName: t.name,
      subject: t.subject,
      designation: t.designation,
      updatedAt: new Date().toISOString()
    };
    saveDocument('schoolTeacherRecords', credId, schoolRec);
    setSchoolTeacherRecords(prev => {
      const idx = prev.findIndex(s => s.id === credId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = schoolRec;
        return copy;
      }
      return [...prev, schoolRec];
    });
  };

  const handleAdminLogin = (s: School) => {
    setSchool(s);
    setRole('ADMIN');
    setIsLoggedIn(true);
    saveDocument('schools', s.id, s);
  };

  const handleAddStudent = (data: Omit<Student, 'id' | 'createdAt'>) => {
    const newSt: Student = {
      ...data,
      id: `st_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setStudents(prev => [...prev, newSt]);
    saveDocument('students', newSt.id, newSt);

    // Record Activity
    const act: TeacherActivity = {
      id: `act_${Date.now()}`,
      schoolCode: school.schoolCode,
      timestamp: new Date().toISOString(),
      teacherName: teacher.name,
      subject: teacher.subject,
      activityType: 'STUDENT ADDED',
      details: `Added student ${newSt.fullName} (Roll #${newSt.rollNumber})`
    };
    setActivities(prev => [act, ...prev]);
    saveDocument('teacherActivities', act.id, act);
  };

  const handleUpdateStudent = (id: string, data: Partial<Student>) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    const target = students.find(s => s.id === id);
    if (target) {
      saveDocument('students', id, { ...target, ...data });
    }
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    removeDocument('students', id);
  };

  const handleSaveAttendance = (record: DailyAttendance) => {
    setAttendanceRecords(prev => {
      const idx = prev.findIndex(r => r.date === record.date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = record;
        return copy;
      }
      return [...prev, record];
    });
    saveDocument('attendance', record.id, record);

    const act: TeacherActivity = {
      id: `act_${Date.now()}`,
      schoolCode: school.schoolCode,
      timestamp: new Date().toISOString(),
      teacherName: teacher.name,
      subject: teacher.subject,
      activityType: 'ATTENDANCE',
      details: `Saved attendance for date ${record.date} (${record.presentCount} Present, ${record.absentCount} Absent)`
    };
    setActivities(prev => [act, ...prev]);
    saveDocument('teacherActivities', act.id, act);
  };

  const handleCreateExam = (exam: Exam) => {
    setExams(prev => [exam, ...prev]);
    saveDocument('exams', exam.id, exam);
  };

  const handleSaveMarks = (examId: string, markRecords: MarkRecord[]) => {
    setMarks(prev => {
      const filtered = prev.filter(m => m.examId !== examId);
      return [...filtered, ...markRecords];
    });
    markRecords.forEach(m => saveDocument('marks', m.id, m));

    const act: TeacherActivity = {
      id: `act_${Date.now()}`,
      schoolCode: school.schoolCode,
      timestamp: new Date().toISOString(),
      teacherName: teacher.name,
      subject: teacher.subject,
      activityType: 'MARKS ENTERED',
      details: `Saved student marks for exam ${examId}`
    };
    setActivities(prev => [act, ...prev]);
    saveDocument('teacherActivities', act.id, act);
  };

  const handleSaveTimetable = (tt: Timetable) => {
    setTimetable(tt);
    saveDocument('timetables', tt.id, tt);
  };

  const handleAddReminder = (data: Omit<Reminder, 'id' | 'createdAt'>) => {
    const rem: Reminder = {
      ...data,
      id: `rem_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setReminders(prev => [rem, ...prev]);
    saveDocument('reminders', rem.id, rem);
  };

  const handleSendDirective = (directive: Directive) => {
    setDirectives(prev => [directive, ...prev]);
    saveDocument('directives', directive.id, directive);
  };

  const handleAddReview = (reviewData: Omit<AppReview, 'id' | 'date'>) => {
    const rev: AppReview = {
      ...reviewData,
      id: `rev_${Date.now()}`,
      date: new Date().toISOString().split('T')[0]
    };
    setReviews(prev => [rev, ...prev]);
    saveDocument('reviews', rev.id, rev);
  };

  const handleDeleteClassroom = (classId: string) => {
    setClasses(prev => prev.filter(c => c.id !== classId));
    removeDocument('classes', classId);

    // Remove classroom students, attendance, exams, marks
    setStudents(prev => prev.filter(s => s.classId !== classId));
    setAttendanceRecords(prev => prev.filter(a => a.classId !== classId));
    setExams(prev => prev.filter(e => e.classId !== classId));
    setMarks(prev => prev.filter(m => m.classId !== classId));

    if (activeClass?.id === classId) {
      const remaining = classes.filter(c => c.id !== classId);
      setActiveClass(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleTemporaryDeleteTeacher = (targetTeacher: Teacher) => {
    const updated: Teacher = { ...targetTeacher, status: 'deactivated' };
    setTeachers(prev => prev.map(t => t.id === targetTeacher.id ? updated : t));
    saveDocument('teachers', targetTeacher.id, updated);

    // Filter out classrooms owned by this teacher from active view
    setClasses(prev => prev.filter(c => c.teacherId !== targetTeacher.id));
  };

  const handlePermanentDeleteTeacher = (targetTeacher: Teacher, reason?: string) => {
    const blacklistId = `${targetTeacher.schoolCode}_${targetTeacher.email}`.toLowerCase();
    const blacklistRecord: BlacklistedTeacher = {
      id: blacklistId,
      email: targetTeacher.email,
      schoolCode: targetTeacher.schoolCode,
      teacherName: targetTeacher.name,
      blacklistedAt: new Date().toISOString(),
      reason: reason || 'Permanent Deletion by Admin'
    };

    setBlacklistedTeachers(prev => [...prev, blacklistRecord]);
    saveDocument('blacklistedTeachers', blacklistId, blacklistRecord);

    const updated: Teacher = { ...targetTeacher, status: 'permanently_deleted' };
    setTeachers(prev => prev.map(t => t.id === targetTeacher.id ? updated : t));
    saveDocument('teachers', targetTeacher.id, updated);

    // Remove classrooms owned by this teacher
    setClasses(prev => prev.filter(c => c.teacherId !== targetTeacher.id));
  };

  const handleSaveSchoolProfile = (updatedSchool: School, updatedTeacher?: Teacher, updatedClass?: ClassRoom) => {
    setSchool(updatedSchool);
    if (updatedTeacher) setTeacher(updatedTeacher);
    if (updatedClass) setActiveClass(updatedClass);
    saveDocument('schools', updatedSchool.id, updatedSchool);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all local storage data and restore initial clean state?')) {
      localStorage.clear();
      setStudents(defaultStudents);
      setAttendanceRecords([]);
      setExams([]);
      setMarks([]);
      setReminders([]);
      setDirectives([]);
      alert('Data reset to clean state successfully.');
    }
  };

  if (!isLoggedIn) {
    return (
      <AuthModal
        onTeacherLogin={handleTeacherLogin}
        onAdminLogin={handleAdminLogin}
        blacklistedTeachers={blacklistedTeachers}
        teachers={teachers}
      />
    );
  }

  // Complete Classroom Data Isolation Filtering
  const teacherClasses = classes.filter(c => c.teacherId === teacher.id || c.schoolCode === teacher.schoolCode);
  const currentActiveClass = activeClass || (teacherClasses.length > 0 ? teacherClasses[0] : null);

  const displayedStudents = currentActiveClass
    ? students.filter(s => s.classId === currentActiveClass.id || (currentActiveClass.isDefault && s.schoolCode === currentActiveClass.schoolCode))
    : [];

  const displayedAttendance = currentActiveClass
    ? attendanceRecords.filter(a => a.classId === currentActiveClass.id || (currentActiveClass.isDefault && a.schoolCode === currentActiveClass.schoolCode))
    : [];

  const displayedExams = currentActiveClass
    ? exams.filter(e => e.classId === currentActiveClass.id || (currentActiveClass.isDefault && e.schoolCode === currentActiveClass.schoolCode))
    : [];

  const displayedMarks = currentActiveClass
    ? marks.filter(m => m.classId === currentActiveClass.id || (currentActiveClass.isDefault && m.schoolCode === currentActiveClass.schoolCode))
    : [];

  const todayAttendance = displayedAttendance.find(r => r.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="min-h-screen bg-[#0b0a12] text-gray-100 flex flex-col font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <Header
        school={school}
        teacher={teacher}
        activeClass={currentActiveClass || { standard: 'No Class', section: 'Select Class' }}
        role={role}
        onOpenClassModal={() => setShowClassModal(true)}
        onOpenReminders={() => setShowRemindersModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onSync={handleManualSync}
        isSyncing={isSyncing}
        onLogOut={() => {
          setIsLoggedIn(false);
          setActiveTab('dashboard');
        }}
      />

      {/* Main Body View */}
      <main className="flex-1 overflow-y-auto">
        {role === 'ADMIN' ? (
          <AdminPortalView
            school={school}
            teachers={teachers.length > 0 ? teachers : [teacher]}
            students={students}
            directives={directives}
            auditLogs={auditLogs}
            activities={activities}
            teacherCredentials={teacherCredentials}
            onAddTeacher={(t) => {
              setTeachers(prev => [...prev, t]);
              saveDocument('teachers', t.id, t);
            }}
            onUpdateTeacher={(t) => {
              setTeachers(prev => prev.map(item => item.id === t.id ? t : item));
              saveDocument('teachers', t.id, t);
            }}
            onTemporaryDeleteTeacher={handleTemporaryDeleteTeacher}
            onPermanentDeleteTeacher={handlePermanentDeleteTeacher}
            onSendDirective={handleSendDirective}
            onSaveSchoolProfile={(s) => setSchool(s)}
            onClearAuditLogs={() => setAuditLogs([])}
            onClearActivities={() => setActivities([])}
            onLogOut={() => setIsLoggedIn(false)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                teacher={teacher}
                school={school}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                students={displayedStudents}
                todayAttendance={todayAttendance}
                exams={displayedExams}
                directives={directives}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenClassModal={() => setShowClassModal(true)}
                onOpenReminders={() => setShowRemindersModal(true)}
                onOpenSchoolProfile={() => setShowSchoolProfileModal(true)}
              />
            )}

            {activeTab === 'students' && (
              <StudentsView
                students={displayedStudents}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceView
                students={displayedStudents}
                school={school}
                teacher={teacher}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                attendanceRecords={displayedAttendance}
                onSaveAttendance={handleSaveAttendance}
              />
            )}

            {activeTab === 'timetable' && (
              <TimetableView
                teacher={teacher}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                school={school}
                timetable={timetable}
                onSaveTimetable={handleSaveTimetable}
              />
            )}

            {activeTab === 'exams' && (
              <ExamsView
                exams={displayedExams}
                students={displayedStudents}
                marks={displayedMarks}
                school={school}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                onCreateExam={handleCreateExam}
                onSaveMarks={handleSaveMarks}
              />
            )}

            {activeTab === 'trajectory' && (
              <TrajectoryView
                students={displayedStudents}
                exams={displayedExams}
                marks={displayedMarks}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                school={school}
                teacher={teacher}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                students={displayedStudents}
                exams={displayedExams}
                marks={displayedMarks}
              />
            )}

            {activeTab === 'notices' && (
              <NoticesView
                directives={directives}
                reminders={reminders}
                onOpenReminders={() => setShowRemindersModal(true)}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                teacher={teacher}
                school={school}
                activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
                students={displayedStudents}
                attendanceRecords={displayedAttendance}
                onSignOut={() => setIsLoggedIn(false)}
                onResetData={handleResetData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Nav Bar (visible for Teachers) */}
      {role === 'TEACHER' && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Global Modals */}
      {showClassModal && (
        <ClassModal
          classes={teacherClasses.length > 0 ? teacherClasses : classes}
          activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
          onSelectClass={(c) => setActiveClass(c)}
          onCreateClass={(c) => {
            setClasses(prev => [...prev, c]);
            saveDocument('classes', c.id, c);
            setActiveClass(c);
          }}
          onDeleteClass={handleDeleteClassroom}
          onClose={() => setShowClassModal(false)}
        />
      )}

      {showRemindersModal && (
        <RemindersModal
          reminders={reminders}
          onAddReminder={handleAddReminder}
          onClose={() => setShowRemindersModal(false)}
        />
      )}

      {showSearchModal && (
        <GlobalSearchModal
          students={displayedStudents}
          exams={displayedExams}
          onSelectStudent={(st) => setActiveTab('students')}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {showSchoolProfileModal && (
        <SchoolProfileModal
          school={school}
          teacher={teacher}
          activeClass={currentActiveClass || { standard: 'No Class', section: '' }}
          onSave={handleSaveSchoolProfile}
          onClose={() => setShowSchoolProfileModal(false)}
        />
      )}
    </div>
  );
}
