import React from 'react';
import { 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  Bell, 
  Clock, 
  TrendingUp, 
  Printer, 
  Building2, 
  CheckCircle2, 
  ShieldCheck,
  Plus, 
  Sliders, 
  User, 
  ArrowRight,
  Sparkles,
  Star
} from 'lucide-react';
import { Teacher, School, ClassRoom, Student, DailyAttendance, Exam, Directive, ActiveTab } from '../types';

interface DashboardViewProps {
  teacher: Partial<Teacher>;
  school: Partial<School>;
  activeClass: Partial<ClassRoom>;
  students: Student[];
  todayAttendance?: DailyAttendance;
  exams: Exam[];
  directives: Directive[];
  onNavigate: (tab: ActiveTab) => void;
  onOpenClassModal: () => void;
  onOpenReminders: () => void;
  onOpenSchoolProfile: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  teacher,
  school,
  activeClass,
  students,
  todayAttendance,
  exams,
  directives,
  onNavigate,
  onOpenClassModal,
  onOpenReminders,
  onOpenSchoolProfile
}) => {
  const teacherName = teacher.name || 'Elwin George';
  const designation = teacher.designation || 'Physics Teacher';
  const className = activeClass ? `${activeClass.standard || ''} ${activeClass.stream || ''} ${activeClass.section || ''}`.trim() || 'G G A' : 'G G A';
  const schoolCode = school.schoolCode || teacher.schoolCode || 'FC';
  const schoolName = school.schoolName || 'GX';

  const totalStudents = students.length;
  const presentCount = todayAttendance?.presentCount || 0;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;
  const activeExamsCount = exams.length;
  const activeNoticesCount = directives.length;

  return (
    <div className="p-3 sm:p-5 space-y-5 pb-24 max-w-4xl mx-auto">
      {/* App Branding Top Strip */}
      <div className="flex items-center justify-between bg-[#151326] border border-purple-900/40 rounded-2xl p-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-black text-sm border border-purple-500/40">
            🏫
          </div>
          <div>
            <h2 className="text-sm font-black text-white tracking-wide">HSS ALL IN ONE</h2>
            <p className="text-[10px] text-purple-400 font-semibold">{schoolName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenClassModal}
            className="flex items-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Class
          </button>
          <button
            onClick={onOpenReminders}
            className="p-2 bg-[#1f1b38] hover:bg-[#282449] text-amber-400 rounded-xl border border-purple-800/40 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </div>
      </div>

      {/* Verified Faculty Portal Card */}
      <div className="bg-gradient-to-br from-[#1b1735] via-[#161329] to-[#120f24] border border-purple-800/50 rounded-3xl p-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start gap-4">
          {/* Avatar Box */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-800 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg border border-purple-400/30">
              {teacherName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-black p-0.5 rounded-full border-2 border-[#161329]">
              <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-[#161329]" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-[9.5px] font-extrabold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3 h-3" />
              VERIFIED FACULTY PORTAL
            </div>

            <h1 className="text-lg font-black text-white truncate">{teacherName}</h1>
            <p className="text-xs text-purple-300/80 font-medium">{designation} • {className}</p>

            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700/50 px-2 py-0.5 rounded-md font-bold">
                6x ({schoolCode})
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 pt-3 border-t border-purple-800/30 grid grid-cols-2 gap-2">
          <button
            onClick={onOpenSchoolProfile}
            className="flex items-center justify-center gap-1.5 bg-[#201c3d] hover:bg-[#28234d] text-purple-200 text-xs font-bold py-2 px-3 rounded-xl border border-purple-700/40 transition-all"
          >
            <User className="w-3.5 h-3.5 text-purple-400" />
            School Profile
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            Settings
          </button>
        </div>
      </div>

      {/* 2x2 Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="bg-[#141226] hover:bg-[#1a1730] border border-purple-900/40 rounded-2xl p-3.5 shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">TOTAL STUDENTS</span>
            <div className="p-1.5 rounded-xl bg-purple-950 text-purple-400 border border-purple-800/40">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">{totalStudents}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Enrolled in active class</p>
        </div>

        {/* Today Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="bg-[#141226] hover:bg-[#1a1730] border border-purple-900/40 rounded-2xl p-3.5 shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">TODAY ATTENDANCE</span>
            <div className="p-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/40">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 group-hover:scale-105 transition-transform">{attendanceRate}%</div>
          <p className="text-[10px] text-gray-400 mt-0.5">{presentCount} of {totalStudents} present</p>
        </div>

        {/* Active Exams */}
        <div 
          onClick={() => onNavigate('exams')}
          className="bg-[#141226] hover:bg-[#1a1730] border border-purple-900/40 rounded-2xl p-3.5 shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">ACTIVE EXAMS</span>
            <div className="p-1.5 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white group-hover:scale-105 transition-transform">{activeExamsCount}</div>
          <p className="text-[10px] text-cyan-400 mt-0.5">Term assessments scheduled</p>
        </div>

        {/* Notice Board */}
        <div 
          onClick={() => onNavigate('notices')}
          className="bg-[#141226] hover:bg-[#1a1730] border border-purple-900/40 rounded-2xl p-3.5 shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold text-purple-300 uppercase tracking-wider">NOTICE BOARD</span>
            <div className="p-1.5 rounded-xl bg-amber-950 text-amber-400 border border-amber-800/40">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 group-hover:scale-105 transition-transform">{activeNoticesCount}</div>
          <p className="text-[10px] text-gray-400 mt-0.5">Active circulars & tasks</p>
        </div>
      </div>

      {/* CORE MANAGEMENT MODULES Section Header */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider">CORE MANAGEMENT MODULES</h3>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Tap any module to open</span>
        </div>

        {/* Modules List */}
        <div className="space-y-3">
          {/* Module 1: Attendance */}
          <div 
            onClick={() => onNavigate('attendance')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Attendance Management
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mark daily student attendance, track absentees, and view attendance reports.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  Open Attendance <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: Students & Roster */}
          <div 
            onClick={() => onNavigate('students')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/40">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Students & Roster
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Manage student profiles, roll numbers, guardian contacts, and remarks.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  View Students <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 3: Timetable & Schedule */}
          <div 
            onClick={() => onNavigate('timetable')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Timetable & Schedule
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Weekly class periods, substitution management, and homework assignments.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  Open Timetable <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 4: Exams & Mark Entry */}
          <div 
            onClick={() => onNavigate('exams')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-950/60 text-indigo-400 border border-indigo-800/40">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Exams & Mark Entry
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Enter term examination scores, tool marks, and compute student grade rankings.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  Open Mark Entry <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 5: Academic Trajectory */}
          <div 
            onClick={() => onNavigate('trajectory')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/40">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Academic Trajectory
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Holistic performance graphs, term-over-term comparisons, and progress analytics.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  View Trajectory <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 6: Reports & PDF Export */}
          <div 
            onClick={() => onNavigate('reports')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/40">
                <Printer className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Reports & PDF Export
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Generate and print student report cards, attendance summaries, and fee rosters.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  Open Reports <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 7: Notice Board & Reminders */}
          <div 
            onClick={() => onNavigate('notices')}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-950/60 text-amber-400 border border-amber-800/40">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  Notice Board & Reminders
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  School circulars, principal announcements, and task reminder lists.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  View Notices <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Module 8: School Profile & Classes */}
          <div 
            onClick={onOpenSchoolProfile}
            className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 hover:border-purple-600/50 rounded-2xl p-4 shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-black text-white group-hover:text-purple-300 transition-colors">
                  School Profile & Classes
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure institution details, class streams, subjects, and Teachers directory.
                </p>
                <div className="mt-2.5 flex items-center text-xs font-bold text-purple-400 group-hover:text-purple-300">
                  Manage School <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Footer Bar */}
      <div className="text-center pt-4 border-t border-purple-900/20 text-[10.5px] text-gray-400 space-y-1">
        <div className="font-bold text-purple-300">HSS ALL IN ONE</div>
        <div>Higher Secondary School Management System • Multi-Device Sync Active</div>
      </div>
    </div>
  );
};
