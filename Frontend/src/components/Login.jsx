import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Rocket, ArrowRight, CheckCircle2, AlertCircle, Activity, Cpu, Layers } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

    const showMessage = (msg, type = 'error') => {
        setNotification({ show: true, message: msg, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: type });
        }, 4000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            if (response.data) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                if (response.data.role) {
                    localStorage.setItem('role', response.data.role);
                }

                const userName = response.data.name || response.data.fullName || response.data.username || email.split('@')[0];
                const userEmail = response.data.email || email;

                localStorage.setItem('userName', userName);
                localStorage.setItem('userEmail', userEmail);
                localStorage.setItem('email', userEmail);
                localStorage.setItem('user', JSON.stringify(response.data));

                showMessage('Authentication successful. Initializing workspace...', 'success');
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1000);
            } else {
                showMessage("Authentication token missing in response payload.", 'error');
            }
        } catch (err) {
            console.error("Login authorization error:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Access denied: Invalid credentials or network error.';
            showMessage(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#05070a] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">

            {/* Dynamic Animated Background Mesh Gradients */}
            <div className="absolute top-10 left-1/3 w-[450px] h-[450px] bg-orange-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse duration-7000"></div>
            <div className="absolute bottom-10 right-1/3 w-[450px] h-[450px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse duration-5000"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b10_1px,transparent_1px),linear-gradient(to_bottom,#1e293b10_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            {/* Modern Floating Notification System */}
            {notification.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3.5 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl text-white transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                    notification.type === 'success'
                        ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50'
                        : 'bg-rose-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/50'
                }`}>
                    {notification.type === 'success' ? (
                        <div className="p-1.5 bg-emerald-500/20 rounded-xl text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 size={18} />
                        </div>
                    ) : (
                        <div className="p-1.5 bg-rose-500/20 rounded-xl text-rose-400 border border-rose-500/30">
                            <AlertCircle size={18} />
                        </div>
                    )}
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">System Notification</p>
                        <p className="text-xs font-bold tracking-tight">{notification.message}</p>
                    </div>
                </div>
            )}

            {/* Main Application Container */}
            <div className="w-full max-w-[940px] bg-slate-900/70 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_60px_-15px_rgba(249,115,22,0.15)] flex flex-col lg:flex-row overflow-hidden border border-slate-800/90 relative z-10 my-auto transition-all duration-500 hover:border-slate-700">

                {/* LEFT PANEL - Enterprise Branding & Live Telemetry */}
                <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 flex-col justify-between text-white relative overflow-hidden border-r border-slate-800/80">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.15),transparent_70%)] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 text-orange-500 font-black text-lg tracking-tight mb-5">
                            <div className="p-2 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl border border-orange-500/30 shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform">
                                <Rocket size={18} className="text-orange-500 animate-pulse" />
                            </div>
                            <span className="bg-gradient-to-r from-white via-slate-200 to-orange-400 bg-clip-text text-transparent">
                                INCUBATOR
                            </span>
                        </div>

                        <div className="space-y-1.5 mb-3">
                            <span className="px-2.5 py-0.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-[9px] font-black uppercase tracking-wider text-orange-400 inline-flex items-center gap-1 shadow-inner">
                                <Activity size={10} className="text-orange-400 animate-pulse" /> Autonomous Node Active
                            </span>
                            <h1 className="text-xl xl:text-2xl font-black leading-tight tracking-tight text-white">
                                Accelerating <br/><span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">Venture Lifecycle</span>
                            </h1>
                        </div>
                        <p className="text-slate-400 text-[11px] font-normal leading-relaxed">
                            A centralized institutional command center engineered to oversee pipelines, manage capital allocations, and evaluate startup ecosystems securely.
                        </p>
                    </div>

                    {/* Animated Telemetry Micro-Card */}
                    <div className="relative z-10 bg-slate-900/90 backdrop-blur-xl p-3 rounded-xl border border-slate-800/80 flex items-center justify-between mt-3 shadow-inner hover:border-orange-500/30 transition-all">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-400 border border-orange-500/20 shrink-0">
                                <Cpu size={14} className="animate-spin duration-3000" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold text-white tracking-wide flex items-center gap-1.5">
                                    Neural Sync
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                </h4>
                                <p className="text-slate-400 text-[9px]">Gateway Online</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-mono text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">99.9%</span>
                    </div>
                </div>

                {/* RIGHT PANEL - High-Performance Authentication Terminal */}
                <div className="w-full lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-slate-900/40 relative">
                    <div className="max-w-sm w-full mx-auto">

                        {/* Mobile Header Brand Element */}
                        <div className="flex lg:hidden items-center gap-2.5 text-orange-500 font-black text-base tracking-tight mb-5">
                            <div className="p-2 bg-orange-500/10 rounded-xl border border-orange-500/20">
                                <Rocket size={16} className="text-orange-500" />
                            </div>
                            INCUBATOR PORTAL
                        </div>

                        <div className="mb-5">
                            <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Sign In</h2>
                            <p className="text-slate-400 mt-1 text-[11px] font-semibold leading-relaxed">
                                Enter your organizational credentials to initialize your secure session.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-3.5">
                            {/* Email Field Group */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={15} />
                                    <input
                                        name="email"
                                        id="email"
                                        type="email"
                                        value={email}
                                        autoComplete="email"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-slate-100 text-xs font-semibold placeholder-slate-600 shadow-inner"
                                        placeholder="admin@incubator.com"
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password Field Group */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Secure Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={15} />
                                    <input
                                        name="password"
                                        id="password"
                                        type="password"
                                        value={password}
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all text-slate-100 text-xs font-semibold placeholder-slate-600 shadow-inner"
                                        placeholder="••••••••••••"
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Submit Terminal Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-1 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase group hover:scale-[1.02] active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={15} />
                                        Authenticating Session...
                                    </>
                                ) : (
                                    <>
                                        Initialize Workspace <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform" />
                                    </>
                                )}
                            </button>

                            {/* Register Navigation Redirect Footer */}
                            <div className="pt-3 text-center border-t border-slate-800/60 mt-3">
                                <p className="text-[11px] text-slate-400 font-semibold">
                                    Looking to onboard a new startup?{' '}
                                    <span
                                        onClick={() => navigate('/register')}
                                        className="text-orange-400 font-bold hover:text-orange-300 hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                                    >
                                        Register organization <Layers size={11} />
                                    </span>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;