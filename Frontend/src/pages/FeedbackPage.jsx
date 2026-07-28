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
        if (userRole !== 'ADMIN') return; // Sirf admin kar sake
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
        if (userRole !== 'ADMIN') return; // Sirf admin delete kar sake
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
        if (item.comment && item.comment.includes(' - [')) {
            const parts = item.comment.split(' - [');
            const titlePart = parts[1]?.replace(']', '');
            return (
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-900">{titlePart}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{item.createdByEmail ? item.createdByEmail.split('@')[0] : 'Verified Founder'}</span>
                </div>
            );
        }
        return (
            <span className="text-xs font-bold text-slate-900">
                {item.createdByEmail ? item.createdByEmail.split('@')[0] : 'Verified Founder'}
            </span>
        );
    };

    const isInvestor = userRole === 'INVESTOR';
    const isAdmin = userRole === 'ADMIN';

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-10">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <Star className="text-orange-500 fill-orange-500" size={32} /> Success Stories & Feedback
                        </h1>
                        <p className="text-slate-500 mt-1">Discover what founders say about our incubation system or share your experience.</p>
                    </div>

                    {!isInvestor && (
                        <div className="flex bg-slate-200/70 p-1.5 rounded-2xl gap-1">
                            <button
                                onClick={() => setActiveTab('public')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                                    activeTab === 'public' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Public Wall
                            </button>
                            <button
                                onClick={() => setActiveTab('manage')}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                    activeTab === 'manage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <ShieldCheck size={14} className="text-orange-500" /> {isAdmin ? 'Admin Moderation & Submit' : 'Submit Feedback'}
                            </button>
                        </div>
                    )}
                </header>

                <div className="max-w-4xl space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-medium border ${
                            message.type === 'success'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 text-white shadow-md">
                            <h2 className="text-2xl font-black">Trusted by Innovative Founders</h2>
                            <p className="text-orange-100 text-sm mt-1">Here is how our incubation platform empowers startup journeys and drives success.</p>
                        </div>

                        {loading ? (
                            <p className="text-slate-500 text-center py-10 animate-pulse">Loading public testimonials...</p>
                        ) : publicFeedbacks.length === 0 ? (
                            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                                <Star className="mx-auto text-slate-300 mb-3" size={48} />
                                <p className="text-slate-500 font-medium">No public success stories published yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {publicFeedbacks.map((item) => (
                                    <div key={item.feedbackId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-1 text-amber-400">
                                                {[...Array(item.rating)].map((_, i) => (
                                                    <Star key={i} size={16} className="fill-amber-400" />
                                                ))}
                                            </div>
                                            <p className="text-slate-700 text-sm italic">
                                                "{item.comment ? item.comment.split(' - [')[0] : item.comment}"
                                            </p>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            {renderAuthorDisplay(item)}
                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold border border-emerald-100">Verified Review</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {!isInvestor && activeTab === 'manage' && (
                        <div className="space-y-8 pt-6">
                            {/* Submit Feedback Form - Visible to all non-investors */}
                            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                    <MessageSquare size={20} className="text-orange-500" /> Share Your Incubation Experience
                                </h3>
                                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Name & Company Title</label>
                                        <input
                                            type="text"
                                            placeholder="Enter your name and startup/company title..."
                                            value={authorTitle}
                                            onChange={(e) => setAuthorTitle(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                                        <select
                                            value={rating}
                                            onChange={(e) => setRating(Number(e.target.value))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                        >
                                            <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                                            <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                                            <option value={3}>⭐⭐⭐ (3 - Good)</option>
                                            <option value={2}>⭐⭐ (2 - Fair)</option>
                                            <option value={1}>⭐ (1 - Poor)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Review / Testimonial</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Write about your journey and experience..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                                    >
                                        <Send size={14} /> Submit Feedback
                                    </button>
                                </form>
                            </div>

                            {/* Admin Feedback Moderation - Visible ONLY if userRole is ADMIN */}
                            {isAdmin && (
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                        <ShieldCheck size={20} className="text-orange-500" /> Admin Feedback Moderation
                                    </h3>
                                    <div className="space-y-3 pt-2">
                                        {feedbacks.length === 0 ? (
                                            <p className="text-xs text-slate-400">No feedbacks submitted in the system yet.</p>
                                        ) : (
                                            feedbacks.map((item) => (
                                                <div key={item.feedbackId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-900">{item.createdByEmail}</span>
                                                            <span className="text-amber-500 text-xs">{'⭐'.repeat(item.rating)}</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                                                item.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'
                                                            }`}>
                                                                {item.isPublic ? 'Publicly Visible' : 'Private'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 italic">"{item.comment}"</p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => handleTogglePublic(item)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                                item.isPublic
                                                                    ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                                                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {item.isPublic ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            <span>{item.isPublic ? 'Make Private' : 'Publish'}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteFeedback(item.feedbackId)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50"
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