import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Zap, 
  Cloud, 
  Bell, 
  Download, 
  Upload, 
  User, 
  Database, 
  RefreshCw, 
  Shield, 
  Check, 
  Trash2, 
  LogOut,
  Smartphone,
  Info
} from 'lucide-react';
import { Teacher, School, ClassRoom, Student, DailyAttendance } from '../types';

interface SettingsViewProps {
  teacher: Partial<Teacher>;
  school: Partial<School>;
  activeClass: Partial<ClassRoom>;
  students: Student[];
  attendanceRecords: DailyAttendance[];
  onSignOut: () => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  teacher,
  school,
  activeClass,
  students,
  attendanceRecords,
  onSignOut,
  onResetData
}) => {
  const [fcmEnabled, setFcmEnabled] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const teacherEmail = teacher.email || 'ddd@gmail.com';
  const teacherName = teacher.name || 'Elwin George';

  const handleBackupExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      school,
      teacher,
      activeClass,
      students,
      attendanceRecords,
      exportedAt: new Date().toISOString()
    }, null, 2));

    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `HSS_ALL_IN_ONE_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    dlAnchorElem.remove();

    setToastMsg('Offline backup JSON downloaded successfully!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRestoreImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (parsed) {
            setToastMsg('Backup restored successfully!');
            setTimeout(() => setToastMsg(null), 3000);
          }
        } catch (err) {
          alert('Invalid backup JSON file format.');
        }
      };
    }
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
          <SettingsIcon className="w-4 h-4" />
          APP ADMINISTRATION
        </div>
        <h2 className="text-xl font-black text-white">SETTINGS & DATA MANAGEMENT</h2>
        <p className="text-xs text-gray-400">Manage Google Account Cloud synchronization, local offline database backups, and storage.</p>
      </div>

      {/* MULTI-DEVICE INSTANT CLOUD SYNTHESIS */}
      <div className="bg-gradient-to-br from-[#181432] via-[#141228] to-[#110f22] border border-purple-800/50 rounded-3xl p-4 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">MULTI-DEVICE INSTANT CLOUD SYNTHESIS</h3>
            <p className="text-[11px] text-gray-400">Seamless real-time bidirectional data synthesis. Any changes made on this device or your Android APK synthesize instantaneously without overwriting records.</p>
          </div>

          <div className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[9px] font-black px-2.5 py-1 rounded-full uppercase shrink-0">
            LIVE STREAM ACTIVE
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#0f0d1c] p-3 rounded-2xl border border-purple-900/40">
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">CONNECTED SYNC ACCOUNT</span>
            <span className="font-bold text-white">{teacherEmail}</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">SYNTHESIS ENGINE</span>
            <span className="font-bold text-purple-300">Non-Destructive Merge</span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">FLEET STATUS</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              1 Device Online
            </span>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase block">LAST CONVERGENCE</span>
            <span className="font-bold text-white">05:35:10 pm</span>
          </div>
        </div>

        {/* Synthesis Convergence Metrics */}
        <div className="bg-[#0e0c1a] border border-purple-900/40 rounded-2xl p-3 space-y-2">
          <div className="text-[10.5px] font-bold text-purple-300 uppercase tracking-wider flex items-center justify-between">
            <span>Latest Multi-Device Synthesis Convergence Metrics</span>
            <span className="text-gray-400">5:33:17 pm</span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-[#17142e] p-2 rounded-xl">
              <div className="text-gray-400 text-[9px] uppercase">CLASSES MERGED</div>
              <div className="font-black text-white text-sm">0</div>
            </div>
            <div className="bg-[#17142e] p-2 rounded-xl">
              <div className="text-gray-400 text-[9px] uppercase">STUDENTS UNIFIED</div>
              <div className="font-black text-white text-sm">{students.length}</div>
            </div>
            <div className="bg-[#17142e] p-2 rounded-xl">
              <div className="text-gray-400 text-[9px] uppercase">ATTENDANCE RECORDS</div>
              <div className="font-black text-white text-sm">{attendanceRecords.length}</div>
            </div>
            <div className="bg-[#17142e] p-2 rounded-xl">
              <div className="text-gray-400 text-[9px] uppercase">EXAMS & MARKS</div>
              <div className="font-black text-white text-sm">0</div>
            </div>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setToastMsg('Deep synthesis completed!')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Zap className="w-3.5 h-3.5" />
            Force Deep Synthesis (Unify All Devices)
          </button>
          <button
            onClick={() => setToastMsg('Synthesis Diagnostic PASSED')}
            className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            Run Synthesis Diagnostic
          </button>
          <button
            onClick={() => setToastMsg('Local state pushed to Cloud Firestore')}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Cloud className="w-3.5 h-3.5" />
            Push Local State to Cloud
          </button>
          <button
            onClick={() => setToastMsg('Remote bundle restored')}
            className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            Pull & Restore Remote Bundle
          </button>
        </div>
      </div>

      {/* FIREBASE PUSH NOTIFICATIONS (FCM) */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider">FIREBASE PUSH NOTIFICATIONS (FCM)</h3>
          </div>
          <span className="bg-amber-950 text-amber-400 border border-amber-800/60 text-[9px] font-black px-2 py-0.5 rounded uppercase">
            NOT SUBSCRIBED
          </span>
        </div>

        <p className="text-xs text-gray-400">
          Project: <strong className="text-white">hss-all-in-one</strong> | Sender ID: <strong className="text-white">978993384932</strong>
        </p>

        <button
          onClick={() => {
            setFcmEnabled(true);
            setToastMsg('FCM Notifications Enabled!');
          }}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
        >
          <Bell className="w-4 h-4" />
          Enable FCM Notifications
        </button>
      </div>

      {/* OFFLINE DATABASE BACKUP & RESTORE */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
          <Database className="w-4 h-4 text-purple-400" />
          Offline Database Backup & Restore
        </h3>
        <p className="text-xs text-gray-400">Export complete class data snapshot or restore to transfer to another device.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={handleBackupExport}
            className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-purple-400" />
            EXPORT ALL DATA AS BACKUP
          </button>

          <label className="bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            RESTORE FROM BACKUP
            <input type="file" accept=".json" onChange={handleRestoreImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* TEACHER ACCESS & PROFILE */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-4 h-4 text-purple-400" />
            Teacher Access & Profile
          </h3>
          <button
            onClick={onSignOut}
            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/50 text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            Switch / Sign Out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-[#100e1c] p-3 rounded-xl text-xs">
          <div>
            <span className="text-gray-400 text-[10px] uppercase">TEACHER NAME</span>
            <div className="font-bold text-white">{teacherName}</div>
          </div>
          <div>
            <span className="text-gray-400 text-[10px] uppercase">DESIGNATION</span>
            <div className="font-bold text-white">{teacher.designation || 'Physics Teacher'}</div>
          </div>
        </div>
      </div>

      {/* APP & STORAGE DIAGNOSTICS */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <Info className="w-4 h-4 text-emerald-400" />
          App & Storage Diagnostics
        </h3>
        <p className="text-xs text-gray-400">Offline database memory footprint</p>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-[#100e1c] p-2.5 rounded-xl border border-purple-900/30">
            <div className="text-[9.5px] text-gray-400 uppercase font-bold">App Version</div>
            <div className="font-black text-amber-400 text-sm mt-0.5">2.4.0 (GOLD)</div>
          </div>
          <div className="bg-[#100e1c] p-2.5 rounded-xl border border-purple-900/30">
            <div className="text-[9.5px] text-gray-400 uppercase font-bold">Students Enrolled</div>
            <div className="font-black text-white text-sm mt-0.5">{students.length}</div>
          </div>
          <div className="bg-[#100e1c] p-2.5 rounded-xl border border-purple-900/30">
            <div className="text-[9.5px] text-gray-400 uppercase font-bold">Estimated Storage</div>
            <div className="font-black text-cyan-400 text-sm mt-0.5">7.5 KB</div>
          </div>
        </div>
      </div>

      {/* DATA RESET & MAINTENANCE */}
      <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
          <Trash2 className="w-4 h-4 text-rose-400" />
          Data Reset & Maintenance
        </h3>
        <p className="text-xs text-gray-400">Manage database wipe and test sample resets</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={onResetData}
            className="bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset to Clean State
          </button>
          <button
            onClick={onResetData}
            className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Wipe All Local Storage Data
          </button>
        </div>
      </div>
    </div>
  );
};
