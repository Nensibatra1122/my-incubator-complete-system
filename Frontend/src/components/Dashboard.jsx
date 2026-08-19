import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import {
    Lightbulb, Rocket, DollarSign, Users, Bell, TrendingUp,
    Plus, Trash2, CheckCircle2, Shield, Briefcase, Award,
    BookOpen, UserCheck, MessageSquare, Eye, Activity, BarChart2
} from 'lucide-react';
import api from '../api/axios';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-6 rounded-3xl shadow-xl transition-all group">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10 border border-current group-hover:scale-110 transition-transform`}>
                <Icon size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <TrendingUp size={12} /> Live
            </span>
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
        <h3 className="text-4xl font-extrabold text-white tracking-tight">
            {loading ? <span className="animate-pulse text-slate-600">--</span> : value}
        </h3>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const userRole = (localStorage.getItem('role') || 'USER').replace('ROLE_', '');
    const userEmail = localStorage.getItem('email') || '';
    const userId = localStorage.getItem('userId') || null;

    // To-Do List State (Strictly Admin Only)
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('admin_memo_checklist');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: 'Review pending incubator applications', completed: false },
            { id: 2, text: 'Schedule meeting with Angel Investors', completed: true },
            { id: 3, text: 'Approve new startup profiles', completed: false }
        ];
    });

    const [newTaskText, setNewTaskText] = useState('');

    useEffect(() => {
        if (userRole === 'ADMIN') {
            localStorage.setItem('admin_memo_checklist', JSON.stringify(tasks));
        }
    }, [tasks, userRole]);

    // Fetch Backend Dynamic Analytics & Real-Time Live Stats with Fallback Endpoints
    const fetchDashboardStats = useCallback(async () => {
        try {
            setLoading(true);

            // 1. ADMIN PORTAL DATA (Direct real-time metrics fetch from database with Fallbacks)
            if (userRole === 'ADMIN') {
                const [ideasRes, startupsRes, mentorsRes] = await Promise.all([
                    api.get('/ideas').catch(() => ({ data: [] })),
                    api.get('/incubations').catch(() => ({ data: [] })),
                    api.get('/mentors').catch(() => api.get('/users/mentors').catch(() => ({ data: [] })))
                ]);

                const ideas = Array.isArray(ideasRes.data) ? ideasRes.data : [];
                const startups = Array.isArray(startupsRes.data) ? startupsRes.data : [];
                const mentors = Array.isArray(mentorsRes.data) ? mentorsRes.data : [];

                setDashboardStats({
                    totalIdeas: ideas.length,
                    totalIncubations: startups.length,
                    totalMentors: mentors.length,
                    systemFunding: "$1.2M"
                });
                setLoading(false);
                return;
            }

            // 2. MENTOR PORTAL DATA
            if (userRole === 'MENTOR') {
                const [incubationsRes, chatRes, sessionsRes] = await Promise.all([
                    api.get('/incubations/my').catch(() => ({ data: [] })),
                    api.get('/chat/rooms').catch(() => ({ data: [] })),
                    api.get('/sessions').catch(() => ({ data: [] }))
                ]);

                const assignedIncs = Array.isArray(incubationsRes.data) ? incubationsRes.data : [];
                const allChats = Array.isArray(chatRes.data) ? chatRes.data : [];
                const allSessions = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];

                setDashboardStats({
                    assignedStartupsCount: assignedIncs.length,
                    assignedMenteesCount: assignedIncs.length,
                    activeChatModulesCount: allChats.length,
                    totalSessionsCount: allSessions.length
                });
                setLoading(false);
                return;
            }

            // 3. INVESTOR PORTAL DATA
            if (userRole === 'INVESTOR') {
                let investments = [];
                let feedbacks = [];

                try {
                    const invRes = await api.get('/investments/my-portfolio');
                    investments = invRes.data || [];
                } catch (e) {
                    console.warn("Investments portfolio endpoint restricted");
                }

                try {
                    const feedRes = await api.get('/feedback/my-feedbacks');
                    feedbacks = feedRes.data || [];
                } catch (e) {
                    console.warn("Feedbacks endpoint restricted");
                }

                const totalCommitted = investments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

                setDashboardStats({
                    investedStartupsCount: investments.length,
                    committedCapital: totalCommitted > 0 ? `$${(totalCommitted / 1000).toFixed(0)}K` : "$0",
                    pipelineFeedbacksCount: feedbacks.length,
                    portfolioRoi: "+22%"
                });
                setLoading(false);
                return;
            }

            // 4. STUDENT / USER PORTAL DATA
            const response = await api.get('/analytics/dashboard', {
                params: {
                    role: userRole,
                    email: userEmail && userEmail !== ':1' ? userEmail : '',
                    mentorId: userId
                }
            });
            setDashboardStats(response.data);

        } catch (error) {
            console.error("Error fetching live stats:", error);
        } finally {
            setLoading(false);
        }
    }, [userRole, userEmail, userId]);

    useEffect(() => {
        fetchDashboardStats();
    }, [fetchDashboardStats]);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([{ id: Date.now(), text: newTaskText, completed: false }, ...tasks]);
        setNewTaskText('');
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(task => task.id !== id));
    };

    // Role-Based Target Notifications Fetching
    const fetchUnreadCount = useCallback(() => {
        api.get('/notifications/all')
            .then(response => {
                const list = Array.isArray(response.data) ? response.data : [];
                const targetedNotifications = list.filter(n => {
                    if (!n.targetRole) return true;
                    return n.targetRole.toUpperCase() === userRole.toUpperCase();
                });
                const unread = targetedNotifications.filter(n => n.isRead === false || n.isRead === 0 || n.read === false).length;
                setUnreadCount(unread);
            })
            .catch(error => {
                console.error("Error fetching notifications:", error);
            });
    }, [userRole]);

    useEffect(() => {
        fetchUnreadCount();
        window.addEventListener('notificationUpdated', fetchUnreadCount);
        return () => {
            window.removeEventListener('notificationUpdated', fetchUnreadCount);
        };
    }, [userRole, fetchUnreadCount]);

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto">

                {/* TOP HEADER */}
                <div className="flex justify-between items-center mb-8 bg-slate-800/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
                            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20 flex items-center gap-1">
                                <Shield size={12} /> {userRole} PORTAL
                            </span>
                        </div>
                        <p className="text-slate-400 text-sm">
                            {userRole === 'ADMIN' && 'Manage your complete innovation ecosystem, logs, and administrative tasks.'}
                            {userRole === 'INVESTOR' && 'Access confidential financials of your invested startups only (Read-Only) and review idea pipeline feeds.'}
                            {userRole === 'MENTOR' && 'Review student idea pipelines, provide guidance, and access mentee chat modules.'}
                            {userRole === 'STUDENT' && 'Manage your active projects, submit new ideas, and track incubation milestones.'}
                            {userRole === 'USER' && 'Welcome! Explore community ideas and complete your profile.'}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative flex items-center gap-2.5 bg-slate-800 hover:bg-slate-700 text-white px-5 py-3 rounded-2xl font-bold border border-slate-700 shadow-lg transition cursor-pointer"
                        >
                            <Bell size={18} className="text-orange-400" />
                            <span>View Notifications</span>
                            {unreadCount > 0 && (
                                <span className="w-5 h-5 bg-rose-600 text-white rounded-full text-xs flex items-center justify-center font-bold">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* 4 STATS CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {userRole === 'ADMIN' && (
                        <>
                            <StatCard title="Total Active Ideas" value={dashboardStats?.totalIdeas ?? 0} icon={Lightbulb} color="text-orange-500 border-orange-500/20 bg-orange-500/10" loading={loading} />
                            <StatCard title="Total Startups" value={dashboardStats?.totalIncubations ?? 0} icon={Rocket} color="text-sky-400 border-sky-500/20 bg-sky-500/10" loading={loading} />
                            <StatCard title="Total Mentors" value={dashboardStats?.totalMentors ?? 0} icon={Users} color="text-emerald-400 border-emerald-500/20 bg-emerald-500/10" loading={loading} />
                            <StatCard title="System Funding" value={dashboardStats?.systemFunding ?? "$1.2M"} icon={DollarSign} color="text-purple-400 border-purple-500/20 bg-purple-500/10" loading={loading} />
                        </>
                    )}
                    {userRole === 'INVESTOR' && (
                        <>
                            <StatCard title="My Invested Startups" value={dashboardStats?.investedStartupsCount ?? 0} icon={Rocket} color="text-sky-400 border-sky-500/20 bg-sky-500/10" loading={loading} />
                            <StatCard title="Committed Capital" value={dashboardStats?.committedCapital ?? "$0"} icon={DollarSign} color="text-purple-400 border-purple-500/20 bg-purple-500/10" loading={loading} />
                            <StatCard title="Pipeline Feedbacks" value={dashboardStats?.pipelineFeedbacksCount ?? 0} icon={MessageSquare} color="text-orange-500 border-orange-500/20 bg-orange-500/10" loading={loading} />
                            <StatCard title="Portfolio ROI" value={dashboardStats?.portfolioRoi ?? "+22%"} icon={TrendingUp} color="text-emerald-400 border-emerald-500/20 bg-emerald-500/10" loading={loading} />
                        </>
                    )}
                    {userRole === 'MENTOR' && (
                        <>
                            <StatCard title="Assigned Startups" value={dashboardStats?.assignedStartupsCount ?? 0} icon={Rocket} color="text-sky-400 border-sky-500/20 bg-sky-500/10" loading={loading} />
                            <StatCard title="Assigned Mentees" value={dashboardStats?.assignedMenteesCount ?? 0} icon={Users} color="text-emerald-400 border-emerald-500/20 bg-emerald-500/10" loading={loading} />
                            <StatCard title="Active Chat Modules" value={dashboardStats?.activeChatModulesCount ?? 0} icon={MessageSquare} color="text-orange-500 border-orange-500/20 bg-orange-500/10" loading={loading} />
                            <StatCard title="Total Sessions" value={dashboardStats?.totalSessionsCount ?? 0} icon={Award} color="text-purple-400 border-purple-500/20 bg-purple-500/10" loading={loading} />
                        </>
                    )}
                    {(userRole === 'STUDENT' || userRole === 'USER') && (
                        <>
                            <StatCard title="My Submitted Ideas" value={dashboardStats?.submittedIdeas ?? 0} icon={Lightbulb} color="text-orange-500 border-orange-500/20 bg-orange-500/10" loading={loading} />
                            <StatCard title="Active Projects" value={dashboardStats?.activeProjects ?? 0} icon={Rocket} color="text-sky-400 border-sky-500/20 bg-sky-500/10" loading={loading} />
                            <StatCard title="Mentor Interactions" value={dashboardStats?.mentorInteractions ?? 0} icon={MessageSquare} color="text-emerald-400 border-emerald-500/20 bg-emerald-500/10" loading={loading} />
                            <StatCard title="Incubation Status" value={dashboardStats?.incubationStatus ?? "Pending"} icon={Award} color="text-purple-400 border-purple-500/20 bg-purple-500/10" loading={loading} />
                        </>
                    )}
                </div>

                {/* BOTTOM SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

                        <div>
                            <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
                                <Activity size={16} /> Live System Growth
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                                {userRole === 'ADMIN' ? 'Performance Tracking & Analytics' : 'Incubation Growth Metrics'}
                            </h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Explore your personalized portal activity and track real-time ecosystem stats.
                            </p>

                            <div className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl mb-6 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400 font-semibold flex items-center gap-1.5"><BarChart2 size={14} className="text-sky-400" /> Active Count</span>
                                    <span className="text-white font-bold">
                                        {dashboardStats?.activeProjects || dashboardStats?.totalIncubations || dashboardStats?.assignedStartupsCount || dashboardStats?.investedStartupsCount || 0}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
                                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '65%' }}></div>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500">
                                    <span>Real-time sync</span>
                                    <span className="text-emerald-400 font-semibold">● Active API</span>
                                </div>
                            </div>
                        </div>

                        {userRole !== 'INVESTOR' && (
                            <button
                                onClick={() => navigate('/analytics')}
                                className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                            >
                                <span>View Full Analytics</span>
                                <TrendingUp size={18} />
                            </button>
                        )}
                    </div>

                    {/* ROLE SPECIFIC PANELS */}
                    {userRole === 'ADMIN' && (
                        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Admin To-Do Checklist</h2>
                                        <p className="text-xs text-slate-400 mt-0.5">Keep track of your personal administrative tasks and logs.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate('/mentor-broadcast-qna')}
                                            className="bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2"
                                        >
                                            <MessageSquare size={15} /> Mentor Q&A Hub
                                        </button>
                                        <span className="text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full">
                                            {tasks.filter(t => t.completed).length}/{tasks.length} Done
                                        </span>
                                    </div>
                                </div>

                                <form onSubmit={handleAddTask} className="flex gap-3 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Add a new task..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-700/80 rounded-2xl focus:outline-none focus:border-orange-500 text-sm font-semibold text-white placeholder-slate-500 transition"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer shrink-0"
                                    >
                                        <Plus size={18} /> Add
                                    </button>
                                </form>

                                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                                    {tasks.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6">No tasks added yet. Create one above!</p>
                                    ) : (
                                        tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                                                    task.completed
                                                        ? 'bg-slate-900/40 border-slate-800 text-slate-500 line-through'
                                                        : 'bg-slate-900/80 border-slate-700/80 text-slate-200 hover:border-slate-600'
                                                }`}
                                            >
                                                <div
                                                    onClick={() => toggleTask(task.id)}
                                                    className="flex items-center gap-3 flex-1"
                                                >
                                                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                                                        task.completed
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'border-slate-600 bg-slate-800'
                                                    }`}>
                                                        {task.completed && <CheckCircle2 size={14} />}
                                                    </div>
                                                    <span className="text-sm font-semibold">{task.text}</span>
                                                </div>
                                                <button
                                                    onClick={() => deleteTask(task.id)}
                                                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {userRole === 'INVESTOR' && (
                        <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-emerald-400 font-bold mb-3">
                                <Briefcase size={24} /> Investor Portal & Confidential Portfolio
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2">View Invested Startups & Share Pipeline Feedbacks</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                You have strict read-only access exclusively to the financial metrics of the startups you have funded.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/my-invested-startups')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                                >
                                    <Eye size={16} /> View My Invested Startups (Read-Only)
                                </button>
                                <button
                                    onClick={() => navigate('/community-ideas')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer border border-slate-700 flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Idea Pipeline & Feedback Feed
                                </button>
                            </div>
                        </div>
                    )}

                    {userRole === 'MENTOR' && (
                        <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-sky-400 font-bold mb-3">
                                <Award size={24} /> Mentor Collaboration & Guidance Hub
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2">Review Idea Pipelines & Connect with Mentees</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Guide student innovations, examine incoming idea details, and utilize mentee chat modules and Q&A broadcast inbox.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/ideas')}
                                    className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                                >
                                    <Lightbulb size={16} /> Review Idea Pipeline & Details
                                </button>
                                <button
                                    onClick={() => navigate('/chat')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer border border-slate-700 flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Chat with Mentees
                                </button>
                                <button
                                    onClick={() => navigate('/mentor-broadcast-qna')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md shadow-orange-500/25 flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Mentor Q&A Inbox
                                </button>
                            </div>
                        </div>
                    )}

                    {(userRole === 'STUDENT' || userRole === 'USER') && (
                        <div className="bg-slate-800/50 border border-slate-800 p-8 rounded-3xl shadow-xl backdrop-blur-xl lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-orange-400 font-bold mb-3">
                                <BookOpen size={24} /> Student Innovation & Project Workspace
                            </div>
                            <h3 className="text-2xl font-extrabold text-white mb-2">Manage Your Projects & Track Submissions</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Submit new startup ideas, track your ongoing project pipeline, and ask questions to mentors in the Q&A Hub.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/submit-idea')}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md shadow-orange-500/20"
                                >
                                    Submit New Idea
                                </button>
                                <button
                                    onClick={() => navigate('/ideas')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer border border-slate-700"
                                >
                                    View My Project Pipeline
                                </button>
                                <button
                                    onClick={() => navigate('/mentor-broadcast-qna')}
                                    className="bg-slate-900 hover:bg-slate-800 text-orange-400 border border-orange-500/30 px-6 py-3.5 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Mentor Q&A Hub
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;