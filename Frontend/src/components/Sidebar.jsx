import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import {
    LayoutDashboard,
    Rocket,
    Lightbulb,
    DollarSign,
    Users,
    MessageSquare,
    UserCheck,
    MessageCircle,
    Tag,
    Activity,
    LogOut,
    ShieldCheck,
    Calendar,
    User,
    HeartHandshake
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Flexible role checking from localStorage
    const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || localStorage.getItem('userType') || '';
    const userRole = rawRole.replace('ROLE_', '').toUpperCase().trim();

    const isAdmin = userRole === 'ADMIN' || userRole.includes('ADMIN');
    const isInvestor = userRole === 'INVESTOR';
    const isMentor = userRole === 'MENTOR';
    const isStudent = userRole === 'STUDENT' || userRole === 'USER';

    const [pendingInterestsCount, setPendingInterestsCount] = useState(0);

    useEffect(() => {
        if (!isAdmin) return;

        let isMounted = true;

        const fetchPendingCount = async () => {
            try {
                const res = await api.get('/investor-interests/pending');
                const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
                if (isMounted) setPendingInterestsCount(data.length);
            } catch (error) {
                console.error('Error fetching pending investor interests count:', error);
            }
        };

        fetchPendingCount();
        const interval = setInterval(fetchPendingCount, 30000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [isAdmin]);

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <>
            <style>{`
                aside.custom-sidebar-scrollbar::-webkit-scrollbar {
                    width: 6px !important;
                    height: 6px !important;
                }
                aside.custom-sidebar-scrollbar::-webkit-scrollbar-track {
                    background: #0b0f17 !important;
                }
                aside.custom-sidebar-scrollbar::-webkit-scrollbar-thumb {
                    background: #f97316 !important;
                    border-radius: 4px !important;
                }
                aside.custom-sidebar-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #ea580c !important;
                }
                aside.custom-sidebar-scrollbar::-webkit-scrollbar-button {
                    display: none !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `}</style>

            <aside className="custom-sidebar-scrollbar w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 flex flex-col justify-between p-6 select-none shrink-0 text-slate-300 z-30 overflow-y-auto">
                {/* Scrollable Upper Area for Links */}
                <div className="space-y-6 pr-1">
                    {/* Brand / Logo Header */}
                    <div className="flex items-center gap-3 px-2 mb-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                            <Rocket size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">Incubator</h2>
                            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">{userRole || 'Portal'}</span>
                        </div>
                    </div>

                    {/* Navigation Sections */}
                    <nav className="space-y-6">
                        {/* OVERVIEW */}
                        <div>
                            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Overview</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    location.pathname === '/dashboard'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                }`}
                            >
                                <LayoutDashboard size={16} />
                                <span>Dashboard</span>
                            </button>
                        </div>

                        {/* INCUBATION */}
                        <div>
                            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Incubation</p>
                            <div className="space-y-1">
                                <button
                                    onClick={() => navigate('/startups')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/startups'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <Rocket size={16} />
                                    <span>Startups</span>
                                </button>
                                <button
                                    onClick={() => navigate('/ideas')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/ideas'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <Lightbulb size={16} />
                                    <span>Idea Pipeline</span>
                                </button>
                                <button
                                    onClick={() => navigate('/sessions')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/sessions'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <Calendar size={16} />
                                    <span>Sessions Management</span>
                                </button>
                            </div>
                        </div>

                        {/* FINANCE */}
                        <div>
                            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Finance</p>
                            <div className="space-y-1">
                                <button
                                    onClick={() => navigate('/finance')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/finance'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <DollarSign size={16} />
                                    <span>Projects & Finance</span>
                                </button>

                                {!isInvestor && !isMentor && !isStudent && (
                                    <button
                                        onClick={() => navigate('/investors')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            location.pathname === '/investors'
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        <Users size={16} />
                                        <span>Investors</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* COMMUNITY & PROFILE */}
                        <div>
                            <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Community & Profile</p>
                            <div className="space-y-1">
                                {!isInvestor && !isMentor && !isStudent && (
                                    <button
                                        onClick={() => navigate('/mentors')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            location.pathname === '/mentors'
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        <UserCheck size={16} />
                                        <span>Mentors</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => navigate('/feedback')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/feedback'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <MessageCircle size={16} />
                                    <span>Feedback</span>
                                </button>
                                <button
                                    onClick={() => navigate('/community-ideas')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/community-ideas' || location.pathname === '/likes'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <MessageSquare size={16} />
                                    <span>Community Hub</span>
                                </button>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                        location.pathname === '/profile'
                                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                    }`}
                                >
                                    <User size={16} />
                                    <span>Profile</span>
                                </button>
                            </div>
                        </div>

                        {/* ADMIN CONTROL */}
                        {isAdmin && (
                            <div>
                                <p className="px-3 text-[10px] font-extrabold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <ShieldCheck size={12} /> Admin Control
                                </p>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => navigate('/investor-interests')}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            location.pathname === '/investor-interests'
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        <span className="flex items-center gap-3">
                                            <HeartHandshake size={16} />
                                            <span>Investor Requests</span>
                                        </span>
                                        {pendingInterestsCount > 0 && (
                                            <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-sm shadow-rose-500/40">
                                                {pendingInterestsCount > 99 ? '99+' : pendingInterestsCount}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => navigate('/tags')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            location.pathname === '/tags'
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        <Tag size={16} />
                                        <span>Manage Tags</span>
                                    </button>
                                    <button
                                        onClick={() => navigate('/logs')}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                            location.pathname === '/logs'
                                                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                                : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                        }`}
                                    >
                                        <Activity size={16} />
                                        <span>System Logs</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </nav>
                </div>

                {/* Logout Footer Section */}
                <div className="pt-3 border-t border-slate-800 bg-slate-900 mt-2 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}