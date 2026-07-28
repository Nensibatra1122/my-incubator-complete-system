import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, Loader2, Code, Building2, DollarSign, Calendar, Mail, User, AlertCircle, Tag } from 'lucide-react';

const IdeaDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Role-based check normalized properly with ROLE_ prefix handling
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || 'USER';
    const userRole = rawRole.replace('ROLE_', '').toUpperCase();
    const canManageStatus = userRole === 'ADMIN' || userRole === 'MENTOR';

    const showMessage = (msg, type = 'success') => {
        setNotification({ show: true, message: msg, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: 'success' });
        }, 4000);
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

    const executeStatusUpdate = async (statusType) => {
        const cleanId = id ? id.split(':')[0] : id;

        try {
            const res = await api.put(`/ideas/${cleanId}/status`, {
                status: statusType
            });

            const serverMessage = res.data?.message || `Idea status updated successfully to ${statusType}`;
            const isAlreadyAccepted = serverMessage.toLowerCase().includes("already accepted");
            const notificationType = (statusType === 'REJECTED') ? 'error' : 'success';

            showMessage(serverMessage, notificationType);

            if (!isAlreadyAccepted) {
                setTimeout(() => {
                    navigate('/idea-pipeline');
                }, 1200);
            }

        } catch (error) {
            console.error("Backend status update failed:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to update status on server. Please check backend logs.';
            showMessage(errorMsg, 'error');
        }
    };

    const handleActionClick = (actionType) => {
        if (actionType === 'DISCUSSION') {
            navigate(`/idea-chat/${id}`);
            return;
        }

        if (actionType === 'ACCEPTED') {
            executeStatusUpdate('ACCEPTED').catch(err => console.error(err));
            return;
        }

        executeStatusUpdate('REJECTED').catch(err => console.error(err));
    };

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-600" size={32} />
                </main>
            </div>
        );
    }

    if (!idea) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex flex-col items-center justify-center">
                    <AlertCircle className="text-rose-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Idea Not Found</h2>
                    <p className="text-slate-500 text-sm mb-6">Could not retrieve idea details from the database.</p>
                    <button
                        onClick={() => navigate('/idea-pipeline')}
                        className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold cursor-pointer"
                    >
                        Back to Pipeline
                    </button>
                </main>
            </div>
        );
    }

    const displayTagName = idea.tagName || idea.tag?.tagName || idea.category || null;

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto">
                {/* Custom Notification Banner */}
                {notification.show && (
                    <div className="fixed top-6 right-6 z-50 animate-bounce flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-slate-900 text-white border-slate-800">
                        {notification.type === 'success' ? (
                            <CheckCircle2 className="text-orange-500" size={22} />
                        ) : (
                            <AlertCircle className="text-rose-500" size={22} />
                        )}
                        <p className="text-sm font-semibold tracking-wide">{notification.message}</p>
                    </div>
                )}

                {/* Back to Idea Pipeline Button */}
                <button
                    onClick={() => navigate('/idea-pipeline')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-6 transition group cursor-pointer"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Idea Pipeline
                </button>

                {/* Main Detailed Card Container */}
                <div className="bg-white p-8 lg:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 max-w-4xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100">
                                    {idea.status || 'PENDING'}
                                </span>
                                {displayTagName && (
                                    <span className="text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200 flex items-center gap-1.5">
                                        <Tag size={12} className="text-orange-500" /> {displayTagName}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 mt-3">{idea.title || idea.name}</h1>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-start sm:self-auto">
                            ID: #{id}
                        </span>
                    </div>

                    <div className="space-y-6 pt-6">
                        {/* Primary Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                                    <Mail size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Official Email</h3>
                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{idea.createdByEmail || idea.submitterEmail || idea.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl shrink-0">
                                    <User size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitter Name</h3>
                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{idea.submitterName || idea.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shrink-0">
                                    <DollarSign size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Proposed Fund</h3>
                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">
                                        {idea.proposedFund || idea.budget ? `$${Number(idea.proposedFund || idea.budget).toLocaleString()}` : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-violet-100 text-violet-600 rounded-xl shrink-0">
                                    <Calendar size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submission Date</h3>
                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{idea.submissionDate || idea.createdAt || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl shrink-0">
                                    <Code size={20} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GitHub Repository</h3>
                                    {idea.githubUrl ? (
                                        <a href={idea.githubUrl} target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold text-xs underline truncate block mt-0.5 hover:text-orange-700">
                                            {idea.githubUrl}
                                        </a>
                                    ) : (
                                        <p className="text-slate-800 font-bold text-xs mt-0.5">Not Provided</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 flex items-center gap-3.5">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                                    <Building2 size={20} />
                                </div>
                                <div className="overflow-hidden flex-1">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company / Organization</h3>
                                    <p className="text-slate-800 font-bold text-xs truncate mt-0.5">{idea.companyName || idea.company || 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Project Description Box */}
                        <div className="bg-slate-50/80 p-6 rounded-2xl border border-slate-100 space-y-2">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Description</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{idea.description || 'No description provided.'}</p>
                        </div>

                        {/* Professional Action Buttons (Restricted to Admin & Mentor roles) */}
                        {canManageStatus && (
                            <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button
                                    onClick={() => handleActionClick('REJECTED')}
                                    className="px-5 py-3.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-2xl text-sm font-bold transition flex items-center gap-2 border border-rose-100 shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <XCircle size={18} /> Reject Proposal
                                </button>
                                <button
                                    onClick={() => handleActionClick('DISCUSSION')}
                                    className="px-5 py-3.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-2xl text-sm font-bold transition flex items-center gap-2 border border-amber-200 shadow-sm active:scale-95 cursor-pointer"
                                >
                                    <MessageSquare size={18} /> Discuss with Mentor
                                </button>
                                <button
                                    onClick={() => handleActionClick('ACCEPTED')}
                                    className="px-6 py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 flex items-center gap-2 active:scale-95 cursor-pointer"
                                >
                                    <CheckCircle2 size={18} /> Accept & Incubate
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default IdeaDetails;