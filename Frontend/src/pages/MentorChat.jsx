import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { MessageSquare, Send, ShieldAlert, Bot, User, Sparkles, ArrowLeft } from 'lucide-react';

const MentorChat = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Retrieve mentor data if passed via router state from the directory
    const selectedMentor = location.state?.mentor;

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);
    const messagesEndRef = useRef(null);

    // Get current user details securely from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userEmail = storedUser.email || storedUser.sub || '';
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Fetch existing chat history from backend on load
    useEffect(() => {
        if (!userRole || userRole === 'GUEST' || userRole === '') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await api.get('/chat');
                const welcomeText = selectedMentor
                    ? `Connected directly with ${selectedMentor.name} (${selectedMentor.domain || 'Expert Mentor'}). Discuss your project milestones, architecture, or feedback!`
                    : `Welcome to Mentor Chat! As a ${userRole}, you can connect directly with assigned industry experts and our ecosystem AI assistant for guidance.`;

                const systemMessage = { id: 'sys-welcome', sender: 'system', text: welcomeText };

                if (response.data && Array.isArray(response.data)) {
                    const formattedMessages = response.data.map((msg, index) => {
                        // Check if message belongs to current logged in user
                        const isOwnMessage =
                            (msg.senderEmail && userEmail && msg.senderEmail.toLowerCase() === userEmail.toLowerCase()) ||
                            msg.sender === 'user' ||
                            msg.role === userRole;

                        return {
                            id: msg.id || `msg-${index}-${Date.now()}`,
                            sender: isOwnMessage ? 'user' : 'mentor',
                            text: msg.message || msg.text
                        };
                    });

                    setMessages([systemMessage, ...formattedMessages]);
                } else {
                    setMessages([systemMessage]);
                }
            } catch (error) {
                console.error('Error fetching chat history:', error);
                const welcomeText = selectedMentor
                    ? `Connected directly with ${selectedMentor.name} (${selectedMentor.domain || 'Expert Mentor'}). Discuss your project milestones, architecture, or feedback!`
                    : `Welcome to Mentor Chat! As a ${userRole}, you can connect directly with assigned industry experts and our ecosystem AI assistant for guidance.`;
                setMessages([{ id: 'sys-welcome', sender: 'system', text: welcomeText }]);
            }
        };

        fetchMessages();
    }, [userRole, selectedMentor, userEmail]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        const userText = inputMessage;
        setInputMessage('');
        setLoading(true);

        try {
            const response = await api.post('/chat', { message: userText });

            const savedMsg = {
                id: response.data?.id || `user-${Date.now()}`,
                sender: 'user',
                text: response.data?.message || response.data?.text || userText
            };
            setMessages(prev => [...prev, savedMsg]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setLoading(false);
        }
    };

    if (accessDenied) {
        return (
            <div className="flex bg-slate-900 min-h-screen text-white">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-700 text-center">
                        <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white mb-2">Access Restricted</h3>
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                            Mentor Chat is exclusively available for active project owners and students. Please register or submit a project idea to access this feature.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-xs font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-950 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 flex flex-col h-screen overflow-hidden p-6 lg:p-10">
                {/* Header */}
                <header className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl transition border border-slate-800 cursor-pointer"
                            title="Go Back"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="p-3 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
                            <MessageSquare size={22} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-black text-white">
                                    {selectedMentor ? `Chat with ${selectedMentor.name}` : 'Mentor Collaboration Chat'}
                                </h1>
                                <span className="text-[10px] px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full font-extrabold uppercase">
                                    {selectedMentor?.domain || userRole}
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs">Direct feedback channel, chatbot assistance, and guidance portal with your mentors.</p>
                        </div>
                    </div>
                </header>

                {/* Chat Box Area */}
                <div className="flex-1 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl flex flex-col overflow-hidden">
                    <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-950/40">
                        {messages.map((msg, index) => {
                            const isUser = msg.sender === 'user';
                            const isSystem = msg.sender === 'system';
                            const uniqueKey = msg.id || `msg-item-${index}`;

                            if (isSystem) {
                                return (
                                    <div key={uniqueKey} className="flex justify-center my-2">
                                        <div className="max-w-lg p-3.5 rounded-2xl text-xs font-semibold leading-relaxed bg-orange-500/10 text-orange-300 border border-orange-500/20 text-center w-full shadow-sm flex items-center justify-center gap-2">
                                            <Sparkles size={16} className="text-orange-400 shrink-0" />
                                            <span>{msg.text}</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={uniqueKey} className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                                        isUser ? 'bg-slate-800 text-white border border-slate-700' : 'bg-orange-500 text-white'
                                    }`}>
                                        {isUser ? <User size={15} /> : <Bot size={15} />}
                                    </div>
                                    <div className={`max-w-lg p-4 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                                        isUser
                                            ? 'bg-orange-500 text-white rounded-tr-none shadow-orange-500/10'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                                    }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {loading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
                                    <Bot size={15} />
                                </div>
                                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-slate-400 text-xs animate-pulse rounded-tl-none flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></span>
                                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:0.2s]"></span>
                                    <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:0.4s]"></span>
                                    <span className="ml-1 font-medium text-slate-300">Sending message to server...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Type your message, project question, or request AI guidance..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 transition text-white placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer"
                        >
                            <Send size={15} /> Send
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default MentorChat;