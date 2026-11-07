import React from 'react';
import { 
  Building2, 
  RotateCw, 
  Search, 
  Bell, 
  ChevronDown,
  LogOut,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { School, Teacher, ClassRoom, Role } from '../types';

interface HeaderProps {
  school: Partial<School>;
  teacher: Partial<Teacher>;
  activeClass: Partial<ClassRoom>;
  role: Role;
  onOpenClassModal: () => void;
  onOpenReminders: () => void;
  onOpenSearch: () => void;
  onSync: () => void;
  isSyncing: boolean;
  onLogOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  school,
  teacher,
  activeClass,
  role,
  onOpenClassModal,
  onOpenReminders,
  onOpenSearch,
  onSync,
  isSyncing,
  onLogOut
}) => {
  const displayClassName = activeClass 
    ? `${activeClass.standard || ''} ${activeClass.stream || ''} ${activeClass.section || ''}`.trim() || 'GGA'
    : teacher.standard ? `${teacher.standard} ${teacher.section}` : 'GGA';

  const schoolCode = school.schoolCode || teacher.schoolCode || 'FC';

  return (
    <header className="sticky top-0 z-40 bg-[#0d0c14]/90 backdrop-blur-md border-b border-purple-900/20 px-3 py-2.5 flex items-center justify-between shadow-lg">
      {/* Left: Active Class / School Dropdown Button */}
      <button 
        onClick={onOpenClassModal}
        className="flex items-center gap-2 bg-[#1a1829] hover:bg-[#221f36] border border-purple-800/40 rounded-full px-3 py-1.5 transition-all text-left group"
      >
        <div className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs border border-purple-500/40">
          🚀
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-200">
            <span>{displayClassName}</span>
            <ChevronDown className="w-3 h-3 text-purple-400 group-hover:translate-y-0.5 transition-transform" />
          </div>
          <div className="text-[9.5px] text-purple-400/80 font-medium truncate max-w-[120px]">
            {role === 'ADMIN' ? 'Principal: Principal' : `Principal: ${school.principalName || 'Principal'}`}
            <span className="ml-1 bg-purple-900/60 text-purple-300 px-1 py-0.2 rounded text-[8px] border border-purple-700/50">
              {schoolCode}
            </span>
          </div>
        </div>
      </button>

      {/* Right Icons: Refresh Sync, Search, Reminders, Explicit Teacher Logout */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSync}
          title="Sync Database"
          className="p-2 rounded-xl bg-[#161426] hover:bg-[#201d38] text-purple-300 border border-purple-900/30 transition-all"
        >
          <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
        </button>

        <button
          onClick={onOpenSearch}
          title="Search Records"
          className="p-2 rounded-xl bg-[#161426] hover:bg-[#201d38] text-purple-300 border border-purple-900/30 transition-all"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenReminders}
          title="Reminders & Alerts"
          className="p-2 rounded-xl bg-[#161426] hover:bg-[#201d38] text-purple-300 border border-purple-900/30 transition-all relative"
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        </button>

        {/* Top-Right Logout Button (Replaces profile button #1 in screenshot) */}
        <button
          onClick={onLogOut}
          title="Logout / Sign Out"
          className="px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition-all flex items-center gap-1.5 text-xs font-bold shadow-md"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
