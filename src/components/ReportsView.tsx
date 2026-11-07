import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  FileText, 
  Users, 
  Award, 
  CalendarCheck, 
  Share2, 
  Building2 
} from 'lucide-react';
import { School, Teacher, ClassRoom, Student, Exam, MarkRecord } from '../types';
import { 
  exportDailyAttendancePDF, 
  exportExamReportPDF, 
  exportInstitutionalAuditPDF 
} from '../lib/pdfExport';

interface ReportsViewProps {
  school: Partial<School>;
  teacher: Partial<Teacher>;
  activeClass: Partial<ClassRoom>;
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  school,
  teacher,
  activeClass,
  students,
  exams,
  marks
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState('2026');

  const selectedExam = exams.find(e => e.id === selectedExamId) || exams[0];

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
          <Printer className="w-4 h-4" />
          OFFICIAL DOCUMENT GENERATION
        </div>
        <h2 className="text-xl font-black text-white">REPORTS & PDF EXPORTS</h2>
        <p className="text-xs text-gray-400">Generate standardized A4 printable report cards, tabulation sheets, and master dossiers.</p>
      </div>

      {/* Card 1: Institutional Master Export */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
          <Building2 className="w-4 h-4 text-purple-400" />
          Institutional Master Export
        </div>
        <h3 className="text-sm font-black text-white">EXPORT ALL APPLICATION DATA TO PDF</h3>
        <p className="text-xs text-gray-400">
          Generates a comprehensive official dossier containing School Profile, Class Details, Teacher Credentials, Student Master List, Attendance Summary, and Conducted Examinations.
        </p>

        <button
          onClick={() => exportInstitutionalAuditPDF(school, [teacher as Teacher], students.length, 1, 100)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
        >
          <Download className="w-4 h-4" />
          EXPORT ALL DATA TO PDF
        </button>
      </div>

      {/* Card 2: Full Exam Report */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <Award className="w-4 h-4" />
          FULL EXAM REPORT
        </div>
        <p className="text-xs text-gray-400">Class mark tabulation with rank & grades</p>

        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1">Select exam to generate report:</label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-purple-500 focus:outline-none"
          >
            {exams.length === 0 ? (
              <option value="">No exams created yet</option>
            ) : (
              exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.examName} ({ex.examType})
                </option>
              ))
            )}
          </select>
        </div>

        <button
          onClick={() => selectedExam && exportExamReportPDF(school, activeClass, selectedExam, students, marks)}
          disabled={!selectedExam}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 uppercase tracking-wider text-xs disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          EXPORT EXAM REPORT PDF
        </button>
      </div>

      {/* Card 3: Class Attendance Reports */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <CalendarCheck className="w-4 h-4" />
          CLASS ATTENDANCE REPORTS
        </div>
        <p className="text-xs text-gray-400">Monthly working days, present & absent summary</p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Select Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="August">August</option>
              <option value="September">September</option>
              <option value="October">October</option>
              <option value="November">November</option>
              <option value="December">December</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1">Academic Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => exportDailyAttendancePDF(school, teacher, activeClass, `${selectedMonth} ${selectedYear}`, [], students.length, students.length)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Download className="w-4 h-4" />
            EXPORT MONTHLY ATTENDANCE PDF
          </button>
          <button
            onClick={() => exportDailyAttendancePDF(school, teacher, activeClass, 'Full History', [], students.length, students.length)}
            className="bg-[#1f1b38] hover:bg-[#282348] text-emerald-300 border border-emerald-800/40 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            EXPORT FULL ATTENDANCE HISTORY PDF
          </button>
        </div>
      </div>

      {/* Card 4: Individual Performance */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
          <Users className="w-4 h-4" />
          INDIVIDUAL PERFORMANCE
        </div>
        <p className="text-xs text-gray-400">Official student progress report card</p>

        <div>
          <label className="block text-xs font-bold text-gray-300 mb-1">TAP TO SELECT STUDENT:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-purple-500 focus:outline-none"
          >
            {students.map(st => (
              <option key={st.id} value={st.id}>
                Roll #{st.rollNumber}: {st.fullName} ({st.admissionNumber})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => exportInstitutionalAuditPDF(school, [teacher as Teacher], 1, 1, 100)}
          className="w-full bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 font-black py-3 px-4 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
        >
          <Share2 className="w-4 h-4" />
          SHARE PROGRESS AS PDF
        </button>
      </div>
    </div>
  );
};
