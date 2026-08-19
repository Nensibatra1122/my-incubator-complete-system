import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ShieldAlert, BarChart3, Users, Lightbulb, Briefcase } from 'lucide-react';
import api from '../api/axios';

const Analytics = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalIdeas: 0,
        totalIncubations: 0,
        totalMentors: 0,
        startups: [],
        message: ''
    });
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // Get current user role and email from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const rawRole = localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || storedUser.roles || 'USER';
    const userRoleString = typeof rawRole === 'string' ? rawRole : JSON.stringify(rawRole);
    const userRoleUpper = userRoleString.toUpperCase();

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);

            // Fetch Ideas, Incubations, and Mentors concurrently with safe fallbacks
            const [ideasRes, startupsRes, mentorsRes] = await Promise.all([
                api.get('/ideas').catch(() => ({ data: [] })),
                api.get('/incubations').catch(() => ({ data: [] })),
                api.get('/mentors').catch(() => api.get('/users/mentors').catch(() => ({ data: [] })))
            ]);

            const ideas = Array.isArray(ideasRes.data) ? ideasRes.data : [];
            const startups = Array.isArray(startupsRes.data) ? startupsRes.data : [];
            const mentors = Array.isArray(mentorsRes.data) ? mentorsRes.data : [];

            setStats({
                totalIdeas: ideas.length,
                totalIncubations: startups.length,
                totalMentors: mentors.length,
                startups: startups,
                message: "High-level performance metrics of all incubated projects."
            });
        } catch (error) {
            console.error("Error fetching analytics stats:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Flexible check: Allow if role contains ADMIN or ROLE_ADMIN
        if (!userRoleUpper.includes('ADMIN')) {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        fetchAnalyticsData();
    }, [userRoleUpper, fetchAnalyticsData]);

    if (accessDenied) {
        return (
            <div className="flex min-h-screen bg-slate-900 text-slate-100">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-slate-800 border border-slate-700/80 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center backdrop-blur-xl">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                            <ShieldAlert size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white mb-2">Access Restricted</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Incubator analytics and performance metrics are restricted to Administrators only.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-500/20 cursor-pointer"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex min-h-screen bg-slate-900 items-center justify-center">
                <div className="text-orange-400 font-bold text-lg animate-pulse">Loading Analytics Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-900 text-slate-100 relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                        <BarChart3 className="text-orange-400" size={32} /> Incubator Analytics & Overview
                    </h1>
                    <span className="text-xs px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full font-bold uppercase">
                        Admin Portal
                    </span>
                </div>
                <p className="text-slate-400 mb-8">{stats.message || "High-level performance metrics of all incubated projects."}</p>

                {/* Top Summary KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl flex items-center gap-4 backdrop-blur-xl">
                        <div className="p-4 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                            <Lightbulb size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Ideas</p>
                            <h3 className="text-3xl font-extrabold text-white mt-1">{stats.totalIdeas ?? 0}</h3>
                        </div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl flex items-center gap-4 backdrop-blur-xl">
                        <div className="p-4 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Incubations</p>
                            <h3 className="text-3xl font-extrabold text-blue-400 mt-1">{stats.totalIncubations ?? 0}</h3>
                        </div>
                    </div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl shadow-xl flex items-center gap-4 backdrop-blur-xl">
                        <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Mentors</p>
                            <h3 className="text-3xl font-extrabold text-emerald-400 mt-1">{stats.totalMentors ?? 0}</h3>
                        </div>
                    </div>
                </div>

                {/* Startups Progress & Overview Section */}
                <div className="bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                    <h2 className="text-xl font-bold text-white mb-6">All Incubated Startups Progress</h2>
                    {stats.startups && stats.startups.length > 0 ? (
                        stats.startups.map((startup, index) => {
                            const progressVal = Number(
                                startup.progress ??
                                startup.completionPercentage ??
                                startup.completion_percentage ??
                                startup.progressPercentage ??
                                startup.progress_percentage ??
                                0
                            );
                            const startupName = startup.idea?.title || startup.projectName || startup.name || startup.programName || `Startup ${index + 1}`;
                            const startupStatus = startup.status || startup.phase || 'Active';

                            return (
                                <div key={startup.incubationId || startup.id || index} className="mb-6 last:mb-0 pb-5 border-b border-slate-700/60 last:border-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-slate-200">{startupName}</span>
                                            <span className="text-xs px-2.5 py-1 bg-slate-900 text-slate-300 border border-slate-700 rounded-full font-semibold uppercase">
                                                {startupStatus}
                                            </span>
                                        </div>
                                        <span className="font-bold text-orange-400">{progressVal}%</span>
                                    </div>
                                    <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
                                        <div
                                            className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500 ease-in-out shadow-lg shadow-orange-500/30"
                                            style={{ width: `${progressVal}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-400 text-sm italic">No startups data found.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;