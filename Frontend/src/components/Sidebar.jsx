import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Rocket,
    Lightbulb,
    DollarSign,
    Users,
    MessageSquare,
    UserCheck,
    MessageCircle,
    Heart,
    Tag,
    Activity,
    LogOut,
    ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Force enable admin items so Tag Management and System Logs are always visible
    const isAdmin = true;

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col justify-between p-6 select-none shrink-0 text-slate-300">
            <div className="space-y-6">
                {/* Brand / Logo Header */}
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                        <Rocket size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-extrabold text-white tracking-wider uppercase">Incubator</h2>
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
                        </div>
                    </div>

                    {/* COMMUNITY */}
                    <div>
                        <p className="px-3 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-2">Community</p>
                        <div className="space-y-1">
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
                                    location.pathname === '/community-ideas'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                }`}
                            >
                                <MessageSquare size={16} />
                                <span>Community Ideas</span>
                            </button>
                            <button
                                onClick={() => navigate('/likes')}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    location.pathname === '/likes'
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                                }`}
                            >
                                <Heart size={16} />
                                <span>Liked Items</span>
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
            <div className="pt-4 border-t border-slate-800">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}