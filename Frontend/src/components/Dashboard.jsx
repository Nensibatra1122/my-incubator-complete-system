import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Lightbulb, Rocket, DollarSign, Users, Bell, TrendingUp, Plus, Trash2, CheckCircle2, Circle, Shield, Briefcase, Award, BookOpen, UserCheck, MessageSquare, Eye } from 'lucide-react';
import api from '../api/axios'; // Centralized axios instance import kiya

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${color}`}>
                <Icon className="text-white" size={24} />
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
        </div>
        <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);
    const [dashboardStats, setDashboardStats] = useState(null);

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

    // Fetch Backend Dynamic Analytics Data using centralized 'api' instance
    useEffect(() => {
        const fetchDashboardStats = async () => {
            // Agar user ADMIN nahi hai, toh analytics request block kar dein taake confidential data secure rahe
            if (userRole !== 'ADMIN') {
                return;
            }

            try {
                // Ensure valid parameters are passed (avoiding any ':1' or empty placeholders)
                const response = await api.get('/analytics/dashboard', {
                    params: {
                        role: userRole,
                        email: userEmail && userEmail !== ':1' ? userEmail : '',
                        mentorId: userId
                    }
                });
                setDashboardStats(response.data);
            } catch (error) {
                console.error("Error fetching analytics:", error);
            }
        };

        fetchDashboardStats();
    }, [userRole, userEmail, userId]);

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

    // Role-Based Target Notifications Fetching using centralized 'api' instance
    const fetchUnreadCount = () => {
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
                console.error("Error fetching role-based notifications count:", error);
            });
    };

    useEffect(() => {
        fetchUnreadCount();
        window.addEventListener('notificationUpdated', fetchUnreadCount);

        return () => {
            window.removeEventListener('notificationUpdated', fetchUnreadCount);
        };
    }, [userRole]);

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 p-10">
                {/* Header with Role Badge */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-extrabold text-slate-900">Dashboard</h1>
                            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-extrabold tracking-wider flex items-center gap-1 shadow-sm">
                                <Shield size={12} /> {userRole} PORTAL
                            </span>
                        </div>
                        <p className="text-slate-500 mt-1">
                            {userRole === 'ADMIN' && 'Manage your complete innovation ecosystem, logs, and administrative tasks.'}
                            {userRole === 'INVESTOR' && 'Access confidential financials of your invested startups only (Read-Only) and review idea pipeline feeds.'}
                            {userRole === 'MENTOR' && 'Review student idea pipelines, provide guidance, and access mentor chat modules.'}
                            {userRole === 'STUDENT' && 'Manage your active projects, submit new ideas, and track incubation milestones.'}
                            {userRole === 'USER' && 'Welcome! Explore community ideas and complete your profile.'}
                        </p>
                    </div>

                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-800 transition cursor-pointer shadow-lg"
                    >
                        <Bell size={20} /> View Notifications
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-extrabold text-white ring-2 ring-white shadow-md animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Statistics Grid (Dynamic Data Integrated) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {userRole === 'ADMIN' && (
                        <>
                            <StatCard title="Total Active Ideas" value={dashboardStats?.totalIdeas ?? 7} icon={Lightbulb} color="bg-orange-500" />
                            <StatCard title="Total Startups" value={dashboardStats?.totalIncubations ?? 12} icon={Rocket} color="bg-blue-600" />
                            <StatCard title="Total Mentors" value={dashboardStats?.totalMentors ?? 8} icon={Users} color="bg-emerald-500" />
                            <StatCard title="System Funding" value="$1.2M" icon={DollarSign} color="bg-purple-600" />
                        </>
                    )}
                    {userRole === 'INVESTOR' && (
                        <>
                            <StatCard title="My Invested Startups" value={dashboardStats?.investmentOpportunitiesCount ?? 2} icon={Rocket} color="bg-blue-600" />
                            <StatCard title="Committed Capital" value="$850K" icon={DollarSign} color="bg-purple-600" />
                            <StatCard title="Pipeline Feedbacks" value="14" icon={MessageSquare} color="bg-orange-500" />
                            <StatCard title="Portfolio ROI" value="+22%" icon={TrendingUp} color="bg-emerald-500" />
                        </>
                    )}
                    {userRole === 'MENTOR' && (
                        <>
                            <StatCard title="Assigned Startups" value={dashboardStats?.assignedStartupsCount ?? 5} icon={Rocket} color="bg-blue-600" />
                            <StatCard title="Assigned Mentees" value="10" icon={Users} color="bg-emerald-500" />
                            <StatCard title="Active Chat Modules" value="3" icon={MessageSquare} color="bg-orange-500" />
                            <StatCard title="Total Sessions" value="24" icon={Award} color="bg-purple-600" />
                        </>
                    )}
                    {userRole === 'STUDENT' && (
                        <>
                            <StatCard title="My Submitted Ideas" value={dashboardStats?.myIdeasCount ?? 0} icon={Lightbulb} color="bg-orange-500" />
                            <StatCard title="Active Projects" value={dashboardStats?.myIncubationsCount ?? 0} icon={Rocket} color="bg-blue-600" />
                            <StatCard title="Mentor Interactions" value="4" icon={MessageSquare} color="bg-emerald-500" />
                            <StatCard title="Incubation Status" value={dashboardStats?.myIncubationsCount > 0 ? "Active" : "Pending"} icon={Award} color="bg-purple-600" />
                        </>
                    )}
                    {userRole === 'USER' && (
                        <>
                            <StatCard title="My Ideas" value={dashboardStats?.myIdeasCount ?? 0} icon={Lightbulb} color="bg-orange-500" />
                            <StatCard title="My Incubations" value={dashboardStats?.myIncubationsCount ?? 0} icon={Rocket} color="bg-blue-600" />
                            <StatCard title="Active Discussions" value="8" icon={MessageSquare} color="bg-emerald-500" />
                            <StatCard title="Profile Status" value="Basic" icon={UserCheck} color="bg-purple-600" />
                        </>
                    )}
                </div>

                {/* Bottom Section: Strict Role-Based Authority Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* 1. ADMIN PANEL */}
                    {userRole === 'ADMIN' && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-slate-900">Admin To-Do Checklist</h3>
                                        <p className="text-slate-400 text-xs">Keep track of your personal administrative tasks and logs.</p>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-xl">
                                        {tasks.filter(t => t.completed).length}/{tasks.length} Done
                                    </span>
                                </div>

                                <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Add a new task..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-2xl font-bold flex items-center gap-1 transition cursor-pointer"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </form>

                                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                    {tasks.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-6">No tasks added yet. Create one above!</p>
                                    ) : (
                                        tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                                                    task.completed ? 'bg-slate-50/60 border-slate-100 opacity-60' : 'bg-slate-50 border-slate-200'
                                                }`}
                                            >
                                                <div
                                                    onClick={() => toggleTask(task.id)}
                                                    className="flex items-center gap-3 cursor-pointer flex-1"
                                                >
                                                    {task.completed ? (
                                                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                                    ) : (
                                                        <Circle size={18} className="text-slate-400 shrink-0" />
                                                    )}
                                                    <span className={`text-xs font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                        {task.text}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => deleteTask(task.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1.5 transition cursor-pointer"
                                                    title="Delete task"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. INVESTOR PANEL */}
                    {userRole === 'INVESTOR' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-emerald-600 font-bold mb-3">
                                <Briefcase size={24} /> Investor Portal & Confidential Portfolio
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">View Invested Startups & Share Pipeline Feedbacks</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                You have strict read-only access exclusively to the financial metrics of the startups you have funded.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => navigate('/my-invested-startups')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                                >
                                    <Eye size={16} /> View My Invested Startups (Read-Only)
                                </button>
                                <button
                                    onClick={() => navigate('/community-ideas')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Idea Pipeline & Feedback Feed
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. MENTOR PANEL */}
                    {userRole === 'MENTOR' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-blue-600 font-bold mb-3">
                                <Award size={24} /> Mentor Collaboration & Guidance Hub
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Review Idea Pipelines & Connect via Mentor Chat</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Guide student innovations, examine incoming idea details, and utilize mentor chat modules.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/ideas')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md flex items-center gap-2"
                                >
                                    <Lightbulb size={16} /> Review Idea Pipeline & Details
                                </button>
                                <button
                                    onClick={() => navigate('/mentor-chat')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer flex items-center gap-2"
                                >
                                    <MessageSquare size={16} /> Chat with Mentees
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 4. STUDENT PANEL */}
                    {userRole === 'STUDENT' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-orange-600 font-bold mb-3">
                                <BookOpen size={24} /> Student Innovation & Project Workspace
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Manage Your Projects & Track Submissions</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Submit new startup ideas, track your ongoing project pipeline, and view your active incubations.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/submit-idea')}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md"
                                >
                                    Submit New Idea
                                </button>
                                <button
                                    onClick={() => navigate('/ideas')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer"
                                >
                                    View My Project Pipeline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 5. USER PANEL */}
                    {userRole === 'USER' && (
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-center">
                            <div className="flex items-center gap-3 text-slate-700 font-bold mb-3">
                                <UserCheck size={24} /> General Account Portal
                            </div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Welcome to the Platform</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                Explore community ideas, browse public startups, or track your submitted items.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => navigate('/community-ideas')}
                                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer shadow-md"
                                >
                                    Explore Community Ideas
                                </button>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-2xl font-bold text-xs transition cursor-pointer"
                                >
                                    Complete Your Profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Right Side Card: Analytics & Insights */}
                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-4 text-orange-400 font-bold text-xs uppercase tracking-wider">
                                <TrendingUp size={16} />
                                Ecosystem Activity
                            </div>
                            <h3 className="text-xl font-bold mb-3 leading-snug">
                                {userRole === 'ADMIN' ? 'Performance Tracking & Analytics' : 'Incubation Growth Metrics'}
                            </h3>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                {dashboardStats?.message || 'Explore your personalized portal activity and track your real-time ecosystem stats.'}
                            </p>
                        </div>
                        {userRole !== 'INVESTOR' && (
                            <button
                                onClick={() => navigate('/analytics')}
                                className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-2xl font-bold text-xs transition shadow-lg shadow-orange-600/30 cursor-pointer"
                            >
                                View Full Analytics
                            </button>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;