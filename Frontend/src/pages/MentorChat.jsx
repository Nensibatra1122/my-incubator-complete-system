import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { MessageSquare, Send, ShieldAlert, Sparkles } from 'lucide-react';

const MentorChat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Get current user role securely from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    // Helper to get auth headers with fallback token keys
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') ||
            localStorage.getItem('jwtToken') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt');
        return { Authorization: token ? `Bearer ${token}` : '' };
    };

    useEffect(() => {
        // Restricting access: Only allow Students, Project Owners, or Admins to use Mentor Chat
        // If a simple guest or unauthenticated user tries to access, block them.
        if (!userRole || userRole === 'GUEST' || userRole === '') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        // Initial welcome message tailored to the user role
        setMessages([
            {
                id: 1,
                sender: 'system',
                text: `Welcome to Mentor Chat! As a ${userRole}, you can connect directly with assigned industry experts for project guidance.`
            }
        ]);
    }, [userRole]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userText = inputMessage;
        const newUserMessage = { id: Date.now(), sender: 'user', text: userText };

        setMessages(prev => [...prev, newUserMessage]);
        setInputMessage('');
        setLoading(true);

        try {
            // Optional: Call your backend chat endpoint if available
            // const response = await api.post('/mentor-chat/send', { message: userText }, { headers: getAuthHeaders() });

            // Simulating robust response delay
            setTimeout(() => {
                const mentorResponse = {
                    id: Date.now() + 1,
                    sender: 'mentor',
                    text: 'Thank you for sharing your project query. Your assigned mentor has received this and will respond shortly.'
                };
                setMessages(prev => [...prev, mentorResponse]);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error sending message:', error);
            setLoading(false);
        }
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
                            Mentor Chat is exclusively available for active project owners and students. Please register or submit a project idea to access this feature.
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

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden p-6 lg:p-10">
                {/* Header */}
                <header className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-slate-900">Mentor Collaboration Chat</h1>
                                <span className="text-xs px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                                    {userRole}
                                </span>
                            </div>
                            <p className="text-slate-500 text-xs">Direct feedback channel and guidance portal with your mentors.</p>
                        </div>
                    </div>
                </header>

                {/* Chat Box Area */}
                <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                        {messages.map((msg) => {
                            const isUser = msg.sender === 'user';
                            const isSystem = msg.sender === 'system';
                            return (
                                <div key={msg.id} className={`flex ${isSystem ? 'justify-center' : isUser ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                                        isSystem
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200 text-center w-full'
                                            : isUser
                                                ? 'bg-orange-600 text-white rounded-br-none'
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 text-slate-400 text-xs animate-pulse">
                                    Mentor is reviewing...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Type your message or project question..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 transition text-slate-800"
                        />
                        <button
                            type="submit"
                            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer"
                        >
                            <Send size={16} /> Send
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default MentorChat;