import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Heart, MessageSquare, Send, Lightbulb, Trash2, Edit3, X } from 'lucide-react';
import api from '../api/axios';

const CommunityIdeas = () => {
    const [ideas, setIdeas] = useState([]);
    const [likes, setLikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentUser, setCurrentUser] = useState(null);

    // States for adding or editing comments
    const [newCommentText, setNewCommentText] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Fetch public ideas, likes, comments, and current logged-in user profile/data
    useEffect(() => {
        const fetchCommunityData = async () => {
            try {
                const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setCurrentUser(storedUser);

                const [ideasRes, likesRes, commentsRes] = await Promise.all([
                    api.get('/ideas').catch(() => ({ data: [] })),
                    api.get('/likes').catch(() => ({ data: [] })),
                    api.get('/comments').catch(() => ({ data: [] }))
                ]);

                const ideasData = Array.isArray(ideasRes.data)
                    ? ideasRes.data
                    : (ideasRes.data?.content || []);

                setIdeas(ideasData);
                setLikes(likesRes.data || []);
                setComments(commentsRes.data || []);
            } catch (e) {
                console.error("Failed to load community ideas", e);
                setMessage({ text: 'Failed to load community feed.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchCommunityData();
    }, []);

    // Filter out rejected ideas
    const publicIdeas = ideas.filter(idea => {
        const status = (idea.status || '').toUpperCase();
        return status !== 'REJECTED';
    });

    // Handle Like / Unlike toggle
    const handleToggleLike = async (ideaId) => {
        try {
            const existingLike = likes.find(l => (l.idea?.ideaId || l.ideaId) === ideaId);

            if (existingLike) {
                await api.delete(`/likes/${existingLike.likeId}`);
                setLikes(likes.filter(l => l.likeId !== existingLike.likeId));
            } else {
                const res = await api.post('/likes', { idea: { ideaId } });
                setLikes([...likes, res.data]);
            }
        } catch (e) {
            console.error("Failed to update like status", e);
            setMessage({ text: 'Action failed. Please make sure you are logged in.', type: 'error' });
        }
    };

    // Handle Add Comment
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
            setMessage({ text: 'Comment posted successfully!', type: 'success' });
        } catch (e) {
            console.error("Failed to post comment", e);
            setMessage({ text: 'Failed to post comment. Please login.', type: 'error' });
        }
    };

    // Handle Delete Comment
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

    // Start Editing Comment
    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.commentId);
        setEditContent(comment.content);
    };

    // Save Edited Comment
    const handleUpdateComment = async (commentId) => {
        if (!editContent || !editContent.trim()) return;

        try {
            const res = await api.put(`/comments/${commentId}`, {
                content: editContent
            });

            setComments(comments.map(c => c.commentId === commentId ? (res.data || { ...c, content: editContent }) : c));
            setEditingCommentId(null);
            setEditContent('');
            setMessage({ text: 'Comment updated successfully!', type: 'success' });
        } catch (e) {
            console.error("Failed to update comment", e);
            setComments(comments.map(c => c.commentId === commentId ? { ...c, content: editContent } : c));
            setEditingCommentId(null);
            setMessage({ text: 'Comment updated locally.', type: 'success' });
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Lightbulb className="text-orange-500" size={32} /> Community Ideas & Discussions
                    </h1>
                    <p className="text-slate-500 mt-1">Explore startup concepts, engage with likes, and share discussions with peers.</p>
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
                        <p className="text-slate-500 text-center py-10 animate-pulse">Loading community feed...</p>
                    ) : publicIdeas.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                            <Lightbulb className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500 font-medium">No public startup ideas available right now.</p>
                        </div>
                    ) : (
                        publicIdeas.map((idea) => {
                            const ideaId = idea.ideaId || idea.id;
                            const ideaLikes = likes.filter(l => (l.idea?.ideaId || l.idea?.id || l.ideaId) === ideaId);
                            const ideaComments = comments.filter(c => (c.idea?.ideaId || c.idea?.id || c.ideaId) === ideaId);
                            const isLiked = ideaLikes.length > 0;

                            return (
                                <div key={ideaId} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition space-y-4">

                                    {/* Idea Header & Content */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="px-3 py-1 bg-orange-50 text-orange-600 font-bold text-xs rounded-full border border-orange-100 uppercase tracking-wide">
                                                {idea.status || 'Active'}
                                            </span>
                                            <span className="text-xs text-slate-400">ID: #{ideaId}</span>
                                        </div>
                                        <h3 className="text-lg font-extrabold text-slate-900">{idea.title}</h3>
                                        <p className="text-sm text-slate-600 mt-1">{idea.description}</p>
                                    </div>

                                    {/* Interaction Action Bar */}
                                    <div className="flex items-center gap-6 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleToggleLike(ideaId)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                                                isLiked
                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            <Heart size={16} className={isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'} />
                                            <span>{ideaLikes.length} Likes</span>
                                        </button>

                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <MessageSquare size={16} className="text-orange-500" />
                                            <span>{ideaComments.length} Comments</span>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="space-y-3 pt-2">
                                        {ideaComments.length > 0 && (
                                            <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                                                {ideaComments.map((comment) => {
                                                    const commentOwnerEmail = comment.user?.email || comment.userEmail;

                                                    const isOwnerOrAdmin = currentUser && currentUser.email && commentOwnerEmail && (
                                                        commentOwnerEmail === currentUser.email ||
                                                        currentUser.role === 'ADMIN' ||
                                                        currentUser.roles?.includes('ADMIN') ||
                                                        currentUser.authorities?.some(a => a.authority === 'ROLE_ADMIN' || a.authority === 'ADMIN')
                                                    );

                                                    return (
                                                        <div key={comment.commentId} className="py-2 border-b border-slate-200/60 last:border-none text-xs">
                                                            {editingCommentId === comment.commentId ? (
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="w-full px-3 py-2 bg-white rounded-xl border border-orange-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleUpdateComment(comment.commentId)}
                                                                            className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingCommentId(null)}
                                                                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition flex items-center gap-1"
                                                                        >
                                                                            <X size={12} /> Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <span className="font-bold text-slate-800 mr-2">
                                                                            {commentOwnerEmail || 'User'}:
                                                                        </span>
                                                                        <span className="text-slate-600">{comment.content}</span>
                                                                    </div>

                                                                    {isOwnerOrAdmin && (
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <button
                                                                                onClick={() => handleStartEdit(comment)}
                                                                                className="p-1.5 text-slate-400 hover:text-blue-600 transition rounded-lg hover:bg-blue-50"
                                                                                title="Edit Comment"
                                                                            >
                                                                                <Edit3 size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteComment(comment.commentId)}
                                                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-rose-50"
                                                                                title="Delete Comment"
                                                                            >
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Input box to add a new comment */}
                                        <div className="flex items-center gap-2 pt-1">
                                            <input
                                                type="text"
                                                placeholder="Write your feedback or comment..."
                                                value={newCommentText[ideaId] || ''}
                                                onChange={(e) => setNewCommentText({ ...newCommentText, [ideaId]: e.target.value })}
                                                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                            />
                                            <button
                                                onClick={() => handleAddComment(ideaId)}
                                                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                                            >
                                                <Send size5={14} /> Post
                                            </button>
                                        </div>
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

export default CommunityIdeas;