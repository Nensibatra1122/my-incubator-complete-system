import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Rocket, DollarSign, Users, Activity, MessageSquare, ClipboardList, LogOut, User, Heart, Lightbulb, Tag } from 'lucide-react';

const Sidebar = () => {
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const storedRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || 'USER').trim().toUpperCase();
        setUserRole(storedRole);
    }, []);

    // Check specific roles
    const isAdmin = userRole === 'ADMIN';
    const isStudentOrUser = userRole === 'STUDENT' || userRole === 'USER';

    // Logout function - Yeh local storage se tokens hatakar user ko login page pe bhej dega
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('jwt');
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('role');
        localStorage.removeItem('email');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    // Helper class for active/inactive nav links styling
    const navLinkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition ${
            isActive
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`;

    return (
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between sticky top-0 h-screen shrink-0 z-40 border-r border-slate-800 shadow-xl overflow-y-auto">
            <div>
                {/* Logo/Header */}
                <div className="flex items-center gap-3 px-6 pt-6 text-orange-600 font-black text-xl mb-10">
                    <div className="p-2 bg-orange-600 text-white rounded-xl">
                        <Rocket size={20} />
                    </div>
                    <span className="tracking-wider text-white">INCUBATOR</span>
                </div>

                {/* Navigation Groups */}
                <nav className="flex-1 space-y-6 px-4">
                    {/* Overview */}
                    <div>
                        <p className="px-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Overview</p>
                        <div className="space-y-1">
                            <NavLink to="/dashboard" className={navLinkClass}>
                                <LayoutDashboard size={18} /> Dashboard
                            </NavLink>
                            <NavLink to="/profile" className={navLinkClass}>
                                <User size={18} /> Profile
                            </NavLink>
                        </div>
                    </div>

                    {/* Incubation */}
                    <div>
                        <p className="px-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Incubation</p>
                        <div className="space-y-1">
                            <NavLink to="/startups" className={navLinkClass}>
                                <Rocket size={18} /> Startups
                            </NavLink>
                            <NavLink to="/ideas" className={navLinkClass}>
                                <ClipboardList size={18} /> Idea Pipeline
                            </NavLink>
                        </div>
                    </div>

                    {/* Finance */}
                    <div>
                        <p className="px-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Finance & Funding</p>
                        <div className="space-y-1">
                            <NavLink to="/finance" className={navLinkClass}>
                                <DollarSign size={18} /> Projects
                            </NavLink>
                            {/* Investors tab is restricted or can be viewed by Admin/Investor */}
                            {!isStudentOrUser && (
                                <NavLink to="/investors" className={navLinkClass}>
                                    <DollarSign size={18} className="text-orange-400" /> Investors
                                </NavLink>
                            )}
                        </div>
                    </div>

                    {/* Community */}
                    <div>
                        <p className="px-2 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Community</p>
                        <div className="space-y-1">
                            <NavLink to="/community-ideas" className={navLinkClass}>
                                <Lightbulb size={18} className="text-orange-500" /> Community Feed
                            </NavLink>
                            <NavLink to="/mentors" className={navLinkClass}>
                                <Users size={18} /> Mentors
                            </NavLink>
                            <NavLink to="/feedback" className={navLinkClass}>
                                <MessageSquare size={18} /> Feedback
                            </NavLink>

                            {/* Likes & Tags Management - Visible ONLY to ADMIN */}
                            {isAdmin && (
                                <>
                                    <NavLink to="/likes" className={navLinkClass}>
                                        <Heart size={18} className="text-rose-500" /> Likes Management
                                    </NavLink>
                                    <NavLink to="/tags" className={navLinkClass}>
                                        <Tag size={18} className="text-orange-500" /> Tags Management
                                    </NavLink>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
            </div>

            {/* Footer Items */}
            <div className="p-4 border-t border-slate-800 space-y-2 mt-4 bg-slate-900">
                {/* System Logs - Visible ONLY to ADMIN */}
                {isAdmin && (
                    <NavLink to="/logs" className={navLinkClass}>
                        <Activity size={18} /> System Logs
                    </NavLink>
                )}

                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition w-full cursor-pointer"
                >
                    <LogOut size={18} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;