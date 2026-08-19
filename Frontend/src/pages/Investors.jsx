import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Building2, Plus, Edit, Trash2, X, ShieldAlert, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const InvestorsPage = () => {
    const navigate = useNavigate();
    const [investors, setInvestors] = useState([]);
    const [filteredInvestors, setFilteredInvestors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [currentUserId, setCurrentUserId] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        investmentFocus: '',
        minimumAmount: '',
        whatInvestorOffers: '',
        user: { userId: '' }
    });

    const [usersList, setUsersList] = useState([]);

    const fetchInvestors = async () => {
        try {
            setLoading(true);
            
            const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || localStorage.getItem('userType') || localStorage.getItem('type') || '';
            const storedRole = rawRole.replace('ROLE_', '').toUpperCase().trim();
            const storedEmail = (localStorage.getItem('email') || localStorage.getItem('userEmail') || localStorage.getItem('username') || '').toLowerCase().trim();
            const storedUserId = localStorage.getItem('userId') || localStorage.getItem('id') || '';

            setUserRole(storedRole);
            setCurrentUserEmail(storedEmail);
            setCurrentUserId(storedUserId);

            let data = [];
            try {
                const endpoint = (storedRole === 'MENTOR' || storedRole.includes('MENTOR')) ? '/investors/mentor/assigned-investors' : '/investors';
                const res = await api.get(endpoint);
                data = Array.isArray(res.data) ? res.data : (res.data?.content || res.data?.data || []);
                
                if ((storedRole === 'MENTOR' || storedRole.includes('MENTOR')) && data.length === 0) {
                    const fallbackRes = await api.get('/investors');
                    data = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.content || fallbackRes.data?.data || []);
                }
            } catch (err) {
                console.warn("Primary fetch failed, using general /investors fallback...", err);
                const fallbackRes = await api.get('/investors');
                data = Array.isArray(fallbackRes.data) ? fallbackRes.data : (fallbackRes.data?.content || fallbackRes.data?.data || []);
            }

            setInvestors(data);
            applyFilters(data, storedRole, storedEmail, storedUserId, searchQuery);

            const isAdminUser = storedRole === 'ADMIN' || storedRole.includes('ADMIN');

            if (isAdminUser) {
                try {
                    const userRes = await api.get('/users');
                    const usersData = Array.isArray(userRes.data) ? userRes.data : (userRes.data?.content || userRes.data?.data || []);
                    setUsersList(usersData);
                } catch (err) {
                    try {
                        const altUserRes = await api.get('/admin/users');
                        const altData = Array.isArray(altUserRes.data) ? altUserRes.data : (altUserRes.data?.content || altUserRes.data?.data || []);
                        setUsersList(altData);
                    } catch (innerErr) {
                        console.warn("Could not fetch users list", innerErr);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to fetch investors", e);
            setMessage({ text: 'Failed to load investors data from server.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = (dataList, role, email, userId, query) => {
        let result = [...dataList];
        const isAdminUser = role === 'ADMIN' || role.includes('ADMIN');
        const isMentorUser = role === 'MENTOR' || role.includes('MENTOR');

        // Admin aur Mentor ke liye email/userId matching bypass ki gayi hai taake assigned/all records show hon
        if (!isAdminUser && !isMentorUser) {
            result = result.filter(inv => {
                const invEmail = (inv?.email || inv?.user?.email || '').toLowerCase().trim();
                const invUserId = String(inv?.user?.userId || inv?.user?.id || inv?.userId || '');
                
                const emailMatch = email && invEmail === email;
                const idMatch = userId && invUserId === String(userId);
                
                return emailMatch || idMatch;
            });
        }

        if (query.trim() !== '') {
            const lowerQuery = query.toLowerCase();
            result = result.filter(inv =>
                inv?.investmentFocus?.toLowerCase().includes(lowerQuery) ||
                inv?.whatInvestorOffers?.toLowerCase().includes(lowerQuery) ||
                inv?.email?.toLowerCase().includes(lowerQuery) ||
                inv?.name?.toLowerCase().includes(lowerQuery) ||
                inv?.user?.fullName?.toLowerCase().includes(lowerQuery) ||
                String(inv?.minimumAmount || '').includes(lowerQuery)
            );
        }

        setFilteredInvestors(result);
    };

    useEffect(() => {
        fetchInvestors();
    }, []);

    useEffect(() => {
        if (investors.length > 0) {
            applyFilters(investors, userRole, currentUserEmail, currentUserId, searchQuery);
        }
    }, [searchQuery]);

    const isAdmin = userRole === 'ADMIN' || userRole.includes('ADMIN');

    const showNotification = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleOpenAddModal = () => {
        if (!isAdmin) return;
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ investmentFocus: '', minimumAmount: '', whatInvestorOffers: '', user: { userId: '' } });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (investor) => {
        if (!isAdmin) return;
        setIsEditing(true);
        const resolvedId = investor?.investorId || investor?.id;
        const resolvedUserId = investor?.user?.userId || investor?.user?.id || investor?.userId || '';
        setCurrentId(resolvedId);
        setFormData({
            investmentFocus: investor?.investmentFocus || '',
            minimumAmount: investor?.minimumAmount || '',
            whatInvestorOffers: investor?.whatInvestorOffers || '',
            user: { userId: resolvedUserId }
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        try {
            if (isEditing) {
                await api.put(`/investors/${currentId}`, formData);
                showNotification('Investor profile updated successfully!', 'success');
            } else {
                await api.post('/investors', formData);
                showNotification('New investor added successfully!', 'success');
            }
            setIsModalOpen(false);
            fetchInvestors();
        } catch (err) {
            console.error("Error saving investor:", err);
            showNotification(err.response?.data?.message || 'Failed to save investor details.', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!isAdmin) return;
        if (!window.confirm("Are you sure you want to delete this investor record?")) return;
        try {
            await api.delete(`/investors/${id}`);
            showNotification('Investor deleted successfully.', 'success');
            fetchInvestors();
        } catch (err) {
            console.error("Error deleting investor:", err);
            showNotification('Failed to delete investor record.', 'error');
        }
    };

    return (
        <div className="flex bg-[#0b0f19] min-h-screen text-slate-100">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto">
                <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#131b2e] border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-orange-500/50 transition cursor-pointer shadow-sm"
                            >
                                <ArrowLeft size={14} className="text-orange-500" /> Back to Dashboard
                            </button>
                        </div>
                        <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                            <Building2 className="text-orange-500" size={32} />
                            Investors Directory
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Comprehensive directory of venture capitalists and investment portfolios.
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer self-start sm:self-auto"
                        >
                            <Plus size={18} /> Add New Investor
                        </button>
                    )}
                </header>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-2xl text-xs font-bold border ${message.type === 'error' ? 'bg-rose-950/40 text-rose-400 border-rose-800/60' : 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'}`}>
                        {message.text}
                    </div>
                )}

                <div className="bg-[#131b2e] p-5 rounded-3xl border border-slate-800/80 shadow-sm mb-8 flex items-center justify-between gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, focus, offerings, or amount..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-[#0b0f19] border border-slate-800 rounded-2xl text-xs font-semibold text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition"
                        />
                    </div>
                    <span className="text-xs font-bold text-slate-400 hidden sm:block">
                        Total Records: {filteredInvestors.length}
                    </span>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-500 font-bold animate-pulse">Loading investors information...</div>
                ) : filteredInvestors.length === 0 ? (
                    <div className="bg-[#131b2e] p-12 rounded-3xl border border-slate-800 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
                        <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mx-auto border border-orange-500/20">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-white">No Investor Record Found</h3>
                        <p className="text-slate-400 text-sm">No matching investor profile found in the system.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvestors.map((investor) => {
                            const invId = investor?.investorId || investor?.id;
                            const investorName = investor?.name || investor?.user?.fullName || investor?.user?.name || investor?.user?.username || investor?.email || `Investor #${invId}`;

                            return (
                                <div key={invId} className="bg-[#131b2e] rounded-3xl border border-slate-800/80 p-6 shadow-xl flex flex-col justify-between space-y-5 hover:border-orange-500/50 transition group">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/20">
                                                    {investorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-white group-hover:text-orange-400 transition truncate max-w-[150px]" title={investorName}>
                                                        {investorName}
                                                    </h3>
                                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-500/20 inline-block mt-0.5">Active VC</span>
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-slate-800">
                                                    <button
                                                        onClick={() => handleOpenEditModal(investor)}
                                                        className="p-2 text-slate-400 hover:text-orange-400 transition rounded-lg hover:bg-slate-800/50 cursor-pointer"
                                                        title="Edit Investor"
                                                    >
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(invId)}
                                                        className="p-2 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-800/50 cursor-pointer"
                                                        title="Delete Investor"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-800/80">
                                            <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60">
                                                <span className="text-[9px] font-extrabold text-slate-500 block uppercase tracking-wider">Focus</span>
                                                <span className="text-xs font-bold text-slate-200 truncate block mt-0.5">{investor?.investmentFocus || 'General'}</span>
                                            </div>
                                            <div className="bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60">
                                                <span className="text-[9px] font-extrabold text-slate-500 block uppercase tracking-wider">Min Amount</span>
                                                <span className="text-xs font-bold text-emerald-400 truncate block mt-0.5">${Number(investor?.minimumAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="font-extrabold text-slate-500 block uppercase text-[9px] tracking-wider">Strategic Offerings:</span>
                                        <p className="text-xs text-slate-400 line-clamp-2 bg-[#0b0f19] p-3 rounded-xl border border-slate-800/60 font-medium">
                                            {investor?.whatInvestorOffers || 'Mentorship, seed capital, and networking support.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add / Edit Modal */}
                {isModalOpen && isAdmin && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-[#131b2e] rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-800">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                <h2 className="text-xl font-black text-white">
                                    {isEditing ? 'Edit Investor Profile' : 'Add New Venture Capitalist'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select User Account</label>
                                    <select
                                        required
                                        value={formData.user.userId}
                                        onChange={(e) => setFormData({ ...formData, user: { userId: e.target.value } })}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#0b0f19] border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-orange-500 transition"
                                    >
                                        <option value="">-- Choose User Account --</option>
                                        {usersList.map(u => {
                                            const uId = u?.userId || u?.id;
                                            const uName = u?.fullName || u?.name || u?.username || 'User';
                                            const uEmail = u?.email || '';
                                            const uRole = u?.role || 'USER';
                                            return (
                                                <option key={uId} value={uId}>
                                                    {uName} {uEmail ? `(${uEmail})` : ''} - [{uRole}]
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Investment Focus</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., AI & SaaS Platforms"
                                        value={formData.investmentFocus}
                                        onChange={(e) => setFormData({ ...formData, investmentFocus: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#0b0f19] border border-slate-800 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Minimum Amount ($)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="e.g., 50000"
                                        value={formData.minimumAmount}
                                        onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#0b0f19] border border-slate-800 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">What Investor Offers</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Mentorship, network access, seed funding..."
                                        value={formData.whatInvestorOffers}
                                        onChange={(e) => setFormData({ ...formData, whatInvestorOffers: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#0b0f19] border border-slate-800 text-xs font-semibold text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-orange-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:bg-slate-800 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-2xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition shadow-lg shadow-orange-500/20 cursor-pointer"
                                    >
                                        {isEditing ? 'Update Investor' : 'Save Investor'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default InvestorsPage;