import React, { useState } from 'react';
import { Bell, X, Plus, Calendar, Clock, Check } from 'lucide-react';
import { Reminder } from '../types';

interface RemindersModalProps {
  reminders: Reminder[];
  onAddReminder: (reminder: Omit<Reminder, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  reminders,
  onAddReminder,
  onClose
}) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-11-03');
  const [time, setTime] = useState('09:30 am');
  const [category, setCategory] = useState<Reminder['category']>('Attendance');
  const [repeat, setRepeat] = useState<Reminder['repeat']>('Once');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    onAddReminder({
      teacherId: 'teacher_1',
      schoolCode: 'FC',
      title,
      description,
      date,
      time,
      category,
      repeat,
      completed: false
    });
    setTitle('');
    setDescription('');
    setShowAdd(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
          <div className="flex items-center gap-2 text-sm font-bold text-purple-300">
            <Bell className="w-4 h-4 text-amber-400" />
            Teacher Reminders & Tasks
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400">Manage daily class schedules & alerts</p>

        {!showAdd ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowAdd(true)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add New Reminder
            </button>

            {reminders.length === 0 ? (
              <div className="bg-[#100e1c] p-6 rounded-2xl text-center text-xs text-gray-400">
                No reminders created yet. Tap above to schedule.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {reminders.map((r) => (
                  <div key={r.id} className="bg-[#19162e] border border-purple-800/40 rounded-xl p-3 space-y-1">
                    <div className="text-xs font-bold text-white">{r.title}</div>
                    <div className="text-[10px] text-gray-400">{r.date} at {r.time} • {r.category}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="bg-[#100e1c] p-3 rounded-2xl border border-purple-900/40 space-y-2.5">
              <div className="font-bold text-purple-300 uppercase tracking-wider text-[11px]">NEW TASK REMINDER</div>

              <div>
                <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Submit Mid-Term Marks"
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Description / Notes</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details or instructions"
                  className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="9:30 am"
                    className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-2 py-1.5 text-white text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Reminder['category'])}
                    className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-2 py-1.5 text-white"
                  >
                    <option value="Attendance">Attendance</option>
                    <option value="Exam">Exam</option>
                    <option value="Timetable">Timetable</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-gray-300 mb-0.5">Repeat</label>
                  <select
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value as Reminder['repeat'])}
                    className="w-full bg-[#19162e] border border-purple-900/60 rounded-xl px-2 py-1.5 text-white"
                  >
                    <option value="Once">Once</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                Save Reminder
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
