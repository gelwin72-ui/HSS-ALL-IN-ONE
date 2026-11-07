import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Award, 
  Info, 
  Check, 
  X, 
  Save, 
  Calculator,
  Download,
  Printer
} from 'lucide-react';
import { Exam, MarkRecord, Student, SubjectConfig, School, ClassRoom } from '../types';
import { exportExamReportPDF } from '../lib/pdfExport';

interface ExamsViewProps {
  exams: Exam[];
  students: Student[];
  marks: MarkRecord[];
  school: Partial<School>;
  activeClass: Partial<ClassRoom>;
  onCreateExam: (exam: Exam) => void;
  onSaveMarks: (examId: string, markRecords: MarkRecord[]) => void;
}

export const ExamsView: React.FC<ExamsViewProps> = ({
  exams,
  students,
  marks,
  school,
  activeClass,
  onCreateExam,
  onSaveMarks
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [loadedExam, setLoadedExam] = useState<Exam | null>(exams[0] || null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Exam Form State
  const [examName, setExamName] = useState('First Terminal Examination 2025');
  const [examType, setExamType] = useState<Exam['examType']>('First Terminal');
  const [examDate, setExamDate] = useState('2026-11-03');
  const [subjects, setSubjects] = useState<SubjectConfig[]>([
    { name: 'English', maxMarks: 100 },
    { name: 'Physics', maxMarks: 100 },
    { name: 'Chemistry', maxMarks: 100 },
    { name: 'Mathematics', maxMarks: 100 },
    { name: 'Biology', maxMarks: 100 },
    { name: 'Malayalam / Second Lang', maxMarks: 100 }
  ]);

  // Mark entry map: studentId -> { subjectName: mark }
  const currentExamMarks = marks.filter(m => m.examId === loadedExam?.id);
  const initialMarksMap: Record<string, Record<string, number | 'AB'>> = {};
  
  students.forEach(st => {
    const existingRec = currentExamMarks.find(m => m.studentId === st.id);
    initialMarksMap[st.id] = existingRec?.subjectMarks || {};
  });

  const [marksState, setMarksState] = useState<Record<string, Record<string, number | 'AB'>>>(initialMarksMap);

  const handleApplyPreset = (preset: 'Science' | 'Commerce' | 'Humanities') => {
    if (preset === 'Science') {
      setSubjects([
        { name: 'English', maxMarks: 100 },
        { name: 'Physics', maxMarks: 100 },
        { name: 'Chemistry', maxMarks: 100 },
        { name: 'Mathematics', maxMarks: 100 },
        { name: 'Biology', maxMarks: 100 },
        { name: 'Malayalam / Second Lang', maxMarks: 100 }
      ]);
    } else if (preset === 'Commerce') {
      setSubjects([
        { name: 'English', maxMarks: 100 },
        { name: 'Business Studies', maxMarks: 100 },
        { name: 'Accountancy', maxMarks: 100 },
        { name: 'Economics', maxMarks: 100 },
        { name: 'Computer Applications', maxMarks: 100 },
        { name: 'Malayalam / Second Lang', maxMarks: 100 }
      ]);
    } else {
      setSubjects([
        { name: 'English', maxMarks: 100 },
        { name: 'History', maxMarks: 100 },
        { name: 'Political Science', maxMarks: 100 },
        { name: 'Sociology', maxMarks: 100 },
        { name: 'Economics', maxMarks: 100 },
        { name: 'Malayalam / Second Lang', maxMarks: 100 }
      ]);
    }
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: Exam = {
      id: `exam_${Date.now()}`,
      schoolCode: activeClass.schoolCode || 'FC',
      classId: activeClass.id || 'class_1',
      examName: examName || 'Terminal Exam',
      examType,
      examDate,
      subjects,
      createdAt: new Date().toISOString()
    };
    onCreateExam(newExam);
    setLoadedExam(newExam);
    setSelectedExamId(newExam.id);
    setShowCreateModal(false);

    setToastMsg(`Exam "${newExam.examName}" configured and saved!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const computeGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D+';
    if (percentage >= 30) return 'E';
    return 'F';
  };

  const handleMarkChange = (studentId: string, subjectName: string, value: string) => {
    let markVal: number | 'AB' = 0;
    if (value.toUpperCase() === 'AB') {
      markVal = 'AB';
    } else {
      markVal = Math.max(0, parseInt(value) || 0);
    }

    setMarksState(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectName]: markVal
      }
    }));
  };

  const handleSaveAllMarks = () => {
    if (!loadedExam) return;

    const maxTotal = loadedExam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);

    // Compute student totals for ranking
    const studentScores = students.map(st => {
      const stMarks = marksState[st.id] || {};
      let total = 0;
      loadedExam.subjects.forEach(s => {
        const val = stMarks[s.name];
        if (typeof val === 'number') {
          total += val;
        }
      });
      const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
      return { studentId: st.id, total, pct, grade: computeGrade(pct) };
    });

    // Rank descending
    studentScores.sort((a, b) => b.total - a.total);

    const markRecords: MarkRecord[] = studentScores.map((score, idx) => ({
      id: `${loadedExam.id}_${score.studentId}`,
      examId: loadedExam.id,
      studentId: score.studentId,
      schoolCode: activeClass.schoolCode || 'FC',
      classId: activeClass.id || 'class_1',
      subjectMarks: marksState[score.studentId] || {},
      totalMarks: score.total,
      maxTotalMarks: maxTotal,
      percentage: score.pct,
      grade: score.grade,
      rank: idx + 1,
      updatedAt: new Date().toISOString()
    }));

    onSaveMarks(loadedExam.id, markRecords);

    setToastMsg(`Exam "${loadedExam.examName}" student marks saved successfully!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
          <FileSpreadsheet className="w-4 h-4" />
          EXAMINATION & EVALUATION
        </div>
        <h2 className="text-xl font-black text-white">EXAM & MARK MANAGEMENT</h2>
        <p className="text-xs text-gray-400">Configure exams, dynamic subject maximum marks, and enter student marks.</p>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            CREATE EXAM
          </button>
          <button
            onClick={() => loadedExam && exportExamReportPDF(school, activeClass, loadedExam, students, marks)}
            disabled={!loadedExam}
            className="flex items-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2 px-3 rounded-xl transition-all disabled:opacity-50"
          >
            <Award className="w-4 h-4 text-amber-400" />
            CLASS STATISTICS & RANKERS
          </button>
        </div>
      </div>

      {/* Teacher Instruction Banner */}
      <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-800/40 rounded-2xl p-3 text-xs text-amber-200">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold text-amber-300">Teacher Instruction:</strong> Please use the same subject name for all exams. Don't forget to set the maximum mark.
        </div>
      </div>

      {/* Exam Selector Box */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 space-y-3">
        <label className="block text-xs font-bold text-gray-300">Select an exam and click LOAD for mark entry:</label>
        <div className="flex gap-2">
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              const found = exams.find(x => x.id === e.target.value);
              if (found) setLoadedExam(found);
            }}
            className="flex-1 bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-purple-500 focus:outline-none"
          >
            {exams.length === 0 ? (
              <option value="">No exams created yet</option>
            ) : (
              exams.map(x => (
                <option key={x.id} value={x.id}>
                  {x.examName} ({x.examType} • {x.examDate})
                </option>
              ))
            )}
          </select>

          <button
            onClick={() => {
              const found = exams.find(x => x.id === selectedExamId);
              if (found) setLoadedExam(found);
            }}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs"
          >
            LOAD
          </button>
        </div>
      </div>

      {/* Loaded Exam Tabulation Entry Grid */}
      {!loadedExam ? (
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-8 text-center text-gray-400 space-y-2">
          <FileSpreadsheet className="w-10 h-10 mx-auto text-purple-500/40" />
          <div className="text-base font-bold text-white">No Exam Loaded</div>
          <p className="text-xs">Select an exam from the dropdown above and click LOAD, or click '+ CREATE EXAM'.</p>
        </div>
      ) : (
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
          {/* Loaded Exam Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-[#19162e] border border-purple-800/40 rounded-xl p-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-bold">Loaded Exam:</span>
                <span className="text-sm font-black text-white">{loadedExam.examName}</span>
                <span className="bg-amber-950 text-amber-400 border border-amber-700/50 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                  {loadedExam.examType}
                </span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                {loadedExam.subjects.length} Subjects • Max Total: {loadedExam.subjects.reduce((a, b) => a + b.maxMarks, 0)} • Date: {loadedExam.examDate}
              </div>
            </div>

            <button
              onClick={() => exportExamReportPDF(school, activeClass, loadedExam, students, marks)}
              className="bg-[#241f42] hover:bg-[#2c2652] text-purple-300 border border-purple-700/40 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Export PDF
            </button>
          </div>

          {/* Mark Tabulation Table */}
          <div className="overflow-x-auto border border-purple-900/40 rounded-xl">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#19162e] text-purple-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Roll</th>
                  <th className="p-2.5">Student Name</th>
                  {loadedExam.subjects.map(sub => (
                    <th key={sub.name} className="p-2.5 text-center min-w-[80px]">
                      {sub.name}
                      <div className="text-purple-400 font-normal text-[9px]">(MAX {sub.maxMarks})</div>
                    </th>
                  ))}
                  <th className="p-2.5 text-center">Total</th>
                  <th className="p-2.5 text-center">%</th>
                  <th className="p-2.5 text-center">Grade</th>
                  <th className="p-2.5 text-center">Rank</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-900/30">
                {students.map((st) => {
                  const stMarks = marksState[st.id] || {};
                  let total = 0;
                  const maxTotal = loadedExam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);

                  loadedExam.subjects.forEach(s => {
                    const val = stMarks[s.name];
                    if (typeof val === 'number') total += val;
                  });

                  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
                  const grade = computeGrade(pct);

                  return (
                    <tr key={st.id} className="hover:bg-[#19162e]/50">
                      <td className="p-2.5 font-bold text-white">{st.rollNumber}</td>
                      <td className="p-2.5 font-bold text-white whitespace-nowrap">{st.fullName}</td>
                      {loadedExam.subjects.map(sub => {
                        const val = stMarks[sub.name];
                        return (
                          <td key={sub.name} className="p-2 text-center">
                            <input
                              type="text"
                              value={val === undefined ? '' : val}
                              onChange={(e) => handleMarkChange(st.id, sub.name, e.target.value)}
                              placeholder="0"
                              className="w-14 bg-[#100e1c] border border-purple-900/60 rounded-lg px-2 py-1 text-center font-bold text-white text-xs focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                        );
                      })}
                      <td className="p-2.5 text-center font-bold text-white">{total} / {maxTotal}</td>
                      <td className="p-2.5 text-center font-bold text-cyan-400">{pct.toFixed(1)}%</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-purple-950 text-purple-300 border border-purple-700/50 font-black px-2 py-0.5 rounded text-[10px]">
                          {grade}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-bold text-amber-400">#1</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleSaveAllMarks}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
          >
            <Save className="w-4 h-4" />
            SAVE ALL STUDENT MARKS
          </button>
        </div>
      )}

      {/* CREATE NEW EXAM MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveExam} className="w-full max-w-lg bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
              <div className="text-sm font-bold text-white">Create New Examination</div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Exam Name *</label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="e.g. First Terminal Examination 2025"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Exam Type *</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value as Exam['examType'])}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="First Terminal">First Terminal</option>
                    <option value="Second Terminal">Second Terminal</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="Christmas Exam">Christmas Exam</option>
                    <option value="Model Exam">Model Exam</option>
                    <option value="Unit Test">Unit Test</option>
                    <option value="Annual / Board Exam">Annual / Board Exam</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-300 mb-1">Exam Date *</label>
                  <input
                    type="date"
                    required
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subject Presets */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-gray-300">MANAGE SUBJECTS & MAXIMUM MARKS ({subjects.length})</label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-gray-400">Quick Presets:</span>
                    <button type="button" onClick={() => handleApplyPreset('Science')} className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700/40">Science</button>
                    <button type="button" onClick={() => handleApplyPreset('Commerce')} className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700/40">Commerce</button>
                    <button type="button" onClick={() => handleApplyPreset('Humanities')} className="bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-700/40">Humanities</button>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {subjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-[#100e1c] p-2 rounded-xl border border-purple-900/40">
                      <span className="w-5 text-center font-bold text-gray-400">{idx + 1}</span>
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[idx].name = e.target.value;
                          setSubjects(updated);
                        }}
                        className="flex-1 bg-[#19162e] border border-purple-900/60 rounded-lg px-2.5 py-1 text-white text-xs"
                      />
                      <input
                        type="number"
                        value={sub.maxMarks}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[idx].maxMarks = parseInt(e.target.value) || 100;
                          setSubjects(updated);
                        }}
                        className="w-20 bg-[#19162e] border border-purple-900/60 rounded-lg px-2 py-1 text-white text-xs text-center font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => setSubjects(subjects.filter((_, i) => i !== idx))}
                        className="text-rose-400 hover:text-rose-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSubjects([...subjects, { name: 'New Subject', maxMarks: 100 }])}
                  className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ADD SUBJECT
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/30"
              >
                <Check className="w-4 h-4" />
                SAVE EXAM
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
