import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Plus, 
  Check, 
  FolderCheck, 
  Users,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { ClassRoom } from '../types';

interface ClassModalProps {
  classes: ClassRoom[];
  activeClass: Partial<ClassRoom>;
  onSelectClass: (c: ClassRoom) => void;
  onCreateClass: (c: ClassRoom) => void;
  onDeleteClass?: (classId: string) => void;
  onClose: () => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  classes,
  activeClass,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'directory'>('directory');
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    standard: 'Class 11 (Plus One)',
    stream: 'Commerce',
    section: 'Division B',
    academicYear: '2025-2026'
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: ClassRoom = {
      id: `class_${Date.now()}`,
      schoolCode: activeClass.schoolCode || 'FC',
      standard: formData.standard,
      stream: formData.stream,
      section: formData.section,
      academicYear: formData.academicYear,
      teacherId: activeClass.teacherId || 'teacher_1',
      teacherName: activeClass.teacherName || 'Elwin George',
      createdAt: new Date().toISOString()
    };
    onCreateClass(newClass);
    setActiveTab('directory');
  };

  const confirmDelete = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingClassId(classId);
  };

  const handleDeleteExecute = () => {
    if (deletingClassId && onDeleteClass) {
      onDeleteClass(deletingClassId);
      setDeletingClassId(null);
    }
  };

  const classToDelete = classes.find(c => c.id === deletingClassId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Building2 className="w-4 h-4 text-purple-400" />
            CREATE ADDITIONAL CLASS & ROSTER
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-[#0d0c18] p-1 rounded-xl border border-purple-900/30 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'create' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            + ADD NEW CLASS
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-1.5 font-bold rounded-lg transition-all ${
              activeTab === 'directory' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            My Classes Directory ({classes.length})
          </button>
        </div>

        {/* TAB 1: CREATE CLASS */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-3 text-xs">
            <div className="bg-[#100e1c] p-3 rounded-2xl border border-purple-900/40 space-y-3">
              <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">
                STEP 1: CLASS INFORMATION
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">STANDARD / LEVEL *</label>
                <select
                  value={formData.standard}
                  onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Class 11 (Plus One)">Class 11 (Plus One)</option>
                  <option value="Class 12 (Plus Two)">Class 12 (Plus Two)</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 9">Class 9</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">STREAM / COURSE *</label>
                <select
                  value={formData.stream}
                  onChange={(e) => setFormData({ ...formData, stream: e.target.value })}
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Commerce">Commerce</option>
                  <option value="Bio-Science">Bio-Science</option>
                  <option value="Computer-Science">Computer-Science</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">SECTION / DIVISION *</label>
                <select
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white font-bold"
                >
                  <option value="Division B">Division B</option>
                  <option value="Section A">Section A</option>
                  <option value="Section C">Section C</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">ACADEMIC YEAR *</label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-2xl shadow-lg uppercase tracking-wider text-xs flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              SAVE AS NEW SEPARATE CLASS
            </button>
          </form>
        )}

        {/* TAB 2: MY CLASSES DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-3 text-xs">
            <div className="text-gray-400 text-[11px]">
              Switch your active working class with one click, or delete unnecessary classes from catalog.
            </div>

            <div className="space-y-2">
              {classes.map((c) => {
                const isSelected = activeClass?.id === c.id || (activeClass?.standard === c.standard && activeClass?.section === c.section);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectClass(c);
                      onClose();
                    }}
                    className={`border rounded-2xl p-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1b1735] border-purple-500 shadow-md'
                        : 'bg-[#100e1c] border-purple-900/30 hover:border-purple-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-black text-white">{c.standard} {c.stream} {c.section}</div>
                        <div className="text-[10.5px] text-gray-400">{c.academicYear || '2025-2026'} • {c.teacherName || 'Elwin George'}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSelected ? (
                          <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Active Class
                          </span>
                        ) : (
                          <span className="text-purple-400 font-bold hover:underline">Select</span>
                        )}

                        {onDeleteClass && (
                          <button
                            type="button"
                            onClick={(e) => confirmDelete(c.id, e)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 transition-colors"
                            title="Delete Classroom"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('create')}
              className="w-full bg-[#19162e] hover:bg-[#201d3b] text-purple-300 border border-purple-800/40 font-bold py-2.5 rounded-xl flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
              + Create Another Additional Class
            </button>
          </div>
        )}

        {/* Delete Classroom Confirmation Modal */}
        {deletingClassId && classToDelete && (
          <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#181226] border border-rose-800/60 rounded-3xl p-5 shadow-2xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-black text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                Confirm Classroom Deletion
              </div>
              <p className="text-xs text-gray-300">
                Are you sure you want to delete <strong className="text-white">{classToDelete.standard} {classToDelete.stream} {classToDelete.section}</strong>?
              </p>
              <p className="text-[11px] text-rose-300/80 bg-rose-950/50 p-2.5 rounded-xl border border-rose-900/40">
                This will permanently remove this classroom and its associated student records, attendance, and exam marks. Other classrooms remain unaffected.
              </p>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingClassId(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 px-3 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteExecute}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Classroom
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
