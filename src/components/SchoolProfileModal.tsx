import React, { useState } from 'react';
import { Building2, X, Check, User, Edit3, Camera } from 'lucide-react';
import { School, Teacher, ClassRoom } from '../types';

interface SchoolProfileModalProps {
  school: Partial<School>;
  teacher: Partial<Teacher>;
  activeClass: Partial<ClassRoom>;
  onSave: (updatedSchool: School, updatedTeacher: Teacher, updatedClass: ClassRoom) => void;
  onClose: () => void;
}

export const SchoolProfileModal: React.FC<SchoolProfileModalProps> = ({
  school,
  teacher,
  activeClass,
  onSave,
  onClose
}) => {
  const [schoolData, setSchoolData] = useState({
    schoolName: school.schoolName || 'Gx',
    schoolCode: school.schoolCode || 'FC',
    address: school.address || 'e.g. Civil Station Road, Ernakulam, Kerala - 682030',
    phone: school.phone || '+91 484 2345678',
    email: school.email || 'joicegeorge1910@gmail.com',
    principalName: school.principalName || 'Principal',
    principalPhone: school.principalPhone || '+91 94471 23456'
  });

  const [classData, setClassData] = useState({
    standard: activeClass.standard || 'Class 12 (Plus Two)',
    stream: activeClass.stream || 'Bio-Science',
    section: activeClass.section || 'A',
    headerName: 'G G A',
    academicYear: activeClass.academicYear || '2025-2026'
  });

  const [teacherData, setTeacherData] = useState({
    name: teacher.name || 'Elwin George',
    designation: teacher.designation || 'Physics Teacher',
    phone: teacher.phone || '88',
    email: teacher.email || 'ddd@gmail.com',
    dob: teacher.dob || '2008-01-01'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSchool: School = {
      id: schoolData.schoolCode,
      schoolName: schoolData.schoolName,
      schoolCode: schoolData.schoolCode,
      address: schoolData.address,
      phone: schoolData.phone,
      email: schoolData.email,
      principalName: schoolData.principalName,
      principalPhone: schoolData.principalPhone,
      adminPin: school.adminPin || '1234',
      adminEmail: schoolData.email,
      createdAt: school.createdAt || new Date().toISOString()
    };

    const updatedTeacher: Teacher = {
      ...teacher as Teacher,
      name: teacherData.name,
      designation: teacherData.designation,
      phone: teacherData.phone,
      email: teacherData.email,
      dob: teacherData.dob
    };

    const updatedClass: ClassRoom = {
      ...activeClass as ClassRoom,
      standard: classData.standard,
      stream: classData.stream,
      section: classData.section,
      academicYear: classData.academicYear
    };

    onSave(updatedSchool, updatedTeacher, updatedClass);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
          <div>
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">INSTITUTIONAL SETUP</span>
            <h3 className="text-sm font-black text-white">SCHOOL & CLASS PROFILE</h3>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400">Configure school identification, class standard, stream, and class teacher details.</p>

        {/* SECTION 1: SCHOOL INFORMATION */}
        <div className="bg-[#100e1c] p-3.5 rounded-2xl border border-purple-900/40 space-y-3 text-xs">
          <div className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-400" />
            School Information
          </div>
          <p className="text-[10.5px] text-gray-400">Institutional branding used in official PDF reports</p>

          <div>
            <label className="block font-bold text-gray-300 mb-1">School Name *</label>
            <input
              type="text"
              required
              value={schoolData.schoolName}
              onChange={(e) => setSchoolData({ ...schoolData, schoolName: e.target.value })}
              className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1">School Address</label>
            <input
              type="text"
              value={schoolData.address}
              onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
              className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gray-300 mb-1">School Code *</label>
              <input
                type="text"
                required
                value={schoolData.schoolCode}
                onChange={(e) => setSchoolData({ ...schoolData, schoolCode: e.target.value })}
                className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white font-bold uppercase"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">School Phone</label>
              <input
                type="text"
                value={schoolData.phone}
                onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1">School Email</label>
            <input
              type="email"
              value={schoolData.email}
              onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
              className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-gray-300 mb-1">Principal Name</label>
              <input
                type="text"
                value={schoolData.principalName}
                onChange={(e) => setSchoolData({ ...schoolData, principalName: e.target.value })}
                className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-gray-300 mb-1">Principal Phone</label>
              <input
                type="text"
                value={schoolData.principalPhone}
                onChange={(e) => setSchoolData({ ...schoolData, principalPhone: e.target.value })}
                className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: CLASS TEACHER INFORMATION */}
        <div className="bg-[#100e1c] p-3.5 rounded-2xl border border-purple-900/40 space-y-3 text-xs">
          <div className="font-bold text-purple-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <User className="w-4 h-4 text-purple-400" />
            Class Teacher Information & Profile Photo
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1">Teacher Name *</label>
            <input
              type="text"
              required
              value={teacherData.name}
              onChange={(e) => setTeacherData({ ...teacherData, name: e.target.value })}
              className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-300 mb-1">Designation</label>
            <input
              type="text"
              value={teacherData.designation}
              onChange={(e) => setTeacherData({ ...teacherData, designation: e.target.value })}
              className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg"
          >
            <Check className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
};
