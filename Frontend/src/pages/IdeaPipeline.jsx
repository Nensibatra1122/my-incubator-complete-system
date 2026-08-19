import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Lightbulb, Search, Plus, CheckCircle, XCircle, ArrowUpDown, Tag, Sparkles, Filter, Users, Briefcase, Rocket, X, ArrowLeft, HeartHandshake, Check, LogOut } from 'lucide-react';

const IdeaPipeline = () => {
    const navigate = useNavigate();
    const [ideas, setIdeas] = useState([]);
    const [filteredIdeas, setFilteredIdeas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters & Sorting States
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('ALL'); // ALL, PENDING, ACCEPTED, REJECTED
    const [sortOrder, setSortOrder] = useState('latest'); // latest, oldest

    // Modal States for Accepting Idea with Mentor & Investor
    const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
    const [selectedIdeaId, setSelectedIdeaId] = useState(null);
    const [mentorsList, setMentorsList] = useState([]);
    const [investorsList, setInvestorsList] = useState([]);
    const [selectedMentorId, setSelectedMentorId] = useState('');
    const [selectedInvestorId, setSelectedInvestorId] = useState('');

    // Dynamic Role-based Check for Admin / Investor Actions
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || storedUser.role || 'USER';
    const userRole = rawRole.replace('ROLE_', '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN';
    const isInvestor = userRole === 'INVESTOR';

    const userEmail = (localStorage.getItem('email') || localStorage.getItem('userEmail') || storedUser.email || '').toLowerCase().trim();
    const userId = storedUser.id || storedUser.userId || storedUser.investorId || localStorage.getItem('userId') || localStorage.getItem('investorId') || '';

    // Tracks which idea IDs the investor has already sent an interest request for in this session
    const [interestedIdeaIds, setInterestedIdeaIds] = useState([]);
    const [interestSubmitting, setInterestSubmitting] = useState(null);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        fetchIdeas();
        fetchDropdownData();
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
            const [ideasRes, incubationsRes] = await Promise.all([
                api.get('/ideas'),
                api.get('/incubations').catch(() => ({ data: [] }))
            ]);

            const ideasData = Array.isArray(ideasRes.data) ? ideasRes.data : (ideasRes.data.content || ideasRes.data.data || []);
            const incubationsData = Array.isArray(incubationsRes.data) ? incubationsRes.data : (incubationsRes.data.content || incubationsRes.data.data || []);

            const mergedIdeas = ideasData.map(idea => {
                const id = idea.ideaId || idea.id;

                const incubationMatch = incubationsData.find(inc => {
                    const incIdeaId = inc.ideaId || inc.idea?.ideaId || inc.idea?.id;
                    return incIdeaId == id;
                });

                if (incubationMatch) {
                    const resolvedMentor = incubationMatch.mentor?.name || incubationMatch.mentor?.fullName || incubationMatch.mentor?.username || incubationMatch.mentorName || idea.mentorName || null;
                    const resolvedInvestor = incubationMatch.investor?.user?.name || incubationMatch.investor?.name || incubationMatch.investorName || idea.investorName || null;

                    return {
                        ...idea,
                        mentorName: resolvedMentor,
                        investorName: resolvedInvestor || 'Not Assigned',
                        incubationId: incubationMatch.incubationId || incubationMatch.id,
                        isIncubated: true
                    };
                }

                return {
                    ...idea,
                    isIncubated: false
                };
            });

            setIdeas(mergedIdeas);
        } catch (error) {
            console.error('Error fetching ideas pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [mentorsRes, investorsRes] = await Promise.all([
                api.get('/mentors').catch(() => ({ data: [] })),
                api.get('/investors').catch(() => ({ data: [] }))
            ]);

            setMentorsList(Array.isArray(mentorsRes.data) ? mentorsRes.data : (mentorsRes.data?.content || []));
            setInvestorsList(Array.isArray(investorsRes.data) ? investorsRes.data : (investorsRes.data?.content || []));
        } catch (error) {
            console.error('Error fetching mentors/investors:', error);
        }
    };

    // Open Modal for Accepting Idea
    const openAcceptModal = (e, id) => {
        e.stopPropagation();
        setSelectedIdeaId(id);
        setSelectedMentorId('');
        setSelectedInvestorId('');
        setIsAcceptModalOpen(true);
    };

    // Submit Acceptance with Selected Mentor & Investor
    const handleConfirmAccept = async () => {
        try {
            await api.put(`/ideas/${selectedIdeaId}/status`, {
                status: "ACCEPTED",
                mentorId: selectedMentorId ? Number(selectedMentorId) : null,
                investorId: selectedInvestorId ? Number(selectedInvestorId) : null
            });
            setIsAcceptModalOpen(false);
            fetchIdeas();
        } catch (error) {
            console.error('Error accepting idea:', error);
        }
    };

    // Quick Admin Status Update Handler for Rejection
    const handleStatusChange = async (e, id, newStatus) => {
        e.stopPropagation();
        try {
            await api.put(`/ideas/${id}/status`, { status: newStatus });
            setIdeas(ideas.map(idea =>
                (idea.ideaId === id || idea.id === id) ? { ...idea, status: newStatus } : idea
            ));
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const showNotice = (msg) => {
        setNotice(msg);
        setTimeout(() => setNotice(''), 4000);
    };

    // Investor expresses interest directly on an idea (Ab yeh Pending aur Rejected dono par kaam karega)
    const handleExpressIdeaInterest = async (e, id) => {
        e.stopPropagation();
        if (!isInvestor || interestedIdeaIds.includes(id)) return;

        setInterestSubmitting(id);
        try {
            await api.post('/investor-interests', {
                investorId: userId || null,
                investorEmail: userEmail,
                ideaId: id,
                status: 'PENDING_APPROVAL'
            });
            setInterestedIdeaIds(prev => [...prev, id]);
            showNotice('Aapka interest is idea par admin ko bhej diya gaya hai. Woh jald review karenge.');
        } catch (error) {
            console.error('Error expressing idea interest:', error);
            showNotice('Interest bhejne mein masla hua, dobara koshish karein.');
        } finally {
            setInterestSubmitting(null);
        }
    };

    // Logout Handler function
    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white">
            {/* Sidebar with embedded Logout action support */}
            <div className="flex flex-col justify-between border-r border-slate-800 bg-slate-900">
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

            <main className="flex-1 p-8 overflow-y-auto">

                {/* Toast Notification */}
                {notice && (
                    <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 max-w-sm animate-in fade-in">
                        <HeartHandshake className="text-emerald-400 shrink-0" size={22} />
                        <p className="text-sm font-semibold">{notice}</p>
                    </div>
                )}

                {/* Back to Dashboard Navigation Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-slate-800/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Idea Pipeline & Community Review</h1>
                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 flex items-center gap-1">
                                <Sparkles size={12} /> Innovation Hub
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">Explore cutting-edge startup concepts, share constructive feedback, and collaborate with visionary innovators.</p>
                    </div>
                    {!isInvestor && (
                        <button
                            onClick={() => navigate('/submit-idea')}
                            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 cursor-pointer shrink-0"
                        >
                            <Plus size={18} /> Submit New Idea
                        </button>
                    )}
                </div>

                {/* Search, Filter Tabs & Sorting Toolbar */}
                <div className="bg-slate-800/50 border border-slate-800 p-6 rounded-3xl shadow-xl backdrop-blur-xl mb-8 space-y-5">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-[420px]">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search ideas by title or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl text-sm focus:outline-none focus:border-orange-500 text-white placeholder-slate-500 transition"
                            />
                        </div>

                        {/* Sorting Dropdown */}
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="flex items-center gap-2 bg-slate-900 px-4 py-3.5 rounded-2xl border border-slate-700/80">
                                <ArrowUpDown size={16} className="text-orange-400" />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                    className="bg-transparent text-slate-200 text-sm font-semibold focus:outline-none cursor-pointer"
                                >
                                    <option value="latest" className="bg-slate-900 text-slate-200">Sort by: Latest First</option>
                                    <option value="oldest" className="bg-slate-900 text-slate-200">Sort by: Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mr-2">
                            <Filter size={14} className="text-orange-400" /> Filter Status:
                        </div>
                        {['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedTab(tab)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                                    selectedTab === tab
                                        ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-transparent shadow-lg shadow-orange-500/20'
                                        : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:bg-slate-900 hover:text-slate-200'
                                }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ideas List Container */}
                <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/80">
                        <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                            Available Startup Concepts
                            <span className="text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                                {filteredIdeas.length}
                            </span>
                        </h2>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-slate-400 font-semibold animate-pulse flex flex-col items-center gap-3">
                            <div className="w-8 h-8 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></div>
                            Loading idea pipeline...
                        </div>
                    ) : filteredIdeas.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-semibold flex flex-col items-center gap-2">
                            <Lightbulb size={36} className="text-slate-600 mb-1" />
                            No ideas found matching your criteria.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredIdeas.map((idea) => {
                                const id = idea.ideaId || idea.id;
                                const status = idea.status?.toUpperCase() || 'PENDING';

                                const displayTag = idea.tagName ||
                                    (typeof idea.tag === 'string' ? idea.tag : idea.tag?.tagName) ||
                                    idea.category ||
                                    idea.domain ||
                                    null;

                                const assignedMentor = idea.mentorName || null;
                                const assignedInvestor = idea.investorName || null;

                                const isAcceptedButNotInStartups = status === 'ACCEPTED' && !idea.isIncubated;
                                const alreadyInterested = interestedIdeaIds.includes(id);
                                const isSubmittingThis = interestSubmitting === id;

                                const getStatusBadge = (st) => {
                                    switch (st) {
                                        case 'ACCEPTED':
                                            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                        case 'REJECTED':
                                            return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                                        default:
                                            return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                    }
                                };

                                return (
                                    <div
                                        key={id}
                                        onClick={() => navigate(`/idea-details/${id}`)}
                                        className="p-5 bg-slate-900/80 hover:bg-slate-900 rounded-2xl border border-slate-700/80 hover:border-slate-600 transition cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group shadow-md"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="p-3 bg-slate-800 text-orange-400 rounded-2xl shadow-sm border border-slate-700/80 mt-1 group-hover:scale-110 transition-transform">
                                                <Lightbulb size={22} />
                                            </div>
                                            <div className="space-y-1 w-full">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-extrabold text-white group-hover:text-orange-400 transition tracking-tight">
                                                        {idea.title}
                                                    </h3>
                                                    {displayTag && (
                                                        <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold rounded-lg border border-orange-500/20 flex items-center gap-1">
                                                            <Tag size={10} /> {displayTag}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-1">{idea.description}</p>

                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                                                    <p className="text-[11px] text-slate-500">
                                                        Submitted by: <span className="font-semibold text-slate-300">{idea.submitterName || idea.submittedBy || 'Innovator'}</span> • Click to view details, leave comments & collaborate.
                                                    </p>
                                                </div>

                                                {status === 'ACCEPTED' && (
                                                    <div className="mt-2.5 pt-2.5 border-t border-slate-800 space-y-2">
                                                        {isAcceptedButNotInStartups ? (
                                                            <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/15 w-full">
                                                                <Rocket size={14} className="shrink-0 text-amber-400" />
                                                                <span>This idea is accepted but not yet included in the active startups/incubation directory, so mentor and investor tags are not available.</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-wrap items-center gap-3 text-xs">
                                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                                                                    <Users size={13} />
                                                                    <span>Mentor: <strong className="text-white">{assignedMentor || 'Not Assigned'}</strong></span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                                                                    <Briefcase size={13} />
                                                                    <span>Investor: <strong className="text-white">{assignedInvestor || 'Not Assigned'}</strong></span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Investor Interest Button: Ab yeh Accepted ke ilawa (yani Pending aur Rejected dono par) nazar aayega jab investor login ho */}
                                                {isInvestor && status !== 'ACCEPTED' && (
                                                    <div className="pt-2.5" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleExpressIdeaInterest(e, id)}
                                                            disabled={alreadyInterested || isSubmittingThis}
                                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${
                                                                alreadyInterested
                                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                                                                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-500/30 shadow-lg shadow-emerald-900/30 cursor-pointer disabled:opacity-60'
                                                            }`}
                                                        >
                                                            {alreadyInterested ? (
                                                                <>
                                                                    <Check size={14} /> Interest Sent to Admin
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <HeartHandshake size={14} />
                                                                    {isSubmittingThis ? 'Sending...' : 'Express Investment Interest'}
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(status)}`}>
                                                {status}
                                            </span>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shadow-inner" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={(e) => openAcceptModal(e, id)}
                                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer"
                                                        title="Approve Idea Pipeline"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStatusChange(e, id, 'REJECTED')}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                                                        title="Reject Idea Pipeline"
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

                {/* Accept Modal with Mentor & Investor Dropdowns */}
                {isAcceptModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-700/80">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Rocket size={18} className="text-orange-400" /> Assign Mentor & Investor
                                </h3>
                                <button
                                    onClick={() => setIsAcceptModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Mentor Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                        <Users size={14} className="text-sky-400" /> Select Mentor
                                    </label>
                                    <select
                                        value={selectedMentorId}
                                        onChange={(e) => setSelectedMentorId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="">-- Choose Mentor (Optional) --</option>
                                        {mentorsList.length > 0 ? (
                                            mentorsList.map((mentor) => (
                                                <option key={mentor.mentorId || mentor.id} value={mentor.mentorId || mentor.id}>
                                                    {mentor.name || mentor.fullName || mentor.username || `Mentor #${mentor.mentorId || mentor.id}`}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled value="">No mentors available</option>
                                        )}
                                    </select>
                                </div>

                                {/* Investor Dropdown */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                                        <Briefcase size={14} className="text-purple-400" /> Select Investor
                                    </label>
                                    <select
                                        value={selectedInvestorId}
                                        onChange={(e) => setSelectedInvestorId(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="">-- Choose Investor (Optional) --</option>
                                        {investorsList.length > 0 ? (
                                            investorsList.map((investor) => (
                                                <option key={investor.investorId || investor.id} value={investor.investorId || investor.id}>
                                                    {investor.name || investor.fullName || investor.user?.name || `Investor #${investor.investorId || investor.id}`}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled value="">No investors available</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-700/80">
                                <button
                                    onClick={() => setIsAcceptModalOpen(false)}
                                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAccept}
                                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 transition"
                                >
                                    Confirm Acceptance
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default IdeaPipeline;