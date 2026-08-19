import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Heart, Trash2, Mail, ClipboardList, MessageSquare, Sparkles, Send, Activity, Layers } from 'lucide-react';
import api from '../api/axios';

const LikesPage = () => {
    const [likes, setLikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [newCommentText, setNewCommentText] = useState({});

    // Fetch likes, comments, and ideas simultaneously to map everything properly
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [likesRes, commentsRes, ideasRes] = await Promise.all([
                    api.get('/likes').catch(() => ({ data: [] })),
                    api.get('/comments').catch(() => ({ data: [] })),
                    api.get('/ideas').catch(() => ({ data: [] }))
                ]);
                setLikes(likesRes.data || []);
                setComments(commentsRes.data || []);
                setIdeas(ideasRes.data || []);
            } catch (e) {
                console.error("Failed to load activity feed", e);
                setMessage({ text: 'Failed to load activity feed data.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Delete a like
    const handleDeleteLike = async (id) => {
        try {
            await api.delete(`/likes/${id}`);
            setLikes(likes.filter(like => like.likeId !== id));
            setMessage({ text: 'Like removed successfully!', type: 'success' });
        } catch (e) {
            console.error("Failed to delete like", e);
            setMessage({ text: 'Failed to delete like. Unauthorized.', type: 'error' });
        }
    };

    // Delete a comment
    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(c => c.commentId !== commentId));
            setMessage({ text: 'Comment deleted successfully!', type: 'success' });
        } catch (e) {
            console.error("Failed to delete comment", e);
            setMessage({ text: 'Failed to delete comment. Unauthorized.', type: 'error' });
        }
    };

    // Add new comment with instant state sync
    const handleAddComment = async (ideaId) => {
        const content = newCommentText[ideaId];
        if (!content || !content.trim()) return;

        try {
            const res = await api.post('/comments', {
                content,
                idea: { ideaId }
            });

            setComments(prev => [...prev, res.data]);
            setNewCommentText({ ...newCommentText, [ideaId]: '' });
            setMessage({ text: 'Comment added successfully!', type: 'success' });

            const [likesRes, commentsRes, ideasRes] = await Promise.all([
                api.get('/likes').catch(() => ({ data: [] })),
                api.get('/comments').catch(() => ({ data: [] })),
                api.get('/ideas').catch(() => ({ data: [] }))
            ]);
            setLikes(likesRes.data || []);
            setComments(commentsRes.data || []);
            setIdeas(ideasRes.data || []);

        } catch (e) {
            console.error("Failed to add comment", e);
            setMessage({ text: 'Failed to add comment. Please login.', type: 'error' });
        }
    };

    // Combine unique ideas that have either a like or a comment
    const activeIdeaIds = Array.from(new Set([
        ...likes.map(l => l.idea?.ideaId || l.ideaId),
        ...comments.map(c => c.idea?.ideaId || c.ideaId)
    ])).filter(Boolean);

    return (
        <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-3">
                            <Activity size={13} /> Engagement Stream
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <Heart className="text-rose-500 fill-rose-500 animate-pulse" size={34} /> Activity & Comments Hub
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl">
                            Monitor live user interactions, evaluate community feedback, and moderate project discussions in real-time.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-inner">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-medium text-slate-300">System Operational</span>
                    </div>
                </header>

                <div className="max-w-4xl space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-semibold border backdrop-blur-md shadow-lg transition-all flex items-center justify-between ${
                            message.type === 'success'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                        }`}>
                            <span>{message.text}</span>
                            <button onClick={() => setMessage({ text: '', type: '' })} className="text-xs opacity-70 hover:opacity-100">Dismiss</button>
                        </div>
                    )}

                    {loading ? (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center shadow-xl backdrop-blur-md">
                            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                            <p className="text-slate-400 font-medium tracking-wide">Syncing interaction stream...</p>
                        </div>
                    ) : activeIdeaIds.length === 0 ? (
                        <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-16 text-center shadow-xl backdrop-blur-md">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <Heart size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">No Activity Found</h3>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">There are no likes or comments registered in the stream yet. Check back once engagement picks up.</p>
                        </div>
                    ) : (
                        activeIdeaIds.map((ideaId) => {
                            const ideaLikes = likes.filter(l => (l.idea?.ideaId || l.ideaId) === ideaId);
                            const ideaComments = comments.filter(c => (c.idea?.ideaId || c.ideaId) === ideaId);

                            const sampleLike = ideaLikes[0];
                            const sampleComment = ideaComments[0];
                            const fetchedIdea = ideas.find(i => i.ideaId === ideaId);

                            const ideaTitle = sampleLike?.idea?.title || sampleComment?.idea?.title || fetchedIdea?.title || `Idea #${ideaId}`;
                            const ideaDescription = sampleLike?.idea?.description || sampleComment?.idea?.description || fetchedIdea?.description || "No description provided.";

                            return (
                                <div key={ideaId} className="bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-800 p-6 md:p-8 shadow-2xl hover:border-indigo-500/40 transition-all duration-300 space-y-6">

                                    {/* Target Idea / Project Card Header */}
                                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 shadow-inner">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                                                <ClipboardList size={15} /> Target Project / Idea
                                            </div>
                                            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                                                ID: #{ideaId}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white tracking-wide">
                                            {ideaTitle}
                                        </h3>
                                        <p className="text-xs md:text-sm text-slate-400 mt-1.5 leading-relaxed">
                                            {ideaDescription}
                                        </p>
                                    </div>

                                    {/* Likes Section Summary */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <Heart size={16} className="text-indigo-400 fill-indigo-400" /> Likes Breakdown
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {ideaLikes.length} Total
                                            </span>
                                        </div>
                                        {ideaLikes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {ideaLikes.map((like) => {
                                                    const userEmailIdentifier = like.userEmail || like.user?.email || like.email || "User";
                                                    return userEmailIdentifier ? (
                                                        <div key={like.likeId} className="flex items-center justify-between bg-slate-950/50 px-3.5 py-2 rounded-xl border border-slate-800 text-xs gap-3 shadow-sm hover:border-slate-700 transition">
                                                            <span className="font-medium text-slate-200 flex items-center gap-1.5">
                                                                <Mail size={13} className="text-indigo-400" />
                                                                {userEmailIdentifier}
                                                            </span>
                                                            <button
                                                                onClick={() => handleDeleteLike(like.likeId)}
                                                                className="text-slate-500 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-900 transition"
                                                                title="Remove Like"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    ) : null;
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic pl-1">No likes registered on this project yet.</p>
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    <div className="pt-4 border-t border-slate-800 space-y-4">
                                        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare size={16} className="text-indigo-400" /> Community Discussions
                                            </div>
                                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {ideaComments.length} Comments
                                            </span>
                                        </div>

                                        {ideaComments.length > 0 ? (
                                            <div className="space-y-2.5">
                                                {ideaComments.map((comment) => (
                                                    <div key={comment.commentId} className="flex items-start justify-between bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800 text-xs gap-3 shadow-inner">
                                                        <div className="space-y-1">
                                                            <span className="font-bold text-indigo-300 tracking-wide">
                                                                {comment.user?.email || comment.userEmail || 'User'}:
                                                            </span>
                                                            <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.commentId)}
                                                            className="text-slate-500 hover:text-amber-400 p-1.5 rounded-xl hover:bg-slate-900 transition shrink-0"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic pl-1">No comments posted yet. Be the first to start the conversation.</p>
                                        )}

                                        {/* Add Comment Input Box */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="text"
                                                placeholder="Write a constructive comment..."
                                                value={newCommentText[ideaId] || ''}
                                                onChange={(e) => setNewCommentText({ ...newCommentText, [ideaId]: e.target.value })}
                                                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition shadow-inner"
                                            />
                                            <button
                                                onClick={() => handleAddComment(ideaId)}
                                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
                                            >
                                                <Send size={13} /> Send
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Status */}
                                    <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
                                        <span className="flex items-center gap-1.5 font-mono text-slate-400">
                                            <Layers size={13} className="text-slate-500" /> REF: <strong className="text-slate-200">#{ideaId}</strong>
                                        </span>
                                        <span className="px-3 py-1 bg-emerald-950/60 text-emerald-400 font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                                            <Sparkles size={11} className="text-emerald-400 animate-spin" /> Active Engagement Stream
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
};

export default LikesPage;