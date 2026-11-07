import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Sparkles, 
  Plus, 
  Printer, 
  BookOpen, 
  Check, 
  X, 
  Zap,
  Coffee
} from 'lucide-react';
import { Timetable, PeriodSlot, Teacher, ClassRoom, School } from '../types';

interface TimetableViewProps {
  teacher: Partial<Teacher>;
  activeClass: Partial<ClassRoom>;
  school: Partial<School>;
  timetable: Timetable | null;
  onSaveTimetable: (timetable: Timetable) => void;
}

export const TimetableView: React.FC<TimetableViewProps> = ({
  teacher,
  activeClass,
  school,
  timetable,
  onSaveTimetable
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'my' | 'class' | 'today'>('my');
  const [selectedDay, setSelectedDay] = useState<string>('All Days');
  const [editingSlot, setEditingSlot] = useState<{ day: string; index: number } | null>(null);
  const [slotSubject, setSlotSubject] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const defaultPeriods: PeriodSlot[] = [
    { id: 'p1', periodNumber: 1, startTime: '09:30 AM', endTime: '10:15 AM', subjectName: 'Free Period' },
    { id: 'p2', periodNumber: 2, startTime: '10:15 AM', endTime: '11:00 AM', isRecess: true, recessLabel: 'Short Recess (10m)' },
    { id: 'p3', periodNumber: 3, startTime: '11:10 AM', endTime: '11:55 AM', subjectName: 'Free Period' },
    { id: 'p4', periodNumber: 4, startTime: '11:55 AM', endTime: '12:40 PM', isRecess: true, recessLabel: 'Lunch Break' },
    { id: 'p5', periodNumber: 5, startTime: '01:25 PM', endTime: '02:10 PM', subjectName: 'Free Period' },
    { id: 'p6', periodNumber: 6, startTime: '02:10 PM', endTime: '02:55 PM', isRecess: true, recessLabel: 'Tea Break (10m)' },
    { id: 'p7', periodNumber: 7, startTime: '03:05 PM', endTime: '03:50 PM', subjectName: 'Free Period' },
    { id: 'p8', periodNumber: 8, startTime: '03:50 PM', endTime: '04:30 PM', subjectName: 'Free Period' },
  ];

  const scheduleState: Record<string, PeriodSlot[]> = timetable?.schedule || {
    Monday: defaultPeriods,
    Tuesday: defaultPeriods,
    Wednesday: defaultPeriods,
    Thursday: defaultPeriods,
    Friday: defaultPeriods,
    Saturday: defaultPeriods,
  };

  const handleAssignSubject = (day: string, index: number) => {
    const currentDayPeriods = [...(scheduleState[day] || defaultPeriods)];
    currentDayPeriods[index] = {
      ...currentDayPeriods[index],
      subjectName: slotSubject || teacher.subject || 'Physics'
    };

    const newSchedule = {
      ...scheduleState,
      [day]: currentDayPeriods
    };

    onSaveTimetable({
      id: `${activeClass.schoolCode || 'FC'}_tt`,
      schoolCode: activeClass.schoolCode || 'FC',
      targetType: 'TEACHER',
      targetId: teacher.id || 'teacher',
      schedule: newSchedule,
      updatedAt: new Date().toISOString()
    });

    setEditingSlot(null);
    setSlotSubject('');
  };

  const teacherName = teacher.name || 'Elwin George';

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
          <Clock className="w-4 h-4" />
          TIMETABLE & ACADEMIC SCHEDULER
        </div>
        <h2 className="text-xl font-black text-white">Weekly Timetable & Period Planner</h2>
        <p className="text-xs text-gray-400">
          Organize daily periods, laboratory hours, and subject allocations. Synced automatically with School Administration.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => alert('Auto-filled template timetable successfully!')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-md transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Auto-Fill Schedule
          </button>
          <button
            onClick={() => setEditingSlot({ day: 'Monday', index: 0 })}
            className="flex items-center gap-1.5 bg-[#1f1b38] hover:bg-[#282348] text-purple-300 border border-purple-800/40 text-xs font-bold py-2 px-3 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            Add Period Slot
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Weekly Periods</div>
          <div className="text-lg font-black text-white">0 <span className="text-xs font-normal text-gray-400">Periods/wk</span></div>
        </div>
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Teaching Hours</div>
          <div className="text-lg font-black text-cyan-400">0.0 <span className="text-xs font-normal text-gray-400">Hours/wk</span></div>
        </div>
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Class Divisions</div>
          <div className="text-lg font-black text-purple-300">0 <span className="text-xs font-normal text-gray-400">Assigned</span></div>
        </div>
        <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-3">
          <div className="text-[10px] text-gray-400 font-bold uppercase">Active Status</div>
          <div className="text-xs font-black text-emerald-400 mt-1">Free / Break</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-purple-900/40">
        <button
          onClick={() => setActiveSubTab('my')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'my'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          My Schedule
        </button>
        <button
          onClick={() => setActiveSubTab('class')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'class'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Class Timetable
        </button>
        <button
          onClick={() => setActiveSubTab('today')}
          className={`py-2 px-4 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'today'
              ? 'border-purple-500 text-purple-300 bg-purple-950/30'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Today's Timeline
        </button>
      </div>

      {/* Day Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['All Days', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDay === d
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#141224] text-gray-400 hover:text-white border border-purple-900/30'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="bg-[#141224] border border-purple-900/40 rounded-2xl p-4 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
          <div className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-400" />
            Weekly Schedule: {teacherName}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">0 periods active</span>
        </div>

        {/* Days Table */}
        <div className="space-y-4">
          {days
            .filter(d => selectedDay === 'All Days' || d.startsWith(selectedDay))
            .map((day) => (
              <div key={day} className="bg-[#100e1c] border border-purple-900/30 rounded-xl p-3 space-y-2">
                <div className="text-xs font-black text-white flex items-center justify-between">
                  <span className="uppercase text-purple-300">{day}</span>
                  <span className="text-[10px] text-gray-400 font-normal">0 Periods</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {defaultPeriods.map((p, idx) => {
                    const assigned = scheduleState[day]?.[idx];
                    if (p.isRecess) {
                      return (
                        <div key={p.id} className="bg-amber-950/20 border border-amber-800/30 rounded-xl p-2 text-center text-[10.5px]">
                          <div className="font-bold text-amber-400">Period {p.periodNumber}</div>
                          <div className="text-gray-400 text-[9px]">{p.startTime} - {p.endTime}</div>
                          <div className="text-amber-300 font-semibold text-[9.5px] mt-1 flex items-center justify-center gap-1">
                            <Coffee className="w-3 h-3" />
                            {p.recessLabel}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={p.id}
                        onClick={() => setEditingSlot({ day, index: idx })}
                        className="bg-[#19162e] hover:bg-[#201d3b] border border-purple-900/40 rounded-xl p-2 cursor-pointer transition-all text-center group"
                      >
                        <div className="font-bold text-purple-300 text-[11px]">Period {p.periodNumber}</div>
                        <div className="text-gray-400 text-[9px]">{p.startTime} - {p.endTime}</div>
                        
                        <div className="mt-2 py-1 px-2 bg-purple-950/60 border border-purple-800/40 rounded-lg text-[10px] font-bold text-gray-300 group-hover:text-purple-300 group-hover:border-purple-600/50 transition-all flex items-center justify-center gap-1">
                          <Plus className="w-3 h-3" />
                          {assigned?.subjectName && assigned.subjectName !== 'Free Period' ? assigned.subjectName : 'Free Period'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* EDIT SLOT MODAL */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
              <div className="text-sm font-bold text-white">Assign Period Slot</div>
              <button onClick={() => setEditingSlot(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-gray-300">
              Day: <strong className="text-purple-300">{editingSlot.day}</strong> • Period <strong className="text-purple-300">#{editingSlot.index + 1}</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">Subject / Activity Name</label>
              <input
                type="text"
                value={slotSubject}
                onChange={(e) => setSlotSubject(e.target.value)}
                placeholder="e.g. Physics Theory / Lab"
                className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white text-xs focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingSlot(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAssignSubject(editingSlot.day, editingSlot.index)}
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Save Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
