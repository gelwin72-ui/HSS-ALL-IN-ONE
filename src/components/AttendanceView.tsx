import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Share2, 
  Printer, 
  Clock, 
  Calendar, 
  Check, 
  X, 
  Phone, 
  ArrowRight,
  FileText
} from 'lucide-react';
import { Student, DailyAttendance, AttendanceStatus, School, Teacher, ClassRoom } from '../types';
import { exportDailyAttendancePDF } from '../lib/pdfExport';

interface AttendanceViewProps {
  students: Student[];
  school: Partial<School>;
  teacher: Partial<Teacher>;
  activeClass: Partial<ClassRoom>;
  attendanceRecords: DailyAttendance[];
  onSaveAttendance: (attendance: DailyAttendance) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  school,
  teacher,
  activeClass,
  attendanceRecords,
  onSaveAttendance
}) => {
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. 2026-11-03
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeSubTab, setActiveSubTab] = useState<'mark' | 'absent' | 'history' | 'monthly'>('mark');

  // Load existing or construct initial daily record for selected date
  const existingRecord = attendanceRecords.find(r => r.date === selectedDate);
  const initialRecords: Record<string, AttendanceStatus> = {};
  students.forEach(st => {
    initialRecords[st.id] = existingRecord?.records?.[st.id] || 'PRESENT';
  });

  const [currentMap, setCurrentMap] = useState<Record<string, AttendanceStatus>>(initialRecords);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month selector for Monthly Register
  const [selectedMonth, setSelectedMonth] = useState('Nov');
  const [selectedYear, setSelectedYear] = useState('2026');

  // Calculated metrics
  const totalStudents = students.length;
  const presentCount = Object.values(currentMap).filter(st => st === 'PRESENT').length;
  const absentCount = Object.values(currentMap).filter(st => st === 'ABSENT').length;
  const attendanceRate = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(1) : '0.0';

  const absentStudents = students.filter(st => currentMap[st.id] === 'ABSENT');

  const handleToggleStatus = (studentId: string) => {
    setCurrentMap(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {};
    students.forEach(st => {
      updated[st.id] = status;
    });
    setCurrentMap(updated);
  };

  const handleSave = () => {
    const record: DailyAttendance = {
      id: `${activeClass.schoolCode || 'FC'}_${activeClass.id || 'class'}_${selectedDate}`,
      schoolCode: activeClass.schoolCode || 'FC',
      classId: activeClass.id || 'class',
      date: selectedDate,
      records: currentMap,
      presentCount,
      absentCount,
      totalStudents,
      attendanceRate: parseFloat(attendanceRate),
      updatedAt: new Date().toISOString()
    };
    onSaveAttendance(record);

    setToastMessage(`Attendance for ${selectedDate} saved successfully! (${presentCount} Present, ${absentCount} Absent)`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportPDF = () => {
    exportDailyAttendancePDF(
      school,
      teacher,
      activeClass,
      selectedDate,
      absentStudents,
      totalStudents,
      presentCount
    );
  };

  const getFormattedReportDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return dateStr;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${dayName}, ${dayNum} ${monthName}, ${year}`;
  };

  const getReportText = () => {
    const formattedDate = getFormattedReportDate(selectedDate);
    const sCode = (activeClass.schoolCode || school.schoolCode || '').trim().toUpperCase();
    const isSpecialCode = sCode === 'SSHSS@111213' || sCode === 'SSHS0111213';
    
    const resolvedSchoolName = isSpecialCode 
      ? "St. Sebastain's Higher Secondary School" 
      : (school.schoolName || "St. Sebastain's Higher Secondary School");

    const std = activeClass.standard || 'Class 11 (Plus One)';
    const stm = activeClass.stream || 'Computer-Science';
    const sec = activeClass.section || 'E';
    const classStr = `${std} ${stm} ${sec}`.replace(/\s+/g, ' ').trim();
    const teacherName = teacher.name || 'Elwin george';

    let absentListStr = '';
    if (absentStudents.length > 0) {
      absentListStr = absentStudents
        .map((st, i) => `${i + 1}. Roll ${st.rollNumber}: ${st.fullName}`)
        .join('\n');
    } else {
      absentListStr = 'None (All Students Present)';
    }

    return `🏫 *${resolvedSchoolName}*\n` +
      `📋 *CLASS ATTENDANCE REPORT*\n` +
      `Class: ${classStr}\n` +
      `Date: ${formattedDate}\n` +
      `Class Strength: ${totalStudents} | Present: ${presentCount} | Absent: ${absentCount}\n\n` +
      `🚨 *ABSENT STUDENTS LIST (${absentCount})*:\n` +
      `${absentListStr}\n\n` +
      `Class Teacher: ${teacherName}\n` +
      `Generated via HSS ALL IN ONE`;
  };

  const handleCopyAbsentees = () => {
    const text = getReportText();
    navigator.clipboard.writeText(text);
    setToastMessage('Absentee report copied to clipboard!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header Card */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
          <CalendarCheck className="w-4 h-4" />
          Daily Roster
        </div>
        <h2 className="text-xl font-black text-white">ATTENDANCE MANAGEMENT</h2>
        <p className="text-xs text-gray-400">Mark daily attendance, track absentees, and generate monthly registers.</p>

        {/* Top Export Buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2 px-3 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            EXPORT SVG
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2 px-3 rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-purple-900/40 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('mark')}
          className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'mark'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          MARK ATTENDANCE
        </button>
        <button
          onClick={() => setActiveSubTab('absent')}
          className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'absent'
              ? 'border-rose-500 text-rose-400 bg-rose-950/20'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          ABSENT STUDENTS ({absentStudents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('history')}
          className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'history'
              ? 'border-purple-500 text-purple-300 bg-purple-950/20'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          ATTENDANCE HISTORY ({attendanceRecords.length})
        </button>
        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`py-2 px-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === 'monthly'
              ? 'border-indigo-500 text-indigo-300 bg-indigo-950/20'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          MONTHLY REGISTER
        </button>
      </div>

      {/* SUB-TAB 1: MARK ATTENDANCE */}
      {activeSubTab === 'mark' && (
        <div className="space-y-3">
          {/* Selected Date Picker */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-gray-300">Selected Date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[#1a172e] border border-purple-800/50 text-white font-bold text-xs rounded-xl px-3 py-1.5 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleMarkAll('PRESENT')}
                className="flex-1 sm:flex-none bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                MARK ALL PRESENT
              </button>
              <button
                onClick={() => handleMarkAll('ABSENT')}
                className="flex-1 sm:flex-none bg-rose-950 hover:bg-rose-900 border border-rose-600/40 text-rose-300 text-[11px] font-bold py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                MARK ALL ABSENT
              </button>
            </div>
          </div>

          {/* Metric Box */}
          <div className="grid grid-cols-4 gap-2 bg-[#100e1c] border border-purple-900/40 rounded-2xl p-3 text-center">
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Total Students</div>
              <div className="text-lg font-black text-white">{totalStudents}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Present Count</div>
              <div className="text-lg font-black text-emerald-400">{presentCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Absent Count</div>
              <div className="text-lg font-black text-rose-400">{absentCount}</div>
            </div>
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Attendance Rate</div>
              <div className="text-lg font-black text-purple-300">{attendanceRate}%</div>
            </div>
          </div>

          {/* Save Status Bar */}
          <div className="bg-[#1b1836] border border-purple-800/40 rounded-xl p-2.5 text-[11px] text-purple-200 flex items-center justify-between">
            <span>Saving attendance for <strong>{selectedDate}</strong>: <span className="text-emerald-400 font-bold">{presentCount} Present</span>, <span className="text-rose-400 font-bold">{absentCount} Absent</span></span>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs"
          >
            <Check className="w-4 h-4" />
            SAVE ATTENDANCE
          </button>

          {/* Student Attendance List */}
          <div className="space-y-2 pt-2">
            {students.map((st) => {
              const isPresent = currentMap[st.id] === 'PRESENT';
              return (
                <div
                  key={st.id}
                  onClick={() => handleToggleStatus(st.id)}
                  className={`border rounded-2xl p-3 shadow-md transition-all cursor-pointer flex items-center justify-between ${
                    isPresent
                      ? 'bg-[#121921] border-emerald-900/40 hover:border-emerald-600/50'
                      : 'bg-[#211219] border-rose-900/40 hover:border-rose-600/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full font-black text-xs flex items-center justify-center ${
                      isPresent ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {st.rollNumber}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{st.fullName}</h4>
                      <p className="text-[10.5px] text-gray-400">Adm: {st.admissionNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase ${
                      isPresent 
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-600/40' 
                        : 'bg-rose-950 text-rose-400 border border-rose-600/40'
                    }`}>
                      {isPresent ? 'PRESENT' : 'ABSENT'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ABSENT STUDENTS LIST */}
      {activeSubTab === 'absent' && (
        <div className="space-y-3">
          <div className="bg-[#141224] border border-rose-900/40 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-rose-300 uppercase tracking-wider">ABSENT STUDENTS LIST</h3>
                <p className="text-[11px] text-gray-400">Date: {selectedDate} • Total {absentStudents.length} absentees identified</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyAbsentees}
                  className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  COPY LIST
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  EXPORT AS PDF
                </button>
              </div>
            </div>

            {absentStudents.length === 0 ? (
              <div className="bg-[#100e1c] rounded-2xl p-8 text-center space-y-1">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-base font-black text-white">All Students Present!</div>
                <p className="text-xs text-gray-400">No absentees were recorded for {selectedDate}.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Formatted Message Preview Card */}
                <div className="bg-[#0e0c18] border border-purple-900/50 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-purple-300 uppercase tracking-wider">FORMATTED ATTENDANCE REPORT PREVIEW</span>
                    <button
                      onClick={handleCopyAbsentees}
                      className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold py-1 px-2.5 rounded-lg flex items-center gap-1 shadow"
                    >
                      <Copy className="w-3 h-3" />
                      COPY REPORT
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-[#141021] text-gray-200 p-3 rounded-xl whitespace-pre-wrap border border-purple-900/30">
                    {getReportText()}
                  </pre>
                </div>

                {/* Individual Absent Student Cards */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-300 uppercase tracking-wider px-1">
                    ABSENT STUDENTS ({absentStudents.length})
                  </div>
                  {absentStudents.map((st, idx) => (
                    <div key={st.id} className="bg-[#1c1218] border border-rose-900/40 rounded-2xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-black text-white">
                            Roll {st.rollNumber}: {st.fullName}
                          </div>
                          <div className="text-[10.5px] text-gray-400">
                            Adm: {st.admissionNumber} • Parent: {st.parentName || 'N/A'} ({st.parentPhone || 'N/A'})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {st.parentPhone && (
                          <a
                            href={`tel:${st.parentPhone}`}
                            className="p-2 bg-rose-950 text-rose-300 border border-rose-800/50 rounded-xl hover:bg-rose-900/80"
                            title="Call Parent"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <span className="bg-rose-950 text-rose-400 border border-rose-800/60 text-[10px] font-black px-2 py-1 rounded-xl">
                          ABSENT
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ATTENDANCE HISTORY */}
      {activeSubTab === 'history' && (
        <div className="space-y-3">
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider">ATTENDANCE HISTORY</h3>
                <p className="text-[11px] text-gray-400">{attendanceRecords.length} recorded school days in database</p>
              </div>

              <button
                onClick={handleExportPDF}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                EXPORT ATTENDANCE PDF
              </button>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="bg-[#100e1c] rounded-2xl p-8 text-center space-y-1 text-gray-400">
                <Calendar className="w-8 h-8 mx-auto text-purple-400/40" />
                <div className="text-sm font-bold text-white">No Records Found</div>
                <p className="text-xs">Saved attendance records will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {attendanceRecords.map((rec) => (
                  <div key={rec.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{rec.date}</div>
                      <div className="text-[10px] text-gray-400">Enrolled: {rec.totalStudents} • Present: {rec.presentCount} • Absent: {rec.absentCount}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-emerald-400">{rec.attendanceRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: MONTHLY REGISTER */}
      {activeSubTab === 'monthly' && (
        <div className="space-y-3">
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-purple-900/30">
              <div>
                <h3 className="text-sm font-black text-purple-300 uppercase tracking-wider">CLASS ATTENDANCE REPORTS</h3>
                <p className="text-[11px] text-gray-400">Select month to export full class summary register</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-[#19162e] border border-purple-800/50 text-white font-bold text-xs rounded-xl px-2.5 py-1.5"
                >
                  <option value="Oct">October</option>
                  <option value="Nov">November</option>
                  <option value="Dec">December</option>
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-[#19162e] border border-purple-800/50 text-white font-bold text-xs rounded-xl px-2.5 py-1.5"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4" />
              EXPORT MONTHLY ATTENDANCE PDF
            </button>

            {/* Table */}
            <div className="overflow-x-auto border border-purple-900/40 rounded-xl">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-[#19162e] text-purple-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">Roll</th>
                    <th className="p-2.5">Student Name</th>
                    <th className="p-2.5">Days Present</th>
                    <th className="p-2.5">Days Absent</th>
                    <th className="p-2.5">Attendance %</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/30">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-[#19162e]/50">
                      <td className="p-2.5 font-bold text-white">{st.rollNumber}</td>
                      <td className="p-2.5 font-bold text-white">{st.fullName}</td>
                      <td className="p-2.5 text-emerald-400 font-bold">0</td>
                      <td className="p-2.5 text-rose-400 font-bold">0</td>
                      <td className="p-2.5 font-bold text-white">100%</td>
                      <td className="p-2.5">
                        <span className="bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          Good
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
