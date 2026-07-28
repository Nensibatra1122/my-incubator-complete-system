import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Lightbulb, Search, Plus, CheckCircle, XCircle, ArrowUpDown, Tag } from 'lucide-react';

const IdeaPipeline = () => {
    const navigate = useNavigate();
    const [ideas, setIdeas] = useState([]);
    const [filteredIdeas, setFilteredIdeas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Sorting States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('ALL'); // ALL, PENDING, ACCEPTED, REJECTED
    const [sortOrder, setSortOrder] = useState('latest'); // latest, oldest

    // Dynamic Role-based Check for Admin Status Actions
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || 'USER';
    const userRole = rawRole.replace('ROLE_', '').toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    useEffect(() => {
        fetchIdeas();
    }, []);

    useEffect(() => {
        let result = [...ideas];

        // 1. Search Filter
        if (searchQuery.trim() !== '') {
            result = result.filter(idea =>
                idea.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                idea.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 2. Status Tab Filter
        if (selectedTab !== 'ALL') {
            result = result.filter(idea => idea.status?.toUpperCase() === selectedTab);
        }

        // 3. Sorting
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.submissionDate || 0);
            const dateB = new Date(b.createdAt || b.submissionDate || 0);
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredIdeas(result);
    }, [ideas, searchQuery, selectedTab, sortOrder]);

    const fetchIdeas = async () => {
        try {
            const response = await api.get('/ideas');
            const data = Array.isArray(response.data) ? response.data : (response.data.content || response.data.data || []);
            setIdeas(data);
        } catch (error) {
            console.error('Error fetching ideas:', error);
        } finally {
            setLoading(false);
        }
    };

    // Quick Admin Status Update Handler
    const handleStatusChange = async (e, id, newStatus) => {
        e.stopPropagation(); // Card click event stop karne ke liye taake detail page open na ho
        try {
            await api.put(`/ideas/${id}/status`, { status: newStatus });
            // Local state update karein
            setIdeas(ideas.map(idea =>
                (idea.ideaId === id || idea.id === id) ? { ...idea, status: newStatus } : idea
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-10">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Idea Pipeline & Community Review</h1>
                        <p className="text-slate-500 text-sm mt-1">Explore startup concepts, share feedback, and collaborate with innovators.</p>
                    </div>
                    <button
                        onClick={() => navigate('/submit-idea')}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-lg shadow-orange-600/20 cursor-pointer"
                    >
                        <Plus size={20} /> Submit New Idea
                    </button>
                </div>

                {/* Search, Filter Tabs & Sorting Toolbar */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search ideas by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
                            />
                        </div>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <ArrowUpDown size={16} className="text-slate-400" />
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-2xl px-4 py-3 focus:outline-none focus:border-orange-500 transition cursor-pointer"
                            >
                                <option value="latest">Sort by: Latest First</option>
                                <option value="oldest">Sort by: Oldest First</option>
                            </select>
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    selectedTab === tab
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ideas List Container */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold text-slate-800">
                            Available Startup Concepts ({filteredIdeas.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Loading idea pipeline...</div>
                    ) : filteredIdeas.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-semibold">No ideas found matching your criteria.</div>
                    ) : (
                        <div className="space-y-4">
                            {filteredIdeas.map((idea) => {
                                const id = idea.ideaId || idea.id;
                                const status = idea.status?.toUpperCase() || 'PENDING';

                                // Enhanced Tag Fallback check
                                const displayTag = idea.tagName ||
                                    (typeof idea.tag === 'string' ? idea.tag : idea.tag?.tagName) ||
                                    idea.category ||
                                    idea.domain ||
                                    null;

                                // Status styling helper
                                const getStatusBadge = (st) => {
                                    switch (st) {
                                        case 'ACCEPTED':
                                            return 'bg-emerald-50 text-emerald-600 border-emerald-200';
                                        case 'REJECTED':
                                            return 'bg-red-50 text-red-600 border-red-200';
                                        default:
                                            return 'bg-amber-50 text-amber-600 border-amber-200';
                                    }
                                };

                                return (
                                    <div
                                        key={id}
                                        onClick={() => navigate(`/idea-details/${id}`)}
                                        className="p-5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white text-orange-500 rounded-2xl shadow-sm border border-slate-100 mt-1">
                                                <Lightbulb size={22} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-bold text-slate-900 group-hover:text-orange-600 transition">
                                                        {idea.title}
                                                    </h3>
                                                    {displayTag && (
                                                        <span className="px-2.5 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded-lg border border-orange-100 flex items-center gap-1">
                                                            <Tag size={10} /> {displayTag}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{idea.description}</p>
                                                <p className="text-[11px] text-slate-400 mt-2">
                                                    Submitted by: <span className="font-semibold text-slate-600">{idea.submitterName || idea.submittedBy || 'Innovator'}</span> • Click to view details, leave comments & collaborate.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                            {/* Status Badge */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(status)}`}>
                                                {status}
                                            </span>

                                            {/* Quick Admin Actions (Strictly visible to Admin only) */}
                                            {isAdmin && (
                                                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => handleStatusChange(e, id, 'ACCEPTED')}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                                        title="Approve Idea"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStatusChange(e, id, 'REJECTED')}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Reject Idea"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default IdeaPipeline;