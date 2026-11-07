export type Role = 'TEACHER' | 'ADMIN';

export type Gender = 'Male' | 'Female' | 'Other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface School {
  id: string; // schoolCode
  schoolName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  principalName: string;
  principalPhone: string;
  adminPin: string;
  adminEmail: string;
  createdAt: string;
}

export interface Teacher {
  id: string;
  uid?: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  schoolCode: string;
  schoolName: string;
  academicYear: string;
  subject: string;
  designation: string;
  isClassTeacher: boolean;
  standard: string;
  stream: string;
  section: string;
  avatar?: string;
  pin?: string;
  status?: 'active' | 'deactivated' | 'permanently_deleted';
  createdAt: string;
}

export interface BlacklistedTeacher {
  id: string;
  email: string;
  schoolCode: string;
  teacherName: string;
  blacklistedAt: string;
  reason: string;
}

export interface TeacherCredentials {
  id: string; // schoolCode_email
  email: string;
  password: string;
  dob: string;
  schoolCode: string;
  teacherName: string;
  createdAt: string;
}

export interface SchoolTeacherRecord {
  id: string; // schoolCode_email
  schoolCode: string;
  email: string;
  password: string;
  dob: string;
  teacherName: string;
  subject?: string;
  designation?: string;
  updatedAt: string;
}

export interface ClassRoom {
  id: string;
  schoolCode: string;
  standard: string;
  stream: string;
  section: string;
  academicYear: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  isDefault?: boolean;
}

export interface Student {
  id: string;
  schoolCode: string;
  classId: string;
  rollNumber: number;
  admissionNumber: string;
  fullName: string;
  studentPhone: string;
  parentName: string;
  parentPhone: string;
  gender: Gender;
  dob: string;
  bloodGroup: BloodGroup;
  address: string;
  notes?: string;
  photo?: string;
  createdAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export interface DailyAttendance {
  id: string; // schoolCode_classId_YYYY-MM-DD
  schoolCode: string;
  classId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, AttendanceStatus>; // studentId -> status
  presentCount: number;
  absentCount: number;
  totalStudents: number;
  attendanceRate: number;
  updatedAt: string;
}

export interface SubjectConfig {
  name: string;
  maxMarks: number;
}

export interface Exam {
  id: string;
  schoolCode: string;
  classId: string;
  examName: string;
  examType: 'First Terminal' | 'Second Terminal' | 'Mid-Term' | 'Christmas Exam' | 'Model Exam' | 'Unit Test' | 'Annual / Board Exam' | 'Other';
  examDate: string;
  subjects: SubjectConfig[];
  createdAt: string;
}

export interface MarkRecord {
  id: string; // examId_studentId
  examId: string;
  studentId: string;
  schoolCode: string;
  classId: string;
  subjectMarks: Record<string, number | 'AB'>; // subjectName -> mark or Absent
  totalMarks: number;
  maxTotalMarks: number;
  percentage: number;
  grade: string;
  rank: number;
  updatedAt: string;
}

export interface PeriodSlot {
  id: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectName?: string;
  className?: string;
  teacherName?: string;
  room?: string;
  isRecess?: boolean;
  recessLabel?: string;
}

export interface DaySchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  periods: PeriodSlot[];
}

export interface Timetable {
  id: string; // schoolCode_classId or schoolCode_teacherId
  schoolCode: string;
  targetType: 'CLASS' | 'TEACHER';
  targetId: string;
  schedule: Record<string, PeriodSlot[]>; // day -> periods
  updatedAt: string;
}

export interface Reminder {
  id: string;
  teacherId: string;
  schoolCode: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  category: 'Attendance' | 'Exam' | 'Timetable' | 'General' | 'Meeting';
  repeat: 'Once' | 'Daily' | 'Weekly';
  completed: boolean;
  createdAt: string;
}

export interface Directive {
  id: string;
  schoolCode: string;
  title: string;
  targetAudience: 'All Teachers & Faculty' | 'Science Department Teachers' | 'Commerce Department Teachers' | 'Class In-Charges Only';
  category: 'Academic & Syllabus Directive' | 'Administrative Notice' | 'Examination & Evaluation Schedule' | 'Staff Council / PTA Meeting' | 'Holiday & Special Schedule' | 'General Institutional Circular';
  priority: 'Normal' | 'High' | 'Urgent';
  message: string;
  senderName: string;
  createdAt: string;
}

export interface TeacherActivity {
  id: string;
  schoolCode: string;
  timestamp: string;
  teacherName: string;
  subject: string;
  activityType: 'STUDENT ADDED' | 'MARKS ENTERED' | 'ATTENDANCE' | 'LOGIN' | 'TIMETABLE UPDATED' | 'PROFILE UPDATED';
  details: string;
}

export interface AuditLog {
  id: string;
  schoolCode: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  target?: string;
  eventDetails?: string;
  category: 'AUTH' | 'SECURITY' | 'DATA';
}

export interface AppReview {
  id: string;
  authorName: string;
  role: 'Teacher' | 'Parent' | 'Principal' | 'Student';
  rating: number; // 1-5
  title: string;
  comment: string;
  date: string;
  schoolCode: string;
  verified?: boolean;
}

export type ActiveTab = 
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'timetable'
  | 'exams'
  | 'trajectory'
  | 'reports'
  | 'notices'
  | 'settings';
