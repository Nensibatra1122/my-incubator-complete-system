import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import axios from 'axios';
import { ArrowLeft, Bell, CheckCircle2, Clock, Trash2, ShieldAlert, CheckCheck, LogOut, MessageSquare, CheckCircle } from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [mentions, setMentions] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'mentions'
    const [loading, setLoading] = useState(true);
    const [accessDenied, setAccessDenied] = useState(false);

    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();
    const currentUserEmail = localStorage.getItem('userEmail') || storedUser.email || '';

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token') ||
            localStorage.getItem('jwtToken') ||
            localStorage.getItem('accessToken') ||
            localStorage.getItem('jwt');
        return { Authorization: token ? `Bearer ${token}` : '' };
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch General Notifications from Backend
            const notifResponse = await api.get('/notifications/all', {
                headers: getAuthHeaders(),
                withCredentials: true
            }).catch((err) => {
                console.error("Notifications fetch error:", err);
                return { data: [] };
            });

            let notifData = [];
            if (Array.isArray(notifResponse.data)) {
                notifData = notifResponse.data;
            } else if (notifResponse.data && Array.isArray(notifResponse.data.content)) {
                notifData = notifResponse.data.content;
            } else if (notifResponse.data && Array.isArray(notifResponse.data.data)) {
                notifData = notifResponse.data.data;
            } else if (notifResponse.data) {
                notifData = [notifResponse.data];
            }

            // 2. Load Local Notifications (like Mentor answer submissions) and merge them
            const localNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const formattedLocalNotifs = localNotifs.map(n => ({
                notificationId: n.id,
                id: n.id,
                message: n.message,
                title: n.title,
                createdAt: n.time,
                read: n.read,
                isRead: n.read,
                isLocal: true // flag to handle local actions separately
            }));

            // Combine backend and local notifications
            setNotifications([...formattedLocalNotifs, ...notifData]);

            // 3. Fetch Project Discussion Mentions
            if (currentUserEmail) {
                const mentionResponse = await axios.get(`http://localhost:8080/api/discussion/mentions?email=${currentUserEmail}`).catch(() => ({ data: [] }));
                setMentions(Array.isArray(mentionResponse.data) ? mentionResponse.data : []);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!userRole || userRole === 'GUEST' || userRole === '') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }
        loadData();

        // Listen to localStorage changes across windows/tabs
        const handleStorageChange = () => {
            loadData();
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('notificationUpdated', handleStorageChange);

        const interval = setInterval(loadData, 30000);
        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('notificationUpdated', handleStorageChange);
        };
    }, [userRole, currentUserEmail]);

    const formatMessage = (msg) => {
        if (!msg) return 'New system alert received.';
        return msg
            .replace(/Aapka naya idea '(.*?)' successfully submit ho gaya hai!/gi, "Your new idea '$1' has been successfully submitted!")
            .replace(/successfully submit ho gaya hai/gi, "has been successfully submitted");
    };

    const handleMarkAsRead = async (id, currentStatus, isLocal) => {
        if (currentStatus) return;

        if (isLocal) {
            // Update local storage notification status
            const localNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const updatedLocal = localNotifs.map(n => n.id === id ? { ...n, read: true } : n);
            localStorage.setItem('admin_notifications', JSON.stringify(updatedLocal));

            setNotifications(prev => prev.map(n => {
                const itemId = n.notificationId || n.id;
                return itemId === id ? { ...n, read: true, isRead: true } : n;
            }));
            window.dispatchEvent(new Event('notificationUpdated'));
            return;
        }

        try {
            await api.put(`/notifications/${id}`, { isRead: true }, {
                headers: getAuthHeaders(),
                withCredentials: true
            });

            setNotifications(prev => prev.map(n => {
                const itemId = n.notificationId || n.id;
                return itemId === id ? { ...n, read: true, isRead: true } : n;
            }));

            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const handleMarkMentionAsRead = async (id, currentStatus) => {
        if (currentStatus) return;
        try {
            await axios.put(`http://localhost:8080/api/discussion/read/${id}`);
            setMentions(prev => prev.map(m => m.id === id ? { ...m, isRead: true, read: true } : m));
            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error("Error marking mention as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            // Update local storage ones
            const localNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const updatedLocal = localNotifs.map(n => ({ ...n, read: true }));
            localStorage.setItem('admin_notifications', JSON.stringify(updatedLocal));

            // Update backend ones
            const unreadItems = notifications.filter(n => !n.isLocal && !(n.read || n.isRead));
            await Promise.all(
                unreadItems.map(item => {
                    const id = item.notificationId || item.id;
                    return api.put(`/notifications/${id}`, { isRead: true }, {
                        headers: getAuthHeaders(),
                        withCredentials: true
                    }).catch(err => console.error(`Failed to update ${id}`, err));
                })
            );

            setNotifications(prev => prev.map(n => ({ ...n, read: true, isRead: true })));
            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleDelete = async (id, isLocal, e) => {
        e.stopPropagation();

        if (isLocal) {
            const localNotifs = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
            const filteredLocal = localNotifs.filter(n => n.id !== id);
            localStorage.setItem('admin_notifications', JSON.stringify(filteredLocal));

            setNotifications(prev => prev.filter(n => (n.notificationId !== id && n.id !== id)));
            window.dispatchEvent(new Event('notificationUpdated'));
            return;
        }

        try {
            await api.delete(`/notifications/${id}`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });

            setNotifications(prev => prev.filter(n => (n.notificationId !== id && n.id !== id)));
            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (accessDenied) {
        return (
            <div className="flex bg-slate-900 min-h-screen text-slate-100">
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
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldAlert size={30} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white mb-2">Access Restricted</h3>
                        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                            Please log in with a valid account to view your notifications.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-500/25 cursor-pointer"
                        >
                            Go to Login
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const systemNotifications = notifications.filter(n => n.targetRole !== 'MENTION');

    const unreadSystemCount = systemNotifications.filter(n => !(n.read || n.isRead)).length;
    const unreadMentionsCount = mentions.filter(m => !(m.read || m.isRead)).length;
    const totalUnreadCount = unreadSystemCount + unreadMentionsCount;

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 selection:bg-orange-500 selection:text-white font-sans">
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

            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 px-4 py-2 rounded-xl transition cursor-pointer mb-8"
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                <div className="bg-slate-800/50 border border-slate-800 p-8 lg:p-10 rounded-3xl shadow-xl backdrop-blur-xl max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/80 flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl shadow-lg shadow-orange-500/25">
                                <Bell size={26} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">Notifications & Mentions</h1>
                                    <span className="text-xs px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full font-extrabold uppercase tracking-wider">
                                        {userRole}
                                    </span>
                                </div>
                                <p className="text-slate-400 text-sm font-medium mt-1">Stay updated with your latest alerts and project discussions.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {unreadSystemCount > 0 && activeTab === 'all' && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="px-4 py-2 bg-slate-900 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs border border-slate-700 transition flex items-center gap-2 cursor-pointer"
                                >
                                    <CheckCheck size={14} className="text-orange-400" /> Mark all read
                                </button>
                            )}
                            <span className="px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl font-bold text-xs text-slate-300 shadow-inner flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {totalUnreadCount} Total Unread
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3 mb-6 border-b border-slate-800 pb-4">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'all'
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            <Bell size={14} /> System Alerts
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                                {systemNotifications.length}
                            </span>
                        </button>

                        <button
                            onClick={() => setActiveTab('mentions')}
                            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                                activeTab === 'mentions'
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                        >
                            <MessageSquare size={14} /> Project Mentions
                            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'mentions' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                                {mentions.length}
                            </span>
                        </button>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-400 text-sm font-semibold">Loading your updates...</p>
                        </div>
                    ) : activeTab === 'all' ? (
                        systemNotifications.length === 0 ? (
                            <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
                                <Bell size={40} className="text-slate-600 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-300 mb-1">No System Notifications</h3>
                                <p className="text-slate-500 text-xs font-medium">You are all caught up with your activities.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {systemNotifications.map((item, idx) => {
                                    const isRead = item.read || item.isRead || false;
                                    const id = item.notificationId || item.id || idx;

                                    return (
                                        <div
                                            key={id}
                                            onClick={() => handleMarkAsRead(id, isRead, item.isLocal)}
                                            className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                                                isRead
                                                    ? 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700'
                                                    : 'bg-slate-900/90 border-orange-500/30 text-white shadow-md hover:border-orange-500/50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl mt-0.5 shrink-0 ${isRead ? 'bg-slate-800 text-slate-500' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                    {isRead ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold leading-relaxed">{formatMessage(item.message || item.title || JSON.stringify(item))}</p>
                                                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5 font-medium">
                                                        <Clock size={13} className="text-slate-500" /> {item.createdAt ? (isNaN(new Date(item.createdAt).getTime()) ? item.createdAt : new Date(item.createdAt).toLocaleString()) : 'Just now'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0">
                                                {!isRead ? (
                                                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-extrabold rounded-lg">
                                                        New
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 bg-slate-800 text-slate-400 text-[11px] font-extrabold rounded-lg">
                                                        Read
                                                    </span>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(id, item.isLocal, e)}
                                                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                                                    title="Delete notification"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        mentions.length === 0 ? (
                            <div className="py-20 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
                                <MessageSquare size={40} className="text-slate-600 mx-auto mb-3" />
                                <h3 className="text-base font-bold text-slate-300 mb-1">No Mentions</h3>
                                <p className="text-slate-500 text-xs font-medium">Nobody has tagged you in project discussions recently.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mentions.map((item) => {
                                    const isRead = item.read || item.isRead || false;

                                    return (
                                        <div
                                            key={item.id}
                                            className={`p-5 rounded-2xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                                                isRead
                                                    ? 'bg-slate-900/40 border-slate-800 text-slate-400'
                                                    : 'bg-slate-900/90 border-orange-500/30 text-white shadow-md'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl mt-0.5 shrink-0 ${isRead ? 'bg-slate-800 text-slate-500' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                                                    <MessageSquare size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-300 font-medium">
                                                        <strong className="text-orange-400 font-bold">{item.senderEmail}</strong> mentioned you in Project <span className="text-white font-bold">{item.projectId}</span>:
                                                    </p>
                                                    <p className="text-xs text-slate-300 italic bg-slate-950 border border-slate-800 p-2.5 rounded-xl my-2">
                                                        "{item.content}"
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                                                        <Clock size={12} /> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recent'}
                                                    </p>
                                                </div>
                                            </div>

                                            {!isRead ? (
                                                <button
                                                    onClick={() => handleMarkMentionAsRead(item.id, isRead)}
                                                    className="self-end sm:self-center px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                                                >
                                                    <CheckCircle size={14} /> Mark as read
                                                </button>
                                            ) : (
                                                <span className="self-end sm:self-center px-3 py-1.5 bg-slate-800 text-slate-400 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0">
                                                    <CheckCircle2 size={14} className="text-emerald-500" /> Read
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;