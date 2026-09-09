import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarDays,
  FileSpreadsheet,
  TrendingUp,
  FileText,
  Settings
} from 'lucide-react';

export type ScreenTab =
  | 'dashboard'
  | 'school_profile'
  | 'students'
  | 'attendance'
  | 'timetable'
  | 'exams'
  | 'progress'
  | 'reports'
  | 'settings';

interface BottomNavProps {
  activeTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
    { id: 'students', label: 'Students', shortLabel: 'Students', icon: Users },
    { id: 'attendance', label: 'Attendance', shortLabel: 'Attend', icon: CalendarCheck },
    { id: 'timetable', label: 'Timetable', shortLabel: 'Schedule', icon: CalendarDays },
    { id: 'exams', label: 'Exams & Marks', shortLabel: 'Exams', icon: FileSpreadsheet },
    { id: 'progress', label: 'Trajectory', shortLabel: 'Progress', icon: TrendingUp },
    { id: 'reports', label: 'Reports', shortLabel: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1C23]/95 backdrop-blur-xl border-t border-[#2D3139] px-1 sm:px-4 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.5rem)] transition-colors no-print">
      <div className="max-w-3xl mx-auto flex items-center justify-between overflow-x-auto no-scrollbar gap-0.5 sm:gap-1.5 px-0.5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id as ScreenTab)}
              className={`relative flex-1 min-w-[48px] sm:min-w-[64px] flex flex-col items-center justify-center py-1 px-1 sm:px-2 rounded-2xl transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? 'bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#252830]/60 border border-transparent'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 transition ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                {isActive && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-purple-400" />
                )}
              </div>
              <span className={`text-[9px] sm:text-[10px] font-semibold tracking-tight mt-0.5 truncate max-w-[58px] sm:max-w-none ${isActive ? 'text-purple-300 font-bold' : 'text-slate-400'}`}>
                <span className="inline sm:hidden">{item.shortLabel}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
