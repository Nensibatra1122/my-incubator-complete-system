import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { AlertCircle, Tag, X, Rocket, Briefcase, Calendar, ArrowRight } from 'lucide-react';

const Startups = () => {
    const navigate = useNavigate();
    const [startups, setStartups] = useState([]);
    const [mentorsList, setMentorsList] = useState([]);
    const [investorsList, setInvestorsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [startupToDelete, setStartupToDelete] = useState(null);

    const [debugInfo, setDebugInfo] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || storedUser.role || '';
    const userRole = rawRole.replace('ROLE_', '').trim().toUpperCase();

    const userEmail = (localStorage.getItem('email') || localStorage.getItem('userEmail') || storedUser.email || '').toLowerCase().trim();

    const userId = storedUser.id || storedUser.userId || storedUser.mentorId || storedUser.investorId ||
        localStorage.getItem('userId') || localStorage.getItem('mentorId') || localStorage.getItem('investorId') || '';

    const isAdmin = userRole === 'ADMIN' || userRole.includes('ADMIN');
    const isMentor = userRole.includes('MENTOR') || userRole === 'MENTOR';
    const isInvestor = userRole.includes('INVESTOR') || userRole === 'INVESTOR';
    const isStudent = userRole.includes('STUDENT') || userRole === 'STUDENT';

    const [newStartup, setNewStartup] = useState({
        programName: '',
        description: '',
        mentor: '',
        investor: '',
        status: 'Active',
        startDate: '',
        ideaId: '',
        tagName: 'Artificial Intelligence'
    });

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                if (isMounted) setLoading(true);

                let data = [];
                let mentorsData = [];
                let investorsData = [];

                try {
                    const endpoint = isStudent ? '/incubations/my' : '/incubations';
                    const incubationsRes = await api.get(endpoint);
                    data = incubationsRes.data || [];
                } catch (err) {
                    console.error("Error fetching incubations:", err);
                }

                try {
                    const mentorsRes = await api.get('/mentors');
                    mentorsData = mentorsRes.data || [];
                } catch (err) {
                    console.error("Error fetching mentors list:", err);
                }

                try {
                    const investorsRes = await api.get('/investors');
                    investorsData = investorsRes.data || [];
                } catch (err) {
                    console.error("Error fetching investors list:", err);
                }

                if (isMounted) {
                    setMentorsList(mentorsData);
                    setInvestorsList(investorsData);
                }

                // 🔒 STRICT CLIENT-SIDE SAFETY FILTER for students.
                // Backend '/incubations/my' may not be filtering correctly, so we
                // enforce it here too by matching the idea's creator (student).
                // IMPORTANT: unlike before, we do NOT fall back to showing
                // everything when a field is missing — that was the bug that let
                // every startup show up for every student.
                if (isStudent) {
                    // Debug: log the raw shape once so we can confirm the real
                    // field name backend uses for the creator/student reference.
                    if (data.length > 0) {
                        console.log("RAW incubation item (inspect this to find the correct student/creator field):", data[0]);
                    }

                    data = data.filter((item) => {
                        const idea = item.idea || {};
                        const studentObj = idea.student || item.student || {};

                        const creatorEmail = (
                            idea.studentEmail ||
                            idea.userEmail ||
                            idea.createdByEmail ||
                            idea.createdBy ||
                            idea.email ||
                            studentObj.email ||
                            studentObj.user?.email ||
                            studentObj.userEmail ||
                            item.studentEmail ||
                            item.userEmail ||
                            item.createdBy ||
                            ''
                        ).toString().toLowerCase().trim();

                        const creatorId = (
                            idea.studentId ||
                            studentObj.studentId ||
                            studentObj.id ||
                            studentObj.userId ||
                            item.studentId ||
                            ''
                        ).toString().trim();

                        const emailMatch = !!creatorEmail && !!userEmail && creatorEmail === userEmail;
                        const idMatch = !!creatorId && !!userId && creatorId === userId.toString();

                        return emailMatch || idMatch;
                    });
                }

                const formatted = data.map((item, index) => {
                    const uniqueId = item.incubationId || item.id || item.incubateId || item.startupId || item.incubation_id || (index + 1);
                    const tagInfo = item.tagName || item.tag?.tagName || item.idea?.tagName || item.idea?.tag?.tagName || item.idea?.category || 'General';

                    let mentorDisplay = 'Not Assigned';
                    let rawMentorValue = '';
                    let assignedMentorEmail = '';
                    let assignedMentorId = '';

                    if (item.mentor) {
                        if (typeof item.mentor === 'object') {
                            rawMentorValue = item.mentor.mentorId || item.mentor.id || '';
                            assignedMentorEmail = (item.mentor.email || item.mentor.user?.email || item.mentor.userEmail || '').toLowerCase().trim();
                            assignedMentorId = String(item.mentor.mentorId || item.mentor.id || '');
                            mentorDisplay = item.mentor.name || item.mentor.user?.fullName || item.mentor.expertise || `Mentor ID #${rawMentorValue}`;
                        } else {
                            mentorDisplay = `Mentor ID #${item.mentor}`;
                            rawMentorValue = item.mentor;
                            assignedMentorId = String(item.mentor);
                        }
                    }

                    let investorDisplay = 'Not Assigned';
                    let rawInvestorValue = '';
                    let assignedInvestorEmail = '';
                    let assignedInvestorId = '';

                    if (item.investor) {
                        if (typeof item.investor === 'object') {
                            rawInvestorValue = item.investor.investorId || item.investor.id || '';
                            assignedInvestorEmail = (item.investor.email || item.investor.user?.email || item.investor.userEmail || '').toLowerCase().trim();
                            assignedInvestorId = String(item.investor.investorId || item.investor.id || '');
                            investorDisplay = item.investor.name || item.investor.user?.fullName || `Investor ID #${rawInvestorValue}`;
                        } else {
                            investorDisplay = `Investor ID #${item.investor}`;
                            rawInvestorValue = item.investor;
                            assignedInvestorId = String(item.investor);
                        }
                    }

                    return {
                        incubationId: uniqueId,
                        programName: item.programName ?? `Startup Project #${uniqueId}`,
                        description: item.description ?? 'Operational overview and milestone tracking for this incubated startup.',
                        mentor: mentorDisplay,
                        investor: investorDisplay,
                        rawMentor: rawMentorValue,
                        rawInvestor: rawInvestorValue,
                        assignedMentorEmail,
                        assignedMentorId,
                        assignedInvestorEmail,
                        assignedInvestorId,
                        status: item.status ?? 'Active',
                        startDate: item.startDate ?? '',
                        ideaId: item.idea?.ideaId ?? item.ideaId ?? '',
                        tagName: tagInfo
                    };
                });

                if (!isMounted) return;

                const debugText = `Role: [${userRole}] | ID: [${userId}] | Email: [${userEmail}] | IsAdmin: ${isAdmin} | IsStudent: ${isStudent}`;
                setDebugInfo(debugText);
                console.log("DEBUG INFO:", debugText); // UI se hata diya, ab sirf console mein dikhega
                setStartups(formatted);

            } catch (error) {
                console.error("Error in fetchData:", error);
                if (isMounted) setStartups([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [userRole, userEmail, userId, isAdmin, isMentor, isInvestor, isStudent]);

    const handleOpenAddModal = async () => {
        if (!isAdmin) {
            setErrorMessage("You do not have permission to add new startups.");
            return;
        }
        try {
            const [mentorsRes, investorsRes] = await Promise.all([
                api.get('/mentors').catch(() => ({ data: [] })),
                api.get('/investors').catch(() => ({ data: [] }))
            ]);
            setMentorsList(mentorsRes.data || []);
            setInvestorsList(investorsRes.data || []);
        } catch (err) {
            console.error("Error refreshing lists", err);
        }

        setIsEditing(false);
        setCurrentId(null);
        setNewStartup({ programName: '', description: '', mentor: '', investor: '', status: 'Active', startDate: '', ideaId: '', tagName: 'Artificial Intelligence' });
        setShowAddModal(true);
    };

    const handleOpenEditModal = async (startup, e) => {
        e.stopPropagation();
        if (!isAdmin) {
            setErrorMessage("You do not have permission to edit startups.");
            return;
        }

        try {
            const [mentorsRes, investorsRes] = await Promise.all([
                api.get('/mentors').catch(() => ({ data: [] })),
                api.get('/investors').catch(() => ({ data: [] }))
            ]);
            setMentorsList(mentorsRes.data || []);
            setInvestorsList(investorsRes.data || []);
        } catch (err) {
            console.error("Error refreshing lists", err);
        }

        setIsEditing(true);
        setCurrentId(startup.incubationId);

        setNewStartup({
            programName: startup.programName || '',
            description: startup.description || '',
            mentor: startup.rawMentor || '',
            investor: startup.rawInvestor || '',
            status: startup.status || 'Active',
            startDate: startup.startDate || '',
            ideaId: startup.ideaId !== null && startup.ideaId !== undefined ? startup.ideaId : '',
            tagName: startup.tagName !== 'General' ? startup.tagName : 'Artificial Intelligence'
        });
        setShowAddModal(true);
    };

    const handleDeleteClick = (id, e) => {
        e.stopPropagation();
        if (!isAdmin) {
            setErrorMessage("Only Administrators can delete incubated startups.");
            return;
        }
        setStartupToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!startupToDelete || !isAdmin) return;
        try {
            await api.delete(`/incubations/${startupToDelete}`);
            setShowDeleteModal(false);
            setStartupToDelete(null);
            window.location.reload();
        } catch (error) {
            console.error("Error deleting startup:", error);
            setErrorMessage("Failed to delete startup.");
            setShowDeleteModal(false);
        }
    };

    const handleSaveStartup = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        try {
            let mentorPayload = null;
            if (newStartup.mentor && newStartup.mentor.toString().trim() !== '') {
                const val = Number(newStartup.mentor);
                if (!isNaN(val)) mentorPayload = { mentorId: val };
            }

            let investorPayload = null;
            if (newStartup.investor && newStartup.investor.toString().trim() !== '') {
                const val = Number(newStartup.investor);
                if (!isNaN(val)) investorPayload = { investorId: val };
            }

            const payload = {
                programName: newStartup.programName,
                description: newStartup.description,
                startDate: newStartup.startDate,
                status: newStartup.status,
                mentor: mentorPayload,
                investor: investorPayload,
                idea: newStartup.ideaId ? { ideaId: Number(newStartup.ideaId) } : null,
                tagName: newStartup.tagName
            };

            if (isEditing) {
                await api.put(`/incubations/${currentId}`, payload);
            } else {
                await api.post('/incubations', payload);
            }

            setShowAddModal(false);
            window.location.reload();
        } catch (error) {
            console.error("Error saving startup:", error);
            setErrorMessage("Failed to save startup. Please check inputs.");
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-900 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-orange-400 font-bold text-lg animate-pulse flex items-center gap-3">
                        <Rocket className="animate-bounce" size={24} /> Loading Incubation Ecosystem...
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                {errorMessage && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                            <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
                                <AlertCircle size={30} />
                            </div>
                            <h3 className="text-xl font-extrabold text-white mb-2">Notification</h3>
                            <p className="text-slate-300 text-sm mb-6 leading-relaxed">{errorMessage}</p>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-500/20 cursor-pointer"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}

                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                                <AlertCircle size={30} />
                            </div>
                            <h3 className="text-xl font-extrabold text-white mb-2">Are you sure?</h3>
                            <p className="text-slate-300 text-sm mb-6 leading-relaxed">Do you really want to delete this incubated startup? This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-sm font-bold transition cursor-pointer border border-slate-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-rose-900/30 cursor-pointer"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-10 flex-wrap gap-4 bg-slate-800/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-lg">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20">
                                <Rocket size={26} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Incubated Startups Directory</h1>
                        </div>
                        <p className="text-slate-400 text-sm">Monitor milestones, track portfolio growth, and manage investor & mentor collaborations.</p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-orange-500/20 cursor-pointer"
                        >
                            <Rocket size={16} /> Add New Startup
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {startups.length > 0 ? (
                        startups.map((startup) => (
                            <div
                                key={startup.incubationId}
                                onClick={() => navigate(`/startup-details/${startup.incubationId}`)}
                                className="bg-slate-800/80 hover:bg-slate-800 p-7 rounded-3xl border border-slate-700/80 shadow-xl hover:shadow-orange-500/10 hover:border-orange-500/50 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 flex items-center gap-1.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                                                {startup.status}
                                            </span>
                                            {startup.tagName && (
                                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-900/80 text-slate-300 rounded-full border border-slate-700 flex items-center gap-1">
                                                    <Tag size={10} className="text-orange-400" /> {startup.tagName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-semibold text-slate-400 bg-slate-900/50 px-2.5 py-1 rounded-lg border border-slate-700">ID: #{startup.incubationId}</span>
                                            {isAdmin && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => handleOpenEditModal(startup, e)} className="text-xs font-bold text-sky-400 hover:text-sky-300 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 transition">Edit</button>
                                                    <button onClick={(e) => handleDeleteClick(startup.incubationId, e)} className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition">Delete</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition tracking-wide">{startup.programName}</h3>
                                    <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">{startup.description}</p>

                                    <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/50 p-3.5 rounded-2xl border border-slate-700/60 text-xs">
                                        {startup.startDate && (
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Calendar size={14} className="text-orange-400 shrink-0" />
                                                <span>Start: <strong className="text-slate-200">{startup.startDate}</strong></span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Briefcase size={14} className="text-amber-400 shrink-0" />
                                            <span className="truncate">Mentor: <strong className="text-slate-200">{startup.mentor}</strong></span>
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
                                            <Briefcase size={14} className="text-emerald-400 shrink-0" />
                                            <span>Investor Partner: <strong className="text-slate-200">{startup.investor}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-700/80 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                        <Rocket size={14} className="text-orange-400" /> Click card or button to inspect details
                                    </span>
                                    <button className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/40">
                                        View Project <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-2 bg-slate-800/40 border border-slate-800 p-12 rounded-3xl text-center shadow-xl backdrop-blur-md">
                            <div className="w-16 h-16 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl border border-orange-500/20">
                                <Rocket size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">No Relevant Startups Found</h3>
                            <p className="text-slate-400 text-sm">No incubated startup records are currently assigned to your profile.</p>
                        </div>
                    )}
                </div>

                {showAddModal && isAdmin && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200">

                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition cursor-pointer border border-slate-700"
                            >
                                <X size={18} />
                            </button>

                            <h2 className="text-2xl font-extrabold text-white mb-6 tracking-tight flex items-center gap-2">
                                <Rocket className="text-orange-500" size={22} />
                                {isEditing ? 'Edit Incubated Startup' : 'Add New Incubated Startup'}
                            </h2>

                            <form onSubmit={handleSaveStartup} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Program / Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white placeholder-slate-600 transition"
                                        value={newStartup.programName}
                                        onChange={(e) => setNewStartup({...newStartup, programName: e.target.value})}
                                        placeholder="Enter project name..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                                    <textarea
                                        rows="3"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white placeholder-slate-600 transition"
                                        value={newStartup.description}
                                        onChange={(e) => setNewStartup({...newStartup, description: e.target.value})}
                                        placeholder="Enter detailed overview..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Idea ID</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white placeholder-slate-600 transition"
                                        value={newStartup.ideaId}
                                        onChange={(e) => setNewStartup({...newStartup, ideaId: e.target.value})}
                                        placeholder="Enter corresponding valid Idea ID..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Tag / Category</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white transition"
                                        value={newStartup.tagName}
                                        onChange={(e) => setNewStartup({...newStartup, tagName: e.target.value})}
                                    >
                                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                                        <option value="Robotics">Robotics</option>
                                        <option value="Sustainable Energy">Sustainable Energy</option>
                                        <option value="DataScience">DataScience</option>
                                        <option value="Computer Vision">Computer Vision</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Mentor</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white transition"
                                        value={newStartup.mentor}
                                        onChange={(e) => setNewStartup({...newStartup, mentor: e.target.value})}
                                    >
                                        <option value="">-- No Mentor Assigned --</option>
                                        {mentorsList.map((m) => (
                                            <option key={m.mentorId || m.id} value={m.mentorId || m.id}>
                                                {m.name || m.user?.fullName || `Mentor #${m.mentorId || m.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assign Investor Partner</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white transition"
                                        value={newStartup.investor}
                                        onChange={(e) => setNewStartup({...newStartup, investor: e.target.value})}
                                    >
                                        <option value="">-- No Investor Assigned --</option>
                                        {investorsList.map((inv) => (
                                            <option key={inv.investorId || inv.id} value={inv.investorId || inv.id}>
                                                {inv.name || inv.user?.fullName || `Investor #${inv.investorId || inv.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white transition"
                                        value={newStartup.status}
                                        onChange={(e) => setNewStartup({...newStartup, status: e.target.value})}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white transition"
                                        value={newStartup.startDate}
                                        onChange={(e) => setNewStartup({...newStartup, startDate: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-sm font-bold transition cursor-pointer border border-slate-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-500/20 cursor-pointer"
                                    >
                                        {isEditing ? 'Update Startup' : 'Save Startup'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Startups;