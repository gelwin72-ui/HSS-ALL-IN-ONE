import React, { useState } from 'react';
import { 
  Bell, 
  Megaphone, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  Plus 
} from 'lucide-react';
import { Directive, Reminder } from '../types';

interface NoticesViewProps {
  directives: Directive[];
  reminders: Reminder[];
  onOpenReminders: () => void;
}

export const NoticesView: React.FC<NoticesViewProps> = ({
  directives,
  reminders,
  onOpenReminders
}) => {
  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            OFFICIAL CIRCULARS
          </div>
          <h2 className="text-xl font-black text-white">NOTICE BOARD & REMINDERS</h2>
          <p className="text-xs text-gray-400">School circulars, principal announcements, and task reminder lists.</p>
        </div>

        <button
          onClick={onOpenReminders}
          className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center gap-1 shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Task
        </button>
      </div>

      {/* Principal Directives Section */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-400" />
            PRINCIPAL BROADCAST DIRECTIVES ({directives.length})
          </h3>
          <span className="text-[10px] text-gray-400">Live synced from Admin Portal</span>
        </div>

        {directives.length === 0 ? (
          <div className="bg-[#100e1c] rounded-2xl p-8 text-center text-gray-400 space-y-1">
            <ShieldCheck className="w-8 h-8 mx-auto text-amber-400/40" />
            <div className="text-sm font-bold text-white">No Directives Broadcasted</div>
            <p className="text-xs">Principal circulars and administrative directives will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {directives.map(dir => (
              <div key={dir.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase">{dir.category}</span>
                    <h4 className="text-sm font-black text-white">{dir.title}</h4>
                  </div>

                  <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                    dir.priority === 'Urgent' 
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                      : dir.priority === 'High'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                      : 'bg-purple-950 text-purple-300 border border-purple-800/60'
                  }`}>
                    {dir.priority}
                  </span>
                </div>

                <p className="text-xs text-gray-300 bg-[#100e1c] p-2.5 rounded-lg border border-purple-900/30 whitespace-pre-wrap">
                  {dir.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>Target: <strong className="text-purple-300">{dir.targetAudience}</strong></span>
                  <span>Issued by: <strong className="text-white">{dir.senderName}</strong> • {new Date(dir.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminders List */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-400" />
          TEACHER REMINDERS & TASKS ({reminders.length})
        </h3>

        {reminders.length === 0 ? (
          <div className="bg-[#100e1c] rounded-2xl p-6 text-center text-gray-400 space-y-1">
            <div className="text-xs font-bold text-white">No Reminders Created Yet</div>
            <p className="text-[11px]">Tap 'Add Task' to schedule daily alerts.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map(rem => (
              <div key={rem.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{rem.title}</div>
                  <div className="text-[10px] text-gray-400">{rem.date} at {rem.time} • {rem.category}</div>
                </div>

                <span className="bg-purple-950 text-purple-300 border border-purple-700/40 text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                  {rem.repeat}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
