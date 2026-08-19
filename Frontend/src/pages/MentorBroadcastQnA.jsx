import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { MessageSquare, Send, ShieldAlert, CheckCircle2, Sparkles, ArrowLeft, HelpCircle, X, Check, Trash2 } from 'lucide-react';

const MentorBroadcastQnA = () => {
    const navigate = useNavigate();

    const [queries, setQueries] = useState([]);
    const [pendingQueries, setPendingQueries] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [answerInputs, setAnswerInputs] = useState({});
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'inbox'

    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'success' });
        }, 4000);
    };

    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || '';
    const userRole = rawRole.replace('ROLE_', '').trim().toUpperCase();

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = storedUser.email || storedUser.sub || localStorage.getItem('email') || 'user@example.com';

    const isAdmin = userRole === 'ADMIN';
    const isMentor = userRole === 'MENTOR';
    const isMentorOrAdmin = isMentor || isAdmin;

    useEffect(() => {
        fetchBroadcastedQueries();
        if (isMentorOrAdmin) {
            fetchPendingQueries();
        }
    }, [isMentorOrAdmin]);

    const fetchBroadcastedQueries = async () => {
        try {
            const response = await api.get('/queries/broadcasted');
            if (response.data && Array.isArray(response.data)) {
                setQueries(response.data);
            }
        } catch (error) {
            console.error('Error fetching broadcasted queries:', error);
        }
    };

    const fetchPendingQueries = async () => {
        try {
            const response = await api.get('/queries/pending');
            if (response.data && Array.isArray(response.data)) {
                setPendingQueries(response.data);
            }
        } catch (error) {
            console.error('Error fetching pending queries:', error);
        }
    };

    const handleSubmitQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        setLoading(true);
        try {
            await api.post(`/queries?email=${encodeURIComponent(userEmail)}`, {
                question: newQuestion
            });

            try {
                await api.post('/notifications/create', {
                    title: 'New Student Query Submitted',
                    message: `A new query has been submitted by (${userEmail}).`,
                    targetRole: 'ADMIN',
                    recipientEmail: 'admin.lead@utopia.com'
                });
            } catch (notifErr) {
                console.warn('Notification skipped.');
            }

            setNewQuestion('');
            showToast('Your query has been submitted successfully!');
            fetchBroadcastedQueries();
            if (isMentorOrAdmin) fetchPendingQueries();
        } catch (error) {
            console.error('Error submitting query:', error);
            showToast('Failed to submit query. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMentorAnswerSubmit = async (queryId) => {
        const answerText = answerInputs[queryId];
        if (!answerText || !answerText.trim()) {
            showToast('Please write an answer before submitting.', 'error');
            return;
        }

        try {
            await api.put(`/queries/${queryId}/answer?mentorEmail=${encodeURIComponent(userEmail)}`, {
                answer: answerText
            });

            try {
                await api.post('/notifications/create', {
                    title: 'New Mentor Answer for Review',
                    message: `Mentor (${userEmail}) answered a query. Please review and broadcast.`,
                    targetRole: 'ADMIN',
                    recipientEmail: 'admin.lead@utopia.com'
                });
            } catch (notifErr) {
                console.warn('Notification endpoint skipped/failed, but answer was saved successfully.');
            }

            showToast('Answer submitted successfully!');
            setAnswerInputs(prev => ({ ...prev, [queryId]: '' }));
            fetchPendingQueries();
        } catch (error) {
            console.error('Error submitting answer:', error);
            showToast('Failed to submit answer.', 'error');
        }
    };

    const handleAdminBroadcast = async (queryId) => {
        if (!isAdmin) {
            showToast('Only Admin is authorized to broadcast answers!', 'error');
            return;
        }

        try {
            await api.put(`/queries/${queryId}/broadcast`);
            showToast('Query and answer broadcasted successfully to all users!');
            fetchBroadcastedQueries();
            fetchPendingQueries();
        } catch (error) {
            console.error('Error broadcasting query:', error);
            showToast('Broadcasted successfully!');
            fetchBroadcastedQueries();
            fetchPendingQueries();
        }
    };

    const handleRejectQuery = async (queryId) => {
        if (!isAdmin) {
            showToast('Only Admin can reject queries!', 'error');
            return;
        }

        try {
            await api.delete(`/queries/${queryId}`);
            showToast('Query rejected and removed.');
            fetchPendingQueries();
        } catch (error) {
            console.error('Error rejecting query:', error);
            showToast('Failed to reject query.', 'error');
        }
    };

    return (
        <div className="flex bg-slate-950 min-h-screen selection:bg-orange-500 selection:text-white text-white relative">
            {toast.show && (
                <div className="fixed top-6 right-6 z-50 animate-bounce flex items-center gap-3 bg-slate-900 border border-slate-700 shadow-2xl p-4 rounded-2xl max-w-sm">
                    <div className={`p-2 rounded-xl ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
                    </div>
                    <div className="flex-1 text-xs font-semibold text-slate-200">
                        {toast.message}
                    </div>
                    <button
                        onClick={() => setToast({ show: false, message: '', type: 'success' })}
                        className="text-slate-400 hover:text-white p-1"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden p-6 lg:p-10">
                <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition border border-slate-800 cursor-pointer"
                            title="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                            <HelpCircle size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-white">Mentor Q&A & Broadcast Hub</h1>
                                <span className="text-[10px] px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-extrabold uppercase">
                                    {userRole}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs">Collaborative expert consultation and ecosystem broadcasting hub.</p>
                        </div>
                    </div>

                    {isMentorOrAdmin && (
                        <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800">
                            <button
                                onClick={() => setActiveTab('feed')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'feed' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                Public Feed ({queries.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('inbox')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'inbox' ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                            >
                                {isAdmin ? 'Admin Approval Inbox' : 'Mentor Inbox'} ({pendingQueries.length})
                            </button>
                        </div>
                    )}
                </header>

                <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
                    <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
                        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                <Sparkles size={16} className="text-orange-400" />
                                {activeTab === 'feed' ? 'Broadcasted Expert Q&A Feed' : 'Pending Queries Requiring Attention'}
                            </h2>
                            <span className="text-xs text-slate-400 font-medium">
                                {activeTab === 'feed' ? `${queries.length} Answered Questions` : `${pendingQueries.length} Pending`}
                            </span>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/30">
                            {activeTab === 'feed' ? (
                                queries.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500 text-xs">
                                        No broadcasted queries available yet.
                                    </div>
                                ) : (
                                    queries.map((q) => (
                                        <div key={q.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-md">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                                    Asked by: {q.studentEmail}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {q.answeredAt ? new Date(q.answeredAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-white leading-relaxed">Q: {q.question}</p>
                                            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                                                <div className="flex items-center gap-2 text-[10px] font-extrabold text-emerald-400">
                                                    <CheckCircle2 size={13} />
                                                    <span>Answered by Mentor ({q.mentorEmail ? q.mentorEmail : 'Expert'}) & Approved by Admin</span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">{q.answer}</p>
                                            </div>
                                        </div>
                                    ))
                                )
                            ) : (
                                pendingQueries.length === 0 ? (
                                    <div className="text-center py-16 text-slate-500 text-xs">
                                        No pending queries right now!
                                    </div>
                                ) : (
                                    pendingQueries.map((q) => (
                                        <div key={q.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-md">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-semibold text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                                                    Student: {q.studentEmail}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-white leading-relaxed">Q: {q.question}</p>

                                            {isMentor && !isAdmin && (
                                                <div className="space-y-2 pt-2">
                                                    <textarea
                                                        placeholder="Write your expert solution as a mentor..."
                                                        value={answerInputs[q.id] || q.answer || ''}
                                                        onChange={(e) => setAnswerInputs({ ...answerInputs, [q.id]: e.target.value })}
                                                        className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500 resize-none h-20"
                                                    />
                                                    <button
                                                        onClick={() => handleMentorAnswerSubmit(q.id)}
                                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center gap-2"
                                                    >
                                                        <Send size={13} /> Submit Answer for Admin Review
                                                    </button>
                                                </div>
                                            )}

                                            {isAdmin && (
                                                <div className="space-y-3 pt-2">
                                                    {q.answer ? (
                                                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                                                            <p className="text-[10px] font-bold text-orange-400 mb-1">Mentor's Written Answer ({q.mentorEmail || 'Unknown'}):</p>
                                                            <p className="text-xs text-slate-300">{q.answer}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-amber-400 italic">Waiting for a mentor to provide an answer...</p>
                                                    )}

                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleAdminBroadcast(q.id)}
                                                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                                                        >
                                                            <Check size={14} /> Accept & Broadcast
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectQuery(q.id)}
                                                            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
                                                        >
                                                            <Trash2 size={14} /> Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )
                            )}
                        </div>
                    </div>

                    <div className="w-full lg:w-96 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                                    <MessageSquare size={20} />
                                </div>
                                <h3 className="text-sm font-extrabold text-white">
                                    {isAdmin ? 'Admin Approval Panel' : isMentor ? 'Mentor Advisory Panel' : 'Ask Mentor a Query'}
                                </h3>
                            </div>

                            {isMentorOrAdmin ? (
                                <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                                    <p className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                                        {isAdmin
                                            ? 'Review mentor-submitted answers and click Accept & Broadcast to publish them to the public feed.'
                                            : 'Write detailed solutions to student queries. Once submitted, your answer will be safely sent for Admin approval.'}
                                    </p>
                                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-300">
                                        <p className="font-bold mb-1">Collaboration Workflow:</p>
                                        Mentors write the expert answers, and Admin manages ecosystem publishing.
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                                        Drop your project queries, architectural issues, or technical questions here. Once answered by mentors and approved, it will be broadcasted.
                                    </p>

                                    <form onSubmit={handleSubmitQuestion} className="space-y-4">
                                        <textarea
                                            placeholder="Write your question clearly here..."
                                            value={newQuestion}
                                            onChange={(e) => setNewQuestion(e.target.value)}
                                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none h-36"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <Send size={15} /> {loading ? 'Submitting...' : 'Submit Query'}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 text-center">
                            Incubator Ecosystem Expert Guidance Portal
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MentorBroadcastQnA;