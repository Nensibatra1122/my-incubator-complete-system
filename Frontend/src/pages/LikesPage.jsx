import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Heart, Trash2, Mail, ClipboardList, MessageSquare, Sparkles, Send } from 'lucide-react';
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

    // Add new comment
    const handleAddComment = async (ideaId) => {
        const content = newCommentText[ideaId];
        if (!content || !content.trim()) return;

        try {
            const res = await api.post('/comments', {
                content,
                idea: { ideaId }
            });
            setComments([...comments, res.data]);
            setNewCommentText({ ...newCommentText, [ideaId]: '' });
            setMessage({ text: 'Comment added successfully!', type: 'success' });
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
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Heart className="text-rose-500 fill-rose-500" size={32} /> Activity & Comments Feed
                    </h1>
                    <p className="text-slate-500 mt-1">Monitor likes, startup ideas, and user comments in one unified place.</p>
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

                    {loading ? (
                        <p className="text-slate-500 text-center py-10 animate-pulse">Loading interaction stream...</p>
                    ) : activeIdeaIds.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                            <Heart className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500 font-medium">No activity or comments found yet.</p>
                        </div>
                    ) : (
                        activeIdeaIds.map((ideaId) => {
                            // Find corresponding likes and comments for this specific idea
                            const ideaLikes = likes.filter(l => (l.idea?.ideaId || l.ideaId) === ideaId);
                            const ideaComments = comments.filter(c => (c.idea?.ideaId || c.ideaId) === ideaId);

                            // Find idea details from embedded like/comment or fetched ideas list
                            const sampleLike = ideaLikes[0];
                            const sampleComment = ideaComments[0];
                            const fetchedIdea = ideas.find(i => i.ideaId === ideaId);

                            const ideaTitle = sampleLike?.idea?.title || sampleComment?.idea?.title || fetchedIdea?.title || `Idea #${ideaId}`;
                            const ideaDescription = sampleLike?.idea?.description || sampleComment?.idea?.description || fetchedIdea?.description || "No description provided.";

                            return (
                                <div key={ideaId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4">

                                    {/* Target Idea / Project Card Header */}
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 mb-1 uppercase tracking-wider">
                                            <ClipboardList size={14} /> Target Idea / Project
                                        </div>
                                        <h3 className="text-base font-extrabold text-slate-800">
                                            {ideaTitle}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {ideaDescription}
                                        </p>
                                    </div>

                                    {/* Likes Section Summary */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <Heart size={16} className="text-rose-500 fill-rose-500" /> Likes ({ideaLikes.length})
                                        </div>
                                        {ideaLikes.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {ideaLikes.map((like) => (
                                                    <div key={like.likeId} className="flex items-center justify-between bg-rose-50/50 px-3 py-1.5 rounded-xl border border-rose-100 text-xs gap-3">
                                                        <span className="font-semibold text-slate-700 flex items-center gap-1">
                                                            <Mail size={12} className="text-slate-400" />
                                                            {like.userEmail || (like.user && like.user.email) || 'Anonymous User'}
                                                        </span>
                                                        <button
                                                            onClick={() => handleDeleteLike(like.likeId)}
                                                            className="text-rose-400 hover:text-rose-600 transition"
                                                            title="Remove Like"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No likes on this idea yet.</p>
                                        )}
                                    </div>

                                    {/* Comments Section */}
                                    <div className="pt-3 border-t border-slate-100 space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                            <MessageSquare size={16} className="text-orange-500" /> Comments ({ideaComments.length})
                                        </div>

                                        {ideaComments.length > 0 ? (
                                            <div className="space-y-2">
                                                {ideaComments.map((comment) => (
                                                    <div key={comment.commentId} className="flex items-start justify-between bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-xs">
                                                        <div>
                                                            <span className="font-bold text-slate-800 mr-2">
                                                                {comment.user?.email || 'User'}:
                                                            </span>
                                                            <span className="text-slate-600">{comment.content}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.commentId)}
                                                            className="text-slate-400 hover:text-rose-600 transition ml-2"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No comments on this idea yet.</p>
                                        )}

                                        {/* Add Comment Input Box */}
                                        <div className="flex items-center gap-2 pt-2">
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={newCommentText[ideaId] || ''}
                                                onChange={(e) => setNewCommentText({ ...newCommentText, [ideaId]: e.target.value })}
                                                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                            />
                                            <button
                                                onClick={() => handleAddComment(ideaId)}
                                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                            >
                                                <Send size={14} /> Send
                                            </button>
                                        </div>
                                    </div>

                                    {/* Footer Status */}
                                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                                        <span>Idea ID: <strong className="text-slate-600">#{ideaId}</strong></span>
                                        <span className="px-3 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded-full border border-emerald-100 flex items-center gap-1">
                                            <Sparkles size={10} /> Active Engagement Stream
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