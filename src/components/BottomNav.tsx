import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Clock, 
  FileSpreadsheet, 
  TrendingUp, 
  Printer, 
  Settings 
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'timetable', label: 'Timetable', icon: <Clock className="w-4 h-4" /> },
    { id: 'exams', label: 'Exams &...', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'trajectory', label: 'Trajectory', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Printer className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0d0c14]/95 backdrop-blur-md border-t border-purple-900/30 px-1 py-1 flex items-center justify-around shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-1.5 rounded-lg transition-all min-w-[40px] ${
              isActive 
                ? 'text-purple-300 bg-purple-950/60 font-semibold scale-105 border border-purple-600/40' 
                : 'text-gray-400 hover:text-gray-200 hover:bg-purple-950/20'
            }`}
          >
            <div className={`p-1 rounded-md ${isActive ? 'bg-purple-600/30 text-purple-300' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] mt-0.5 tracking-tight truncate max-w-[54px]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
