import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Printer,
  Calendar,
  Award,
  Users,
  Search,
  School,
  Sparkles,
  CheckCircle2,
  Eye
} from 'lucide-react';
import {
  SchoolProfile,
  ClassInfo,
  TeacherInfo,
  Student,
  AttendanceRecord,
  Exam,
  ExamMarksRecord
} from '../types';
import {
  generateFullSchoolDataPDF,
  generateExamReportPDF,
  generateMonthlyAttendancePDF,
  generateStudentProgressReportPDF,
  generateAbsentReportPDF
} from '../utils/pdfGenerator';
import { PDFPreviewModal } from '../components/PDFPreviewModal';
import jsPDF from 'jspdf';

interface ReportsScreenProps {
  school: SchoolProfile;
  classInfo: ClassInfo;
  teacher: TeacherInfo;
  students: Student[];
  attendance: AttendanceRecord[];
  exams: Exam[];
  examMarksMap: Record<string, ExamMarksRecord>;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  school,
  classInfo,
  teacher,
  students,
  attendance,
  exams,
  examMarksMap
}) => {
  // Modal Preview state
  const [previewDoc, setPreviewDoc] = useState<jsPDF | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFilename, setPreviewFilename] = useState('');

  // Form selections
  const safeExams = exams || [];
  const safeStudents = students || [];
  const [selectedExamId, setSelectedExamId] = useState<string>(safeExams.length > 0 ? safeExams[0].id : '');
  const [selectedMonthName, setSelectedMonthName] = useState<string>('August');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(safeStudents.length > 0 ? safeStudents[0].id : '');

  const sortedStudents = [...safeStudents].sort((a, b) => (a?.rollNo || 0) - (b?.rollNo || 0));

  // 1. Export All Application Data PDF
  const handleExportAllData = () => {
    const doc = generateFullSchoolDataPDF(school, classInfo, teacher, students, attendance, exams, examMarksMap);
    setPreviewDoc(doc);
    setPreviewTitle('Comprehensive Class Dossier & Master Report');
    setPreviewFilename(`${classInfo.className.replace(/[^a-zA-Z0-9]/g, '_')}_Master_Dossier.pdf`);
  };

  // 2. Export Exam Tabulation PDF
  const handleExportExamReport = () => {
    const targetExam = exams.find(e => e.id === selectedExamId) || exams[0];
    if (!targetExam) return;

    const doc = generateExamReportPDF(school, classInfo, teacher, targetExam, students, examMarksMap[targetExam.id]);
    setPreviewDoc(doc);
    setPreviewTitle(`Full Exam Tabulation: ${targetExam.name}`);
    setPreviewFilename(`${targetExam.name.replace(/[^a-zA-Z0-9]/g, '_')}_Tabulation.pdf`);
  };

  // 3. Export Monthly Attendance PDF
  const handleExportMonthlyAttendance = () => {
    const doc = generateMonthlyAttendancePDF(school, classInfo, teacher, selectedMonthName, selectedYear, students, attendance);
    setPreviewDoc(doc);
    setPreviewTitle(`Class Monthly Attendance Report - ${selectedMonthName} ${selectedYear}`);
    setPreviewFilename(`${classInfo.className.replace(/[^a-zA-Z0-9]/g, '_')}_Attendance_${selectedMonthName}_${selectedYear}.pdf`);
  };

  // 4. Export Individual Student Performance Report PDF
  const handleExportStudentProgress = () => {
    const targetStudent = students.find(s => s.id === selectedStudentId) || sortedStudents[0];
    if (!targetStudent) return;

    const doc = generateStudentProgressReportPDF(school, classInfo, teacher, targetStudent, exams, examMarksMap, attendance);
    setPreviewDoc(doc);
    setPreviewTitle(`Student Progress Report: ${targetStudent.name}`);
    setPreviewFilename(`ReportCard_Roll${targetStudent.rollNo}_${targetStudent.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-1">
            <FileText className="w-3.5 h-3.5" /> Official Document Generation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            REPORTS & PDF EXPORTS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Generate standardized A4 printable report cards, tabulation sheets, and master dossiers.
          </p>
        </div>
      </div>

      {/* 1. MASTER ALL-DATA DOSSIER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/60 via-[#1A1C23] to-indigo-950/60 p-6 sm:p-7 border border-purple-500/40 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Institutional Master Export
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              EXPORT ALL APPLICATION DATA TO PDF
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
              Generates a comprehensive official dossier containing School Profile, Class Details, Teacher Credentials, Student Master List, Attendance Summary, and Conducted Examinations.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportAllData}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-purple-950/60 transition active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT ALL DATA TO PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. FULL EXAM TABULATION REPORT */}
        <div className="rounded-3xl bg-[#1A1C23] border border-[#2D3139] p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">FULL EXAM REPORT</h3>
                <p className="text-xs text-slate-400">Class mark tabulation with rank & grades</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select exam to generate report:
              </label>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm font-bold text-white focus:outline-none focus:border-purple-500"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#2D3139]">
            <button
              type="button"
              onClick={handleExportExamReport}
              disabled={exams.length === 0}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-900/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT EXAM REPORT PDF</span>
            </button>
          </div>
        </div>

        {/* 3. MONTHLY ATTENDANCE REPORT */}
        <div className="rounded-3xl bg-[#1A1C23] border border-[#2D3139] p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">CLASS ATTENDANCE REPORTS</h3>
                <p className="text-xs text-slate-400">Monthly working days, present & absent summary</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Month</label>
                <select
                  value={selectedMonthName}
                  onChange={e => setSelectedMonthName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Year</label>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-xs font-bold text-white focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                  <option value={2024}>2024</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#2D3139]">
            <button
              type="button"
              onClick={handleExportMonthlyAttendance}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>EXPORT MONTHLY ATTENDANCE PDF</span>
            </button>
          </div>
        </div>

        {/* 4. INDIVIDUAL STUDENT REPORT CARD */}
        <div className="rounded-3xl bg-[#1A1C23] border border-[#2D3139] p-5 sm:p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">INDIVIDUAL PERFORMANCE</h3>
                <p className="text-xs text-slate-400">Official student progress report card</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                TAP TO SELECT STUDENT:
              </label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0F1115] border border-[#2D3139] text-sm font-bold text-white focus:outline-none focus:border-cyan-500"
              >
                {sortedStudents.map(st => (
                  <option key={st.id} value={st.id}>
                    Roll #{st.rollNo}: {st.name} ({st.admissionNo})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[#2D3139]">
            <button
              type="button"
              onClick={handleExportStudentProgress}
              disabled={students.length === 0}
              className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-900/30 transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>SHARE PROGRESS AS PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={!!previewDoc}
        doc={previewDoc}
        title={previewTitle}
        filename={previewFilename}
        onClose={() => setPreviewDoc(null)}
      />
    </div>
  );
};
