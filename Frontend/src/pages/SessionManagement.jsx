import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, Calendar, Clock, CheckCircle2, Trash2, Plus, AlertCircle } from 'lucide-react';

const SessionManagement = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [projects, setProjects] = useState([]);
    const [form, setForm] = useState({
        startupId: '',
        topic: 'Weekly Progress & Improvement Review',
        scheduledTime: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    const currentUserId = Number(storedUser.id || storedUser.userId || storedUser.user_id || storedUser.mentorId || localStorage.getItem('userId') || 0);
    const currentUserEmail = (storedUser.email || storedUser.sub || localStorage.getItem('userEmail') || '').toLowerCase().trim();

    const isInvestor = userRole.includes('INVESTOR');
    const isStudent = userRole.includes('STUDENT');
    const nowLocalISO = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            let projectData = [];
            try {
                const projectRes = await api.get('/incubations').catch(() => ({ data: [] }));
                projectData = projectRes.data || [];
            } catch (e) {
                projectData = [];
            }

            if (userRole.includes('ADMIN')) {
                setProjects(projectData);
            } else if (isInvestor || isStudent) {
                setProjects([]);
            } else {
                const filteredProjects = projectData.filter(p => {
                    const mObj = p.mentor;
                    if (!mObj) return false;
                    const mId = Number(mObj.userId || mObj.id || mObj.mentorId || 0);
                    const mEmail = (mObj.email || '').toLowerCase().trim();

                    if (currentUserId && mId > 0 && mId === currentUserId) return true;
                    if (currentUserEmail && mEmail && mEmail === currentUserEmail) return true;
                    return false;
                });
                setProjects(filteredProjects.length > 0 ? filteredProjects : []);
            }

            let sessionData = [];
            try {
                const sessionRes = await api.get('/sessions/my-sessions');
                sessionData = sessionRes.data || [];
            } catch (err) {
                const fallbackRes = await api.get('/sessions').catch(() => ({ data: [] }));
                sessionData = fallbackRes.data || [];
            }

            let allSessions = Array.isArray(sessionData) ? sessionData : [];

            allSessions = allSessions.map(s => {
                const matchingProject = projectData.find(p => String(p.incubationId || p.id) === String(s.startupId || s.incubationId));
                const derivedName = matchingProject ? (matchingProject.programName || matchingProject.idea?.title || `Incubation #${matchingProject.incubationId || matchingProject.id}`) : null;

                return {
                    ...s,
                    resolvedStartupName: s.startupName || s.projectName || s.name || derivedName || `Startup ID: ${s.startupId || 'N/A'}`,
                    resolvedTime: s.scheduledTime || s.startTime || s.date || s.time || null
                };
            });

            if (isStudent && currentUserEmail) {
                allSessions = allSessions.filter(s => {
                    const sEmail = (s.menteeEmail || s.studentEmail || s.email || '').toLowerCase().trim();
                    return !sEmail || sEmail === currentUserEmail;
                });
            }

            if (isInvestor && currentUserEmail) {
                allSessions = allSessions.filter(s => {
                    const sEmail = (s.investorEmail || s.email || s.assignedEmail || s.menteeEmail || '').toLowerCase().trim();
                    const sId = Number(s.investorId || s.userId || 0);
                    return (sEmail && sEmail === currentUserEmail) || (currentUserId && sId === currentUserId) || true;
                });
            }

            setSessions(allSessions);
        } catch (err) {
            console.error("Failed to load session management data", err);
            setError('Failed to load session management data.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isInvestor || isStudent) return;

        setLoading(true);
        setError('');
        setSuccessMsg('');

        if (!form.scheduledTime) {
            setError('Please select a complete date and time.');
            setLoading(false);
            return;
        }

        if (new Date(form.scheduledTime) < new Date()) {
            setError('You cannot schedule a session in the past.');
            setLoading(false);
            return;
        }

        try {
            const formattedTime = form.scheduledTime.length === 16 ? `${form.scheduledTime}:00` : form.scheduledTime;
            const selectedProject = projects.find(p => String(p.incubationId || p.id) === String(form.startupId));
            const menteeEmail = selectedProject?.menteeEmail || selectedProject?.email || selectedProject?.user?.email || '';
            const startupName = selectedProject?.programName || selectedProject?.idea?.title || `Incubation #${form.startupId}`;

            const payload = {
                startupId: Number(form.startupId),
                startupName: startupName,
                topic: form.topic,
                scheduledTime: formattedTime,
                mentorEmail: currentUserEmail,
                menteeEmail: menteeEmail
            };

            if (currentUserId) {
                payload.mentorId = currentUserId;
            }

            await api.post('/sessions', payload);
            setForm({ startupId: '', topic: 'Weekly Progress & Improvement Review', scheduledTime: '' });
            setSuccessMsg('Session successfully scheduled! Notifications sent.');

            await fetchData();
        } catch (err) {
            const serverMessage = err.response?.data?.message || err.response?.data;
            setError(typeof serverMessage === 'string' ? serverMessage : 'Failed to schedule session.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/sessions/${id}`, { status: newStatus });
            await fetchData();
        } catch (err) {
            setError('Failed to update session status.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/sessions/${id}`);
            await fetchData();
        } catch (err) {
            setError('Failed to cancel session.');
        }
    };

    const totalSessions = sessions.length;
    const pendingSessions = sessions.filter(s => (s.status || '').toUpperCase() === 'PENDING').length;
    const upcomingSessions = sessions.filter(s => s.resolvedTime && new Date(s.resolvedTime) > new Date()).length;

    return (
        <div className="flex bg-[#0b0f19] min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white">
            <Sidebar />

            <main className="flex-1 p-8 md:p-10 overflow-y-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="max-w-6xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111827]/80 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl shadow-xl">
                        <div>
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">
                                {isInvestor ? 'My Mentorship Sessions & Notifications' : isStudent ? 'My Scheduled Mentorship Sessions' : 'Session & Mentorship Command Center'}
                            </h1>
                            <p className="text-slate-400 text-sm mt-1">
                                {isInvestor ? 'View scheduled sessions and notifications regarding your portfolio startups.' : isStudent ? 'View sessions scheduled for your projects by mentors or administrators.' : 'Manage project progress reviews, schedule mentor slots, and track milestones.'}
                            </p>
                        </div>
                        <div className="self-start md:self-auto">
                            <span className="text-xs px-4 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-extrabold tracking-wider uppercase shadow-sm">
                                {userRole} PORTAL
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <StatCard title="Total Sessions" value={totalSessions} color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20" icon={<Calendar size={20} className="text-blue-400" />} />
                        <StatCard title="Pending Reviews" value={pendingSessions} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/20" icon={<AlertCircle size={20} className="text-amber-400" />} />
                        <StatCard title="Upcoming Scheduled" value={upcomingSessions} color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20" icon={<Clock size={20} className="text-emerald-400" />} />
                    </div>

                    {error && <div className="p-4 bg-rose-500/10 text-rose-400 rounded-2xl text-sm font-semibold border border-rose-500/20 shadow-lg">{error}</div>}
                    {successMsg && <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl text-sm font-semibold border border-emerald-500/20 shadow-lg">{successMsg}</div>}

                    <div className={`grid grid-cols-1 ${(isInvestor || isStudent) ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
                        {!isInvestor && !isStudent && (
                            <div className="lg:col-span-1 bg-[#111827]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl flex flex-col justify-between backdrop-blur-xl">
                                <div>
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-800/80">
                                        <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                                            <Plus size={20} />
                                        </div>
                                        <h2 className="text-lg font-bold text-white">Schedule Session</h2>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Select Startup / Incubation</label>
                                            <select
                                                value={form.startupId}
                                                onChange={(e) => setForm({ ...form, startupId: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-[#0b0f19] border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-200 text-sm font-medium cursor-pointer shadow-inner"
                                            >
                                                <option value="">Choose incubation...</option>
                                                {projects.map((p) => {
                                                    const pId = p.incubationId || p.id;
                                                    const displayName = p.programName || (p.idea && p.idea.title) || `Incubation #${pId}`;
                                                    return (
                                                        <option key={pId} value={pId}>
                                                            {displayName} {p.category ? `(${p.category})` : ''}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Topic / Agenda</label>
                                            <select
                                                value={form.topic}
                                                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-[#0b0f19] border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-200 text-sm font-medium cursor-pointer shadow-inner"
                                            >
                                                <option value="Weekly Progress & Improvement Review">Weekly Progress & Improvement Review</option>
                                                <option value="Technical Architecture & Code Review">Technical Architecture & Code Review</option>
                                                <option value="Milestone Evaluation & Pitch Prep">Milestone Evaluation & Pitch Prep</option>
                                                <option value="Bug Troubleshooting & Deployment Strategy">Bug Troubleshooting & Deployment Strategy</option>
                                                <option value="General Mentorship & Q&A">General Mentorship & Q&A</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                value={form.scheduledTime}
                                                min={nowLocalISO}
                                                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                                                required
                                                className="w-full px-4 py-3 bg-[#0b0f19] border border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-200 text-sm font-medium cursor-pointer shadow-inner"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full mt-2 py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:opacity-90 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                                        >
                                            {loading ? 'Processing...' : 'Confirm & Schedule Session'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className={`${(isInvestor || isStudent) ? 'lg:col-span-1' : 'lg:col-span-2'} bg-[#111827]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl backdrop-blur-xl`}>
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/80">
                                <h2 className="text-lg font-bold text-white">{isInvestor ? 'Session Notifications & Updates' : isStudent ? 'Sessions Scheduled For You' : 'Scheduled Sessions'}</h2>
                                <span className="text-xs text-slate-400 font-medium">{sessions.length} total records</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="border-b border-slate-800/80 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="pb-3 px-3">ID</th>
                                        <th className="pb-3 px-3">Startup Name</th>
                                        <th className="pb-3 px-3">Managed By</th>
                                        <th className="pb-3 px-3">Topic / Agenda</th>
                                        <th className="pb-3 px-3">Status</th>
                                        <th className="pb-3 px-3">Scheduled Time</th>
                                        <th className="pb-3 px-3 text-right">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60 text-sm font-medium text-slate-300">
                                    {sessions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="py-12 text-center text-slate-500 italic">
                                                No session notifications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        sessions.map((s) => {
                                            const sessionId = s.id || s.sessionId;
                                            const status = (s.status || 'PENDING').toUpperCase();

                                            return (
                                                <tr key={sessionId} className="hover:bg-slate-800/40 transition">
                                                    <td className="py-4 px-3 font-bold text-white">#{sessionId}</td>
                                                    <td className="py-4 px-3 font-semibold text-orange-400">
                                                        {s.resolvedStartupName}
                                                    </td>
                                                    <td className="py-4 px-3 text-slate-300 font-medium">
                                                        {s.managedByName || s.mentorEmail || 'Admin/Mentor'}
                                                    </td>
                                                    <td className="py-4 px-3 text-slate-200">{s.topic}</td>
                                                    <td className="py-4 px-3">
                                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                                                                status === 'APPROVED' || status === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                    status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                            }`}>
                                                                {status}
                                                            </span>
                                                    </td>
                                                    <td className="py-4 px-3 text-slate-400 text-xs">
                                                        {s.resolvedTime ? new Date(s.resolvedTime).toLocaleString() : 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-3 text-right space-x-2">
                                                        {!isInvestor && !isStudent && (
                                                            <>
                                                                {(userRole.includes('ADMIN') || userRole.includes('MENTOR')) && status === 'PENDING' && (
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(sessionId, 'ACCEPTED')}
                                                                        className="text-emerald-400 hover:text-emerald-300 font-bold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 border border-emerald-500/20 cursor-pointer"
                                                                    >
                                                                        <CheckCircle2 size={12} /> Approve
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleDelete(sessionId)}
                                                                    className="text-rose-400 hover:text-rose-300 font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 border border-rose-500/20 cursor-pointer"
                                                                >
                                                                    <Trash2 size={12} /> Cancel
                                                                </button>
                                                            </>
                                                        )}
                                                        {(isInvestor || isStudent) && (
                                                            <span className="text-xs text-slate-500 italic">View Only</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

const StatCard = ({ title, value, color, bg, border, icon }) => (
    <div className="bg-[#111827]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl flex items-center justify-between backdrop-blur-xl">
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
            <h3 className={`text-3xl font-black mt-1 ${color}`}>{value}</h3>
        </div>
        <div className={`p-3.5 rounded-2xl border ${bg} ${border}`}>
            {icon}
        </div>
    </div>
);

export default SessionManagement;