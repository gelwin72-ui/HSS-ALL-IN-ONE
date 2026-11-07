import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart2, 
  User, 
  BookOpen, 
  Award, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Student, Exam, MarkRecord } from '../types';

interface TrajectoryViewProps {
  students: Student[];
  exams: Exam[];
  marks: MarkRecord[];
}

export const TrajectoryView: React.FC<TrajectoryViewProps> = ({
  students,
  exams,
  marks
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'student' | 'class'>('student');

  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const studentMarks = marks.filter(m => m.studentId === selectedStudent?.id);

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">
          <TrendingUp className="w-4 h-4" />
          PERFORMANCE ANALYTICS
        </div>
        <h2 className="text-xl font-black text-white">EXAM PROGRESS & TRAJECTORY</h2>
        <p className="text-xs text-gray-400">Track student improvement, multi-terminal comparisons, and subject growth charts.</p>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex border-b border-purple-900/40">
        <button
          onClick={() => setActiveSubTab('student')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'student'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Student Trajectory
        </button>
        <button
          onClick={() => setActiveSubTab('class')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'class'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Class Exam Comparison
        </button>
      </div>

      {/* SUB TAB 1: STUDENT TRAJECTORY */}
      {activeSubTab === 'student' && (
        <div className="space-y-4">
          {/* Select Student Selector */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-400" />
              Select Student to Analyze
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-xs text-white font-bold focus:border-purple-500 focus:outline-none"
            >
              {students.map(st => (
                <option key={st.id} value={st.id}>
                  Roll #{st.rollNumber} — {st.fullName} ({st.admissionNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Academic Trajectory Across Examinations */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider">
              Academic Trajectory Across Examinations — {selectedStudent?.fullName}
            </h3>

            {exams.length === 0 ? (
              <div className="bg-[#100e1c] rounded-2xl p-8 text-center text-gray-400 space-y-1">
                <BarChart2 className="w-8 h-8 mx-auto text-purple-400/40" />
                <div className="text-sm font-bold text-white">No Exam Records</div>
                <p className="text-xs">No examination scores entered for this student yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map(ex => {
                  const mRec = studentMarks.find(m => m.examId === ex.id);
                  const pct = mRec ? mRec.percentage : 0;

                  return (
                    <div key={ex.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">{ex.examName}</div>
                          <div className="text-[10px] text-gray-400">{ex.examDate} • {ex.examType}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-cyan-400">{pct.toFixed(1)}%</span>
                          <span className="bg-rose-950 text-rose-300 border border-rose-800/60 text-[10px] font-black px-2 py-0.5 rounded">
                            Grade {mRec ? mRec.grade : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-[#100e1c] h-2 rounded-full overflow-hidden border border-purple-900/40">
                        <div 
                          className="bg-gradient-to-r from-purple-600 to-cyan-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Subject Marks Breakdown */}
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-400" />
              Subject Marks Breakdown by Examination
            </h3>

            {exams.map(ex => {
              const mRec = studentMarks.find(m => m.examId === ex.id);
              return (
                <div key={ex.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-purple-900/30">
                    <span className="text-xs font-bold text-white">{ex.examName}</span>
                    <span className="text-xs font-bold text-purple-300">Total: {mRec?.totalMarks || 0} / {mRec?.maxTotalMarks || 600}</span>
                  </div>

                  <div className="space-y-1.5">
                    {ex.subjects.map(s => {
                      const score = mRec?.subjectMarks?.[s.name];
                      return (
                        <div key={s.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#100e1c]">
                          <span className="text-gray-300 font-medium">{s.name}</span>
                          <span className="font-bold text-white">
                            {score === undefined ? '-' : score === 'AB' ? 'Absent' : `${score} / ${s.maxMarks}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB TAB 2: CLASS EXAM COMPARISON */}
      {activeSubTab === 'class' && (
        <div className="space-y-4">
          <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
            <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Class Performance Trend Across All Examinations
            </h3>

            {exams.length === 0 ? (
              <div className="bg-[#100e1c] rounded-2xl p-8 text-center text-gray-400 space-y-1">
                <BarChart2 className="w-8 h-8 mx-auto text-purple-400/40" />
                <div className="text-sm font-bold text-white">No Examinations Conducted</div>
                <p className="text-xs">Conduct terminal examinations to view overall class averages.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((ex, idx) => (
                  <div key={ex.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">EXAM {idx + 1}</div>
                        <div className="text-sm font-black text-white">{ex.examName}</div>
                      </div>

                      <span className="bg-purple-950 text-purple-300 border border-purple-700/50 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {ex.examType}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-[#100e1c] p-2.5 rounded-xl text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Class Average</div>
                        <div className="text-xl font-black text-cyan-400">0%</div>
                      </div>
                      <div className="bg-[#100e1c] p-2.5 rounded-xl text-center">
                        <div className="text-[10px] text-gray-400 font-bold uppercase">Pass Rate</div>
                        <div className="text-xl font-black text-emerald-400">0%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
