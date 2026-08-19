import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, HeartHandshake, CheckCircle2, XCircle, Loader2, Mail, Lightbulb, Clock } from 'lucide-react';

const InvestorInterests = () => {
    const navigate = useNavigate();
    const [interests, setInterests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actingOnId, setActingOnId] = useState(null);
    const [notice, setNotice] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || storedUser.role || 'USER';
    const userRole = rawRole.replace('ROLE_', '').trim().toUpperCase();
    const isAdmin = userRole === 'ADMIN';

    const showNotice = (msg) => {
        setNotice(msg);
        setTimeout(() => setNotice(''), 4000);
    };

    const fetchInterests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/investor-interests');
            const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);

            // Pending first, followed by newest to oldest
            const sorted = [...data].sort((a, b) => {
                if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
                if (a.status !== 'PENDING_APPROVAL' && b.status === 'PENDING_APPROVAL') return 1;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });

            setInterests(sorted);
        } catch (error) {
            console.error('Error fetching investor interests:', error);
            setInterests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInterests();
    }, []);

    const handleUpdateStatus = async (id, newStatus) => {
        setActingOnId(id);
        try {
            await api.put(`/investor-interests/${id}/status`, { status: newStatus });
            setInterests(prev =>
                prev.map(item =>
                    item.id === id ? { ...item, status: newStatus } : item
                )
            );
            showNotice(
                newStatus === 'APPROVED'
                    ? 'Investor interest has been approved successfully.'
                    : 'Investor interest has been rejected.'
            );
        } catch (error) {
            console.error('Error updating interest status:', error);
            const backendMsg = error.response?.data?.message;
            showNotice(backendMsg || 'Failed to update interest status.');
        } finally {
            setActingOnId(null);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'APPROVED':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'REJECTED':
                return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const pendingCount = interests.filter(i => i.status === 'PENDING_APPROVAL').length;

    if (!isAdmin) {
        return (
            <div className="flex bg-slate-900 min-h-screen text-slate-100">
                <Sidebar />
                <main className="flex-1 p-10 flex flex-col items-center justify-center">
                    <h2 className="text-xl font-extrabold text-white mb-2">Access Restricted</h2>
                    <p className="text-slate-400 text-sm">Only administrators can view this page.</p>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white">
            <Sidebar />

            <main className="flex-1 p-8 overflow-y-auto">

                {notice && (
                    <div className="fixed top-6 right-6 z-50 bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 max-w-sm animate-in fade-in">
                        <HeartHandshake className="text-emerald-400 shrink-0" size={22} />
                        <p className="text-sm font-semibold">{notice}</p>
                    </div>
                )}

                <div className="mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-xl transition cursor-pointer"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                <div className="flex items-center justify-between mb-8 bg-slate-800/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl gap-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20">
                                <HeartHandshake size={26} />
                            </div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Investor Interest Requests</h1>
                        </div>
                        <p className="text-slate-400 text-sm">Review incoming investment interests submitted by investors for various ideas.</p>
                    </div>
                    {pendingCount > 0 && (
                        <span className="px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-2xl text-sm font-bold flex items-center gap-2 shrink-0">
                            <Clock size={16} /> {pendingCount} Pending Review
                        </span>
                    )}
                </div>

                <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                    {loading ? (
                        <div className="text-center py-16 text-slate-400 font-semibold flex flex-col items-center gap-3">
                            <Loader2 className="animate-spin text-orange-500" size={32} />
                            Loading interest requests...
                        </div>
                    ) : interests.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 font-semibold flex flex-col items-center gap-2">
                            <HeartHandshake size={36} className="text-slate-600 mb-1" />
                            No investor interest requests found yet.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {interests.map((item) => {
                                const isPending = item.status === 'PENDING_APPROVAL';
                                const isActing = actingOnId === item.id;

                                const investorLabel = item.investorEmail || 'Unknown Investor';

                                // Corrected to use startupName from backend DTO response
                                const ideaTitle = item.startupName || `Idea #${item.incubationId || ''}`;

                                return (
                                    <div
                                        key={item.id}
                                        className="p-5 bg-slate-900/80 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="p-3 bg-slate-800 text-orange-400 rounded-2xl border border-slate-700/80 mt-1">
                                                <Lightbulb size={20} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <h3 className="font-extrabold text-white tracking-tight">{ideaTitle}</h3>
                                                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                                                    <Mail size={12} /> Investor: <span className="font-semibold text-slate-300">{investorLabel}</span>
                                                </p>
                                                {item.createdAt && (
                                                    <p className="text-[11px] text-slate-500">
                                                        Submitted: {new Date(item.createdAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                                            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getStatusBadge(item.status)}`}>
                                                {item.status?.replace('_', ' ')}
                                            </span>

                                            {isPending && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                                                        disabled={isActing}
                                                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition cursor-pointer disabled:opacity-50"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                                                        disabled={isActing}
                                                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <XCircle size={18} />
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

export default InvestorInterests;