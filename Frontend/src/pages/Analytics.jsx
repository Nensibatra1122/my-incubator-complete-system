import React, { useState, useEffect } from 'react';
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
    const userEmail = storedUser.email || localStorage.getItem('userEmail') || '';

    useEffect(() => {
        // Flexible check: Allow if role contains ADMIN or ROLE_ADMIN
        if (!userRoleUpper.includes('ADMIN')) {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchAnalyticsData = async () => {
            try {
                const response = await api.get(`/analytics/dashboard?role=ADMIN&email=${encodeURIComponent(userEmail)}`);
                if (response.data) {
                    setStats(response.data);
                }
            } catch (error) {
                console.error("API Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, [userRoleUpper, userEmail]);

    if (accessDenied) {
        return (
            <div className="flex min-h-screen bg-slate-50">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Access Restricted</h3>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            Incubator analytics and performance metrics are restricted to Administrators only.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
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
            <div className="flex min-h-screen bg-slate-50 items-center justify-center">
                <div className="text-lg font-semibold text-slate-600 animate-pulse">Loading Analytics Dashboard...</div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <BarChart3 className="text-orange-500" size={32} /> Incubator Analytics & Overview
                    </h1>
                    <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                        Admin Portal
                    </span>
                </div>
                <p className="text-slate-500 mb-8">{stats.message || "High-level performance metrics of all incubated projects."}</p>

                {/* Top Summary KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl">
                            <Lightbulb size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Ideas</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalIdeas ?? 0}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                            <Briefcase size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Incubations</p>
                            <h3 className="text-3xl font-extrabold text-blue-600 mt-1">{stats.totalIncubations ?? 0}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
                            <Users size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Mentors</p>
                            <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">{stats.totalMentors ?? 0}</h3>
                        </div>
                    </div>
                </div>

                {/* Startups Progress & Overview Section */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">All Incubated Startups Progress</h2>
                    {stats.startups && stats.startups.length > 0 ? (
                        stats.startups.map((startup, index) => {
                            const progressVal = Number(startup.progress ?? startup.completionPercentage ?? 50);
                            const startupName = startup.idea?.title || startup.projectName || startup.name || `Startup ${index + 1}`;
                            const startupStatus = startup.status || startup.phase || 'Active';

                            return (
                                <div key={startup.incubationId || index} className="mb-6 last:mb-0 pb-4 border-b border-slate-100 last:border-0">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <span className="font-bold text-slate-700">{startupName}</span>
                                            <span className="ml-3 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-semibold">
                                                {startupStatus}
                                            </span>
                                        </div>
                                        <span className="font-bold text-orange-600">{progressVal}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                        <div
                                            className="bg-orange-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                            style={{ width: `${progressVal}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-slate-500 italic">No startups data found.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;