import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RotateCw, 
  Printer, 
  LogOut, 
  Megaphone, 
  Download, 
  Users, 
  GraduationCap, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  Activity, 
  Key, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  X,
  UserX,
  ShieldAlert,
  Edit,
  Gift,
  FileText,
  BookOpen,
  Phone,
  Mail,
  Building,
  Cake,
  Hash
} from 'lucide-react';
import { School, Teacher, Student, Directive, AuditLog, TeacherActivity, TeacherCredentials } from '../types';
import { exportInstitutionalAuditPDF } from '../lib/pdfExport';

interface AdminPortalViewProps {
  school: School;
  teachers: Teacher[];
  students: Student[];
  directives: Directive[];
  auditLogs: AuditLog[];
  activities: TeacherActivity[];
  teacherCredentials?: TeacherCredentials[];
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher?: (teacher: Teacher) => void;
  onTemporaryDeleteTeacher?: (teacher: Teacher) => void;
  onPermanentDeleteTeacher?: (teacher: Teacher, reason?: string) => void;
  onSendDirective: (directive: Directive) => void;
  onSaveSchoolProfile: (school: School) => void;
  onClearAuditLogs: () => void;
  onClearActivities: () => void;
  onLogOut: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  school,
  teachers,
  students,
  directives,
  auditLogs,
  activities,
  teacherCredentials = [],
  onAddTeacher,
  onUpdateTeacher,
  onTemporaryDeleteTeacher,
  onPermanentDeleteTeacher,
  onSendDirective,
  onSaveSchoolProfile,
  onClearAuditLogs,
  onClearActivities,
  onLogOut
}) => {
  const [openSection, setOpenSection] = useState<string>('teachers');
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [viewingDossierTeacher, setViewingDossierTeacher] = useState<Teacher | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [permanentReason] = useState('Institutional Policy Violation');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Search & Filter State inside Registered Teachers
  const [searchQuery, setSearchQuery] = useState('');
  const [facultyTab, setFacultyTab] = useState<'all' | 'upcoming_bdays' | 'this_month_bdays'>('all');

  // New Teacher Form State
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Physics',
    designation: 'HSST Physics, Class Teacher',
    academicYear: '2026-2027',
    dob: '1985-05-15',
    avatar: '👨‍🏫',
    standard: 'Class 11 (Plus One)',
    stream: 'Science',
    section: 'A'
  });

  // Broadcast Directive Form
  const [directiveForm, setDirectiveForm] = useState({
    title: '',
    targetAudience: 'All Teachers & Faculty' as Directive['targetAudience'],
    category: 'Academic & Syllabus Directive' as Directive['category'],
    priority: 'High' as Directive['priority'],
    message: ''
  });

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? '' : id);
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Teacher = {
      id: `teacher_${Date.now()}`,
      name: newTeacher.name || 'New Teacher',
      email: newTeacher.email || 'teacher@gmail.com',
      phone: newTeacher.phone || '+91 98470 12345',
      dob: newTeacher.dob,
      schoolCode: school.schoolCode,
      schoolName: school.schoolName,
      academicYear: newTeacher.academicYear,
      subject: newTeacher.subject,
      designation: newTeacher.designation,
      isClassTeacher: true,
      standard: newTeacher.standard,
      stream: newTeacher.stream,
      section: newTeacher.section,
      avatar: newTeacher.avatar,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    onAddTeacher(created);
    setShowAddTeacherModal(false);
    setToastMsg(`Teacher "${created.name}" registered successfully!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSaveEditedTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (onUpdateTeacher) {
      onUpdateTeacher(editingTeacher);
    } else {
      onAddTeacher(editingTeacher);
    }
    setEditingTeacher(null);
    setToastMsg(`Teacher information updated for "${editingTeacher.name}"!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveForm.title || !directiveForm.message) {
      alert('Please fill out the directive title and message body.');
      return;
    }
    const created: Directive = {
      id: `dir_${Date.now()}`,
      schoolCode: school.schoolCode,
      title: directiveForm.title,
      targetAudience: directiveForm.targetAudience,
      category: directiveForm.category,
      priority: directiveForm.priority,
      message: directiveForm.message,
      senderName: school.principalName || 'Principal',
      createdAt: new Date().toISOString()
    };
    onSendDirective(created);
    setDirectiveForm({
      title: '',
      targetAudience: 'All Teachers & Faculty',
      category: 'Academic & Syllabus Directive',
      priority: 'High',
      message: ''
    });
    setToastMsg('Directive broadcasted to all teacher dashboards!');
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Filter teachers based on search query & sub-tabs
  const filteredTeachers = teachers.filter(t => {
    const matchQuery = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone && t.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.standard && t.standard.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchQuery) return false;

    if (facultyTab === 'upcoming_bdays' || facultyTab === 'this_month_bdays') {
      if (!t.dob) return false;
      const dobMonth = new Date(t.dob).getMonth();
      const currentMonth = new Date().getMonth();
      if (facultyTab === 'this_month_bdays') return dobMonth === currentMonth;
      if (facultyTab === 'upcoming_bdays') return dobMonth >= currentMonth;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#090812] text-gray-100 pb-24">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          {toastMsg}
        </div>
      )}

      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 bg-[#0d0c14]/90 backdrop-blur-md border-b border-amber-900/30 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-600/30 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/40">
            🏫
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              SCHOOL ADMIN PORTAL
              <span className="bg-amber-950 text-amber-400 border border-amber-700/50 text-[9px] px-1.5 py-0.2 rounded font-mono">
                #{school.schoolCode}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 font-medium">Principal: {school.principalName}</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setToastMsg('Synchronized successfully!')}
            className="p-2 rounded-xl bg-[#1a1728] hover:bg-[#231f36] text-amber-300 border border-amber-900/30"
            title="Sync"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => exportInstitutionalAuditPDF(school, teachers, students.length, 1, 100)}
            className="p-2 rounded-xl bg-[#1a1728] hover:bg-[#231f36] text-amber-300 border border-amber-900/30"
            title="Print Official Audit PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={onLogOut}
            className="p-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/40"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-3 sm:p-5 max-w-4xl mx-auto space-y-4">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-[#1f1912] via-[#1a150e] to-[#14100b] border border-amber-800/40 rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600/40 text-amber-300 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            Principal & School Management Supervisory Console
          </div>

          <h1 className="text-xl font-black text-white">Welcome, {school.principalName}</h1>
          <p className="text-xs text-amber-200/70 max-w-xl">
            Supervise classroom registers, teacher work dossiers, upcoming faculty birthdays, and academic performance for {school.schoolName}.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setOpenSection('directives')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-2 shadow-lg"
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Directive
            </button>
            <button
              onClick={() => exportInstitutionalAuditPDF(school, teachers, students.length, 1, 100)}
              className="bg-[#241d14] hover:bg-[#2d2419] text-amber-300 border border-amber-800/40 font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Backup
            </button>
          </div>
        </div>

        {/* 2x2 Top Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-[#151224] border border-purple-900/40 rounded-2xl p-3.5 shadow-md">
            <div className="text-[10px] text-gray-400 font-bold uppercase">Total Teachers</div>
            <div className="text-2xl font-black text-white">{teachers.length}</div>
            <div className="text-[9.5px] text-purple-400">Registered under {school.schoolCode}</div>
          </div>
          <div className="bg-[#151224] border border-purple-900/40 rounded-2xl p-3.5 shadow-md">
            <div className="text-[10px] text-gray-400 font-bold uppercase">Total Classes</div>
            <div className="text-2xl font-black text-emerald-400">1</div>
            <div className="text-[9.5px] text-gray-400">Active class registered</div>
          </div>
          <div className="bg-[#151224] border border-purple-900/40 rounded-2xl p-3.5 shadow-md">
            <div className="text-[10px] text-gray-400 font-bold uppercase">Total Students</div>
            <div className="text-2xl font-black text-white">{students.length}</div>
            <div className="text-[9.5px] text-gray-400">Enrolled roster</div>
          </div>
          <div className="bg-[#151224] border border-purple-900/40 rounded-2xl p-3.5 shadow-md">
            <div className="text-[10px] text-gray-400 font-bold uppercase">School Academic Avg</div>
            <div className="text-2xl font-black text-cyan-400">0%</div>
            <div className="text-[9.5px] text-gray-400">Calculated from terminal exams</div>
          </div>
        </div>

        {/* ACCORDION SECTIONS */}
        <div className="space-y-3">
          {/* SECTION 1: REGISTERED TEACHERS */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('teachers')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a172e] transition-colors"
            >
              <div className="flex items-center gap-2 font-black text-sm text-white">
                <Users className="w-4 h-4 text-purple-400" />
                Registered Teachers ({teachers.length})
              </div>
              {openSection === 'teachers' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {openSection === 'teachers' && (
              <div className="p-4 pt-0 border-t border-purple-900/30 space-y-4">
                <p className="text-xs text-gray-400">Real-time monitoring of teachers registered under School Code <strong className="text-amber-400">{school.schoolCode}</strong>.</p>
                
                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, subject, phone, or class..."
                      className="w-full pl-9 pr-3 py-2 bg-[#0c0b16] border border-purple-900/50 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddTeacherModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      Add New Teacher
                    </button>
                    <button
                      onClick={() => exportInstitutionalAuditPDF(school, teachers, students.length, 1, 100)}
                      className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {/* Sub-tabs: All Faculty | Upcoming Birthdays | Birthdays This Month */}
                <div className="flex gap-1.5 p-1 bg-[#0c0b16] border border-purple-900/40 rounded-xl text-[11px] font-bold">
                  <button
                    onClick={() => setFacultyTab('all')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      facultyTab === 'all'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All Faculty ({teachers.length})
                  </button>
                  <button
                    onClick={() => setFacultyTab('upcoming_bdays')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      facultyTab === 'upcoming_bdays'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Upcoming Birthdays
                  </button>
                  <button
                    onClick={() => setFacultyTab('this_month_bdays')}
                    className={`flex-1 py-1.5 px-2 rounded-lg transition-all ${
                      facultyTab === 'this_month_bdays'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Birthdays This Month
                  </button>
                </div>

                {/* Teachers List Cards matching video layout */}
                {filteredTeachers.length === 0 ? (
                  <div className="bg-[#100e1c] p-6 rounded-2xl text-center space-y-1 text-gray-400">
                    <Users className="w-8 h-8 mx-auto text-purple-500/40" />
                    <div className="text-xs font-bold text-white">No Teachers Match Filter</div>
                    <p className="text-[11px]">Try adjusting your search criteria or add a new teacher.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTeachers.map(t => (
                      <div key={t.id} className="bg-[#18152b] border border-purple-800/40 hover:border-purple-600/60 transition-all rounded-2xl p-4 space-y-3.5 shadow-lg">
                        {/* Card Top Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-purple-900/50 border border-purple-500/50 flex items-center justify-center text-2xl shadow-inner">
                                {t.avatar || '👨‍🏫'}
                              </div>
                              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#18152b] ${
                                t.status === 'deactivated' ? 'bg-amber-400' :
                                t.status === 'permanently_deleted' ? 'bg-rose-500' : 'bg-emerald-400'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-white">{t.name}</h3>
                                <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600/40">
                                  {t.status === 'deactivated' ? 'DEACTIVATED' : t.status === 'permanently_deleted' ? 'BLACKLISTED' : 'Active'}
                                </span>
                              </div>
                              <div className="text-xs text-purple-300 font-semibold mt-0.5">
                                {t.subject || 'Computer Science'} ({t.schoolCode || school.schoolCode})
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="inline-block text-[10px] font-black px-2.5 py-1 rounded-xl bg-purple-950/80 border border-purple-600/40 text-purple-200">
                              {t.standard ? `${t.standard} ${t.stream || ''} ${t.section || ''}` : 'Class 11 (Plus One) Computer-Science E'}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Grid Rows (Matching Video Frame 0:06-0:10) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-[#110e20] p-3 rounded-xl border border-purple-900/30">
                          <div className="flex items-center gap-2 text-gray-300">
                            <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Subject Assigned:</span>
                            <span className="font-bold text-white">{t.subject || 'Computer Science'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Phone Number:</span>
                            <span className="font-bold text-white">{t.phone || '+91 98470 54321'}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Teacher Gmail:</span>
                            <span className="font-bold text-purple-300 font-mono text-[10.5px] truncate">{t.email}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Hash className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Profile ID:</span>
                            <span className="font-bold text-gray-300 font-mono text-[10px]">{t.id}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Building className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">School Code:</span>
                            <span className="font-bold text-amber-400 font-mono">{t.schoolCode || school.schoolCode}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Registered On:</span>
                            <span className="font-bold text-white">{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Last Login:</span>
                            <span className="font-bold text-emerald-400">Active Today</span>
                          </div>

                          <div className="flex items-center gap-2 text-gray-300">
                            <Cake className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-gray-400">Date of Birth:</span>
                            <span className="font-bold text-cyan-300">{t.dob || '2008-01-01'}</span>
                          </div>
                        </div>

                        {/* Action Buttons Row matching Video buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-900/30">
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(t)}
                            className="bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/50 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-purple-300" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setToastMsg(`Birthday wish broadcast sent to ${t.name}! 🎉`);
                              setTimeout(() => setToastMsg(null), 3500);
                            }}
                            className="bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-600/40 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors"
                          >
                            <Gift className="w-3.5 h-3.5 text-pink-400" />
                            Wish
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewingDossierTeacher(t)}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-purple-900/30"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Work Dossier
                          </button>

                          <button
                            type="button"
                            onClick={() => setTeacherToDelete(t)}
                            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Teacher
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION: TEACHER CREDENTIALS & GMAIL/PASSWORD FIRESTORE COLLECTION */}
          <div className="bg-[#141224] border border-amber-900/40 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('credentials')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a172e] transition-colors"
            >
              <div className="flex items-center gap-2 font-black text-sm text-amber-300">
                <Key className="w-4 h-4 text-amber-400" />
                Teacher Credentials Repository (Gmail, Password & DOB) ({teacherCredentials.length})
              </div>
              {openSection === 'credentials' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {openSection === 'credentials' && (
              <div className="p-4 pt-0 border-t border-amber-900/30 space-y-3">
                <p className="text-xs text-amber-200/80">
                  Collected teacher login credentials (Gmail, Password, DOB) saved in Firestore under collection <strong className="text-amber-400">/teacherCredentials</strong> and indexed by School Code under <strong className="text-amber-400">/schoolTeacherRecords</strong>.
                </p>
                
                {teacherCredentials.length === 0 ? (
                  <div className="bg-[#100e1c] p-6 rounded-2xl text-center space-y-1 text-gray-400">
                    <Key className="w-8 h-8 mx-auto text-amber-500/40" />
                    <div className="text-xs font-bold text-white">No Saved Credentials in Firestore</div>
                    <p className="text-[11px]">When teachers log in or sign up under a school code, credentials will be saved here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {teacherCredentials.map(c => (
                      <div key={c.id} className="bg-[#191526] border border-amber-900/40 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{c.teacherName}</span>
                            <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800/40 px-1.5 py-0.2 rounded font-bold font-mono">
                              Code: {c.schoolCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-300 font-mono mt-0.5">
                            Gmail: <strong className="text-amber-300">{c.email}</strong> • Password/PIN: <strong className="text-amber-400 font-mono">{c.password}</strong> • DOB: <strong className="text-cyan-300">{c.dob}</strong>
                          </div>
                        </div>
                        <span className="text-[9.5px] text-gray-400 shrink-0">
                          Recorded: {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 2: STUDENTS AND CLASS RECORDS */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('students')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a172e] transition-colors"
            >
              <div className="flex items-center gap-2 font-black text-sm text-white">
                <GraduationCap className="w-4 h-4 text-purple-400" />
                Students and Class Records ({students.length})
              </div>
              {openSection === 'students' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {openSection === 'students' && (
              <div className="p-4 pt-0 border-t border-purple-900/30 space-y-3">
                <p className="text-xs text-gray-400">View student lists, roll numbers, academic performance, and parent contacts organized classroom-wise.</p>
                <div className="space-y-2">
                  {students.map(st => (
                    <div key={st.id} className="bg-[#19162e] p-2.5 rounded-xl flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Roll #{st.rollNumber} {st.fullName}</span>
                      <span className="text-purple-300">{st.admissionNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: PRINCIPAL BROADCAST DIRECTIVES */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('directives')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a172e] transition-colors"
            >
              <div className="flex items-center gap-2 font-black text-sm text-amber-300">
                <Megaphone className="w-4 h-4 text-amber-400" />
                Principal Broadcast Directives ({directives.length})
              </div>
              {openSection === 'directives' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {openSection === 'directives' && (
              <form onSubmit={handleBroadcast} className="p-4 pt-0 border-t border-purple-900/30 space-y-3 text-xs">
                <p className="text-xs text-gray-400">Broadcast institutional instructions, examination schedules, or urgent notices. These appear instantly on every teacher's dashboard.</p>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Directive Title *</label>
                  <input
                    type="text"
                    required
                    value={directiveForm.title}
                    onChange={(e) => setDirectiveForm({ ...directiveForm, title: e.target.value })}
                    placeholder="e.g. Mandatory Submission of Terminal Marks"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Target Audience</label>
                    <select
                      value={directiveForm.targetAudience}
                      onChange={(e) => setDirectiveForm({ ...directiveForm, targetAudience: e.target.value as Directive['targetAudience'] })}
                      className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="All Teachers & Faculty">All Teachers & Faculty</option>
                      <option value="Science Department Teachers">Science Department Teachers</option>
                      <option value="Commerce Department Teachers">Commerce Department Teachers</option>
                      <option value="Class In-Charges Only">Class In-Charges Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-gray-300 mb-1">Category</label>
                    <select
                      value={directiveForm.category}
                      onChange={(e) => setDirectiveForm({ ...directiveForm, category: e.target.value as Directive['category'] })}
                      className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="Academic & Syllabus Directive">Academic & Syllabus Directive</option>
                      <option value="Administrative Notice">Administrative Notice</option>
                      <option value="Examination & Evaluation Schedule">Examination & Evaluation Schedule</option>
                      <option value="Staff Council / PTA Meeting">Staff Council / PTA Meeting</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Normal', 'High', 'Urgent'] as Directive['priority'][]).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setDirectiveForm({ ...directiveForm, priority: p })}
                        className={`py-1.5 rounded-lg font-bold border transition-all ${
                          directiveForm.priority === p 
                            ? p === 'Urgent' ? 'bg-rose-600 text-white border-rose-500' : 'bg-amber-600 text-white border-amber-500'
                            : 'bg-[#100e1c] text-gray-400 border-purple-900/40'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-300 mb-1">Directive Message Body *</label>
                  <textarea
                    rows={3}
                    required
                    value={directiveForm.message}
                    onChange={(e) => setDirectiveForm({ ...directiveForm, message: e.target.value })}
                    placeholder="Enter detailed instructions, submission deadlines, or circular content..."
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                  <Megaphone className="w-4 h-4" />
                  BROADCAST TO ALL TEACHER DASHBOARDS
                </button>
              </form>
            )}
          </div>

          {/* SECTION 9: RECENT TEACHER ACTIVITY */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl overflow-hidden shadow-xl">
            <button
              onClick={() => toggleSection('activity')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#1a172e] transition-colors"
            >
              <div className="flex items-center gap-2 font-black text-sm text-cyan-400">
                <Activity className="w-4 h-4 text-cyan-400" />
                Recent Teacher Activity ({activities.length})
              </div>
              {openSection === 'activity' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>

            {openSection === 'activity' && (
              <div className="p-4 pt-0 border-t border-purple-900/30 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Live audit of actions performed by teachers across school.</p>
                  <button onClick={onClearActivities} className="text-xs text-rose-400 hover:underline">Clear Activity</button>
                </div>

                {activities.length === 0 ? (
                  <div className="bg-[#100e1c] p-6 rounded-2xl text-center text-gray-400 space-y-1">
                    <Activity className="w-8 h-8 mx-auto text-cyan-400/40" />
                    <div className="text-xs font-bold text-white">No Teacher Activity Recorded Yet</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activities.map(act => (
                      <div key={act.id} className="bg-[#19162e] p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{act.teacherName} — {act.activityType}</div>
                          <div className="text-[10px] text-gray-400">{act.details}</div>
                        </div>
                        <span className="text-[9.5px] text-gray-400">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD NEW TEACHER MODAL */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateTeacher} className="w-full max-w-md bg-[#161426] border border-amber-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/30">
              <div className="text-sm font-bold text-amber-300">Register New Teacher</div>
              <button type="button" onClick={() => setShowAddTeacherModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Avatar Emoji</label>
                <div className="flex gap-2">
                  {['👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍🔬', '💻', '📐', '📚'].map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setNewTeacher({ ...newTeacher, avatar: emo })}
                      className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition-all ${
                        newTeacher.avatar === emo ? 'bg-purple-600 border-purple-400' : 'bg-[#100e1c] border-purple-900/40'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={newTeacher.name}
                  onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  placeholder="e.g. Smt. Lakshmi Devi M."
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Subject Assigned *</label>
                <input
                  type="text"
                  required
                  value={newTeacher.subject}
                  onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })}
                  placeholder="e.g. Physics, Computer Science..."
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Teacher Gmail *</label>
                <input
                  type="email"
                  required
                  value={newTeacher.email}
                  onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
                  placeholder="teacher@gmail.com"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newTeacher.phone}
                  onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  placeholder="+91 98470 12345"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Designation / Role</label>
                <input
                  type="text"
                  value={newTeacher.designation}
                  onChange={(e) => setNewTeacher({ ...newTeacher, designation: e.target.value })}
                  placeholder="e.g. HSST Physics, Class Teacher"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={newTeacher.dob}
                  onChange={(e) => setNewTeacher({ ...newTeacher, dob: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTeacherModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-amber-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Register Teacher
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT TEACHER INFORMATION MODAL */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEditedTeacher} className="w-full max-w-md bg-[#161426] border border-purple-700/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <div className="flex items-center gap-2 font-bold text-sm text-purple-300">
                <Edit className="w-4 h-4 text-purple-400" />
                Edit Teacher Information
              </div>
              <button type="button" onClick={() => setEditingTeacher(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Avatar Emoji</label>
                <div className="flex gap-2">
                  {['👨‍🏫', '👩‍🏫', '🧑‍🏫', '👨‍🔬', '💻', '📐', '📚'].map(emo => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setEditingTeacher({ ...editingTeacher, avatar: emo })}
                      className={`w-9 h-9 text-lg rounded-xl flex items-center justify-center border transition-all ${
                        editingTeacher.avatar === emo ? 'bg-purple-600 border-purple-400' : 'bg-[#100e1c] border-purple-900/40'
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Teacher Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.name}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Subject Assigned *</label>
                <input
                  type="text"
                  required
                  value={editingTeacher.subject}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Teacher Gmail *</label>
                <input
                  type="email"
                  required
                  value={editingTeacher.email}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={editingTeacher.phone || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Standard / Class</label>
                  <input
                    type="text"
                    value={editingTeacher.standard || 'Class 11 (Plus One)'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, standard: e.target.value })}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Stream / Division</label>
                  <input
                    type="text"
                    value={editingTeacher.stream || 'Computer-Science'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, stream: e.target.value })}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Date of Birth (DOB)</label>
                <input
                  type="date"
                  value={editingTeacher.dob || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, dob: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-purple-600/30"
              >
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* WORK DOSSIER MODAL */}
      {viewingDossierTeacher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#161426] border border-purple-600/50 rounded-3xl p-5 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/40">
              <div className="flex items-center gap-2 font-black text-sm text-purple-300">
                <FileText className="w-5 h-5 text-purple-400" />
                Teacher Work Dossier — {viewingDossierTeacher.name}
              </div>
              <button onClick={() => setViewingDossierTeacher(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#110e20] p-4 rounded-2xl border border-purple-900/30 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-2xl">
                  {viewingDossierTeacher.avatar || '👨‍🏫'}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{viewingDossierTeacher.name}</h4>
                  <p className="text-xs text-purple-300">{viewingDossierTeacher.designation} • {viewingDossierTeacher.subject}</p>
                  <p className="text-[10.5px] text-gray-400 font-mono mt-0.5">{viewingDossierTeacher.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                <div className="bg-[#18152c] p-2.5 rounded-xl border border-purple-900/40">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Assigned Class</div>
                  <div className="font-bold text-white mt-0.5">{viewingDossierTeacher.standard || 'Class 11 (Plus One)'}</div>
                </div>
                <div className="bg-[#18152c] p-2.5 rounded-xl border border-purple-900/40">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">School Code</div>
                  <div className="font-bold text-amber-400 font-mono mt-0.5">{viewingDossierTeacher.schoolCode || school.schoolCode}</div>
                </div>
                <div className="bg-[#18152c] p-2.5 rounded-xl border border-purple-900/40">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Class Strength</div>
                  <div className="font-bold text-emerald-400 mt-0.5">{students.length} Students</div>
                </div>
                <div className="bg-[#18152c] p-2.5 rounded-xl border border-purple-900/40">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Account Status</div>
                  <div className="font-bold text-purple-300 mt-0.5 uppercase">{viewingDossierTeacher.status || 'Active'}</div>
                </div>
              </div>

              <div className="text-xs space-y-1 pt-1">
                <div className="font-bold text-gray-300">Recent Institutional Performance Record:</div>
                <p className="text-[11px] text-gray-400">
                  Teacher active in logging daily student attendance registers, generating absentee circular lists, and participating in terminal exam evaluation sessions under {school.schoolName}.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setViewingDossierTeacher(null)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-xl text-xs shadow-md"
              >
                Close Work Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER PROFILE DELETION MODAL (OPTION A vs OPTION B) */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-[#181426] border border-rose-800/60 rounded-3xl p-5 shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-rose-900/40">
              <div className="flex items-center gap-2 font-black text-sm text-rose-400">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                Confirm Teacher Deletion — School Admin Control
              </div>
              <button onClick={() => setTeacherToDelete(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#120f1e] p-3 rounded-2xl border border-purple-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 font-black flex items-center justify-center text-base border border-purple-500/40">
                {teacherToDelete.avatar || teacherToDelete.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-black text-white">{teacherToDelete.name}</div>
                <div className="text-xs text-gray-400">{teacherToDelete.email} • Code: {teacherToDelete.schoolCode}</div>
              </div>
            </div>

            <p className="text-xs text-gray-300">
              Select the deletion policy to apply for <strong className="text-white">{teacherToDelete.name}</strong> under School Code <strong className="text-amber-400">{teacherToDelete.schoolCode}</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* OPTION A: TEMPORARY DELETE */}
              <div className="bg-[#1b172a] border border-amber-800/40 hover:border-amber-500 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-amber-300 mb-1">
                    <UserX className="w-4 h-4 text-amber-400" />
                    OPTION A: Temporary Delete
                  </div>
                  <ul className="text-[10.5px] text-gray-300 space-y-1 list-disc list-inside">
                    <li>Temporarily deactivates teacher account.</li>
                    <li>Removes classroom data from active application views.</li>
                    <li><strong className="text-amber-200">Does NOT permanently blacklist</strong> School Code access.</li>
                    <li>Teacher can be reactivated later by admin.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onTemporaryDeleteTeacher) {
                      onTemporaryDeleteTeacher(teacherToDelete);
                      setToastMsg(`Teacher "${teacherToDelete.name}" temporarily deactivated.`);
                      setTimeout(() => setToastMsg(null), 3500);
                    }
                    setTeacherToDelete(null);
                  }}
                  className="w-full bg-amber-700 hover:bg-amber-600 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Deactivate (Temporary)
                </button>
              </div>

              {/* OPTION B: PERMANENT DELETE & BLACKLIST */}
              <div className="bg-[#1f1422] border border-rose-800/50 hover:border-rose-500 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black text-rose-300 mb-1">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    OPTION B: Permanent Delete
                  </div>
                  <ul className="text-[10.5px] text-rose-200/80 space-y-1 list-disc list-inside">
                    <li>Permanently deactivates teacher account.</li>
                    <li><strong className="text-rose-300">Permanently blacklists</strong> email + School Code in Firestore.</li>
                    <li>Blocks re-registration & login attempts forever.</li>
                    <li>Removes associated application data.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (onPermanentDeleteTeacher) {
                      onPermanentDeleteTeacher(teacherToDelete, permanentReason);
                      setToastMsg(`Teacher "${teacherToDelete.name}" permanently blacklisted under School Code ${teacherToDelete.schoolCode}.`);
                      setTimeout(() => setToastMsg(null), 3500);
                    }
                    setTeacherToDelete(null);
                  }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-rose-600/30"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Blacklist (Permanent)
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setTeacherToDelete(null)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-4 rounded-xl text-xs"
              >
                Cancel / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
