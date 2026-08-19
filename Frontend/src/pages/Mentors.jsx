import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, AlertCircle, Rocket, MessageCircle, Search, Users, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const Mentors = () => {
    const navigate = useNavigate();
    const [mentors, setMentors] = useState([]);
    const [filteredMentors, setFilteredMentors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [alertMessage, setAlertMessage] = useState(null);

    const isInvestor = userRole === 'INVESTOR';
    const isStudent = userRole === 'STUDENT' || userRole === 'USER';
    const isMentor = userRole === 'MENTOR';

    useEffect(() => {
        fetchMentors();
    }, []);

    const fetchMentors = async () => {
        try {
            setLoading(true);
            const rawRole = (localStorage.getItem('role') || localStorage.getItem('userRole') || '').replace('ROLE_', '').trim().toUpperCase();
            const storedEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';

            setUserRole(rawRole);
            setCurrentUserEmail(storedEmail);

            const response = await api.get('/mentors');
            console.log("Fetched mentors raw response:", response.data);
            
            const data = Array.isArray(response.data) ? response.data : (response.data.content || response.data.data || []);
            setMentors(data);
            setFilteredMentors(data);
        } catch (err) {
            console.error("Error fetching mentors:", err);
            setAlertMessage({ text: 'Failed to load mentors data from server. Check backend connection.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = [...mentors];

        if (isMentor && currentUserEmail) {
            result = result.filter(mentor => 
                mentor.email?.toLowerCase() === currentUserEmail.toLowerCase() || 
                mentor.username?.toLowerCase() === currentUserEmail.toLowerCase()
            );
        } else if (isInvestor || isStudent) {
            result = result.filter(mentor => mentor.assignedStartup && mentor.assignedStartup !== "Not Assigned");
        }

        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            result = result.filter(mentor =>
                (mentor.name || mentor.username || '')?.toLowerCase().includes(query) ||
                mentor.expertise?.toLowerCase().includes(query) ||
                mentor.bio?.toLowerCase().includes(query) ||
                mentor.assignedStartup?.toLowerCase().includes(query)
            );
        }

        setFilteredMentors(result);
    }, [searchQuery, mentors, userRole, currentUserEmail, isInvestor, isStudent, isMentor]);

    return (
        <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-slate-400 hover:text-indigo-400 font-semibold transition bg-slate-900 px-4 py-2.5 rounded-2xl shadow-sm border border-slate-800 cursor-pointer text-xs"
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase mb-3">
                            <Users size={13} /> Ecosystem Directory
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight">Mentors Directory</h1>
                        <p className="text-xs text-slate-400 mt-1">
                            Explore registered mentors in the system ecosystem.
                        </p>
                    </div>
                </div>

                {alertMessage && (
                    <div className="mb-6 p-4 rounded-2xl shadow-sm border flex items-center justify-between bg-amber-950/60 border-amber-800 text-amber-300">
                        <div className="flex items-center gap-2.5">
                            <AlertCircle size={18} />
                            <span className="text-xs font-bold">{alertMessage.text}</span>
                        </div>
                        <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-white font-bold text-lg cursor-pointer">&times;</button>
                    </div>
                )}

                <div className="bg-slate-900/70 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-xl mb-8 flex items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search mentors by name, expertise, or bio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600 shadow-inner"
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-400 hidden sm:block bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                        Showing: {filteredMentors.length} Mentors
                    </span>
                </div>

                {loading ? (
                    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-16 text-center shadow-xl backdrop-blur-md">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                        <p className="text-slate-400 font-medium tracking-wide">Loading mentors directory...</p>
                    </div>
                ) : filteredMentors.length === 0 ? (
                    <div className="bg-slate-900/40 rounded-3xl border border-slate-800 p-16 text-center shadow-xl max-w-lg mx-auto">
                        <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white mb-1">No Mentors Found</h3>
                        <p className="text-slate-400 text-xs">
                            No mentors found matching your criteria.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredMentors.map((mentor) => {
                            const mId = mentor.mentorId || mentor.id;
                            const mentorName = mentor.name || mentor.username || mentor.email || 'Mentor';
                            const hasStartups = mentor.assignedStartup && mentor.assignedStartup !== "Not Assigned";
                            const startupList = hasStartups ? mentor.assignedStartup.split(",") : [];

                            return (
                                <div key={mId} className="bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 shadow-2xl hover:border-indigo-500/40 transition-all border border-slate-800 flex flex-col justify-between group">
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                                                    {mentorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-white text-base group-hover:text-indigo-400 transition">
                                                        {mentorName}
                                                    </h3>
                                                    <span className="inline-block text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-3 py-0.5 rounded-full mt-1 border border-indigo-500/20">
                                                        Expert Mentor
                                                    </span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => navigate('/mentor-chat', { state: { mentor } })}
                                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 cursor-pointer active:scale-95"
                                            >
                                                <MessageCircle size={14} /> Chat
                                            </button>
                                        </div>

                                        <div className="mb-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 shadow-inner">
                                            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Expertise Domain</p>
                                            <p className="text-slate-200 text-xs font-bold mt-0.5">
                                                {mentor.expertise || 'General Mentorship'}
                                            </p>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-slate-300 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800 leading-relaxed font-medium shadow-inner">
                                                {mentor.bio || 'No biography provided yet.'}
                                            </p>
                                        </div>

                                        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 shadow-inner">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-wider">
                                                    <Briefcase size={14} className="text-indigo-400" />
                                                    <span>Assigned Startups</span>
                                                </div>
                                                <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                                    {hasStartups ? `${startupList.length} Active` : "0 Active"}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {hasStartups ? (
                                                    startupList.map((startup, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-indigo-200 text-xs font-extrabold rounded-xl border border-slate-800 shadow-sm"
                                                        >
                                                            <Rocket size={12} className="text-indigo-400 shrink-0" />
                                                            <span>{startup.trim()}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-500 italic bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 w-full text-center">
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
            </main>
        </div>
    );
};

export default Mentors;