import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import { Activity, ShieldCheck, Search, RefreshCw, Trash2, Database, ArrowLeft, Terminal, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const SystemLogsPage = () => {
    const navigate = useNavigate();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get('/logs');
            setLogs(response.data || []);
            setMessage({ text: '', type: '' });
        } catch (e) {
            console.error("Failed to fetch system logs", e);
            setMessage({ text: 'Failed to load system audit logs from database.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs().catch((err) => console.error("Error in fetchLogs:", err));
    }, [fetchLogs]);

    const handleClearLogs = async () => {
        if (!window.confirm("Are you sure you want to clear all historical system logs?")) return;
        try {
            await api.delete('/logs');
            setMessage({ text: 'System logs cleared successfully!', type: 'success' });
            await fetchLogs();
        } catch (e) {
            console.error("Failed to clear logs", e);
            setMessage({ text: 'Failed to clear system logs.', type: 'error' });
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const filteredLogs = logs.filter(log => {
        const query = searchTerm.toLowerCase();
        const action = log.action || log.type || '';
        const details = log.details || log.description || log.message || '';
        const email = log.createdByEmail || log.email || '';
        return action.toLowerCase().includes(query) ||
               details.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query);
    });

    return (
        <div className="flex bg-slate-950 min-h-screen selection:bg-orange-500 selection:text-white text-slate-100 font-sans">
            {/* Sidebar with embedded Logout action */}
            <div className="flex flex-col justify-between border-r border-slate-800 bg-slate-950 shrink-0">
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

            <main className="flex-1 p-10 bg-slate-950 overflow-y-auto">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
                            <Activity className="text-orange-500" size={32} /> System Audit & Operation Logs
                        </h1>
                        <p className="text-slate-400 mt-1">Real-time backend event tracking, API queries, and system diagnostics.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchLogs}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                            title="Refresh Logs"
                        >
                            <RefreshCw size={14} className="text-orange-500" /> Refresh
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                        >
                            <ArrowLeft size={14} className="text-orange-500" /> Back to Dashboard
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-2xl text-sm font-medium border ${
                            message.type === 'success'
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/50'
                                : 'bg-rose-950/40 text-rose-400 border-rose-800/50'
                        }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Controls Bar: Search & Actions */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                            <input
                                type="text"
                                placeholder="Search logs by action, email, or details..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-950 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-semibold"
                            />
                        </div>
                        <button
                            onClick={handleClearLogs}
                            className="px-5 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-2xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer"
                        >
                            <Trash2 size={14} /> Clear All Logs
                        </button>
                    </div>

                    {/* Logs Container */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                                <ShieldCheck size={20} className="text-orange-500" /> Live Event Stream
                            </h3>
                            <span className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-bold">
                                {filteredLogs.length} Total Records
                            </span>
                        </div>

                        {loading ? (
                            <div className="text-center py-12 space-y-3">
                                <RefreshCw className="animate-spin text-orange-500 mx-auto" size={24} />
                                <p className="text-xs text-slate-500 animate-pulse">Streaming database audit logs...</p>
                            </div>
                        ) : filteredLogs.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                                <Database size={32} className="mx-auto opacity-40 text-slate-400" />
                                <p>No system logs found matching your criteria.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pt-2">
                                {filteredLogs.map((log, index) => {
                                    const logId = log.id || log.logId || index + 1;
                                    const actionType = log.action || log.type || 'SYSTEM_EVENT';
                                    const logDetails = log.details || log.description || log.message || 'No details provided.';
                                    const userEmail = log.createdByEmail || log.email || 'system@incubator.internal';
                                    const timestamp = log.timestamp || log.createdAt || 'Just now';

                                    return (
                                        <div key={logId} className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800/70 hover:border-slate-700 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-start gap-3 min-w-0 flex-1">
                                                <div className="p-2.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                                                    <Terminal size={16} />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-extrabold text-orange-400 px-2 py-0.5 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                                            [{actionType}]
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-200 truncate">{logDetails}</span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                                        <span className="text-slate-500">By:</span> <span className="text-slate-300 font-medium">{userEmail}</span>
                                                        <span className="text-slate-600">•</span>
                                                        <span className="text-slate-500">ID:</span> <span className="text-slate-500 font-mono">#{logId}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0 self-end sm:self-center">
                                                <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                                                    {timestamp}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SystemLogsPage;