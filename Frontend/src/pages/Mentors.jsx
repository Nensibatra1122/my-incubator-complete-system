import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Edit2, Trash2, Briefcase, AlertCircle, X, CheckCircle2, Rocket, MessageCircle, Search } from 'lucide-react';

const Mentors = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [name, setName] = useState('');
    const [expertise, setExpertise] = useState('');
    const [bio, setBio] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);

    // Custom Delete Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [mentorToDelete, setMentorToDelete] = useState(null);

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const rawRole = (localStorage.getItem('role') || localStorage.getItem('userRole') || '').replace('ROLE_', '').trim().toUpperCase();
            const storedEmail = localStorage.getItem('email') || '';

            setUserRole(rawRole);
            setCurrentUserEmail(storedEmail);

            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            // Relative path use kiya hai taake Nginx proxy handle kare
            const response = await axios.get('/api/mentors', { headers });
            const data = Array.isArray(response.data) ? response.data : (response.data.content || response.data.data || []);
            setMentors(data);
            setFilteredMentors(data);
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setAlertMessage({ text: 'Failed to load mentors data from server.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic for Roles (Admin, Investor, Student/User) & Search Query
    useEffect(() => {
        let result = [...mentors];

        const isAdmin = userRole === 'ADMIN';
        const isInvestor = userRole === 'INVESTOR';
        const isStudent = userRole === 'STUDENT' || userRole === 'USER';

        if (isInvestor) {
            result = result.filter(mentor => mentor.assignedStartup && mentor.assignedStartup !== "Not Assigned");
        } else if (isStudent) {
            result = result.filter(mentor => {
                if (!mentor.assignedStartup || mentor.assignedStartup === "Not Assigned") return false;
                return true;
            });
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(mentor =>
                mentor.name?.toLowerCase().includes(query) ||
                mentor.expertise?.toLowerCase().includes(query) ||
                mentor.bio?.toLowerCase().includes(query) ||
                mentor.assignedStartup?.toLowerCase().includes(query)
            );
        }

        setFilteredMentors(result);
    }, [searchQuery, mentors, userRole]);

    const isAdmin = userRole === 'ADMIN';
    const isInvestor = userRole === 'INVESTOR';
    const isStudent = userRole === 'STUDENT' || userRole === 'USER';

    const handleOpenAddModal = () => {
        if (!isAdmin) return;
        setEditMode(false);
        setName('');
        setExpertise('');
        setBio('');
        setCurrentId(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (mentor) => {
        if (!isAdmin) return;
        setEditMode(true);
        setCurrentId(mentor.mentorId || mentor.id);
        setName(mentor.name || '');
        setExpertise(mentor.expertise || '');
        setBio(mentor.bio || '');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        try {
            const payload = { name, expertise, bio };
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            if (editMode) {
                await axios.put(`/api/mentors/${currentId}`, payload, { headers });
                setAlertMessage({ text: 'Mentor updated successfully!', type: 'success' });
            } else {
                await axios.post('/api/mentors', payload, { headers });
                setAlertMessage({ text: 'Mentor added successfully!', type: 'success' });
            }

            setShowModal(false);
            fetchMentors();
            setTimeout(() => setAlertMessage(null), 4000);
        } catch (err) {
            console.error("Error saving mentor:", err);
            setAlertMessage({
                text: 'Failed to save mentor. Make sure you have admin rights.',
                type: 'error'
            });
        }
    };

    const handleDeleteClick = (id) => {
        if (!isAdmin) return;
        setMentorToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!mentorToDelete || !isAdmin) return;
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            await axios.delete(`/api/mentors/${mentorToDelete}`, { headers });
            setShowDeleteModal(false);
            setMentorToDelete(null);
            setAlertMessage({ text: 'Mentor deleted successfully!', type: 'success' });
            fetchMentors();
            setTimeout(() => setAlertMessage(null), 4000);
        } catch (err) {
            console.error("Error deleting mentor:", err);
            setShowDeleteModal(false);
            setAlertMessage({ text: 'Failed to delete mentor. Make sure you have admin rights.', type: 'error' });
        }
    };

    return (
        <div className="p-8 lg:p-12 max-w-7xl mx-auto bg-slate-50 min-h-screen">
            <div className="mb-6 flex items-center justify-between">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-600 hover:text-orange-600 font-semibold transition bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mentors Directory</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {isInvestor
                            ? 'Explore expert mentors guiding your invested projects and startups.'
                            : isStudent
                                ? 'Connect with the expert mentor assigned specifically to your startup project.'
                                : 'Manage, inspect, and track active startup allocations for each mentor.'}
                    </p>
                </div>

                {isAdmin && (
                    <button
                        onClick={handleOpenAddModal}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg shadow-orange-600/20 transition-all flex items-center gap-2 cursor-pointer text-xs"
                    >
                        <Plus size={18} /> Add New Mentor
                    </button>
                )}
            </div>

            {alertMessage && (
                <div className={`mb-6 p-4 rounded-2xl shadow-sm border flex items-center justify-between animate-in fade-in duration-200 ${
                    alertMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                    <div className="flex items-center gap-2.5">
                        {alertMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                        <span className="text-sm font-bold">{alertMessage.text}</span>
                    </div>
                    <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">&times;</button>
                </div>
            )}

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm mb-8 flex items-center justify-between gap-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search mentors by name, expertise, or bio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                    />
                </div>
                <span className="text-xs font-bold text-slate-400 hidden sm:block">
                    Showing: {filteredMentors.length} Mentors
                </span>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading mentors directory...</div>
            ) : filteredMentors.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm max-w-lg mx-auto">
                    <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={32} />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800 mb-1">No Mentors Found</h3>
                    <p className="text-slate-500 text-sm">No associated mentors matched your search criteria or startup portfolio view.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMentors.map((mentor) => {
                        const mId = mentor.mentorId || mentor.id;
                        return (
                            <div key={mId} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all border border-slate-200/80 flex flex-col justify-between group">
                                <div>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-14 h-14 rounded-2xl bg-orange-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-600/20">
                                                {mentor.name ? mentor.name.charAt(0) : 'M'}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base group-hover:text-orange-600 transition">
                                                    {mentor.name}
                                                </h3>
                                                <span className="inline-block text-[10px] font-extrabold text-orange-600 bg-orange-50 px-3 py-0.5 rounded-full mt-1 border border-orange-100">
                                                    Expert Mentor
                                                </span>
                                            </div>
                                        </div>

                                        {isAdmin ? (
                                            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 text-xs font-bold">
                                                <button
                                                    onClick={() => handleOpenEditModal(mentor)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 transition rounded-lg hover:bg-white cursor-pointer"
                                                    title="Edit Mentor"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(mId)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-white cursor-pointer"
                                                    title="Delete Mentor"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        ) : isInvestor || isStudent ? (
                                            <button
                                                onClick={() => alert(`Opening chat session with mentor: ${mentor.name}`)}
                                                className="px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                            >
                                                <MessageCircle size={14} /> Chat
                                            </button>
                                        ) : null}
                                    </div>

                                    <div className="mb-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Expertise Domain</p>
                                        <p className="text-slate-800 text-xs font-bold mt-0.5">
                                            {mentor.expertise}
                                        </p>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-slate-600 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed font-medium">
                                            {mentor.bio}
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-br from-orange-50/60 to-amber-50/30 rounded-2xl border border-orange-100 shadow-inner">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                                                <Briefcase size={14} className="text-orange-600" />
                                                <span>Assigned Startups</span>
                                            </div>
                                            <span className="text-[10px] font-extrabold bg-orange-200/70 text-orange-900 px-2.5 py-0.5 rounded-full">
                                                {mentor.assignedStartup && mentor.assignedStartup !== "Not Assigned"
                                                    ? mentor.assignedStartup.split(",").length + " Active"
                                                    : "0 Active"}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {mentor.assignedStartup && mentor.assignedStartup !== "Not Assigned" ? (
                                                mentor.assignedStartup.split(",").map((startup, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-900 text-xs font-extrabold rounded-xl border border-orange-200/60 shadow-sm"
                                                    >
                                                        <Rocket size={12} className="text-orange-600 shrink-0" />
                                                        <span>{startup.trim()}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-400 italic bg-white/60 px-3 py-1.5 rounded-xl border border-slate-200/60 w-full text-center">
                                                    No startups assigned yet
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && isAdmin && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-900">{editMode ? 'Edit Mentor Details' : 'Add New Mentor'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition cursor-pointer"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mentor Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. Sir Kashif"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 text-xs font-semibold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Expertise</label>
                                <input
                                    type="text"
                                    value={expertise}
                                    onChange={(e) => setExpertise(e.target.value)}
                                    required
                                    placeholder="e.g. Artificial Intelligence"
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 text-xs font-semibold text-slate-800"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Bio / Description</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows="4"
                                    required
                                    placeholder="Write a brief professional background..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 text-xs font-semibold text-slate-800"
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-3 rounded-2xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer bg-slate-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-orange-600/25 transition cursor-pointer"
                                >
                                    {editMode ? 'Update Mentor' : 'Save Mentor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDeleteModal && isAdmin && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-sm w-full p-8 shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={26} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Delete Mentor?</h3>
                        <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                            Are you sure you want to delete this mentor? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-3 text-slate-600 font-bold text-xs bg-slate-100 hover:bg-slate-200 rounded-2xl transition cursor-pointer"
                            >
                                Cancel, keep it
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-2xl text-xs font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-600/25 cursor-pointer"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mentors;