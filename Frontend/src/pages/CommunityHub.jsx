import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { Heart, MessageSquare, Bookmark, Send, Sparkles, Loader2, Trash2, Lightbulb, ClipboardList, Mail, Layers, Activity } from 'lucide-react';
import api from '../api/axios';

const CommunityHub = () => {
    const [activeTab, setActiveTab] = useState('explore'); // 'explore' or 'activity'
    const [ideas, setIdeas] = useState([]);
    const [likes, setLikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentUser, setCurrentUser] = useState(null);

    // Interaction states
    const [commentTexts, setCommentTexts] = useState({});
    const [bookmarked, setBookmarked] = useState({});

    const fetchCommunityData = useCallback(async () => {
        try {
            const [ideasRes, likesRes, commentsRes] = await Promise.all([
                api.get('/ideas').catch(() => ({ data: [] })),
                api.get('/likes').catch(() => ({ data: [] })),
                api.get('/comments').catch(() => ({ data: [] }))
            ]);

            const ideasData = Array.isArray(ideasRes.data) ? ideasRes.data : (ideasRes.data?.content || []);
            setIdeas(ideasData);
            setLikes(Array.isArray(likesRes.data) ? likesRes.data : []);
            setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        } catch (err) {
            console.error("Failed to load community feed", err);
            setMessage({ text: 'Failed to load feed data.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setCurrentUser(storedUser);
            } catch (e) {
                console.error("Failed to parse user from localStorage", e);
            }
            await fetchCommunityData();
        };
        loadData();
    }, [fetchCommunityData]);

    const getUserIdentifier = (userObj) => {
        if (!userObj) return null;
        return userObj.email || userObj.userId || userObj.id || userObj.username;
    };

    // Toggle Like Handler
    const handleToggleLike = async (ideaId) => {
        const currentIdentifier = getUserIdentifier(currentUser);
        const existingLike = likes.find(l => {
            const lIdeaId = l.idea?.ideaId || l.idea?.id || l.ideaId;
            const lUserEmail = l.user?.email || l.userEmail || l.user?.userId || l.userId;
            return Number(lIdeaId) === Number(ideaId) && currentIdentifier && lUserEmail && (String(lUserEmail).toLowerCase() === String(currentIdentifier).toLowerCase());
        });

        if (existingLike) {
            setLikes(prev => prev.filter(l => (l.like_id || l.likeId || l.id) !== (existingLike.like_id || existingLike.likeId || existingLike.id)));
        } else {
            setLikes(prev => [...prev, { likeId: Date.now(), idea: { ideaId }, user: currentUser }]);
        }

        try {
            if (existingLike) {
                await api.delete(`/likes/${existingLike.like_id || existingLike.likeId || existingLike.id}`);
            } else {
                await api.post('/likes', { idea: { ideaId, id: ideaId } });
                await fetchCommunityData();
                return;
            }
        } catch (err) {
            console.error("Failed to update like", err);
            await fetchCommunityData();
        }
    };

    const toggleBookmark = (ideaId) => {
        setBookmarked(prev => ({ ...prev, [ideaId]: !prev[ideaId] }));
    };

    // Comment Handler
    const handleCommentSubmit = async (e, ideaId) => {
        e.preventDefault();
        const content = commentTexts[ideaId];
        if (!content || !content.trim()) return;

        try {
            const res = await api.post('/comments', { content, idea: { ideaId, id: ideaId } });
            setComments(prev => [...prev, res.data]);
            setCommentTexts(prev => ({ ...prev, [ideaId]: '' }));
            setMessage({ text: 'Comment posted successfully!', type: 'success' });
            await fetchCommunityData();
        } catch (err) {
            console.error("Failed to post comment", err);
            setMessage({ text: 'Failed to post comment.', type: 'error' });
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => (c.commentId || c.id) !== commentId));
            setMessage({ text: 'Comment deleted successfully!', type: 'success' });
        } catch (err) {
            console.error("Failed to delete comment", err);
            setMessage({ text: 'Failed to delete comment.', type: 'error' });
        }
    };

    const handleDeleteLike = async (id) => {
        try {
            await api.delete(`/likes/${id}`);
            setLikes(likes.filter(like => (like.likeId || like.id) !== id));
            setMessage({ text: 'Like removed successfully!', type: 'success' });
        } catch (e) {
            console.error("Failed to delete like", e);
            setMessage({ text: 'Failed to delete like.', type: 'error' });
        }
    };

    const publicIdeas = ideas.filter(idea => (idea.status || '').toUpperCase() !== 'ACTIVE');
    const activeIdeaIds = Array.from(new Set([
        ...likes.map(l => l.idea?.ideaId || l.ideaId),
        ...comments.map(c => c.idea?.ideaId || c.ideaId)
    ])).filter(Boolean);

    return (
        <div className="flex bg-[#0b0f19] min-h-screen text-slate-100 font-sans antialiased selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold tracking-wide uppercase mb-3 shadow-sm">
                            <Sparkles size={14} /> Community Hub
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                            <Lightbulb className="text-orange-500" size={34} /> Explore & Activity Feed
                        </h1>
                        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-2xl leading-relaxed">
                            Discover community concepts, track project interactions, and manage feedback in real-time.
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex items-center gap-1.5 bg-[#111827] p-1.5 rounded-2xl border border-slate-800/80 shadow-lg">
                        <button
                            onClick={() => setActiveTab('explore')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'explore'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            Explore Ideas
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                activeTab === 'activity'
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                            Liked & Activity Hub
                        </button>
                    </div>
                </header>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-2xl text-sm font-semibold border backdrop-blur-md shadow-lg flex items-center justify-between animate-fadeIn ${
                        message.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                    }`}>
                        <span>{message.text}</span>
                        <button onClick={() => setMessage({ text: '', type: '' })} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">Dismiss</button>
                    </div>
                )}

                {loading ? (
                    <div className="bg-[#111827]/60 border border-slate-800/80 rounded-3xl p-16 text-center shadow-2xl backdrop-blur-md">
                        <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={40} />
                        <p className="text-slate-400 font-medium tracking-wide">Syncing community hub...</p>
                    </div>
                ) : activeTab === 'explore' ? (
                    /* EXPLORE IDEAS TAB */
                    <div className="space-y-6 max-w-4xl">
                        {publicIdeas.length === 0 ? (
                            <div className="bg-[#111827]/60 border border-slate-800/80 rounded-3xl p-16 text-center shadow-xl">
                                <Lightbulb className="mx-auto text-slate-600 mb-3" size={48} />
                                <h3 className="text-lg font-bold text-white mb-1">No Ideas Available</h3>
                                <p className="text-slate-400 text-sm">Check back later for new community submissions.</p>
                            </div>
                        ) : (
                            publicIdeas.map((idea) => {
                                const ideaId = idea.ideaId || idea.id;
                                const ideaLikes = likes.filter(l => Number(l.idea?.ideaId || l.idea?.id || l.ideaId) === Number(ideaId));
                                const ideaComments = comments.filter(c => Number(c.idea?.ideaId || c.idea?.id || c.ideaId) === Number(ideaId));
                                const currentIdentifier = getUserIdentifier(currentUser);
                                const isLiked = ideaLikes.some(l => {
                                    const lUserEmail = l.user?.email || l.userEmail || l.user?.userId || l.userId;
                                    return currentIdentifier && lUserEmail && (String(lUserEmail).toLowerCase() === String(currentIdentifier).toLowerCase());
                                });
                                const isBookmarked = bookmarked[ideaId];

                                return (
                                    <div key={ideaId} className="bg-[#111827]/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-6 md:p-8 shadow-2xl hover:border-orange-500/40 transition-all space-y-6">
                                        <div className="flex items-center justify-between">
                                            <span className="px-3.5 py-1 bg-orange-500/10 text-orange-400 text-xs font-extrabold rounded-full uppercase border border-orange-500/20 shadow-sm">
                                                {idea.status || 'PENDING'}
                                            </span>
                                            <button onClick={() => toggleBookmark(ideaId)} className={`p-2.5 rounded-xl cursor-pointer transition ${isBookmarked ? 'text-orange-500 bg-orange-500/10 border border-orange-500/20' : 'text-slate-400 bg-[#0b0f19] border border-slate-800 hover:text-white'}`}>
                                                <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-white mb-2">{idea.title || idea.ideaTitle}</h2>
                                            <p className="text-slate-300 text-sm leading-relaxed">{idea.description || idea.projectDescription}</p>
                                        </div>
                                        <div className="flex items-center gap-4 pt-3 border-t border-slate-800/80">
                                            <button onClick={() => handleToggleLike(ideaId)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition shadow-sm ${isLiked ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' : 'bg-[#0b0f19] text-slate-300 border border-slate-800 hover:border-slate-700'}`}>
                                                <Heart size={18} className={isLiked ? 'fill-orange-500 text-orange-500' : 'text-slate-400'} />
                                                <span>{ideaLikes.length} Likes</span>
                                            </button>
                                        </div>

                                        {/* Comments Section */}
                                        <div className="space-y-3 pt-2">
                                            <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                                <MessageSquare size={16} className="text-orange-400" /> Community Discussions ({ideaComments.length})
                                            </div>
                                            {ideaComments.length > 0 && (
                                                <div className="space-y-2.5 bg-[#0b0f19]/70 p-4 rounded-2xl border border-slate-800/80 shadow-inner">
                                                    {ideaComments.map(c => {
                                                        const cId = c.commentId || c.id;
                                                        return (
                                                            <div key={cId} className="p-3.5 bg-[#111827] rounded-xl text-xs flex justify-between items-start gap-3 border border-slate-800/80">
                                                                <div>
                                                                    <span className="font-bold text-orange-400">{c.user?.email || c.userEmail || 'User'}: </span>
                                                                    <span className="text-slate-300 leading-relaxed">{c.content}</span>
                                                                </div>
                                                                <button onClick={() => handleDeleteComment(cId)} className="text-slate-500 hover:text-orange-400 cursor-pointer transition"><Trash2 size={14} /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <form onSubmit={(e) => handleCommentSubmit(e, ideaId)} className="flex gap-2 pt-2">
                                                <input
                                                    type="text"
                                                    value={commentTexts[ideaId] || ''}
                                                    onChange={(e) => setCommentTexts({ ...commentTexts, [ideaId]: e.target.value })}
                                                    placeholder="Write a constructive comment..."
                                                    className="flex-1 px-4 py-2.5 bg-[#0b0f19] border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition shadow-inner"
                                                />
                                                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/20 cursor-pointer transition">
                                                    <Send size={13} /> Send
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    /* LIKED & ACTIVITY HUB TAB */
                    <div className="space-y-6 max-w-4xl">
                        {activeIdeaIds.length === 0 ? (
                            <div className="bg-[#111827]/60 border border-slate-800/80 rounded-3xl p-16 text-center shadow-xl">
                                <Activity className="mx-auto text-slate-600 mb-3" size={48} />
                                <h3 className="text-lg font-bold text-white mb-1">No Activity Found</h3>
                                <p className="text-slate-400 text-sm">There are no likes or comments registered yet.</p>
                            </div>
                        ) : (
                            activeIdeaIds.map((ideaId) => {
                                const ideaLikes = likes.filter(l => (l.idea?.ideaId || l.ideaId) === ideaId);
                                const ideaComments = comments.filter(c => (c.idea?.ideaId || c.ideaId) === ideaId);
                                const fetchedIdea = ideas.find(i => i.ideaId === ideaId);

                                const ideaTitle = fetchedIdea?.title || `Idea #${ideaId}`;
                                const ideaDescription = fetchedIdea?.description || "No description provided.";

                                return (
                                    <div key={ideaId} className="bg-[#111827]/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 p-6 md:p-8 shadow-2xl space-y-6">

                                        {/* Project Card Header */}
                                        <div className="p-5 rounded-2xl bg-[#0b0f19] border border-slate-800/80 shadow-inner">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                                                    <ClipboardList size={15} /> Target Project / Idea
                                                </div>
                                                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-[#111827] text-slate-400 border border-slate-800">
                                                    ID: #{ideaId}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white tracking-wide">{ideaTitle}</h3>
                                            <p className="text-xs md:text-sm text-slate-400 mt-1.5 leading-relaxed">{ideaDescription}</p>
                                        </div>

                                        {/* Likes Breakdown */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <Heart size={16} className="text-orange-400 fill-orange-400" /> Likes Breakdown
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                    {ideaLikes.length} Total
                                                </span>
                                            </div>
                                            {ideaLikes.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {ideaLikes.map((like) => {
                                                        const userEmail = like.userEmail || like.user?.email || like.email || "User";
                                                        return (
                                                            <div key={like.likeId || like.id} className="flex items-center justify-between bg-[#0b0f19] px-3.5 py-2 rounded-xl border border-slate-800/80 text-xs gap-3 shadow-sm">
                                                                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                                                                    <Mail size={13} className="text-orange-400" /> {userEmail}
                                                                </span>
                                                                <button onClick={() => handleDeleteLike(like.likeId || like.id)} className="text-slate-500 hover:text-orange-400 p-1 rounded-lg cursor-pointer transition">
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic pl-1">No likes registered.</p>
                                            )}
                                        </div>

                                        {/* Community Discussions */}
                                        <div className="pt-4 border-t border-slate-800/80 space-y-4">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <MessageSquare size={16} className="text-orange-400" /> Community Discussions
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                                                    {ideaComments.length} Comments
                                                </span>
                                            </div>

                                            {ideaComments.length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {ideaComments.map((comment) => {
                                                        const cId = comment.commentId || comment.id;
                                                        return (
                                                            <div key={cId} className="flex items-start justify-between bg-[#0b0f19] p-3.5 rounded-2xl border border-slate-800/80 text-xs gap-3 shadow-inner">
                                                                <div className="space-y-1">
                                                                    <span className="font-bold text-orange-300 tracking-wide">
                                                                        {comment.user?.email || comment.userEmail || 'User'}:
                                                                    </span>
                                                                    <p className="text-slate-300 leading-relaxed">{comment.content}</p>
                                                                </div>
                                                                <button onClick={() => handleDeleteComment(cId)} className="text-slate-500 hover:text-orange-400 p-1.5 rounded-xl cursor-pointer transition">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-500 italic pl-1">No comments posted yet.</p>
                                            )}

                                            {/* Add Comment Input */}
                                            <form onSubmit={(e) => handleCommentSubmit(e, ideaId)} className="flex items-center gap-2 pt-2">
                                                <input
                                                    type="text"
                                                    placeholder="Write a constructive comment..."
                                                    value={commentTexts[ideaId] || ''}
                                                    onChange={(e) => setCommentTexts({ ...commentTexts, [ideaId]: e.target.value })}
                                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0f19] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition shadow-inner"
                                                />
                                                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-orange-600/25 cursor-pointer">
                                                    <Send size={13} /> Send
                                                </button>
                                            </form>
                                        </div>

                                        {/* Footer Status */}
                                        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
                                            <span className="flex items-center gap-1.5 font-mono text-slate-400">
                                                <Layers size={13} className="text-slate-500" /> REF: <strong className="text-slate-200">#{ideaId}</strong>
                                            </span>
                                            <span className="px-3 py-1 bg-emerald-950/80 text-emerald-400 font-semibold rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                                                <Sparkles size={11} className="text-emerald-400 animate-spin" /> Active Engagement Stream
                                            </span>
                                        </div>

                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunityHub;