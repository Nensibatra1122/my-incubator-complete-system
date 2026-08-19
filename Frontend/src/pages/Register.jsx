import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, FileText, UserCheck, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Rocket, ShieldCheck } from 'lucide-react';
import api from '../api/axios';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'USER',
        bio: ''
    });

    // Custom Toast Notification State
    const [notification, setNotification] = useState({ show: false, message: '', type: 'error' });

    const showMessage = (msg, type = 'error') => {
        setNotification({ show: true, message: msg, type });
        setTimeout(() => {
            setNotification({ show: false, message: '', type: type });
        }, 4000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("Sending registration request...");
            await api.post('/auth/register', formData);

            // Success toast with green/emerald theme
            showMessage('Registration successful! Redirecting to login...', 'success');
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error("Registration Error:", error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registration failed! Please check your input.';
            showMessage(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#07090e] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">

            {/* Dynamic Background Mesh Gradients */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

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
            <div className="w-full max-w-[1200px] bg-slate-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] flex flex-col lg:flex-row overflow-hidden border border-slate-800/80 relative z-10 my-auto">

                {/* LEFT PANEL - Professional Enterprise Branding */}
                <div className="hidden lg:flex w-5/12 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 xl:p-10 flex-col justify-between text-white relative overflow-hidden border-r border-slate-800/80">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_60%)] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 text-orange-500 font-black text-xl tracking-tight mb-6">
                            <div className="p-2.5 bg-gradient-to-br from-orange-500/20 to-orange-500/5 rounded-xl border border-orange-500/30 shadow-lg shadow-orange-500/20">
                                <Rocket size={20} className="text-orange-500 animate-pulse" />
                            </div>
                            <span className="bg-gradient-to-r from-white via-slate-200 to-orange-400 bg-clip-text text-transparent">
                                INCUBATOR
                            </span>
                        </div>
                        <h1 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white mb-3">
                            Join the <br/><span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">Ecosystem</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-normal leading-relaxed">
                            Register your account to manage ventures, track milestones, and connect with global mentors and investors securely.
                        </p>
                    </div>

                    <div className="relative z-10 bg-slate-900/90 backdrop-blur-xl p-3.5 rounded-xl border border-slate-800 flex items-center gap-3 mt-4">
                        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 border border-orange-500/20 shrink-0">
                            <ShieldCheck size={16} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-white tracking-wide">Multi-Role Access</h4>
                            <p className="text-slate-400 text-[10px]">Custom permissions for Admins, Investors & Mentors</p>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL - Registration Form Terminal */}
                <div className="w-full lg:w-7/12 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-slate-900/50 relative">
                    <div className="max-w-md w-full mx-auto">

                        <div className="flex items-center gap-3 mb-5">
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:border-slate-700 cursor-pointer transition shrink-0"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div>
                                <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">Create Account</h2>
                                <p className="text-slate-400 text-[11px] font-semibold mt-0.5">Fill in your details to get started.</p>
                            </div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-3">
                            {/* Full Name */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition" size={16} />
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-100 text-xs font-semibold placeholder-slate-600 shadow-inner"
                                        required
                                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition" size={16} />
                                    <input
                                        type="email"
                                        placeholder="name@company.com"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-100 text-xs font-semibold placeholder-slate-600 shadow-inner"
                                        required
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition" size={16} />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-100 text-xs font-semibold placeholder-slate-600 shadow-inner"
                                        required
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Role</label>
                                <div className="relative group">
                                    <UserCheck className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition" size={16} />
                                    <select
                                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-100 text-xs font-semibold cursor-pointer shadow-inner"
                                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        value={formData.role}
                                    >
                                        <option value="USER" className="bg-slate-900 text-slate-100">USER</option>
                                        <option value="ADMIN" className="bg-slate-900 text-slate-100">ADMIN</option>
                                        <option value="INVESTOR" className="bg-slate-900 text-slate-100">INVESTOR</option>
                                        <option value="MENTOR" className="bg-slate-900 text-slate-100">MENTOR</option>
                                        <option value="STUDENT" className="bg-slate-900 text-slate-100">STUDENT</option>
                                    </select>
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bio (Optional)</label>
                                <div className="relative group">
                                    <FileText className="absolute left-3.5 top-3 text-slate-500 group-focus-within:text-orange-500 transition" size={16} />
                                    <textarea
                                        placeholder="Tell us a bit about yourself..."
                                        className="w-full pl-11 pr-4 py-2 bg-slate-950/80 border border-slate-800/80 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition text-slate-100 text-xs font-semibold placeholder-slate-600 resize-none h-14 shadow-inner"
                                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white py-3 rounded-xl font-bold transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer disabled:opacity-50 text-xs tracking-wider uppercase"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Complete Registration'}
                            </button>

                            {/* Back to Login Redirect */}
                            <div className="pt-3 text-center border-t border-slate-800/60 mt-3">
                                <p className="text-xs text-slate-400 font-semibold">
                                    Already have an account?{' '}
                                    <span
                                        onClick={() => navigate('/')}
                                        className="text-orange-400 font-bold hover:text-orange-300 hover:underline cursor-pointer transition"
                                    >
                                        Sign in
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

export default Register;