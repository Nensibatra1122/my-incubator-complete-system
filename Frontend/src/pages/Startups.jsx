import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { AlertCircle, Tag, ShieldAlert } from 'lucide-react';

const Startups = () => {
    const navigate = useNavigate();
    const [startups, setStartups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [errorMessage, setErrorMessage] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [startupToDelete, setStartupToDelete] = useState(null);

    // Robust Role and User Extraction
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || storedUser.role || '';
    const userRole = rawRole.replace('ROLE_', '').trim().toUpperCase();

    const userEmail = (localStorage.getItem('email') || localStorage.getItem('userEmail') || storedUser.email || '').toLowerCase().trim();
    const userId = storedUser.id || storedUser.userId || storedUser.mentorId || storedUser.investorId || localStorage.getItem('userId') || localStorage.getItem('investorId') || '';

    // Strict Admin check
    const isAdmin = userRole === 'ADMIN';

    const [newStartup, setNewStartup] = useState({
        programName: '',
        description: '',
        mentor: '',
        status: 'Active',
        startDate: '',
        ideaId: '',
        tagName: 'Artificial Intelligence'
    });

    useEffect(() => {
        let isMounted = true;

        const fetchStartups = async () => {
            try {
                if (isMounted) setLoading(true);

                let data = [];
                let progressData = [];

                try {
                    const endpoint = userRole === 'INVESTOR' ? `/incubations?role=INVESTOR&email=${encodeURIComponent(userEmail)}` : '/incubations';
                    const incubationsRes = await api.get(endpoint);
                    data = incubationsRes.data || [];
                } catch (err) {
                    console.error("Error fetching incubations:", err);
                }

                try {
                    const progressRes = await api.get('/progress');
                    progressData = progressRes.data || [];
                } catch (err) {
                    console.error("Error fetching progress (non-blocking):", err);
                }

                const progressMap = {};
                progressData.forEach(p => {
                    const sId = p.startupId || p.startup?.id || p.startup?.incubationId;
                    if (sId) {
                        progressMap[sId] = p.percentage ?? p.completionPercentage ?? 0;
                    }
                });

                const formatted = data.map((item, index) => {
                    const uniqueId = item.incubationId ?? item.id ?? (index + 1);
                    const tagInfo = item.tagName || item.tag?.tagName || item.idea?.tagName || item.idea?.tag?.tagName || item.idea?.category || 'General';

                    let mentorDisplay = 'Not Assigned';
                    let rawMentorValue = '';
                    let assignedMentorEmail = '';
                    let assignedMentorId = '';

                    if (item.mentor) {
                        if (typeof item.mentor === 'object') {
                            rawMentorValue = item.mentor.mentorId || item.mentor.id || '';
                            assignedMentorEmail = (item.mentor.email || item.mentor.user?.email || '').toLowerCase().trim();
                            assignedMentorId = String(item.mentor.mentorId || item.mentor.id || '');
                            mentorDisplay = item.mentor.name || item.mentor.user?.fullName || item.mentor.expertise || `Mentor ID #${rawMentorValue}`;
                        } else {
                            mentorDisplay = item.mentor;
                            rawMentorValue = item.mentor;
                            assignedMentorId = String(item.mentor);
                        }
                    }

                    if (item.mentorEmail) {
                        assignedMentorEmail = item.mentorEmail.toLowerCase().trim();
                    }

                    let assignedInvestorEmail = '';
                    let assignedInvestorId = '';
                    if (item.investor) {
                        assignedInvestorEmail = (item.investor.email || item.investor.user?.email || '').toLowerCase().trim();
                        assignedInvestorId = String(item.investor.investorId || item.investor.id || '');
                    }

                    const computedProgress = progressMap[uniqueId] ?? item.percentage ?? item.completionPercentage ?? 0;

                    return {
                        incubationId: uniqueId,
                        programName: item.programName ?? `Startup Project #${uniqueId}`,
                        description: item.description ?? 'Operational overview and milestone tracking for this incubated startup.',
                        mentor: mentorDisplay,
                        rawMentor: rawMentorValue,
                        assignedMentorEmail,
                        assignedMentorId,
                        assignedInvestorEmail,
                        assignedInvestorId,
                        status: item.status ?? 'Active',
                        startDate: item.startDate ?? '',
                        ideaId: item.idea?.ideaId ?? item.ideaId ?? '',
                        completionPercentage: computedProgress,
                        tagName: tagInfo
                    };
                });

                if (!isMounted) return;

                if (isAdmin) {
                    setStartups(formatted);
                } else if (userRole === 'MENTOR') {
                    const filtered = formatted.filter(s => {
                        const matchEmail = s.assignedMentorEmail && userEmail && s.assignedMentorEmail === userEmail;
                        const matchId = s.assignedMentorId && userId && String(s.assignedMentorId).trim() === String(userId).trim();
                        const matchName = s.mentor && storedUser.fullName && s.mentor.toLowerCase().includes(storedUser.fullName.toLowerCase());
                        return matchEmail || matchId || matchName;
                    });
                    setStartups(filtered);
                } else if (userRole === 'INVESTOR') {
                    const filtered = formatted.filter(s => {
                        const matchEmail = s.assignedInvestorEmail && userEmail && s.assignedInvestorEmail === userEmail;
                        const matchId = s.assignedInvestorId && userId && String(s.assignedInvestorId).trim() === String(userId).trim();
                        return matchEmail || matchId;
                    });
                    setStartups(filtered);
                } else {
                    setStartups(formatted);
                }

            } catch (error) {
                console.error("Error in fetchStartups:", error);
                if (isMounted) setStartups([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchStartups();

        return () => {
            isMounted = false;
        };
    }, [userRole, userEmail, userId, isAdmin, storedUser.fullName]);

    const handleOpenAddModal = () => {
        if (!isAdmin) {
            setErrorMessage("You do not have permission to add new startups.");
            return;
        }
        setIsEditing(false);
        setCurrentId(null);
        setNewStartup({ programName: '', description: '', mentor: '', status: 'Active', startDate: '', ideaId: '', tagName: 'Artificial Intelligence' });
        setShowAddModal(true);
    };

    const handleOpenEditModal = (startup, e) => {
        e.stopPropagation();
        if (!isAdmin) {
            setErrorMessage("You do not have permission to edit startups.");
            return;
        }
        setIsEditing(true);
        setCurrentId(startup.incubationId);

        let mentorVal = '';
        if (startup.rawMentor) {
            mentorVal = startup.rawMentor;
        } else if (startup.mentor && startup.mentor !== 'Not Assigned') {
            mentorVal = startup.mentor;
        }

        setNewStartup({
            programName: startup.programName || '',
            description: startup.description || '',
            mentor: mentorVal,
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
            setErrorMessage("Failed to delete startup. Make sure you have ADMIN rights.");
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
                if (!isNaN(val)) {
                    mentorPayload = { mentorId: val };
                }
            }

            const payload = {
                programName: newStartup.programName,
                description: newStartup.description,
                startDate: newStartup.startDate,
                status: newStartup.status,
                mentor: mentorPayload,
                idea: newStartup.ideaId ? { ideaId: Number(newStartup.ideaId) } : null,
                tagName: newStartup.tagName
            };

            if (isEditing) {
                await api.put(`/incubations/${currentId}`, payload);
            } else {
                await api.post('/incubations', payload);
            }

            setShowAddModal(false);
            setNewStartup({ programName: '', description: '', mentor: '', status: 'Active', startDate: '', ideaId: '', tagName: 'Artificial Intelligence' });
            window.location.reload();
        } catch (error) {
            console.error("Error saving startup:", error);
            const errorMsg = error.response?.data?.error || "Failed to save startup. Please check your inputs.";
            setErrorMessage(errorMsg);
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-slate-600 font-semibold text-lg animate-pulse">Loading Startups Directory & Progress...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 min-h-screen relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                {errorMessage && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
                            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={30} />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Notice</h3>
                            <p className="text-slate-600 text-sm mb-6 leading-relaxed">{errorMessage}</p>
                            <button
                                onClick={() => setErrorMessage('')}
                                className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-extrabold text-slate-900">Incubated Startups Directory</h1>
                            <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                                {userRole || 'USER'} Portal
                            </span>
                        </div>
                        <p className="text-slate-500 mt-1">Manage, inspect, and track operational status and progress of your assigned projects.</p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm transition cursor-pointer"
                        >
                            <span className="text-xl">+</span> Add Startup
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {startups.length > 0 ? (
                        startups.map((startup) => {
                            const routeId = startup.incubationId;
                            return (
                                <div
                                    key={routeId}
                                    onClick={() => navigate(`/startup-details/${routeId}`)}
                                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-orange-200 transition cursor-pointer flex flex-col justify-between group"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-orange-50 text-orange-600 rounded-full">
                                                    {startup.status}
                                                </span>
                                                {startup.tagName && (
                                                    <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1">
                                                        <Tag size={10} className="text-orange-500" /> {startup.tagName}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-semibold text-slate-400">ID: #{routeId}</span>
                                                {isAdmin && (
                                                    <>
                                                        <button
                                                            onClick={(e) => handleOpenEditModal(startup, e)}
                                                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteClick(routeId, e)}
                                                            className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-orange-600 transition">{startup.programName}</h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 mb-2">{startup.description}</p>
                                        {startup.startDate && (
                                            <p className="text-xs font-medium text-slate-400 mb-2">Start Date: <span className="text-slate-700 font-semibold">{startup.startDate}</span></p>
                                        )}
                                        <p className="text-xs font-medium text-slate-400 mb-6">Assigned Mentor: <span className="text-slate-700 font-semibold">{startup.mentor}</span></p>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                        <div className="w-1/2 pr-4">
                                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                                <span>Milestone Progress</span>
                                                <span>{startup.completionPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                <div
                                                    className="bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.min(Math.max(startup.completionPercentage, 0), 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <span className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold group-hover:bg-orange-600 transition shadow-sm">
                                            View Project
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-2 bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
                            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                                i
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No Relevant Startups Found</h3>
                            <p className="text-slate-500 text-sm">No incubated startup records are currently assigned to your investor account.</p>
                        </div>
                    )}
                </div>

                {showAddModal && isAdmin && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                            <h2 className="text-xl font-extrabold text-slate-900 mb-6">
                                {isEditing ? 'Edit Incubated Startup' : 'Add New Incubated Startup'}
                            </h2>
                            <form onSubmit={handleSaveStartup} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Program / Project Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.programName}
                                        onChange={(e) => setNewStartup({...newStartup, programName: e.target.value})}
                                        placeholder="Enter project name..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                                    <textarea
                                        rows="4"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.description}
                                        onChange={(e) => setNewStartup({...newStartup, description: e.target.value})}
                                        placeholder="Enter detailed project overview..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Idea ID</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.ideaId}
                                        onChange={(e) => setNewStartup({...newStartup, ideaId: e.target.value})}
                                        placeholder="Enter corresponding valid Idea ID..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Select Tag / Category</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.startDate}
                                        onChange={(e) => setNewStartup({...newStartup, startDate: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Mentor ID</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.mentor}
                                        onChange={(e) => setNewStartup({...newStartup, mentor: e.target.value})}
                                        placeholder="Enter mentor ID..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status / Phase</label>
                                    <select
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-slate-800"
                                        value={newStartup.status}
                                        onChange={(e) => setNewStartup({...newStartup, status: e.target.value})}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="In-Progress">In-Progress</option>
                                        <option value="PROTOTYPING">Prototyping</option>
                                        <option value="MARKET ANALYSIS">Market Analysis</option>
                                        <option value="BETA TESTING">Beta Testing</option>
                                        <option value="DEPLOYMENT">Deployment</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="px-5 py-3 text-slate-500 hover:bg-slate-100 rounded-2xl text-sm font-bold transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
                                    >
                                        {isEditing ? 'Save Changes' : 'Create Startup'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showDeleteModal && isAdmin && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
                            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={30} />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Delete Startup Record</h3>
                            <p className="text-slate-500 text-sm mb-6">
                                Are you sure you want to delete this incubated startup? This action is permanent and cannot be undone.
                            </p>
                            <div className="flex justify-center gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-2xl text-sm font-bold transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-3.5 bg-rose-600 text-white hover:bg-rose-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-rose-600/25 cursor-pointer"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Startups;