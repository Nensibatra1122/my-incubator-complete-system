import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, Bell, CheckCircle2, Clock, Trash2, ShieldAlert } from 'lucide-react';

const Notifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
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
        // Restrict access if user role is missing, guest, or unauthenticated
        if (!userRole || userRole === 'GUEST' || userRole === '') {
            setAccessDenied(true);
            setLoading(false);
            return;
        }

        const loadNotifications = async () => {
            try {
                // Fetching role-filtered notifications using api instance with authorization headers
                const response = await api.get('/notifications/all', {
                    headers: getAuthHeaders(),
                    withCredentials: true
                });
                const data = Array.isArray(response.data) ? response.data : (response.data.content || response.data.data || []);
                setNotifications(data);
            } catch (error) {
                console.error('Error fetching notifications:', error);
            } finally {
                setLoading(false);
            }
        };

        loadNotifications();
    }, [userRole]);

    // Professional helper function for message formatting
    const formatMessage = (msg) => {
        if (!msg) return '';
        return msg
            .replace(/Aapka naya idea '(.*?)' successfully submit ho gaya hai!/gi, "Your new idea '$1' has been successfully submitted!")
            .replace(/successfully submit ho gaya hai/gi, "has been successfully submitted");
    };

    // Mark notification as read with token headers
    const handleMarkAsRead = async (id, currentStatus) => {
        if (currentStatus) return;
        try {
            await api.put(`/notifications/${id}`, { isRead: true }, {
                headers: getAuthHeaders(),
                withCredentials: true
            });

            setNotifications(prev => prev.map(n =>
                (n.notificationId === id || n.id === id) ? { ...n, read: true, isRead: true } : n
            ));

            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    // Delete notification with token headers & immediate count reduction
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await api.delete(`/notifications/${id}`, {
                headers: getAuthHeaders(),
                withCredentials: true
            });

            // Flexible check for both 'notificationId' and 'id' to instantly update list & reduce count
            setNotifications(prev => prev.filter(n => n.notificationId !== id && n.id !== id));

            window.dispatchEvent(new Event('notificationUpdated'));
        } catch (error) {
            console.error('Error deleting notification:', error);
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
                            Please log in with a valid account to view your notifications.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-3.5 bg-orange-600 text-white hover:bg-orange-700 rounded-2xl text-sm font-bold transition shadow-lg shadow-orange-600/25 cursor-pointer"
                        >
                            Go to Login
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex bg-slate-50 min-h-screen selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                                <Bell size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
                                    <span className="text-xs px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                                        {userRole}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-sm">Stay updated with your latest alerts and activities.</p>
                            </div>
                        </div>
                        <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl font-bold text-xs border border-orange-100">
                            {notifications.length} Total Alerts
                        </span>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">Loading notifications...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-semibold">No notifications found.</div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((item) => {
                                const isRead = item.read || item.isRead;
                                const id = item.notificationId || item.id;

                                return (
                                    <div
                                        key={id}
                                        onClick={() => handleMarkAsRead(id, isRead)}
                                        className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 cursor-pointer ${
                                            isRead
                                                ? 'bg-slate-50/70 border-slate-100 text-slate-600'
                                                : 'bg-orange-50/30 border-orange-200 text-slate-900 font-medium'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className={`p-2.5 rounded-xl mt-0.5 ${isRead ? 'bg-slate-200 text-slate-600' : 'bg-orange-500 text-white'}`}>
                                                {isRead ? <CheckCircle2 size={18} /> : <Bell size={18} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{formatMessage(item.message)}</p>
                                                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                    <Clock size={12} /> {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {!isRead && (
                                                <span className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg">
                                                    New
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(id, e)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                                                title="Delete notification"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;