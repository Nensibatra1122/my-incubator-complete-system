import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { Heart, MessageSquare, Bookmark, Send, Sparkles, Loader2, Edit3, Trash2, X, Lightbulb } from 'lucide-react';
import api from '../api/axios';

const CommunityIdeas = () => {
    const [ideas, setIdeas] = useState([]);
    const [likes, setLikes] = useState([]);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [currentUser, setCurrentUser] = useState(null);

    // Interaction states
    const [commentTexts, setCommentTexts] = useState({});
    const [bookmarked, setBookmarked] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const fetchCommunityData = useCallback(async () => {
        try {
            const [ideasRes, likesRes, commentsRes] = await Promise.all([
                api.get('/ideas').catch(() => ({ data: [] })),
                api.get('/likes').catch(() => ({ data: [] })),
                api.get('/comments').catch(() => ({ data: [] }))
            ]);

            const ideasData = Array.isArray(ideasRes.data)
                ? ideasRes.data
                : (ideasRes.data?.content || []);

            setIdeas(ideasData);
            setLikes(Array.isArray(likesRes.data) ? likesRes.data : []);
            setComments(Array.isArray(commentsRes.data) ? commentsRes.data : []);
        } catch (err) {
            console.error("Failed to load community feed", err);
            setMessage({ text: 'Failed to load community feed.', type: 'error' });
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

    // Filter out rejected ideas
    const publicIdeas = ideas.filter(idea => {
        const status = (idea.status || '').toUpperCase();
        return status !== 'REJECTED';
    });

    // Helper to extract unique identifier from user object
    const getUserIdentifier = (userObj) => {
        if (!userObj) return null;
        return userObj.email || userObj.userId || userObj.id || userObj.username;
    };

    // Robust Toggle Like Handler
    const handleToggleLike = async (ideaId) => {
        const currentIdentifier = getUserIdentifier(currentUser);

        // Find existing like for this idea by current user
        const existingLike = likes.find(l => {
            const lIdeaId = l.idea?.ideaId || l.idea?.id || l.ideaId;
            const lUserEmail = l.user?.email || l.userEmail;

            const isSameIdea = Number(lIdeaId) === Number(ideaId);
            const isSameUser = currentIdentifier && lUserEmail && (lUserEmail.toLowerCase() === currentIdentifier.toLowerCase());

            return isSameIdea && (isSameUser || !lUserEmail);
        });

        // Optimistic UI Update
        if (existingLike) {
            setLikes(prev => prev.filter(l => (l.like_id || l.likeId || l.id) !== (existingLike.like_id || existingLike.likeId || existingLike.id)));
        } else {
            const tempLike = {
                likeId: Date.now(),
                idea: { ideaId },
                user: currentUser
            };
            setLikes(prev => [...prev, tempLike]);
        }

        try {
            if (existingLike) {
                const likeIdToDelete = existingLike.like_id || existingLike.likeId || existingLike.id;
                await api.delete(`/likes/${likeIdToDelete}`);
            } else {
                // Sending exact payload structure matching Spring Boot @RequestBody Like entity
                await api.post('/likes', {
                    idea: {
                        ideaId: ideaId,
                        id: ideaId // Supporting both variations to avoid 400 Bad Request
                    }
                });
                await fetchCommunityData();
                return;
            }
        } catch (err) {
            console.error("Failed to update like status", err);
            setMessage({ text: 'Action failed. Please check your login status.', type: 'error' });
            await fetchCommunityData(); // Revert on failure
        }
    };

    // Bookmark Toggle Handler
    const toggleBookmark = (ideaId) => {
        setBookmarked(prev => ({ ...prev, [ideaId]: !prev[ideaId] }));
    };

    // Comment Submit Handler
    const handleCommentSubmit = async (e, ideaId) => {
        e.preventDefault();
        const content = commentTexts[ideaId];
        if (!content || !content.trim()) return;

        try {
            const res = await api.post('/comments', {
                content,
                idea: { ideaId, id: ideaId }
            });
            setComments(prev => [...prev, res.data]);
            setCommentTexts(prev => ({ ...prev, [ideaId]: '' }));
            setMessage({ text: 'Comment posted successfully!', type: 'success' });
        } catch (err) {
            console.error("Failed to post comment", err);
            setMessage({ text: 'Failed to post comment. Please login.', type: 'error' });
        }
    };

    // Delete Comment Handler
    const handleDeleteComment = async (commentId) => {
        try {
            await api.delete(`/comments/${commentId}`);
            setComments(prev => prev.filter(c => (c.commentId || c.id) !== commentId));
            setMessage({ text: 'Comment deleted successfully!', type: 'success' });
        } catch (err) {
            console.error("Failed to delete comment", err);
            setMessage({ text: 'Failed to delete comment. Unauthorized.', type: 'error' });
        }
    };

    // Update Comment Handlers
    const handleStartEdit = (comment) => {
        setEditingCommentId(comment.commentId || comment.id);
        setEditContent(comment.content);
    };

    const handleUpdateComment = async (commentId) => {
        if (!editContent || !editContent.trim()) return;

        try {
            const res = await api.put(`/comments/${commentId}`, {
                content: editContent
            });

            setComments(prev => prev.map(c => ((c.commentId || c.id) === commentId ? (res.data || { ...c, content: editContent }) : c)));
            setEditingCommentId(null);
            setEditContent('');
            setMessage({ text: 'Comment updated successfully!', type: 'success' });
        } catch (err) {
            console.error("Failed to update comment", err);
            setComments(prev => prev.map(c => ((c.commentId || c.id) === commentId ? { ...c, content: editContent } : c)));
            setEditingCommentId(null);
            setMessage({ text: 'Comment updated locally.', type: 'success' });
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans">
            <Sidebar />
            <main className="flex-1 p-10 max-w-5xl mx-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <Sparkles className="text-orange-500" size={32} /> Community Ideas & Discussions
                        </h1>
                        <p className="text-slate-500 mt-1">Explore startup concepts, engage with likes, and share discussions with peers.</p>
                    </div>
                </header>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-2xl text-sm font-medium border ${
                        message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}>
                        {message.text}
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <Loader2 className="animate-spin text-orange-500" size={40} />
                    </div>
                ) : publicIdeas.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
                        <Lightbulb className="mx-auto text-slate-300 mb-3" size={48} />
                        <p className="text-slate-500 font-medium">No public startup ideas available right now.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {publicIdeas.map((idea) => {
                            const ideaId = idea.ideaId || idea.id;

                            // Filter and deduplicate likes for this specific idea
                            const rawIdeaLikes = likes.filter(l => {
                                const lIdeaId = l.idea?.ideaId || l.idea?.id || l.ideaId;
                                return Number(lIdeaId) === Number(ideaId);
                            });

                            const uniqueLikesMap = new Map();
                            rawIdeaLikes.forEach(l => {
                                const userKey = l.user?.email || l.userEmail || l.like_id || l.likeId || l.id;
                                uniqueLikesMap.set(userKey, l);
                            });
                            const ideaLikes = Array.from(uniqueLikesMap.values());

                            // Filter comments for this specific idea
                            const ideaComments = comments.filter(c => {
                                const cIdeaId = c.idea?.ideaId || c.idea?.id || c.ideaId;
                                return Number(cIdeaId) === Number(ideaId);
                            });

                            const currentIdentifier = getUserIdentifier(currentUser);
                            const isLiked = ideaLikes.some(l => {
                                const lUserEmail = l.user?.email || l.userEmail;
                                return lUserEmail && currentIdentifier && lUserEmail.toLowerCase() === currentIdentifier.toLowerCase();
                            });

                            const isBookmarked = bookmarked[ideaId];

                            return (
                                <div key={ideaId} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 transition hover:shadow-md space-y-4">
                                    {/* Header / Status */}
                                    <div className="flex items-center justify-between">
                                        <span className="px-3 py-1 bg-orange-50 text-orange-600 text-xs font-bold rounded-full uppercase tracking-wider border border-orange-100">
                                            {idea.status || 'ACCEPTED'}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-slate-400">ID: #{ideaId}</span>
                                            <button
                                                onClick={() => toggleBookmark(ideaId)}
                                                className={`p-2 rounded-xl transition ${isBookmarked ? 'text-orange-500 bg-orange-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                                title="Bookmark Idea"
                                            >
                                                <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Title & Description */}
                                    <div>
                                        <h2 className="text-xl font-extrabold text-slate-900 mb-1">{idea.title || idea.ideaTitle}</h2>
                                        <p className="text-slate-600 text-sm leading-relaxed">{idea.description || idea.projectDescription}</p>
                                    </div>

                                    {/* Action Bar (Like & Comments Count) */}
                                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                                        <button
                                            onClick={() => handleToggleLike(ideaId)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition cursor-pointer ${
                                                isLiked
                                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                            }`}
                                        >
                                            <Heart
                                                size={18}
                                                className={`transition transform active:scale-125 ${isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`}
                                            />
                                            <span>{ideaLikes.length} Likes</span>
                                        </button>

                                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl font-bold text-sm">
                                            <MessageSquare size={18} className="text-orange-500" />
                                            <span>{ideaComments.length} Comments</span>
                                        </div>
                                    </div>

                                    {/* Comments Section */}
                                    <div className="space-y-3 pt-2">
                                        {ideaComments.length > 0 && (
                                            <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                                                {ideaComments.map((comment) => {
                                                    const commentId = comment.commentId || comment.id;
                                                    const commentOwnerEmail = comment.user?.email || comment.userEmail;
                                                    const isOwnerOrAdmin = currentUser && currentUser.email && commentOwnerEmail && (
                                                        commentOwnerEmail.toLowerCase() === currentUser.email.toLowerCase() ||
                                                        currentUser.role === 'ADMIN' ||
                                                        currentUser.roles?.includes('ADMIN') ||
                                                        currentUser.authorities?.some(a => a.authority === 'ROLE_ADMIN' || a.authority === 'ADMIN')
                                                    );

                                                    return (
                                                        <div key={commentId} className="py-2 border-b border-slate-200/60 last:border-none text-xs">
                                                            {editingCommentId === commentId ? (
                                                                <div className="space-y-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editContent}
                                                                        onChange={(e) => setEditContent(e.target.value)}
                                                                        className="w-full px-3 py-2 bg-white rounded-xl border border-orange-300 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                                                                    />
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleUpdateComment(commentId)}
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
                                                                                onClick={() => handleDeleteComment(commentId)}
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

                                        {/* Comment Input Form */}
                                        <form onSubmit={(e) => handleCommentSubmit(e, ideaId)} className="flex items-center gap-2 pt-1">
                                            <input
                                                type="text"
                                                value={commentTexts[ideaId] || ''}
                                                onChange={(e) => setCommentTexts({ ...commentTexts, [ideaId]: e.target.value })}
                                                placeholder="Write your feedback or comment..."
                                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700"
                                            />
                                            <button
                                                type="submit"
                                                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                                            >
                                                <Send size={14} /> Post
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CommunityIdeas;