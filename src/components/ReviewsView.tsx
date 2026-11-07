import React, { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Plus, 
  CheckCircle2, 
  User, 
  ThumbsUp, 
  Sparkles, 
  Filter, 
  X, 
  Check 
} from 'lucide-react';
import { AppReview, Teacher, School } from '../types';

interface ReviewsViewProps {
  reviews: AppReview[];
  teacher: Partial<Teacher>;
  school: Partial<School>;
  onAddReview: (review: Omit<AppReview, 'id' | 'date'>) => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({
  reviews,
  teacher,
  school,
  onAddReview
}) => {
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Review Form State
  const [newRating, setNewRating] = useState(5);
  const [newAuthor, setNewAuthor] = useState(teacher.name || 'Elwin George');
  const [newRole, setNewRole] = useState<AppReview['role']>('Teacher');
  const [newTitle, setNewTitle] = useState('Excellent School Management System!');
  const [newComment, setNewComment] = useState('The real-time attendance marking, exam mark entry, and PDF report generation features work seamlessly. Highly recommended for all higher secondary schools in Kerala!');

  const filteredReviews = reviews.filter(r => {
    if (filterRole === 'ALL') return true;
    return r.role.toUpperCase() === filterRole.toUpperCase();
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : '4.9';

  const count5 = reviews.filter(r => r.rating === 5).length;
  const count4 = reviews.filter(r => r.rating === 4).length;
  const count3 = reviews.filter(r => r.rating === 3).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newComment) return;

    onAddReview({
      authorName: newAuthor || 'Anonymous Educator',
      role: newRole,
      rating: newRating,
      title: newTitle,
      comment: newComment,
      schoolCode: school.schoolCode || 'FC',
      verified: true
    });

    setShowAddModal(false);
    setToastMsg('Thank you! Your app review has been published and saved.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="p-3 sm:p-5 space-y-4 pb-24 max-w-4xl mx-auto">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#151326] border border-purple-900/40 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            COMMUNITY APP REVIEWS & FEEDBACK
          </div>
          <h2 className="text-xl font-black text-white">App Reviews & Ratings</h2>
          <p className="text-xs text-gray-400">Read verified reviews, teacher feedback, and principal ratings for HSS ALL IN ONE.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          Write a Review
        </button>
      </div>

      {/* Summary Score Card */}
      <div className="bg-gradient-to-br from-[#1c1836] via-[#16132b] to-[#120f22] border border-purple-800/50 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-center sm:text-left">
            <div className="text-4xl font-black text-white flex items-center justify-center sm:justify-start gap-2">
              {avgRating}
              <div className="flex items-center text-amber-400 text-lg">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400" />
                ))}
              </div>
            </div>
            <p className="text-xs text-purple-300 font-bold mt-1">Based on {reviews.length} Verified Educator & Parent Reviews</p>
          </div>
        </div>

        {/* Rating Bars */}
        <div className="w-full sm:w-64 space-y-1.5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-10 text-[10px] font-bold">5 Stars</span>
            <div className="flex-1 bg-[#0e0c1a] h-2 rounded-full overflow-hidden border border-purple-900/30">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: reviews.length > 0 ? `${(count5 / reviews.length) * 100}%` : '85%' }}></div>
            </div>
            <span className="w-6 text-[10px] text-right font-bold text-white">{count5}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-10 text-[10px] font-bold">4 Stars</span>
            <div className="flex-1 bg-[#0e0c1a] h-2 rounded-full overflow-hidden border border-purple-900/30">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: reviews.length > 0 ? `${(count4 / reviews.length) * 100}%` : '15%' }}></div>
            </div>
            <span className="w-6 text-[10px] text-right font-bold text-white">{count4}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-10 text-[10px] font-bold">3 Stars</span>
            <div className="flex-1 bg-[#0e0c1a] h-2 rounded-full overflow-hidden border border-purple-900/30">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: reviews.length > 0 ? `${(count3 / reviews.length) * 100}%` : '0%' }}></div>
            </div>
            <span className="w-6 text-[10px] text-right font-bold text-white">{count3}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {['ALL', 'Teacher', 'Principal', 'Parent', 'Student'].map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterRole === role
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-[#141224] text-gray-400 hover:text-white border border-purple-900/30'
            }`}
          >
            {role === 'ALL' ? 'All Reviews' : `${role} Reviews`}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="bg-[#141224] border border-purple-900/30 rounded-2xl p-8 text-center text-gray-400 space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto text-purple-500/40" />
            <div className="text-sm font-bold text-white">No Reviews Found</div>
            <p className="text-xs">Be the first to submit a review for this app!</p>
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div key={rev.id} className="bg-[#141224] hover:bg-[#19162e] border border-purple-900/40 rounded-2xl p-4 shadow-md transition-all space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                    {rev.authorName.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-white">{rev.authorName}</h4>
                      <span className="bg-purple-950 text-purple-300 border border-purple-700/40 text-[9px] font-bold px-2 py-0.2 rounded-full uppercase">
                        {rev.role}
                      </span>
                      {rev.verified && (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[8.5px] font-black px-1.5 py-0.2 rounded-full uppercase flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">School Code: {rev.schoolCode} • {rev.date}</div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-black text-purple-200">{rev.title}</h5>
                <p className="text-xs text-gray-300 leading-relaxed mt-1 bg-[#100e1c] p-3 rounded-xl border border-purple-900/30">
                  "{rev.comment}"
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SUBMIT REVIEW MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSubmit} className="w-full max-w-md bg-[#161426] border border-purple-800/50 rounded-3xl p-5 shadow-2xl relative space-y-4 my-6">
            <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                Submit App Review & Feedback
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Star Picker */}
              <div className="text-center p-3 bg-[#100e1c] rounded-2xl border border-purple-900/40">
                <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase">Select Rating Star</label>
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-gray-600'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Your Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AppReview['role'])}
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Principal">Principal</option>
                  <option value="Parent">Parent</option>
                  <option value="Student">Student</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Review Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Outstanding Management App for Teachers!"
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-300 mb-1">Review Details / Comment *</label>
                <textarea
                  rows={3}
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your experience using HSS ALL IN ONE..."
                  className="w-full bg-[#100e1c] border border-purple-900/50 rounded-xl px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2.5 px-4 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1 shadow-lg"
              >
                <Check className="w-4 h-4" />
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
