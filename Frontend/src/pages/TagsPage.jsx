import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { Tag, Plus, Trash2, Edit3, ShieldCheck, Hash, X, Check, Sparkles } from 'lucide-react';
import api from '../api/axios';

const TagsPage = () => {
    const [tags, setTags] = useState([]);
    const [tagName, setTagName] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(true);

    // Comprehensive list covering all technical domains, AI/ML, and Software Operations tracks
    const allSuggestedTags = [
        // AI, ML & Data Science
        "Artificial Intelligence",
        "Machine Learning",
        "Data Science",
        "Computer Vision",
        "Deep Learning",
        "Natural Language Processing",
        "Predictive Modeling",
        "Raw Data Pipelines",
        "Algorithm Optimization",
        "Data Analytics",

        // Software Operations & DevOps
        "CI/CD Pipelines",
        "Docker & Containerization",
        "System Automation",
        "Database Optimization",
        "Cloud Infrastructure",
        "API Development",
        "Microservices",
        "Enterprise Architecture",
        "System Logs",

        // Backend & Tech Stacks
        "Spring Boot Backend",
        "Java Full Stack",
        "Python Automation",
        "JPA / Hibernate",
        "MySQL Database",
        "RESTful Services",

        // Specialized Engineering
        "IoT & Embedded Systems",
        "Sustainable Energy",
        "FinTech",
        "EdTech",
        "HealthTech",
        "Cloud Computing",
        "Cybersecurity",
        "Web Development",
        "Mobile App Development",
        "E-Commerce Solutions",
        "Autonomous Systems",
        "Neural Networks"
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

    // Filter out tags that already exist in the database (case-insensitive check)
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
            setMessage({ text: 'Tag created successfully!', type: 'success' });
            await fetchTags();
        } catch (e) {
            console.error("Failed to create tag", e);
            setMessage({ text: 'Failed to create tag. It might already exist.', type: 'error' });
        }
    };

    const startEdit = (tag) => {
        setEditingId(tag.tagId);
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

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                            <Tag className="text-orange-500" size={32} /> Tags Management
                        </h1>
                        <p className="text-slate-500 mt-1">Create, customize, and manage system-wide categorical tags for your startups, AI projects, and systems.</p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                        Portal
                    </span>
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

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <Plus size={20} className="text-orange-500" /> Add Custom Tag
                        </h3>
                        <form onSubmit={(e) => handleCreateTag(e)} className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Type any custom tag (e.g., Autonomous Systems, Neural Networks)..."
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                            />
                            <button
                                type="submit"
                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm shrink-0 cursor-pointer"
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
                                            className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 text-slate-700 rounded-xl border border-slate-200 transition cursor-pointer"
                                        >
                                            + {suggestion}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">All suggested tags have already been added!</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-orange-500" /> Available System Tags
                        </h3>

                        {loading ? (
                            <p className="text-xs text-slate-400 py-4 animate-pulse">Loading tags...</p>
                        ) : tags.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                No tags found. Create your first tag above!
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                                {tags.map((tag) => (
                                    <div key={tag.tagId} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-2.5 flex-1">
                                            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl shrink-0">
                                                <Hash size={16} />
                                            </div>
                                            {editingId === tag.tagId ? (
                                                <div className="flex items-center gap-1 flex-1">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="w-full px-2 py-1 rounded border border-slate-300 text-xs font-semibold"
                                                    />
                                                    <button onClick={() => handleUpdateTag(tag.tagId)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-xs font-bold text-slate-900">{tag.tagName}</span>
                                                    <p className="text-[10px] text-slate-400">{tag.createdByEmail || 'System Tag'}</p>
                                                </div>
                                            )}
                                        </div>

                                        {editingId !== tag.tagId && (
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={() => startEdit(tag)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 transition rounded-xl hover:bg-orange-50 cursor-pointer"
                                                    title="Edit Tag"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTag(tag.tagId)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50 cursor-pointer"
                                                    title="Delete Tag"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TagsPage;