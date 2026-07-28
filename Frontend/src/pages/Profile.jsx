import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { UserCircle, Save, Globe, Image as ImageIcon, FileText, Code, Cpu, User } from 'lucide-react';
import api from '../api/axios';

const ProfilePage = () => {
    const [profile, setProfile] = useState({
        id: null,
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

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/profiles/me');
                if (res.data && Object.keys(res.data).length > 0) {
                    setProfile({
                        id: res.data.id || res.data.profileId || null,
                        fullName: res.data.fullName || '',
                        bio: res.data.bio || '',
                        linkedInUrl: res.data.linkedInUrl || '',
                        githubUrl: res.data.githubUrl || '',
                        profilePictureUrl: res.data.profilePictureUrl || '',
                        skills: res.data.skills || ''
                    });
                }
            } catch (e) {
                console.error("Failed to load profile", e);
                setMessage({ text: 'Failed to load profile settings.', type: 'error' });
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
            let res;
            if (profile.id) {
                res = await api.put(`/profiles/${profile.id}`, profile);
            } else {
                res = await api.post('/profiles', profile);
            }

            if (res.data && (res.data.id || res.data.profileId)) {
                setProfile(prev => ({
                    ...prev,
                    id: res.data.id || res.data.profileId
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

    return (
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <UserCircle className="text-orange-500" size={32} /> User Profile Management
                    </h1>
                    <p className="text-slate-500 mt-1">Manage your personal bio, professional links, tech stack, and account settings.</p>
                </header>

                <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                    {loading ? (
                        <p className="text-slate-500 text-center py-10 animate-pulse">Loading profile settings...</p>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Profile Completion / Verified Badge */}
                            <div className="flex items-center gap-2 mb-2">
                                {profile.fullName && profile.bio && profile.skills ? (
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                        100% Profile Complete & Verified
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm">
                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                        Incomplete Profile (Fill Name, Bio & Skills)
                                    </span>
                                )}
                            </div>

                            {message.text && (
                                <div className={`p-4 rounded-2xl text-sm font-medium border ${
                                    message.type === 'success'
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                    {message.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <User size={16} className="text-slate-400" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profile.fullName}
                                    onChange={handleChange}
                                    placeholder="e.g. Nensi Batra"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} className="text-slate-400" /> Bio / Professional Summary
                                </label>
                                <textarea
                                    name="bio"
                                    rows="3"
                                    value={profile.bio}
                                    onChange={handleChange}
                                    placeholder="Write a short summary about yourself..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Cpu size={16} className="text-slate-400" /> Tech Stack / Skills
                                </label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={profile.skills}
                                    onChange={handleChange}
                                    placeholder="Java, Spring Boot, Python, React, AI"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Globe size={16} className="text-slate-400" /> LinkedIn Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="linkedInUrl"
                                    value={profile.linkedInUrl}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <Code size={16} className="text-slate-400" /> GitHub Profile URL
                                </label>
                                <input
                                    type="url"
                                    name="githubUrl"
                                    value={profile.githubUrl}
                                    onChange={handleChange}
                                    placeholder="https://github.com/username"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    <ImageIcon size={16} className="text-slate-400" /> Profile Picture URL
                                </label>
                                <input
                                    type="url"
                                    name="profilePictureUrl"
                                    value={profile.profilePictureUrl}
                                    onChange={handleChange}
                                    placeholder="https://example.com/avatar.jpg"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-700 text-sm transition"
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/20 transition flex items-center gap-2 disabled:opacity-50"
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