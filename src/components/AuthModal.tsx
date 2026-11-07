import React, { useState } from 'react';
import { 
  Building2, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  KeyRound,
  GraduationCap
} from 'lucide-react';
import { Teacher, School, Role, BlacklistedTeacher } from '../types';

interface AuthModalProps {
  onTeacherLogin: (teacher: Teacher) => void;
  onAdminLogin: (school: School) => void;
  blacklistedTeachers?: BlacklistedTeacher[];
  teachers?: Teacher[];
}

const AUTHORIZED_ADMIN_EMAILS = [
  'joicegeorge1910@gmail.com'
];

export const AuthModal: React.FC<AuthModalProps> = ({ 
  onTeacherLogin, 
  onAdminLogin,
  blacklistedTeachers = [],
  teachers = []
}) => {
  const [activeAuthTab, setActiveAuthTab] = useState<'signup' | 'login' | 'admin'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotRole, setForgotRole] = useState<'teacher' | 'admin'>('teacher');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Sign Up State
  const [signUpData, setSignUpData] = useState({
    name: 'Elwin George',
    dob: '2008-01-01',
    email: 'ddd@gmail.com',
    phone: '+91 98470 54321',
    schoolName: 'St.Sebastain\'s Higher Secondary School Koodaranhi',
    schoolCode: 'SSHSS@111213',
    academicYear: '2026-2027',
    subject: 'Computer Science',
    designation: 'Class Teacher',
    isClassTeacher: true,
    standard: 'Class 11 (Plus One)',
    stream: 'Computer-Science',
    section: 'E',
    pin: '1234'
  });

  // Login State
  const [loginData, setLoginData] = useState({
    emailOrPhone: 'ddd@gmail.com',
    schoolCode: 'SSHSS@111213',
    academicYear: '2026-2027',
    dob: '2008-01-01',
    pin: '1234'
  });

  // Admin Login State - Strictly Authorized Credentials
  const [adminLoginData, setAdminLoginData] = useState({
    email: 'joicegeorge1910@gmail.com',
    schoolCode: 'SSHSS@111213',
    designation: 'Principal',
    pin: 'joice1910'
  });

  const isBlacklisted = (email: string, schoolCode: string) => {
    return blacklistedTeachers.some(
      b => b.email.trim().toLowerCase() === email.trim().toLowerCase() && 
           b.schoolCode.trim().toUpperCase() === schoolCode.trim().toUpperCase()
    );
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const email = signUpData.email.trim();
    const sCode = signUpData.schoolCode.trim().toUpperCase();

    if (isBlacklisted(email, sCode)) {
      setAuthError(`Access Denied: Teacher "${email}" is permanently blacklisted for School Code "${sCode}". Account creation prohibited.`);
      return;
    }

    const newTeacher: Teacher = {
      id: `teacher_${Date.now()}`,
      name: signUpData.name || 'Elwin George',
      email: email || 'ddd@gmail.com',
      phone: signUpData.phone,
      dob: signUpData.dob,
      schoolCode: sCode || 'SSHSS@111213',
      schoolName: signUpData.schoolName || 'St.Sebastain\'s Higher Secondary School Koodaranhi',
      academicYear: signUpData.academicYear || '2026-2027',
      subject: signUpData.subject || 'Computer Science',
      designation: signUpData.designation || 'Class Teacher',
      isClassTeacher: signUpData.isClassTeacher,
      standard: signUpData.standard,
      stream: signUpData.stream,
      section: signUpData.section,
      pin: signUpData.pin,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    onTeacherLogin(newTeacher);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const inputEmail = loginData.emailOrPhone.trim().toLowerCase();
    const sCode = loginData.schoolCode.trim().toUpperCase();

    if (inputEmail.includes('@') && isBlacklisted(inputEmail, sCode)) {
      setAuthError(`Access Denied: Account "${inputEmail}" is permanently blacklisted under School Code "${sCode}".`);
      return;
    }

    // Check if teacher profile is deactivated
    const matchedTeacher = teachers.find(
      t => (t.email.trim().toLowerCase() === inputEmail || t.phone === inputEmail) &&
           t.schoolCode.trim().toUpperCase() === sCode
    );

    if (matchedTeacher && matchedTeacher.status === 'deactivated') {
      setAuthError(`Account Deactivated: Teacher account for "${inputEmail}" has been temporarily deactivated by School Admin.`);
      return;
    }

    if (matchedTeacher && matchedTeacher.status === 'permanently_deleted') {
      setAuthError(`Access Denied: Account for "${inputEmail}" has been permanently deleted.`);
      return;
    }

    const existingTeacher: Teacher = matchedTeacher || {
      id: 'teacher_1',
      name: signUpData.name || 'Elwin George',
      email: inputEmail.includes('@') ? inputEmail : 'ddd@gmail.com',
      phone: '+91 98470 54321',
      dob: loginData.dob || '2008-01-01',
      schoolCode: sCode || 'SSHSS@111213',
      schoolName: signUpData.schoolName || 'St.Sebastain\'s Higher Secondary School Koodaranhi',
      academicYear: loginData.academicYear || '2026-2027',
      subject: 'Computer Science',
      designation: 'Class Teacher',
      isClassTeacher: true,
      standard: 'Class 11 (Plus One)',
      stream: 'Computer-Science',
      section: 'E',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    onTeacherLogin(existingTeacher);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const adminEmail = adminLoginData.email.trim().toLowerCase();
    const adminCode = adminLoginData.schoolCode.trim().toUpperCase();
    const adminPin = adminLoginData.pin.trim();

    // STRICT PERMITTED ADMIN CHECK: Only joicegeorge1910@gmail.com with SSHSS@111213 and joice1910
    if (adminEmail !== 'joicegeorge1910@gmail.com') {
      setAuthError(`Access Denied: Only authorized Gmail "joicegeorge1910@gmail.com" can access the School Admin Panel.`);
      return;
    }

    if (adminCode !== 'SSHSS@111213') {
      setAuthError(`Access Denied: Invalid School Code "${adminCode}". Access requires School Code "SSHSS@111213".`);
      return;
    }

    if (adminPin !== 'joice1910') {
      setAuthError(`Access Denied: Incorrect password/PIN for administrator "${adminEmail}".`);
      return;
    }

    const adminSchool: School = {
      id: 'SSHSS@111213',
      schoolName: 'St.Sebastain\'s Higher Secondary School Koodaranhi',
      schoolCode: 'SSHSS@111213',
      address: 'Koodaranhi, Kozhikode, Kerala - 673604',
      phone: '+91 495 2200100',
      email: 'joicegeorge1910@gmail.com',
      principalName: 'Joice George',
      principalPhone: '+91 94471 23456',
      adminPin: 'joice1910',
      adminEmail: 'joicegeorge1910@gmail.com',
      createdAt: new Date().toISOString()
    };
    onAdminLogin(adminSchool);
  };

  return (
    <div className="min-h-screen bg-[#090812] text-gray-100 flex flex-col items-center justify-center p-3 relative overflow-y-auto">
      {/* Background Neon Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-[#141224] border border-purple-900/40 rounded-3xl p-5 shadow-2xl relative z-10 my-6">
        {/* Top Header Identity */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-700/50 text-purple-300 text-[10px] font-bold tracking-wider uppercase mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-purple-400" />
            HIGHER SECONDARY EDUCATION PORTAL
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              🏫
            </div>
            HSS ALL IN ONE
          </h1>

          <p className="text-xs text-purple-300/80 mt-1 max-w-xs mx-auto font-medium">
            Smart School & Class Management System for Higher Secondary Teachers & Administration
          </p>

          {/* Sync Pill */}
          <div className="mt-3 inline-flex items-center gap-2 bg-[#1b1933] border border-purple-800/40 rounded-2xl px-3 py-1.5 text-left max-w-sm">
            <div className="p-1 rounded-lg bg-purple-600/20 text-purple-400">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-white">
                Multi-Device Instant Sync Active
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                  REAL-TIME
                </span>
              </div>
              <div className="text-[9.5px] text-gray-400">
                Log in with the same email on any phone, tablet, or PC to access records seamlessly.
              </div>
            </div>
          </div>
        </div>

        {/* Auth Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-[#0d0c18] p-1 rounded-2xl border border-purple-900/30 mb-6">
          <button
            onClick={() => { setActiveAuthTab('signup'); setAuthError(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeAuthTab === 'signup'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TEACHER SIGN UP
          </button>
          <button
            onClick={() => { setActiveAuthTab('login'); setAuthError(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all ${
              activeAuthTab === 'login'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            TEACHER LOGIN
          </button>
          <button
            onClick={() => { setActiveAuthTab('admin'); setAuthError(null); }}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
              activeAuthTab === 'admin'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            SCHOOL ADMIN
          </button>
        </div>

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs flex items-start gap-2 shadow-lg animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{authError}</div>
            <button onClick={() => setAuthError(null)} className="text-rose-400 hover:text-white text-xs font-bold">✕</button>
          </div>
        )}

        {/* TAB 1: TEACHER SIGN UP */}
        {activeAuthTab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div className="bg-[#1a172e] p-3 rounded-2xl border border-purple-800/30">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 mb-2">
                <User className="w-4 h-4 text-purple-400" />
                Teacher Profile Registration & Multi-Device Linking
              </div>
              <p className="text-[10.5px] text-gray-400 mb-3">
                Set up your educator profile with your email to enable automatic multi-device synchronization.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Teacher Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={signUpData.name}
                    onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                    placeholder="e.g. Elwin George"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Date of Birth * <span className="text-[10px] text-gray-400">(e.g. DD/MM/YYYY or YYYY-MM-DD)</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={signUpData.dob}
                    onChange={(e) => setSignUpData({ ...signUpData, dob: e.target.value })}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Warning Banner */}
                <div className="flex items-start gap-2 bg-amber-950/40 border border-amber-600/40 rounded-xl p-2.5 text-[10.5px] text-amber-200">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    Do not use the original school code here. The school must create its own unique code and use that to log in to this portal.
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    Email Address * <span className="text-purple-400 font-normal">(Key for Multi-Device)</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="teacher@gmail.com"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    placeholder="+91 98470 54321"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">School / College Name *</label>
                  <input
                    type="text"
                    required
                    value={signUpData.schoolName}
                    onChange={(e) => setSignUpData({ ...signUpData, schoolName: e.target.value })}
                    placeholder="Enter your school name"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={signUpData.schoolCode}
                    onChange={(e) => setSignUpData({ ...signUpData, schoolCode: e.target.value })}
                    placeholder="# ENTER YOUR SCHOOL CODE"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-bold tracking-wider uppercase focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">Academic Year *</label>
                    <input
                      type="text"
                      required
                      value={signUpData.academicYear}
                      onChange={(e) => setSignUpData({ ...signUpData, academicYear: e.target.value })}
                      placeholder="e.g. 2025-2026"
                      className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-300 mb-1">Subject Assigned *</label>
                    <input
                      type="text"
                      required
                      value={signUpData.subject}
                      onChange={(e) => setSignUpData({ ...signUpData, subject: e.target.value })}
                      placeholder="Physics"
                      className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Class Details */}
                <div className="bg-[#121021] p-3 rounded-xl border border-purple-900/40 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isClassTeacher"
                      checked={signUpData.isClassTeacher}
                      onChange={(e) => setSignUpData({ ...signUpData, isClassTeacher: e.target.checked })}
                      className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                    />
                    <label htmlFor="isClassTeacher" className="text-xs font-bold text-purple-200">
                      I am a Class Teacher
                    </label>
                  </div>

                  {signUpData.isClassTeacher && (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Standard</label>
                        <select
                          value={signUpData.standard}
                          onChange={(e) => setSignUpData({ ...signUpData, standard: e.target.value })}
                          className="w-full bg-[#19162c] border border-purple-900/60 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="Class 12 (Plus Two)">Class 12 (Plus Two)</option>
                          <option value="Class 11 (Plus One)">Class 11 (Plus One)</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 9">Class 9</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Stream</label>
                        <select
                          value={signUpData.stream}
                          onChange={(e) => setSignUpData({ ...signUpData, stream: e.target.value })}
                          className="w-full bg-[#19162c] border border-purple-900/60 rounded-lg p-1.5 text-xs text-white"
                        >
                          <option value="Bio-Science">Bio-Science</option>
                          <option value="Computer-Science">Computer-Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Humanities">Humanities</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-0.5">Section</label>
                        <input
                          type="text"
                          value={signUpData.section}
                          onChange={(e) => setSignUpData({ ...signUpData, section: e.target.value })}
                          placeholder="A"
                          className="w-full bg-[#19162c] border border-purple-900/60 rounded-lg p-1.5 text-xs text-white uppercase text-center"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">Create Password / Access PIN *</label>
                  <input
                    type="password"
                    required
                    value={signUpData.pin}
                    onChange={(e) => setSignUpData({ ...signUpData, pin: e.target.value })}
                    placeholder="Create a 4+ character password"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs"
            >
              CREATE TEACHER ACCOUNT & ENABLE SYNC
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 2: TEACHER LOGIN */}
        {activeAuthTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="bg-[#1a172e] p-4 rounded-2xl border border-purple-800/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 mb-1">
                <Lock className="w-4 h-4 text-purple-400" />
                Teacher Portal Sign In
              </div>
              <p className="text-[10.5px] text-gray-400 mb-3">
                Log in with your registered email to synchronize your records across all devices.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">Registered Email Address or Phone *</label>
                <input
                  type="text"
                  required
                  value={loginData.emailOrPhone}
                  onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
                  placeholder="teacher.hss@gmail.com or +91..."
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">School Code *</label>
                  <input
                    type="text"
                    required
                    value={loginData.schoolCode}
                    onChange={(e) => setLoginData({ ...loginData, schoolCode: e.target.value })}
                    placeholder="# FC"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white font-bold uppercase focus:border-purple-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={loginData.academicYear}
                    onChange={(e) => setLoginData({ ...loginData, academicYear: e.target.value })}
                    placeholder="2025-2026"
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={loginData.dob}
                  onChange={(e) => setLoginData({ ...loginData, dob: e.target.value })}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">Password / PIN *</label>
                <input
                  type="password"
                  required
                  value={loginData.pin}
                  onChange={(e) => setLoginData({ ...loginData, pin: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none text-xs"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotRole('teacher');
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                >
                  Forgot Password? Reset via Email
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs"
            >
              SIGN IN & SYNC MULTI-DEVICE DATA
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TAB 3: SCHOOL ADMIN PORTAL */}
        {activeAuthTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="space-y-4">
            <div className="bg-[#1f1912] p-4 rounded-2xl border border-amber-800/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                School Administrator Portal Authentication
              </div>
              <p className="text-[10.5px] text-amber-200/70 mb-2">
                Accessible ONLY to authorized Gmail accounts verified by backend authentication.
              </p>

              {/* Authorized Gmail Accounts Badge Display */}
              <div className="bg-[#14100b] border border-amber-900/50 p-2.5 rounded-xl text-[10.5px]">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Permitted Authorized Admin Gmail Accounts:
                </div>
                <div className="flex flex-wrap gap-1">
                  {AUTHORIZED_ADMIN_EMAILS.map(email => (
                    <button
                      key={email}
                      type="button"
                      onClick={() => setAdminLoginData(prev => ({ ...prev, email }))}
                      className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-mono transition-colors"
                    >
                      {email}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-100 mb-1">School Gmail Address *</label>
                <input
                  type="email"
                  required
                  value={adminLoginData.email}
                  onChange={(e) => setAdminLoginData({ ...adminLoginData, email: e.target.value })}
                  placeholder="e.g. principal.ghss@gmail.com"
                  className="w-full bg-[#14100b] border border-amber-900/60 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-100 mb-1">
                  School Code * <span className="text-amber-400 font-normal float-right">Unique Institutional ID</span>
                </label>
                <input
                  type="text"
                  required
                  value={adminLoginData.schoolCode}
                  onChange={(e) => setAdminLoginData({ ...adminLoginData, schoolCode: e.target.value })}
                  placeholder="# ENTER YOUR SCHOOL CODE"
                  className="w-full bg-[#14100b] border border-amber-900/60 rounded-xl px-3 py-2 text-amber-200 font-bold uppercase tracking-wider focus:border-amber-500 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-100 mb-1">Head of School Designation *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Principal', 'Headmaster', 'Headmistress'].map((desig) => (
                    <button
                      key={desig}
                      type="button"
                      onClick={() => setAdminLoginData({ ...adminLoginData, designation: desig })}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                        adminLoginData.designation === desig
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-[#14100b] text-amber-300 border-amber-900/50 hover:bg-amber-950/40'
                      }`}
                    >
                      {desig}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-100 mb-1">
                  Password * <span className="text-amber-400/80 font-normal float-right">Firebase Auth Managed</span>
                </label>
                <input
                  type="password"
                  required
                  value={adminLoginData.pin}
                  onChange={(e) => setAdminLoginData({ ...adminLoginData, pin: e.target.value })}
                  placeholder="Enter School Admin Password"
                  className="w-full bg-[#14100b] border border-amber-900/60 rounded-xl px-3 py-2 text-white focus:border-amber-500 focus:outline-none text-xs"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotRole('admin');
                    setShowForgotModal(true);
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Forgot Password? Reset via Email
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-2xl shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider text-xs"
            >
              LOG IN TO SCHOOL ADMIN PORTAL
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative">
            <div className="flex items-center gap-2 text-sm font-bold text-purple-300 mb-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
              Forgot Password? Secure Account Recovery
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Recover your account safely using Firebase Authentication. Enter your registered email address to receive an official password reset link.
            </p>

            {forgotSent ? (
              <div className="bg-emerald-950/40 border border-emerald-600/40 rounded-2xl p-4 text-center space-y-2">
                <div className="text-emerald-400 font-bold text-sm">Reset Link Sent Successfully!</div>
                <p className="text-xs text-gray-300">
                  Please check your inbox at <span className="text-white font-bold">{forgotEmail}</span> to complete password reset.
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="mt-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2 px-4 rounded-xl"
                >
                  CLOSE & RETURN
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Select Account Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotRole('teacher')}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        forgotRole === 'teacher'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-[#100e1c] text-gray-400 border-purple-900/40'
                      }`}
                    >
                      Teacher Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotRole('admin')}
                      className={`py-2 text-xs font-bold rounded-xl border ${
                        forgotRole === 'admin'
                          ? 'bg-amber-600 text-white border-amber-500'
                          : 'bg-[#100e1c] text-gray-400 border-purple-900/40'
                      }`}
                    >
                      School Administrator
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">Registered Email Address *</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder={forgotRole === 'admin' ? 'principal.ghss@gmail.com' : 'teacher.hss@gmail.com'}
                    className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/30 text-[10.5px] text-purple-200">
                  Firebase Authentication will email a secure, single-use password reset link.
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-3 rounded-xl text-xs"
                  >
                    CANCEL & RETURN
                  </button>
                  <button
                    type="button"
                    onClick={() => setForgotSent(true)}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1"
                  >
                    SEND RESET LINK
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
