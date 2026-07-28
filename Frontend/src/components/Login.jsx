import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Rocket, ArrowRight, UserCircle, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('ADMIN');

    // Custom Toast Notification State
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
            console.log("Sending login request to backend...");
            const response = await api.post('/auth/login', { email, password, role });
            console.log("Login Response Received:", response.data);

            if (response.data) {
                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                }
                if (response.data.role) {
                    localStorage.setItem('role', response.data.role);
                }

                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    // Seedha main dashboard par redirect karein
                    navigate('/dashboard');
                }, 1000);
            } else {
                showMessage("Token not found in response!", 'error');
            }
        } catch (err) {
            console.error("Login error details:", err);
            const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed: Invalid email or password.';
            showMessage(errorMsg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-orange-500 selection:text-white">

            {/* Custom Modern Floating Notification Popup */}
            {notification.show && (
                <div className="fixed top-6 right-6 z-50 animate-bounce flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border bg-slate-900 text-white border-slate-800">
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="text-orange-500 shrink-0" size={22} />
                    ) : (
                        <AlertCircle className="text-rose-500 shrink-0" size={22} />
                    )}
                    <p className="text-sm font-semibold tracking-wide">{notification.message}</p>
                </div>
            )}

            <div className="w-full max-w-[1200px] h-[700px] bg-white rounded-3xl shadow-2xl flex overflow-hidden">

                {/* LEFT PANEL */}
                <div className="hidden lg:flex w-2/5 bg-slate-900 p-12 flex-col justify-between text-white">
                    <div>
                        <div className="flex items-center gap-3 text-orange-600 font-bold text-2xl mb-12">
                            <Rocket size={28} /> INCUBATOR
                        </div>
                        <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-white mb-6">
                            Innovation & <br/><span className="text-orange-500">Startup Growth</span>
                        </h1>
                        <p className="text-slate-400 text-lg">
                            A modern, creative ecosystem built to scale your ventures.
                        </p>
                    </div>

                    <div className="bg-orange-500/10 p-6 rounded-2xl border border-orange-500/20">
                        <div className="flex items-center gap-3 text-orange-400 font-bold mb-2">
                            <ShieldCheck size={20} /> Secure Infrastructure
                        </div>
                        <p className="text-slate-400 text-xs">Enterprise-grade multi-role authentication layer.</p>
                    </div>
                </div>

                {/* RIGHT PANEL */}
                <div className="w-full lg:w-3/5 p-12 lg:p-20 flex flex-col justify-center bg-white overflow-y-auto">
                    <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Sign In</h2>
                    <p className="text-slate-500 mb-8 text-lg">Select your authority to enter the portal.</p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        {/* Role Select */}
                        <div className="relative group">
                            <UserCircle className="absolute left-4 top-4 text-slate-400 group-focus-within:text-orange-600 transition" size={20} />
                            <select
                                name="role"
                                id="role"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition cursor-pointer"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="ADMIN">ADMIN</option>
                                <option value="INVESTOR">INVESTOR</option>
                                <option value="MENTOR">MENTOR</option>
                                <option value="STUDENT">STUDENT</option>
                                <option value="USER">USER</option>
                            </select>
                        </div>

                        {/* Email */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-orange-600 transition" size={20} />
                            <input
                                name="email"
                                id="email"
                                type="email"
                                value={email}
                                autoComplete="email"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition text-slate-900"
                                placeholder="Email Address"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-orange-600 transition" size={20} />
                            <input
                                name="password"
                                id="password"
                                type="password"
                                value={password}
                                autoComplete="current-password"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-600 transition text-slate-900"
                                placeholder="Password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>Access Portal <ArrowRight size={20} /></>}
                        </button>

                        {/* Register Link */}
                        <p className="mt-4 text-center text-sm text-slate-600">
                            Don't have an account? <span onClick={() => navigate('/register')} className="text-orange-600 font-bold hover:underline cursor-pointer">Register here</span>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;