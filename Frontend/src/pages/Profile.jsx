import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { UserCircle, Save, Globe, FileText, Code, Cpu, User, ArrowLeft, LogOut, Image as ImageIcon } from 'lucide-react';
import api from '../api/axios';

const ProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState({
        profileId: null,
        fullName: '',
        bio: '',
        linkedInUrl: '',
        githubUrl: '',
        profilePictureUrl: '',
        skills: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profiles/me');

                if (res.data) {
                    const fallbackName = localStorage.getItem('userName') || storedUser.name || 'Nensi Bai';
                    setProfile({
                        profileId: res.data.profileId || res.data.id || null,
                        fullName: res.data.fullName || fallbackName,
                        bio: res.data.bio || '',
                        linkedInUrl: res.data.linkedInUrl || '',
                        githubUrl: res.data.githubUrl || '',
                        profilePictureUrl: res.data.profilePictureUrl || '',
                        skills: res.data.skills || ''
                    });
                }
            } catch (e) {
                console.error("Failed to load profile from backend", e);
                const fallbackName = localStorage.getItem('userName') || storedUser.name || 'Nensi Bai';
                setProfile(prev => ({
                    ...prev,
                    fullName: fallbackName
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await api.post('/profiles', profile);

            if (res.data && (res.data.profileId || res.data.id)) {
                setProfile(prev => ({
                    ...prev,
                    profileId: res.data.profileId || res.data.id,
                    ...res.data
                }));
            }

            setMessage({ text: 'Profile updated successfully!', type: 'success' });
        } catch (e) {
            console.error("Save profile error:", e);
            setMessage({ text: 'Failed to update profile. Please try again.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/');
    };

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white font-sans">
            {/* Sidebar & Logout */}
            <div className="flex flex-col justify-between border-r border-slate-800 bg-slate-900 shrink-0">
                <Sidebar />
                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 rounded-2xl transition cursor-pointer"
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-xl transition cursor-pointer mb-8"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <header className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl shadow-lg shadow-orange-500/25">
                            <UserCircle size={28} />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">User Profile Management</h1>
                                <span className="text-xs px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-extrabold uppercase tracking-wider">
                                    {userRole}
                                </span>
                            </div>
                            <p className="text-slate-400 text-sm font-medium mt-1">Manage your personal bio, professional links, tech stack, and account settings.</p>
                        </div>
                    </div>
                </header>

                <div className="max-w-2xl bg-slate-800/50 border border-slate-800 rounded-3xl shadow-xl backdrop-blur-xl p-8 lg:p-10">
                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400 text-sm font-semibold">Loading profile settings...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                {profile.fullName && profile.bio && profile.skills ? (
                                    <span className="px-3.5 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        100% Profile Complete & Verified
                                    </span>
                                ) : (
                                    <span className="px-3.5 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Incomplete Profile (Fill Name, Bio & Skills)
                                    </span>
                                )}
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-2xl text-sm font-medium border ${
                                    message.type === 'success'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-orange-400" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-orange-400" /> Bio / Professional Summary
                                </label>
                                <textarea
                                    name="bio"
                                    rows="3"
                                    value={profile.bio}
                                    onChange={handleChange}
                                    placeholder="Write a short summary about yourself..."
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <Cpu size={16} className="text-orange-400" /> Tech Stack / Skills
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={profile.skills}
                                    onChange={handleChange}
                                    placeholder="Java, Spring Boot, Python, React, AI"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-orange-400" /> Profile Picture URL
                                </label>
                                <input
                                    type="url"
                                    name="profilePictureUrl"
                                    value={profile.profilePictureUrl || ''}
                                    onChange={handleChange}
                                    placeholder="https://images.unsplash.com/photo-..."
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <Globe size={16} className="text-orange-400" /> LinkedIn Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="linkedInUrl"
                                    value={profile.linkedInUrl}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
                                    <Code size={16} className="text-orange-400" /> GitHub Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="githubUrl"
                                    value={profile.githubUrl}
                                    onChange={handleChange}
                                    placeholder="https://github.com/username"
                                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-white text-sm transition placeholder:text-slate-600"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    <Save size={18} /> {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;