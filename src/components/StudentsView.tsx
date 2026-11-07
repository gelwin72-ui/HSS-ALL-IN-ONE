import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Upload, 
  Download, 
  Search, 
  SortAsc, 
  Phone, 
  User, 
  Calendar, 
  Droplet, 
  MapPin, 
  FileText, 
  Camera, 
  X, 
  Check, 
  Edit3, 
  Eye 
} from 'lucide-react';
import { Student, ClassRoom, Gender, BloodGroup } from '../types';

interface StudentsViewProps {
  students: Student[];
  activeClass: Partial<ClassRoom>;
  onAddStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  onUpdateStudent: (id: string, data: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  activeClass,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'roll' | 'name'>('roll');
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'import'>('list');

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    rollNumber: (students.length + 1).toString(),
    admissionNumber: `ADM-2025-00${students.length + 1}`,
    fullName: '',
    studentPhone: '+91 ',
    parentName: '',
    parentPhone: '+91 ',
    gender: 'Male' as Gender,
    dob: '2008-01-01',
    bloodGroup: 'O+' as BloodGroup,
    address: '',
    notes: '',
    photo: ''
  });

  const className = activeClass ? `${activeClass.standard || ''} ${activeClass.stream || ''} ${activeClass.section || ''}`.trim() || 'G G A' : 'G G A';

  const filteredStudents = students
    .filter(st => 
      st.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.rollNumber.toString().includes(searchQuery) ||
      st.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'roll') return a.rollNumber - b.rollNumber;
      return a.fullName.localeCompare(b.fullName);
    });

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    onAddStudent({
      schoolCode: activeClass.schoolCode || 'FC',
      classId: activeClass.id || 'class_1',
      rollNumber: parseInt(formData.rollNumber) || 1,
      admissionNumber: formData.admissionNumber || `ADM-2025-00${students.length + 1}`,
      fullName: formData.fullName || 'New Student',
      studentPhone: formData.studentPhone,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      gender: formData.gender,
      dob: formData.dob,
      bloodGroup: formData.bloodGroup,
      address: formData.address,
      notes: formData.notes,
      photo: formData.photo
    });

    // Reset
    setFormData({
      rollNumber: (students.length + 2).toString(),
      admissionNumber: `ADM-2025-00${students.length + 2}`,
      fullName: '',
      studentPhone: '+91 ',
      parentName: '',
      parentPhone: '+91 ',
      gender: 'Male',
      dob: '2008-01-01',
      bloodGroup: 'O+',
      address: '',
      notes: '',
      photo: ''
    });
    setActiveTab('list');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    onUpdateStudent(editingStudent.id, {
      rollNumber: editingStudent.rollNumber,
      admissionNumber: editingStudent.admissionNumber,
      fullName: editingStudent.fullName,
      studentPhone: editingStudent.studentPhone,
      parentName: editingStudent.parentName,
      parentPhone: editingStudent.parentPhone,
      gender: editingStudent.gender,
      dob: editingStudent.dob,
      bloodGroup: editingStudent.bloodGroup,
      address: editingStudent.address,
      notes: editingStudent.notes
    });
    setEditingStudent(null);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Roll No,Admission No,Full Name,Gender,Blood Group,Parent Name,Parent Phone,Student Phone"]
        .concat(students.map(s => `${s.rollNumber},${s.admissionNumber},"${s.fullName}",${s.gender},${s.bloodGroup},"${s.parentName}",${s.parentPhone},${s.studentPhone}`))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Students_Roster_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
          <Users className="w-4 h-4" />
          STUDENT DIRECTORY
        </div>
        <h2 className="text-xl font-black text-white">STUDENT MANAGEMENT</h2>
        <p className="text-xs text-gray-400">Total {students.length} students enrolled in {className}</p>

        {/* Action Buttons Top Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <button
            onClick={() => setActiveTab('add')}
            className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2.5 px-3 rounded-xl shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            ADD STUDENT
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className="flex items-center justify-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
          >
            <Upload className="w-4 h-4 text-purple-400" />
            IMPORT SVG / CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            EXPORT CSV
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
          >
            <Download className="w-4 h-4 text-purple-400" />
            EXPORT SVG
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-purple-900/40">
        <button
          onClick={() => setActiveTab('list')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          REGISTERED STUDENTS ({students.length})
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'add'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          + ADD STUDENT
        </button>
      </div>

      {/* TAB 1: LIST */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          {/* Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name, roll number, admission..."
                className="w-full bg-[#141224] border border-purple-900/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSortBy(sortBy === 'roll' ? 'name' : 'roll')}
                className="bg-[#141224] border border-purple-900/40 text-purple-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#1a172e]"
              >
                <SortAsc className="w-4 h-4" />
                Sort: {sortBy === 'roll' ? 'Roll Number' : 'Name'}
              </button>
            </div>
          </div>

          {/* Students Roster List */}
          {filteredStudents.length === 0 ? (
            <div className="bg-[#141224] border border-purple-900/30 rounded-2xl p-8 text-center text-gray-400 space-y-2">
              <User className="w-10 h-10 mx-auto text-purple-500/40" />
              <div className="text-sm font-bold text-white">No Students Found</div>
              <p className="text-xs">Add a student using the '+ ADD STUDENT' button above.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredStudents.map((st) => (
                <div
                  key={st.id}
                  className="bg-[#141224] hover:bg-[#1a172e] border border-purple-900/40 rounded-2xl p-3.5 shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Roll Number Circle */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                      {st.rollNumber}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{st.fullName}</h4>
                        <span className="bg-rose-950/80 text-rose-400 border border-rose-800/50 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                          {st.bloodGroup}
                        </span>
                        <span className="bg-blue-950/80 text-blue-400 border border-blue-800/50 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                          {st.gender}
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-400 font-medium">
                        Adm: <span className="text-purple-300 font-bold">{st.admissionNumber}</span>
                      </div>

                      {(st.studentPhone || st.parentPhone) && (
                        <div className="flex flex-wrap items-center gap-3 text-[10.5px] text-gray-400 pt-0.5">
                          {st.studentPhone && (
                            <span className="flex items-center gap-1">
                              📞 Student: <span className="text-white font-semibold">{st.studentPhone}</span>
                            </span>
                          )}
                          {st.parentName && (
                            <span className="flex items-center gap-1">
                              👨‍👩‍👦 Parent: <span className="text-white font-semibold">{st.parentName} ({st.parentPhone})</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => setSelectedStudent(st)}
                      className="bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/50 text-[11px] font-bold px-2.5 py-1.5 rounded-xl flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Profile
                    </button>
                    <button
                      onClick={() => setEditingStudent(st)}
                      className="p-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 rounded-xl"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ADD STUDENT FORM */}
      {activeTab === 'add' && (
        <form onSubmit={handleSaveNew} className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
            <div className="flex items-center gap-2 text-sm font-bold text-white">
              <Plus className="w-4 h-4 text-purple-400" />
              Add New Student
            </div>
            <button type="button" onClick={() => setActiveTab('list')} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Photo placeholder */}
          <div className="text-center p-3 bg-[#19162e] rounded-xl border border-dashed border-purple-800/50">
            <Camera className="w-6 h-6 mx-auto text-purple-400 mb-1" />
            <div className="text-xs font-bold text-purple-300">STUDENT PROFILE PHOTO</div>
            <p className="text-[10px] text-gray-400">Upload an image file for this student record.</p>
            <div className="mt-2 flex justify-center gap-2">
              <button type="button" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-lg">
                Take Photo
              </button>
              <button type="button" className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded-lg">
                Upload Image
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-bold text-gray-300 mb-1">Roll Number *</label>
              <input
                type="number"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Admission Number *</label>
              <input
                type="text"
                required
                value={formData.admissionNumber}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Aadhavan Nair"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Student Phone Number</label>
              <input
                type="text"
                value={formData.studentPhone}
                onChange={(e) => setFormData({ ...formData, studentPhone: e.target.value })}
                placeholder="+91 98471 23456"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Parent / Guardian Name</label>
              <input
                type="text"
                value={formData.parentName}
                onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                placeholder="e.g. K. V. Nair"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Parent Phone Number</label>
              <input
                type="text"
                value={formData.parentPhone}
                onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                placeholder="+91 98471 23450"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as BloodGroup })}
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-300 mb-1">Address</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="House Name, Street, Town, District"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg shadow-emerald-600/30"
            >
              <Check className="w-4 h-4" />
              SAVE STUDENT
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: IMPORT MODAL */}
      {activeTab === 'import' && (
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
            <div className="text-sm font-bold text-white">IMPORT STUDENTS FROM PDF / SVG / CSV</div>
            <button onClick={() => setActiveTab('list')} className="text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-[#1a172e] p-3.5 rounded-xl border border-purple-800/40">
              <div className="text-xs font-bold text-purple-300 mb-1">IMPORT PDF DOCUMENT</div>
              <p className="text-[11px] text-gray-400 mb-3">Upload a PDF student register or class list. Text & tables are parsed.</p>
              <button type="button" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload & Parse PDF
              </button>
            </div>

            <div className="bg-[#1a172e] p-3.5 rounded-xl border border-purple-800/40">
              <div className="text-xs font-bold text-purple-300 mb-1">IMPORT SVG REGISTER</div>
              <p className="text-[11px] text-gray-400 mb-3">Upload an SVG student roster or exported register with contact details.</p>
              <button type="button" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload & Parse SVG
              </button>
            </div>

            <div className="bg-[#1a172e] p-3.5 rounded-xl border border-purple-800/40">
              <div className="text-xs font-bold text-purple-300 mb-1">IMPORT CSV FILE</div>
              <p className="text-[11px] text-gray-400 mb-3">Upload a standard spreadsheet (.csv) containing columns for Roll No, Name, Phone, and Parent details.</p>
              <button type="button" className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload & Parse CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE DETAILS MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  {selectedStudent.rollNumber}
                </div>
                <div>
                  <h3 className="text-base font-black text-white">{selectedStudent.fullName}</h3>
                  <div className="text-[10px] text-purple-300">Roll #{selectedStudent.rollNumber} • Adm: {selectedStudent.admissionNumber}</div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Call Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedStudent.studentPhone}`}
                className="bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-900/80"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Call Student ({selectedStudent.studentPhone || 'N/A'})
              </a>
              <a
                href={`tel:${selectedStudent.parentPhone}`}
                className="bg-purple-950/80 border border-purple-600/40 text-purple-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-purple-900/80"
              >
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                Call Parent ({selectedStudent.parentPhone || 'N/A'})
              </a>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-2 bg-[#100e1c] p-3 rounded-2xl border border-purple-900/40 text-xs">
              <div>
                <span className="text-gray-400 text-[10px] uppercase">Gender</span>
                <div className="font-bold text-white uppercase">{selectedStudent.gender}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase">Date of Birth</span>
                <div className="font-bold text-white">{selectedStudent.dob}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase">Blood Group</span>
                <div className="font-bold text-rose-400">{selectedStudent.bloodGroup}</div>
              </div>
              <div>
                <span className="text-gray-400 text-[10px] uppercase">Parent / Guardian</span>
                <div className="font-bold text-white">{selectedStudent.parentName || 'N/A'}</div>
              </div>
            </div>

            {/* Attendance Summary */}
            <div className="bg-[#121021] p-3 rounded-2xl border border-purple-900/30 text-center">
              <div className="text-[10.5px] font-bold text-purple-300 uppercase tracking-wider mb-1">ATTENDANCE SUMMARY</div>
              <div className="text-xl font-black text-emerald-400">100%</div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-[10px]">
                <div className="bg-[#18152c] p-1.5 rounded-lg">
                  <div className="text-gray-400">Working Days</div>
                  <div className="font-bold text-white">0</div>
                </div>
                <div className="bg-[#18152c] p-1.5 rounded-lg">
                  <div className="text-gray-400">Present</div>
                  <div className="font-bold text-emerald-400">0</div>
                </div>
                <div className="bg-[#18152c] p-1.5 rounded-lg">
                  <div className="text-gray-400">Absent</div>
                  <div className="font-bold text-rose-400">0</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingStudent(selectedStudent);
                  setSelectedStudent(null);
                }}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Edit Details
              </button>
              <button
                onClick={() => setSelectedStudent(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveEdit} className="w-full max-w-lg bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
              <div className="text-sm font-bold text-white">Edit Student: {editingStudent.fullName}</div>
              <button type="button" onClick={() => setEditingStudent(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-300 mb-1">Roll Number *</label>
                <input
                  type="number"
                  required
                  value={editingStudent.rollNumber}
                  onChange={(e) => setEditingStudent({ ...editingStudent, rollNumber: parseInt(e.target.value) || 1 })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Admission Number *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.admissionNumber}
                  onChange={(e) => setEditingStudent({ ...editingStudent, admissionNumber: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-bold text-gray-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingStudent.fullName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Student Phone Number</label>
                <input
                  type="text"
                  value={editingStudent.studentPhone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, studentPhone: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Parent / Guardian Name</label>
                <input
                  type="text"
                  value={editingStudent.parentName}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentName: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-gray-300 mb-1">Parent Phone Number</label>
                <input
                  type="text"
                  value={editingStudent.parentPhone}
                  onChange={(e) => setEditingStudent({ ...editingStudent, parentPhone: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                SAVE STUDENT
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
