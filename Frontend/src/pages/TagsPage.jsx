import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { Tag, Plus, Trash2, Edit3, ShieldCheck, Hash, X, Check, Sparkles, ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const TagsPage = () => {
    const navigate = useNavigate();
    const [tags, setTags] = useState([]);
    const [tagName, setTagName] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);

    const allSuggestedTags = [
        "Artificial Intelligence", "Machine Learning", "Data Science", "Computer Vision",
        "Deep Learning", "Natural Language Processing", "Predictive Modeling", "Raw Data Pipelines",
        "Algorithm Optimization", "Data Analytics", "CI/CD Pipelines", "Docker & Containerization",
        "System Automation", "Database Optimization", "Cloud Infrastructure", "API Development",
        "Microservices", "Enterprise Architecture", "System Logs", "Spring Boot Backend",
        "Java Full Stack", "Python Automation", "JPA / Hibernate", "MySQL Database",
        "RESTful Services", "IoT & Embedded Systems", "Sustainable Energy", "FinTech",
        "EdTech", "HealthTech", "Cloud Computing", "Cybersecurity", "Web Development",
        "Mobile App Development", "E-Commerce Solutions", "Autonomous Systems", "Neural Networks"
    ];

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const fetchTags = useCallback(async () => {
        try {
            const response = await api.get('/tags');
            setTags(response.data || []);
        } catch (e) {
            console.error("Failed to fetch tags", e);
            setMessage({ text: 'Failed to load tags.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTags().catch((err) => console.error("Error in fetchTags:", err));
    }, [fetchTags]);

    const existingTagNames = new Set(tags.map(t => t.tagName?.trim().toLowerCase()));
    const suggestedTags = allSuggestedTags.filter(
        suggestion => !existingTagNames.has(suggestion.toLowerCase())
    );

    const handleCreateTag = async (e, customName = null) => {
        if (e) e.preventDefault();
        const nameToCreate = customName || tagName;
        if (!nameToCreate.trim()) return;

        try {
            await api.post('/tags', { tagName: nameToCreate.trim() });
            setTagName('');
            setMessage({ text: 'Tag created successfully and saved to database!', type: 'success' });
            await fetchTags();
        } catch (e) {
            console.error("Failed to create tag", e);
            setMessage({ text: 'Failed to create tag. It might already exist.', type: 'error' });
        }
    };

    const startEdit = (tag) => {
        setEditingId(tag.tagId || tag.id);
        setEditName(tag.tagName);
    };

    const handleUpdateTag = async (id) => {
        if (!editName.trim()) return;
        try {
            await api.put(`/tags/${id}`, { tagName: editName.trim() });
            setEditingId(null);
            setEditName('');
            setMessage({ text: 'Tag updated successfully!', type: 'success' });
            await fetchTags();
        } catch (e) {
            console.error("Failed to update tag", e);
            setMessage({ text: 'Failed to update tag.', type: 'error' });
        }
    };

    const handleDeleteTag = async (id) => {
        try {
            await api.delete(`/tags/${id}`);
            setMessage({ text: 'Tag deleted successfully!', type: 'success' });
            await fetchTags();
        } catch (e) {
            console.error("Failed to delete tag", e);
            setMessage({ text: 'Failed to delete tag.', type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex bg-slate-950 min-h-screen selection:bg-orange-500 selection:text-white text-slate-100 font-sans">
            {/* Sidebar with embedded Logout action */}
            <div className="flex flex-col justify-between border-r border-slate-800 bg-slate-950 shrink-0">
                <Sidebar />
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-2xl transition cursor-pointer"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            <main className="flex-1 p-10 bg-slate-950 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <Tag className="text-orange-500" size={32} /> Tags Management
                        </h1>
                        <p className="text-slate-400 mt-1">Create, customize, and manage system-wide categorical tags for your startups, AI projects, and systems.</p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <ArrowLeft size={14} className="text-orange-500" /> Back to Dashboard
                    </button>
                </header>

                <div className="max-w-4xl space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-medium border ${
                            message.type === 'success'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <Plus size={20} className="text-orange-500" /> Add Custom Tag
                        </h3>
                        <form onSubmit={(e) => handleCreateTag(e)} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Type any custom tag (e.g., Autonomous Systems, Neural Networks)..."
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer shadow-orange-500/20"
                            >
                                <Plus size={14} /> Create Custom Tag
                            </button>
                        </form>

                        <div className="pt-2">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-orange-500" /> Quick-Add Domain Recommendations:
                            </p>
                            {suggestedTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2">
                                    {suggestedTags.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => handleCreateTag(null, suggestion)}
                                            className="text-xs font-semibold px-3 py-1.5 bg-slate-950 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/30 text-slate-300 rounded-xl border border-slate-800 transition cursor-pointer"
                                        >
                                            + {suggestion}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 italic">All suggested tags have already been added to the database!</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                            <ShieldCheck size={20} className="text-orange-500" /> Available System Tags
                        </h3>

                        {loading ? (
                            <p className="text-xs text-slate-500 py-4 animate-pulse">Loading tags from database...</p>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-xs">
                                No tags found in database. Create your first tag above!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {tags.map((tag) => {
                                    const currentTagId = tag.tagId || tag.id;
                                    return (
                                        <div key={currentTagId} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/60 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                <div className="p-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl shrink-0">
                                                    <Hash size={16} />
                                                </div>
                                                {editingId === currentTagId ? (
                                                    <div className="flex items-center gap-1 flex-1">
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                                                        />
                                                        <button onClick={() => handleUpdateTag(currentTagId)} className="p-1.5 text-emerald-400 hover:bg-emerald-950/50 rounded-lg cursor-pointer transition" title="Save">
                                                            <Check size={16} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded-lg cursor-pointer transition" title="Cancel">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="truncate">
                                                        <span className="text-xs font-bold text-slate-200 block truncate">{tag.tagName}</span>
                                                        <p className="text-[10px] text-slate-500 truncate">{tag.createdByEmail || 'System Tag'}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {editingId !== currentTagId && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => startEdit(tag)}
                                                        className="p-2 text-slate-400 hover:text-orange-400 transition rounded-xl hover:bg-orange-500/10 cursor-pointer"
                                                        title="Edit Tag"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTag(currentTagId)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 transition rounded-xl hover:bg-rose-500/10 cursor-pointer"
                                                        title="Delete Tag"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TagsPage;