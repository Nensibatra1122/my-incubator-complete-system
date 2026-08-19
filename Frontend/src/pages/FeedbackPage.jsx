import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Star, MessageSquare, Send, Trash2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

const FeedbackPage = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [publicFeedbacks, setPublicFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('public');
    const [message, setMessage] = useState({ text: '', type: '' });

    // User Role State
    const [userRole, setUserRole] = useState('');

    // Form State for new feedback
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [authorTitle, setAuthorTitle] = useState('');

    const fetchFeedbacks = async () => {
        try {
            setLoading(true);

            // LocalStorage se role get kar ke uppercase karna
            const storedRole = (localStorage.getItem('role') || localStorage.getItem('userRole') || '').trim().toUpperCase();
            setUserRole(storedRole);

            const [allRes, publicRes] = await Promise.all([
                api.get('/feedback').catch(() => ({ data: [] })),
                api.get('/feedback/public').catch(() => ({ data: [] }))
            ]);
            setFeedbacks(allRes.data || []);
            setPublicFeedbacks(publicRes.data || []);
        } catch (e) {
            console.error("Failed to fetch feedbacks", e);
            setMessage({ text: 'Failed to load feedback feed.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (userRole === 'INVESTOR') return;
        if (!comment.trim()) return;

        const finalComment = authorTitle.trim()
            ? `${comment} - [${authorTitle}]`
            : comment;

        try {
            await api.post('/feedback', {
                comment: finalComment,
                rating,
                isPublic: false
            });
            setComment('');
            setAuthorTitle('');
            setRating(5);
            setMessage({ text: 'Feedback submitted successfully! Pending admin approval for public wall.', type: 'success' });
            fetchFeedbacks();
        } catch (e) {
            console.error("Failed to submit feedback", e);
            setMessage({ text: 'Failed to submit feedback. Please ensure you have proper permissions.', type: 'error' });
        }
    };

    const handleTogglePublic = async (feedback) => {
        if (userRole !== 'ADMIN') return;
        const updatedStatus = !feedback.isPublic;

        // Optimistic UI update
        setFeedbacks(prev => prev.map(item =>
            item.feedbackId === feedback.feedbackId ? { ...item, isPublic: updatedStatus } : item
        ));

        if (updatedStatus) {
            setPublicFeedbacks(prev => [...prev, { ...feedback, isPublic: true }]);
        } else {
            setPublicFeedbacks(prev => prev.filter(item => item.feedbackId !== feedback.feedbackId));
        }

        try {
            await api.put(`/feedback/${feedback.feedbackId}`, {
                comment: feedback.comment || "",
                rating: feedback.rating || 5,
                isPublic: updatedStatus
            });
            setMessage({ text: 'Feedback visibility updated successfully!', type: 'success' });
            fetchFeedbacks();
        } catch (e) {
            console.error("Failed to update feedback status", e);
            setMessage({ text: 'Failed to update status on server.', type: 'error' });
            fetchFeedbacks();
        }
    };

    const handleDeleteFeedback = async (id) => {
        if (userRole !== 'ADMIN') return;
        try {
            await api.delete(`/feedback/${id}`);
            setMessage({ text: 'Feedback deleted successfully!', type: 'success' });
            fetchFeedbacks();
        } catch (e) {
            console.error("Failed to delete feedback", e);
            setMessage({ text: 'Failed to delete feedback.', type: 'error' });
        }
    };

    const renderAuthorDisplay = (item) => {
        const emailPrefix = item.createdByEmail ? item.createdByEmail.split('@')[0] : 'Verified Founder';

        if (item.comment && item.comment.includes(' - [')) {
            const parts = item.comment.split(' - [');
            const titlePart = parts[1]?.replace(']', '');
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{titlePart}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{emailPrefix}</span>
                </div>
            );
        }
        return (
            <span className="text-xs font-bold text-white">
                {emailPrefix}
            </span>
        );
    };

    const isInvestor = userRole === 'INVESTOR';
    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between bg-slate-800/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <Star className="text-orange-500 fill-orange-500" size={32} /> Success Stories & Feedback
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">Discover what founders say about our incubation system or share your experience.</p>
                    </div>

                    {!isInvestor && (
                        <div className="flex bg-slate-800 p-1.5 rounded-2xl gap-1 border border-slate-700/80">
                            <button
                                onClick={() => setActiveTab('public')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    activeTab === 'public' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                Public Wall
                            </button>
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    activeTab === 'manage' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-400 hover:text-white'
                                }`}
                            >
                                <ShieldCheck size={14} className={activeTab === 'manage' ? 'text-white' : 'text-orange-400'} />
                                {isAdmin ? 'Admin Moderation & Submit' : 'Submit Feedback'}
                            </button>
                        </div>
                    )}
                </header>

                <div className="max-w-4xl space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-medium border ${
                            message.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/10 border border-orange-400/20">
                            <h2 className="text-2xl font-black">Trusted by Innovative Founders</h2>
                            <p className="text-orange-100 text-sm mt-1">Here is how our incubation platform empowers startup journeys and drives success.</p>
                        </div>

                        {activeTab === 'public' && (
                            loading ? (
                                <p className="text-slate-500 text-center py-10 animate-pulse">Loading public testimonials...</p>
                            ) : publicFeedbacks.length === 0 ? (
                                <div className="bg-slate-800/50 rounded-3xl border border-slate-800 p-12 text-center shadow-xl backdrop-blur-xl">
                                    <Star className="mx-auto text-slate-600 mb-3" size={48} />
                                    <p className="text-slate-400 font-medium">No public success stories published yet.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {publicFeedbacks.map((item) => (
                                        <div key={item.feedbackId} className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition">
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-1 text-amber-400">
                                                    {[...Array(item.rating || 5)].map((_, i) => (
                                                        <Star key={i} size={16} className="fill-amber-400" />
                                                    ))}
                                                </div>
                                                <p className="text-slate-300 text-sm italic">
                                                    "{item.comment ? item.comment.split(' - [')[0] : item.comment}"
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between">
                                                {renderAuthorDisplay(item)}
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold border border-emerald-500/20">Verified Review</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {!isInvestor && activeTab === 'manage' && (
                        <div className="space-y-8 pt-2">
                            {/* Submit Feedback Form */}
                            <div className="bg-slate-800/50 rounded-3xl border border-slate-800 p-8 shadow-xl backdrop-blur-xl space-y-5">
                                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                    <MessageSquare size={20} className="text-orange-500" /> Share Your Incubation Experience
                                </h3>
                                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Your Name & Company Title</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name and startup/company title..."
                                            value={authorTitle}
                                            onChange={(e) => setAuthorTitle(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Rating (1 to 5 Stars)</label>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition"
                                        >
                                            <option value={5} className="bg-slate-900 text-white">⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                                            <option value={4} className="bg-slate-900 text-white">⭐⭐⭐⭐ (4 - Very Good)</option>
                                            <option value={3} className="bg-slate-900 text-white">⭐⭐⭐ (3 - Good)</option>
                                            <option value={2} className="bg-slate-900 text-white">⭐⭐ (2 - Fair)</option>
                                            <option value={1} className="bg-slate-900 text-white">⭐ (1 - Poor)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Your Review / Testimonial</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Write about your journey and experience..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full px-5 py-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition font-semibold"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                                    >
                                        <Send size={16} /> Submit Feedback
                                    </button>
                                </form>
                            </div>

                            {/* Admin Feedback Moderation */}
                            {isAdmin && (
                                <div className="bg-slate-800/50 rounded-3xl border border-slate-800 p-8 shadow-xl backdrop-blur-xl space-y-5">
                                    <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                        <ShieldCheck size={20} className="text-orange-500" /> Admin Feedback Moderation
                                    </h3>
                                    <div className="space-y-3 pt-2">
                                        {feedbacks.length === 0 ? (
                                            <p className="text-xs text-slate-400">No feedbacks submitted in the system yet.</p>
                                        ) : (
                                            feedbacks.map((item) => (
                                                <div key={item.feedbackId} className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex items-center justify-between gap-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-white">{item.createdByEmail}</span>
                                                            <span className="text-amber-400 text-xs">{'⭐'.repeat(item.rating || 5)}</span>
                                                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                                                                item.isPublic ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                                                            }`}>
                                                                {item.isPublic ? 'Publicly Visible' : 'Private'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-300 italic">"{item.comment}"</p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleTogglePublic(item)}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                                                item.isPublic
                                                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                            }`}
                                                        >
                                                            {item.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            <span>{item.isPublic ? 'Make Private' : 'Publish'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteFeedback(item.feedbackId)}
                                                            className="p-2.5 text-slate-400 hover:text-rose-400 transition rounded-xl hover:bg-rose-500/10 cursor-pointer"
                                                            title="Delete Feedback"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FeedbackPage;