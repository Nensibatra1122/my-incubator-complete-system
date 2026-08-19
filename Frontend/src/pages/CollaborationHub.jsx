import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, MessageSquare, AtSign, User, ArrowLeft, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const CollaborationHub = () => {
    const { id: rawId, projectId: rawProjectId } = useParams();
    const rawTargetId = rawProjectId || rawId;
    const projectId = rawTargetId && String(rawTargetId).startsWith(':') ? String(rawTargetId).substring(1) : (rawTargetId || '1');

    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newContent, setNewContent] = useState('');
    const [selectedMentions, setSelectedMentions] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [projectName, setProjectName] = useState(`Project #${projectId}`);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserEmail = localStorage.getItem('userEmail') || storedUser.email || 'user@example.com';
    const currentUserRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'Member').trim().toUpperCase();

    const getToken = () => {
        return localStorage.getItem('token') ||
            localStorage.getItem('jwtToken') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt') ||
            storedUser.token;
    };

    const getAuthConfig = useCallback(() => {
        const token = getToken();
        return {
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            },
            withCredentials: true
        };
    }, []);

    const fetchFeed = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:8080/api/discussion/feed/${projectId}`, getAuthConfig());
            setMessages(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching discussion feed:", error);
        }
    }, [projectId, getAuthConfig]);

    const fetchProjectDetailsAndMembers = useCallback(async () => {
        const uniqueMembersMap = new Map();
        uniqueMembersMap.set('admin@utopia.com', {
            name: 'System Admin',
            email: 'admin@utopia.com',
            role: 'ADMIN'
        });

        try {
            const response = await axios.get(`http://localhost:8080/api/incubations`, getAuthConfig());
            const incubationsList = Array.isArray(response.data)
                ? response.data
                : (response.data?.data || response.data?.content || []);

            const currentProj = incubationsList.find(item =>
                String(item.id || item.projectId || item.incubationId) === String(projectId)
            );

            if (currentProj) {
                // 💡 Yahan 'programName' ko sabse pehle add kar diya hai kyunke Hibernate query mein yahi column hai
                const foundName = currentProj.programName || currentProj.projectName || currentProj.name || currentProj.title || currentProj.startupName;
                if (foundName) {
                    setProjectName(foundName);
                }

                const extractNameAndEmail = (field, defaultRole) => {
                    if (!field) return;
                    if (typeof field === 'object') {
                        const name = field.fullName || field.name || field.email || field.username;
                        let email = field.email;
                        if (!email || typeof email === 'object') {
                            email = field.username || name;
                        }
                        if (email) {
                            uniqueMembersMap.set(String(email).toLowerCase(), {
                                name: String(name || email),
                                email: String(email),
                                role: field.role || defaultRole
                            });
                        }
                    } else if (typeof field === 'string' && field.trim()) {
                        uniqueMembersMap.set(field.toLowerCase(), {
                            name: field,
                            email: field,
                            role: defaultRole
                        });
                    }
                };

                extractNameAndEmail(currentProj.admin || currentProj.adminName || currentProj.manager || currentProj.coordinator, 'ADMIN');
                extractNameAndEmail(currentProj.mentor, 'MENTOR');
                extractNameAndEmail(currentProj.investor || currentProj.investorPartner || currentProj.investorEmail, 'INVESTOR');
                extractNameAndEmail(currentProj.student || currentProj.owner || currentProj.createdBy, 'STUDENT');
            }
        } catch (err) {
            console.log("Incubations fetch warning:", err);
        }

        setAllMembers(Array.from(uniqueMembersMap.values()));
    }, [projectId, getAuthConfig]);

    useEffect(() => {
        if (projectId) {
            fetchFeed();
            fetchProjectDetailsAndMembers();
        }
    }, [projectId, fetchFeed, fetchProjectDetailsAndMembers]);

    const handleCheckboxChange = (emailIdentifier) => {
        setErrorMessage('');
        if (selectedMentions.includes(emailIdentifier)) {
            setSelectedMentions(selectedMentions.filter(item => item !== emailIdentifier));
        } else {
            if (selectedMentions.length >= 4) {
                setErrorMessage("Aap aik waqt mein maximum 4 logon ko mention kar sakte hain!");
                return;
            }
            setSelectedMentions([...selectedMentions, emailIdentifier]);
        }
    };

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newContent.trim()) return;

        setErrorMessage('');
        setSuccessMessage('');

        const messagePayload = {
            projectId: projectId,
            senderEmail: currentUserEmail,
            senderRole: currentUserRole,
            content: newContent.trim(),
            mentionedUserEmails: selectedMentions
        };

        try {
            setLoading(true);
            await axios.post('http://localhost:8080/api/discussion/post', messagePayload, getAuthConfig());
            setNewContent('');
            setSelectedMentions([]);
            setSuccessMessage("Message posted successfully!");
            fetchFeed();

            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);

        } catch (error) {
            console.error("Error posting message:", error);
            setErrorMessage("Failed to post message. Please check if you are logged in properly.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 bg-slate-950 min-h-screen p-6 lg:p-10 text-slate-100 overflow-y-auto font-sans selection:bg-orange-500 selection:text-white">
            <div className="max-w-4xl mx-auto space-y-6">

                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl shadow-lg shadow-orange-500/25 shrink-0">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                                Project Collaboration Hub
                            </h1>
                            <p className="text-xs text-slate-400 mt-1 font-medium">
                                Active discussion feed and milestone updates for project: <span className="text-orange-400 font-bold">{projectName}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="self-end sm:self-center bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center gap-2 shadow-md shrink-0"
                    >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-fade-in">
                        <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                        <span className="text-xs font-semibold">{successMessage}</span>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-950/80 border border-red-800/80 text-red-200 px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-fade-in">
                        <AlertCircle className="text-red-400 shrink-0" size={20} />
                        <span className="text-xs font-semibold">{errorMessage}</span>
                    </div>
                )}

                <form onSubmit={handlePostMessage} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-xl backdrop-blur-xl space-y-4">
                    <textarea
                        rows="3"
                        placeholder="Write an update, milestone info, or message for the team..."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all resize-none shadow-inner"
                        required
                    />

                    <div className="space-y-2 bg-slate-950 border border-slate-800 rounded-2xl p-4">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-2 border-b border-slate-800">
                            <span className="flex items-center gap-1.5"><AtSign size={14} /> Mention Stakeholders:</span>
                            <span className="text-orange-400">{selectedMentions.length}/4 selected</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                            {allMembers.length === 0 ? (
                                <p className="text-xs text-slate-500 py-2">No connected members found for this project.</p>
                            ) : (
                                allMembers
                                    .filter(member => member.email.toLowerCase() !== currentUserEmail.toLowerCase())
                                    .map((member, idx) => {
                                        const identifier = member.email;
                                        const displayName = member.name || member.email;
                                        const roleName = member.role || 'Member';
                                        const isChecked = selectedMentions.includes(identifier);

                                        return (
                                            <label
                                                key={idx}
                                                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                                    isChecked
                                                        ? 'bg-orange-500/10 border-orange-500/50 text-orange-200 font-semibold'
                                                        : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => handleCheckboxChange(identifier)}
                                                        className="rounded border-slate-700 text-orange-500 focus:ring-orange-500 bg-slate-950 cursor-pointer"
                                                    />
                                                    <span className="truncate">{displayName}</span>
                                                </div>
                                                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-orange-400 uppercase tracking-wide shrink-0 border border-slate-700/50">
                                                    {roleName}
                                                </span>
                                            </label>
                                        );
                                    })
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Send size={14} />
                            <span>{loading ? 'Posting...' : 'Post Update'}</span>
                        </button>
                    </div>
                </form>

                <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-1">Team Discussions Feed</h3>

                    {messages.length === 0 ? (
                        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-12 text-center text-slate-500 text-sm font-medium">
                            No messages yet. Be the first to start the discussion!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id || Math.random()} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 transition hover:border-slate-700">
                                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-bold shrink-0">
                                            <User size={15} />
                                        </div>
                                        <span className="font-bold text-slate-200">{msg.senderEmail}</span>
                                        <span className="bg-slate-800 text-orange-400 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border border-slate-700/80 uppercase tracking-wide">
                                            {msg.senderRole}
                                        </span>
                                    </div>
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                                        <Clock size={12} /> {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Just now'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap pl-10 leading-relaxed">{msg.content}</p>

                                {(msg.mentionedUserEmails || msg.mentionedUserEmail) && (
                                    <div className="pl-10 text-xs text-orange-400 font-semibold flex items-center gap-1 flex-wrap">
                                        <AtSign size={13} /> Mentions:
                                        <span className="underline ml-1">
                                            {Array.isArray(msg.mentionedUserEmails)
                                                ? msg.mentionedUserEmails.join(', ')
                                                : (typeof msg.mentionedUserEmails === 'string'
                                                    ? msg.mentionedUserEmails
                                                    : msg.mentionedUserEmail)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollaborationHub;