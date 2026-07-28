import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ShieldAlert, BarChart3 } from 'lucide-react';
import api from '../api/axios';

const Analytics = () => {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState([]);
    const [ideasCount, setIdeasCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // Get current user role from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    useEffect(() => {
        // Strict check: Only ADMIN can view incubator analytics
        if (userRole !== 'ADMIN') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [progRes, ideaRes] = await Promise.all([
                    api.get('/progress').catch(() => ({ data: [] })),
                    api.get('/ideas').catch(() => ({ data: [] }))
                ]);

                const progressList = progRes.data || [];
                const ideas = ideaRes.data || [];
                setIdeasCount(ideas.length);

                const combined = progressList.map((item, index) => {
                    const matchedIdea = ideas[index % ideas.length] || {};
                    return {
                        name: matchedIdea.title || `Project ${index + 1}`,
                        percentage: Number(item.completion_percentage ?? item.percentage ?? item.completionPercentage ?? 0),
                        phase: item.current_phase ?? item.currentPhase ?? item.status ?? 'Active'
                    };
                });

                setAnalytics(combined);
            } catch (error) {
                console.error("API Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userRole]);

    // Calculate Average Progress dynamically
    const avgProgress = analytics.length > 0
        ? Math.round(analytics.reduce((acc, curr) => acc + curr.percentage, 0) / analytics.length)
        : 0;

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
                <div className="text-lg font-semibold text-slate-600 animate-pulse">Loading Analytics...</div>
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
                <p className="text-slate-500 mb-8">High-level performance metrics of all incubated projects.</p>

                {/* Top Summary KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Total Projects</p>
                        <h3 className="text-4xl font-extrabold text-slate-900 mt-2">{ideasCount}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Average Completion</p>
                        <h3 className="text-4xl font-extrabold text-orange-600 mt-2">{avgProgress}%</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Active Modules</p>
                        <h3 className="text-4xl font-extrabold text-blue-600 mt-2">{analytics.length}</h3>
                    </div>
                </div>

                {/* System Health / Category Breakdown Section */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Overall Progress Distribution</h2>
                    {analytics.length > 0 ? (
                        analytics.map((item, index) => (
                            <div key={index} className="mb-6 last:mb-0">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <span className="font-bold text-slate-700">{item.name}</span>
                                        <span className="ml-3 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-semibold">{item.phase}</span>
                                    </div>
                                    <span className="font-bold text-orange-600">{item.percentage}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                                    <div
                                        className="bg-orange-500 h-3 rounded-full transition-all duration-500 ease-in-out"
                                        style={{ width: `${item.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 italic">No analytics data found.</p>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Analytics;