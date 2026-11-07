import React, { useState } from 'react';
import { Search, X, User, FileSpreadsheet, CalendarCheck } from 'lucide-react';
import { Student, Exam } from '../types';

interface GlobalSearchModalProps {
  students: Student[];
  exams: Exam[];
  onSelectStudent: (student: Student) => void;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  students,
  exams,
  onSelectStudent,
  onClose
}) => {
  const [query, setQuery] = useState('');

  const filteredStudents = students.filter(st => 
    st.fullName.toLowerCase().includes(query.toLowerCase()) ||
    st.rollNumber.toString().includes(query) ||
    st.admissionNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredExams = exams.filter(ex =>
    ex.examName.toLowerCase().includes(query.toLowerCase()) ||
    ex.examType.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4 pt-16">
      <div className="w-full max-w-lg bg-[#161426] border border-purple-800/50 rounded-3xl p-4 shadow-2xl relative space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-3 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student name, roll no, admission, exams..."
            className="w-full bg-[#100e1c] border border-purple-900/60 rounded-2xl pl-9 pr-9 py-2.5 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
          />
          <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10.5px] text-gray-400 px-1">
          Type to instantly search students, exams, and class records.
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
          {query && (
            <>
              {/* Students Matches */}
              <div>
                <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  STUDENTS ({filteredStudents.length})
                </div>
                {filteredStudents.map(st => (
                  <div
                    key={st.id}
                    onClick={() => {
                      onSelectStudent(st);
                      onClose();
                    }}
                    className="p-2.5 bg-[#100e1c] hover:bg-[#19162e] rounded-xl border border-purple-900/30 mb-1 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-white">Roll #{st.rollNumber} {st.fullName}</span>
                      <span className="text-[10px] text-gray-400 ml-2">Adm: {st.admissionNumber}</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-bold">View</span>
                  </div>
                ))}
              </div>

              {/* Exams Matches */}
              <div>
                <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  EXAMS ({filteredExams.length})
                </div>
                {filteredExams.map(ex => (
                  <div key={ex.id} className="p-2.5 bg-[#100e1c] rounded-xl border border-purple-900/30 mb-1 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{ex.examName}</span>
                      <span className="text-[10px] text-gray-400 ml-2">{ex.examType}</span>
                    </div>
                    <span className="text-[10px] text-cyan-400 font-bold">{ex.examDate}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
