import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, Send, MessageSquare, Loader2, ShieldAlert } from 'lucide-react';

const IdeaChat = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { sender: 'Mentor', text: 'Hello! Let us discuss the technical feasibility and scaling plan of this project idea.', time: '12:10 PM' }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [idea, setIdea] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    // Get current user role from localStorage
    const userRole = localStorage.getItem('userRole') || 'USER';

    useEffect(() => {
        // Restrict access: Only Students (owners), Mentors, and Admins can access chat rooms
        if (userRole === 'INVESTOR') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchIdea = async () => {
            try {
                const res = await api.get(`/ideas/${id}`);
                setIdea(res.data);
            } catch (err) {
                setIdea({ title: `Project Idea #${id}` });
            } finally {
                setLoading(false);
            }
        };
        fetchIdea();
    }, [id, userRole]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const newMsg = {
            sender: 'You',
            text: inputMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newMsg]);
        setInputMessage('');

        // Simulate mentor automated response for realism
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                {
                    sender: 'Mentor',
                    text: 'Noted! I will review these specifications and update the team accordingly.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }, 1000);
    };

    if (accessDenied) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center">
                        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-2">Access Restricted</h3>
                        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                            Mentor discussion rooms are reserved for project innovators, mentors, and administrators.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-orange-600" size={32} />
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-8 flex flex-col h-screen">
                <button
                    onClick={() => navigate(`/idea-details/${id}`)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-4 transition w-fit cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Idea Details
                </button>

                <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col flex-1 overflow-hidden mb-4">
                    {/* Chat Header */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                <MessageSquare size={22} />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900">Mentor Discussion Room</h2>
                                <p className="text-xs font-semibold text-slate-500">Project: {idea?.title || `Idea #${id}`}</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100">
                            Live Secure Session
                        </span>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                            >
                                <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                    {msg.sender} • {msg.time}
                                </span>
                                <div
                                    className={`max-w-md p-4 rounded-2xl text-sm font-medium shadow-sm ${
                                        msg.sender === 'You'
                                            ? 'bg-orange-600 text-white rounded-br-none'
                                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Input Footer */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Type your message to the mentor..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                        />
                        <button
                            type="submit"
                            className="p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl transition shadow-lg shadow-orange-600/25 flex items-center justify-center cursor-pointer"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default IdeaChat;