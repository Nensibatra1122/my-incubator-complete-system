import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Code, Building2, DollarSign, Calendar, Mail, User, AlertCircle, Tag, FileText, X } from 'lucide-react';

const IdeaDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);

    // Assignment Modal State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [mentorsList, setMentorsList] = useState([]);
    const [investorsList, setInvestorsList] = useState([]);
    const [selectedMentor, setSelectedMentor] = useState('');
    const [selectedInvestor, setSelectedInvestor] = useState('');

    // Robust Custom Modal State
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Role-based check normalized properly with ROLE_ prefix handling
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || 'USER';
    const userRole = rawRole.replace('ROLE_', '').toUpperCase();
    const canManageStatus = userRole === 'ADMIN' || userRole === 'MENTOR';

    const showAlert = (title, message, type = 'success') => {
        setModalConfig({ show: true, title, message, type });
    };

    useEffect(() => {
        let isMounted = true;
        const cleanId = id ? id.split(':')[0] : id;

        const fetchIdeaDetails = async () => {
            try {
                const res = await api.get(`/ideas/${cleanId}`);
                if (isMounted) {
                    setIdea(res.data);
                }
            } catch (error) {
                console.error("Error fetching idea details from database:", error);
                if (isMounted) {
                    setIdea(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchIdeaDetails().catch(err => console.error(err));

        return () => {
            isMounted = false;
        };
    }, [id]);

    // Open Assignment Modal and fetch Mentors/Investors safely with multiple fallbacks
    const handleAcceptClick = async () => {
        try {
            let mentorsRes = { data: [] };
            try {
                mentorsRes = await api.get('/mentors');
            } catch {
                mentorsRes = await api.get('/users/mentors').catch(() => ({ data: [] }));
            }

            let investorsRes = { data: [] };
            try {
                investorsRes = await api.get('/investors');
            } catch {
                investorsRes = await api.get('/users/investors').catch(() => ({ data: [] }));
            }

            setMentorsList(mentorsRes.data || []);
            setInvestorsList(investorsRes.data || []);
        } catch (error) {
            console.error("Failed to load mentors/investors list:", error);
            setMentorsList([]);
            setInvestorsList([]);
        } finally {
            setShowAssignModal(true);
        }
    };

    const executeStatusUpdate = async (statusType, mentorId = null, investorId = null) => {
        const cleanId = id ? id.split(':')[0] : id;

        try {
            const payload = {
                status: statusType,
                ...(mentorId && { mentorId }),
                ...(investorId && { investorId })
            };

            const res = await api.put(`/ideas/${cleanId}/status`, payload);

            const serverMessage = res.data?.message || `Idea status updated successfully to ${statusType}`;

            if (statusType === 'ACCEPTED') {
                showAlert('Success!', 'Idea successfully accepted, and Mentor/Investor assigned!', 'success');
            } else if (statusType === 'REJECTED') {
                showAlert('Notice', 'Idea proposal has been rejected.', 'error');
            } else {
                showAlert('Status Updated', serverMessage, 'success');
            }

            setIdea(prev => prev ? { ...prev, status: statusType } : prev);
            setShowAssignModal(false);

        } catch (error) {
            console.error("Backend status update failed:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to update status on server.';
            showAlert('Action Failed', errorMsg, 'error');
        }
    };

    const handleActionClick = (actionType) => {
        if (actionType === 'ACCEPTED') {
            handleAcceptClick();
            return;
        }

        executeStatusUpdate('REJECTED').catch(err => console.error(err));
    };

    const handleModalClose = () => {
        const isSuccess = modalConfig.type === 'success';
        setModalConfig({ show: false, type: 'success', title: '', message: '' });
        if (isSuccess) {
            navigate('/idea-pipeline');
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-900 h-screen w-screen overflow-hidden text-slate-100 font-sans">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center bg-slate-950/50">
                    <Loader2 className="animate-spin text-orange-500" size={36} />
                </main>
            </div>
        );
    }

    if (!idea) {
        return (
            <div className="flex bg-slate-900 h-screen w-screen overflow-hidden text-slate-100 font-sans">
                <Sidebar />
                <main className="flex-1 p-10 flex flex-col items-center justify-center bg-slate-950/50">
                    <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4 shadow-inner">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-extrabold text-white mb-2">Idea Not Found</h2>
                    <p className="text-slate-400 text-sm mb-6 font-medium">Could not retrieve idea details from the database.</p>
                    <button
                        onClick={() => navigate('/idea-pipeline')}
                        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-500/25 cursor-pointer"
                    >
                        Back to Pipeline
                    </button>
                </main>
            </div>
        );
    }

    const displayTagName = idea.tagName || idea.tag?.tagName || idea.category || null;

    return (
        <div className="flex bg-slate-900 h-screen w-screen overflow-hidden text-slate-100 selection:bg-orange-500 selection:text-white font-sans">
            {/* Custom Popup Modal */}
            {modalConfig.show && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center relative transform transition-all scale-100">
                        <button
                            onClick={handleModalClose}
                            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-700/80 hover:bg-slate-700 rounded-full transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner ${
                            modalConfig.type === 'success'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-emerald-500/10'
                                : 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-orange-500/10'
                        }`}>
                            {modalConfig.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                        </div>

                        <h3 className="text-xl font-extrabold text-white mb-2">{modalConfig.title}</h3>
                        <p className="text-slate-300 text-sm mb-7 leading-relaxed font-medium">{modalConfig.message}</p>

                        <button
                            onClick={handleModalClose}
                            className={`w-full py-4 text-white rounded-2xl text-sm font-bold transition shadow-xl cursor-pointer ${
                                modalConfig.type === 'success'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-500/25'
                            }`}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* Mentor & Investor Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                        <button
                            onClick={() => setShowAssignModal(false)}
                            className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-700/80 rounded-full transition cursor-pointer"
                        >
                            <X size={18} />
                        </button>

                        <h3 className="text-xl font-black text-white mb-2">
                            {idea.status === 'ACCEPTED' ? 'Edit Mentor & Investor' : 'Assign Mentor & Investor'}
                        </h3>
                        <p className="text-slate-400 text-xs mb-6 font-medium">Select a mentor and investor for this startup project.</p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Mentor</label>
                                <select
                                    value={selectedMentor}
                                    onChange={(e) => setSelectedMentor(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">-- Choose Mentor --</option>
                                    {mentorsList.map((m) => {
                                        const mentorId = m.id || m.mentorId || m.userId;
                                        const mentorName = m.name || m.fullName || m.user?.fullName || m.email || 'Unnamed Mentor';
                                        return (
                                            <option key={mentorId} value={mentorId}>
                                                {mentorName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Investor</label>
                                <select
                                    value={selectedInvestor}
                                    onChange={(e) => setSelectedInvestor(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500"
                                >
                                    <option value="">-- Choose Investor --</option>
                                    {investorsList.map((inv) => {
                                        const investorId = inv.id || inv.investorId || inv.userId;
                                        const investorName = inv.name || inv.fullName || inv.user?.fullName || inv.email || 'Unnamed Investor';
                                        return (
                                            <option key={investorId} value={investorId}>
                                                {investorName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowAssignModal(false)}
                                className="flex-1 py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-sm font-bold transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => executeStatusUpdate('ACCEPTED', selectedMentor, selectedInvestor)}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition shadow-lg shadow-emerald-600/30 cursor-pointer"
                            >
                                Confirm & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Fixed Sidebar */}
            <div className="h-full shrink-0">
                <Sidebar />
            </div>

            {/* Scrollable Main Content Area */}
            <main className="flex-1 h-full p-8 lg:p-12 overflow-y-auto relative bg-slate-900">
                {/* Back to Idea Pipeline Button */}
                <button
                    onClick={() => navigate('/idea-pipeline')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-xl transition cursor-pointer mb-8 shadow-sm"
                >
                    <ArrowLeft size={16} /> Back to Idea Pipeline
                </button>

                {/* Main Detailed Card Container */}
                <div className="bg-slate-800/50 border border-slate-800 p-8 lg:p-10 rounded-3xl shadow-xl backdrop-blur-xl max-w-4xl mx-auto mb-12">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <span className={`text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full border shadow-sm ${
                                    (idea.status || 'PENDING') === 'ACCEPTED'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : (idea.status || 'PENDING') === 'REJECTED'
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                            : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                }`}>
                                    {idea.status || 'PENDING'}
                                </span>
                                {displayTagName && (
                                    <span className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 bg-slate-900 text-slate-300 rounded-full border border-slate-700/80 flex items-center gap-1.5 shadow-sm">
                                        <Tag size={12} className="text-orange-400" /> {displayTagName}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-black text-white mt-3 tracking-tight">{idea.title || idea.name}</h1>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 self-start sm:self-auto shadow-sm">
                            ID: #{id}
                        </span>
                    </div>

                    <div className="space-y-6 pt-6">
                        {/* Primary Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-orange-500/10 text-orange-400 rounded-xl shrink-0 border border-orange-500/20">
                                    <Mail size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</h3>
                                    <p className="text-slate-200 font-bold text-xs truncate mt-0.5">{idea.createdByEmail || idea.submitterEmail || idea.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl shrink-0 border border-blue-500/20">
                                    <User size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitter Name</h3>
                                    <p className="text-slate-200 font-bold text-xs truncate mt-0.5">{idea.submitterName || idea.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/20">
                                    <DollarSign size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposed Fund</h3>
                                    <p className="text-slate-200 font-bold text-xs truncate mt-0.5">
                                        {idea.proposedFund || idea.budget ? `$${Number(idea.proposedFund || idea.budget).toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl shrink-0 border border-violet-500/20">
                                    <Calendar size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Date</h3>
                                    <p className="text-slate-200 font-bold text-xs truncate mt-0.5">{idea.submissionDate || idea.createdAt || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl shrink-0 border border-purple-500/20">
                                    <Code size={18} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitHub Repository</h3>
                                    {idea.githubUrl ? (
                                        <a href={idea.githubUrl} target="_blank" rel="noopener noreferrer" className="text-orange-400 font-bold text-xs underline truncate block mt-0.5 hover:text-orange-300">
                                            {idea.githubUrl}
                                        </a>
                                    ) : (
                                        <p className="text-slate-200 font-bold text-xs mt-0.5">Not Provided</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 flex items-center gap-3.5 shadow-inner">
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 border border-indigo-500/20">
                                    <Building2 size={18} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company / Organization</h3>
                                    <p className="text-slate-200 font-bold text-xs truncate mt-0.5">{idea.companyName || idea.company || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Project Description Box */}
                        <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-xs font-black text-orange-400 uppercase tracking-widest">Project Description & Architecture</h3>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed font-medium">{idea.description || 'No description provided.'}</p>
                        </div>

                        {/* Professional Action Buttons (Restricted to Admin & Mentor roles) */}
                        {canManageStatus && (
                            <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-800">
                                <button
                                    onClick={() => handleActionClick('REJECTED')}
                                    className="px-5 py-3.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-sm font-bold transition flex items-center gap-2 border border-rose-500/20 shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <XCircle size={18} /> Reject Proposal
                                </button>

                                {idea.status === 'ACCEPTED' ? (
                                    <button
                                        onClick={() => handleActionClick('ACCEPTED')}
                                        className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl text-sm font-bold transition shadow-lg flex items-center gap-2 active:scale-95 cursor-pointer"
                                    >
                                        <User size={18} /> Edit Mentor/Investor
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleActionClick('ACCEPTED')}
                                        className="px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-sm font-bold transition shadow-xl shadow-emerald-600/20 flex items-center gap-2 active:scale-95 cursor-pointer"
                                    >
                                        <CheckCircle2 size={18} /> Accept & Incubate
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IdeaDetails;