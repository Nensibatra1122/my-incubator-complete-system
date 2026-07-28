import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, Calendar, ShieldAlert, CheckCircle2, XCircle, Trash2 } from 'lucide-react';

const SessionManagement = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [startups, setStartups] = useState([]);
    const [form, setForm] = useState({
        mentorId: '',
        startupId: '',
        topic: 'Weekly Progress & Improvement Review',
        scheduledTime: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Get current user role securely from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    useEffect(() => {
        fetchSessions();
        fetchMentors();
        fetchStartups();
    }, []);

    const fetchSessions = async () => {
        try {
            const response = await api.get('/sessions/my-sessions');
            setSessions(response.data || []);
        } catch (err) {
            console.error("Error fetching sessions:", err);
        }
    };

    const fetchMentors = async () => {
        try {
            const response = await api.get('/mentors');
            setMentors(response.data || []);
        } catch (err) {
            console.error("Error fetching mentors:", err);
        }
    };

    const fetchStartups = async () => {
        try {
            const response = await api.get('/ideas');
            setStartups(response.data || []);
        } catch (err) {
            console.error("Error fetching startups:", err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            await api.post('/sessions', {
                mentorId: Number(form.mentorId),
                startupId: Number(form.startupId),
                topic: form.topic,
                scheduledTime: form.scheduledTime
            });
            setForm({ mentorId: '', startupId: '', topic: 'Weekly Progress & Improvement Review', scheduledTime: '' });
            setSuccessMsg('Weekly mentorship update session successfully scheduled!');
            fetchSessions();
        } catch (err) {
            setError('Failed to request session. Please check inputs and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            await api.put(`/sessions/${id}`, { status: newStatus });
            fetchSessions();
        } catch (err) {
            console.error("Error updating session status:", err);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/sessions/${id}`);
            fetchSessions();
        } catch (err) {
            console.error("Error deleting session:", err);
        }
    };

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Request Form Card - Open to all users/roles for weekly updates */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">Schedule Mentor Weekly Update & Improvement</h2>
                                    <p className="text-slate-500 text-sm">Book a recurring or scheduled session with any mentor to review project progress and improvements.</p>
                                </div>
                            </div>
                            <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                                {userRole} Portal
                            </span>
                        </div>

                        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-semibold border border-red-100">{error}</div>}
                        {successMsg && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-semibold border border-emerald-100">{successMsg}</div>}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Select Mentor</label>
                                <select
                                    value={form.mentorId}
                                    onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-700 font-medium cursor-pointer"
                                >
                                    <option value="">Choose an expert mentor...</option>
                                    {mentors.map((m) => (
                                        <option key={m.mentorId || m.id} value={m.mentorId || m.id}>
                                            {m.name || m.fullName || `Mentor #${m.mentorId || m.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Related Startup / Project</label>
                                <select
                                    value={form.startupId}
                                    onChange={(e) => setForm({ ...form, startupId: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-700 font-medium cursor-pointer"
                                >
                                    <option value="">Choose associated project...</option>
                                    {startups.map((s) => (
                                        <option key={s.id || s.ideaId} value={s.id || s.ideaId}>
                                            {s.title || s.name || `Startup #${s.id || s.ideaId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Session Topic / Agenda</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Weekly Progress Review & Improvements"
                                    value={form.topic}
                                    onChange={(e) => setForm({ ...form, topic: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-700 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Scheduled Date & Time</label>
                                <input
                                    type="datetime-local"
                                    value={form.scheduledTime}
                                    onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:outline-none text-slate-700 font-medium"
                                />
                            </div>

                            <div className="md:col-span-2 flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition shadow-lg shadow-orange-600/25 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? 'Submitting Request...' : 'Schedule Weekly Update Session'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Sessions Table Card */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Scheduled & Requested Update Sessions</h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-xs font-bold uppercase tracking-wider">
                                    <th className="p-4 rounded-l-2xl">ID</th>
                                    <th className="p-4">Topic / Agenda</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Scheduled Time</th>
                                    <th className="p-4 text-right rounded-r-2xl">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                                {sessions.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="p-8 text-center text-slate-400 italic">No mentorship update sessions scheduled yet.</td>
                                    </tr>
                                ) : (
                                    sessions.map((s) => {
                                        const sessionId = s.id || s.sessionId;
                                        const status = (s.status || 'PENDING').toUpperCase();

                                        return (
                                            <tr key={sessionId} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4 font-bold text-slate-900">#{sessionId}</td>
                                                <td className="p-4 text-slate-800">{s.topic}</td>
                                                <td className="p-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                                        status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                                            status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-500">{s.scheduledTime ? new Date(s.scheduledTime).toLocaleString() : 'N/A'}</td>
                                                <td className="p-4 text-right space-x-3">
                                                    {(userRole === 'ADMIN' || userRole === 'MENTOR') && status === 'PENDING' && (
                                                        <button
                                                            onClick={() => handleUpdateStatus(sessionId, 'APPROVED')}
                                                            className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                                                        >
                                                            <CheckCircle2 size={14} /> Approve
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(sessionId)}
                                                        className="text-rose-600 hover:text-rose-700 font-bold text-xs bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl transition cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        <Trash2 size={14} /> Cancel
                                                    </button>
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
            </main>
        </div>
    );
};

export default SessionManagement;