import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, FileText, UserCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../api/axios';

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        role: 'USER',
        bio: ''
    });
    const [message, setMessage] = useState(''); // Success/Error message state
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            setMessage("Registration successful! Redirecting to login...");
            setTimeout(() => {
                navigate('/');
            }, 2000); // 2 second baad automatically login page par redirect karega
        } catch (error) {
            console.error("Registration Error:", error);
            setMessage("Registration failed! Please check your input.");
        }
    };

    return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-6 selection:bg-orange-500 selection:text-white">
            <form onSubmit={handleRegister} className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-lg space-y-6">

                {/* Success/Error Message UI */}
                {message && (
                    <div className={`p-4 rounded-xl font-bold flex items-center gap-2 text-sm ${message.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        <CheckCircle2 size={20} /> {message}
                    </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-900 cursor-pointer">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="text-3xl font-extrabold text-slate-900">Create Account</h2>
                </div>
                <p className="text-slate-500 text-sm">Join our ecosystem by filling in your details.</p>

                {/* Full Name */}
                <div className="relative">
                    <User className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full pl-12 p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-700/20 text-sm"
                        required
                        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                </div>

                {/* Email */}
                <div className="relative">
                    <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-700/20 text-sm"
                        required
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                {/* Password */}
                <div className="relative">
                    <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full pl-12 p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-700/20 text-sm"
                        required
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                {/* Role Selection (All 5 Roles Included) */}
                <div className="relative">
                    <UserCheck className="absolute left-4 top-4 text-slate-400" size={20} />
                    <select
                        className="w-full pl-12 p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-700/20 text-sm bg-white font-semibold cursor-pointer"
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        value={formData.role}
                    >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="INVESTOR">INVESTOR</option>
                        <option value="MENTOR">MENTOR</option>
                        <option value="STUDENT">STUDENT</option>
                    </select>
                </div>

                {/* Bio */}
                <div className="relative">
                    <FileText className="absolute left-4 top-4 text-slate-400" size={20} />
                    <textarea
                        placeholder="Bio (Optional)"
                        className="w-full pl-12 p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-700/20 text-sm resize-none h-24"
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-orange-700 text-white py-4 rounded-xl font-bold hover:bg-orange-800 transition cursor-pointer text-sm shadow-lg shadow-orange-700/20"
                >
                    Complete Registration
                </button>
            </form>
        </div>
    );
};

export default Register;