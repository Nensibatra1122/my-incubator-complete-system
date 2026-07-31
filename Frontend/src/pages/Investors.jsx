import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Building2, Plus, Edit, Trash2, X, ShieldAlert, Search, Briefcase, Award } from 'lucide-react';
import api from '../api/axios';

const InvestorsPage = () => {
    const [investors, setInvestors] = useState([]);
    const [filteredInvestors, setFilteredInvestors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState('');
    const [currentUserEmail, setCurrentUserEmail] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Form States for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        investmentFocus: '',
        minimumAmount: '',
        whatInvestorOffers: '',
        email: ''
    });

    const fetchInvestors = async () => {
        try {
            setLoading(true);
            const rawRole = localStorage.getItem('role') || localStorage.getItem('userRole') || '';
            const storedRole = rawRole.replace('ROLE_', '').toUpperCase();
            const storedEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';

            setUserRole(storedRole);
            setCurrentUserEmail(storedEmail);

            if (storedRole === 'USER') {
                setInvestors([]);
                setFilteredInvestors([]);
                setLoading(false);
                return;
            }

            const res = await api.get('/investors');
            const data = Array.isArray(res.data) ? res.data : (res.data.content || res.data.data || []);
            setInvestors(data);
            setFilteredInvestors(data);
        } catch (e) {
            console.error("Failed to fetch investors", e);
            setMessage({ text: 'Failed to load investors data from server.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvestors();
    }, []);

    // Filter Logic: Filter records based on role and search criteria
    useEffect(() => {
        let result = [...investors];

        const isAdmin = userRole === 'ADMIN';
        const isInvestor = userRole === 'INVESTOR';
        const isStudent = userRole === 'STUDENT' || userRole === 'USER';

        if (isInvestor) {
            result = result.filter(inv => {
                const invEmail = inv.email || inv.user?.email || '';
                return currentUserEmail && invEmail.toLowerCase() === currentUserEmail.toLowerCase();
            });
        } else if (searchQuery.trim() !== '' && !isStudent) {
            const query = searchQuery.toLowerCase();
            result = result.filter(inv =>
                inv.investmentFocus?.toLowerCase().includes(query) ||
                inv.whatInvestorOffers?.toLowerCase().includes(query) ||
                inv.email?.toLowerCase().includes(query) ||
                inv.fullName?.toLowerCase().includes(query) ||
                inv.name?.toLowerCase().includes(query) ||
                String(inv.minimumAmount || '').includes(query)
            );
        }

        setFilteredInvestors(result);
    }, [searchQuery, investors, userRole, currentUserEmail]);

    const isAdmin = userRole === 'ADMIN';
    const isInvestor = userRole === 'INVESTOR';
    const isBasicUser = userRole === 'USER';

    const showNotification = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const handleOpenAddModal = () => {
        if (!isAdmin) return;
        setIsEditing(false);
        setCurrentId(null);
        setFormData({ investmentFocus: '', minimumAmount: '', whatInvestorOffers: '', email: '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (investor) => {
        if (!isAdmin) return;
        setIsEditing(true);
        setCurrentId(investor.id || investor.investorId);
        setFormData({
            investmentFocus: investor.investmentFocus || '',
            minimumAmount: investor.minimumAmount || '',
            whatInvestorOffers: investor.whatInvestorOffers || '',
            email: investor.email || investor.user?.email || ''
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
            showNotification('Failed to save investor details. Check backend connection.', 'error');
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
        <div className="flex bg-slate-50 min-h-screen">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 relative overflow-y-auto">
                <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Building2 className="text-orange-500" size={32} />
                            {isInvestor ? 'My Investor Profile & Project History' : userRole === 'STUDENT' ? 'Your Startup Investors' : 'Investors Directory'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {isInvestor
                                ? 'View your active fund allocations, linked startup history, and venture capital profile.'
                                : userRole === 'STUDENT'
                                    ? 'Explore venture capitalists and investors aligned with your startup project.'
                                    : 'Comprehensive directory of venture capitalists, fund allocations, and investment portfolios.'}
                        </p>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={handleOpenAddModal}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer self-start sm:self-auto"
                        >
                            <Plus size={18} /> Add New Investor
                        </button>
                    )}
                </header>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-2xl text-xs font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                        {message.text}
                    </div>
                )}

                {!isInvestor && !isBasicUser && (
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm mb-8 flex items-center justify-between gap-4">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, investment focus, offers, or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                            />
                        </div>
                        <span className="text-xs font-bold text-slate-400 hidden sm:block">
                            Total Records: {filteredInvestors.length}
                        </span>
                    </div>
                )}

                {isBasicUser ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800">Access Restricted</h3>
                        <p className="text-slate-500 text-sm">
                            Basic registered accounts do not have access to the Investors directory.
                        </p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading investors information...</div>
                ) : isInvestor ? (
                    <div className="max-w-4xl space-y-6">
                        {filteredInvestors.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 shadow-sm">
                                <ShieldAlert className="mx-auto text-orange-500" size={32} />
                                <h3 className="text-lg font-bold text-slate-800">No Profile Record Found</h3>
                                <p className="text-slate-500 text-sm">No investor profile is currently linked to your email address, or the administrator has not yet assigned one.</p>
                            </div>
                        ) : (
                            filteredInvestors.map((investor) => {
                                const investorName = investor.fullName || investor.name || investor.user?.fullName || investor.email || investor.user?.email || 'Investor';
                                const assignedIncubations = investor.incubations || [];

                                return (
                                    <div key={investor.id || investor.investorId} className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xl shadow-slate-100 space-y-6">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-orange-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-orange-600/20">
                                                    {investorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-slate-900">{investorName}</h2>
                                                    <span className="text-xs bg-orange-50 text-orange-600 px-3 py-1 rounded-full font-extrabold border border-orange-100 inline-block mt-1.5">Verified Investor Portfolio</span>
                                                </div>
                                            </div>
                                            <div className="text-right bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Minimum Investment</span>
                                                <span className="text-xl font-black text-slate-900">${Number(investor.minimumAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Briefcase size={14} className="text-orange-500" /> Investment Focus
                                                </span>
                                                <p className="text-sm font-bold text-slate-800">{investor.investmentFocus || 'Not specified'}</p>
                                            </div>
                                            <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-100 space-y-1.5">
                                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Award size={14} className="text-orange-500" /> What Investor Offers
                                                </span>
                                                <p className="text-sm font-bold text-slate-800">{investor.whatInvestorOffers || 'Standard investment support'}</p>
                                            </div>
                                        </div>

                                        {/* Associated Startups / Incubation History */}
                                        <div className="pt-4 border-t border-slate-100 space-y-3">
                                            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Your Associated Startups / Incubation History</h3>
                                            {assignedIncubations.length === 0 ? (
                                                <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-100">No startup projects currently linked to your investor portfolio.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {assignedIncubations.map((inc, idx) => (
                                                        <div key={idx} className="bg-orange-50/40 p-4 rounded-2xl border border-orange-100/60 flex items-center justify-between">
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-900">{inc.programName || inc.title || `Startup #${idx + 1}`}</h4>
                                                                <span className="text-[10px] text-slate-500">Status: Active Funding</span>
                                                            </div>
                                                            <span className="text-[10px] bg-orange-600 text-white font-bold px-2.5 py-1 rounded-xl shadow-xs">Linked</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : filteredInvestors.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 shadow-sm">
                        <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                            <ShieldAlert size={32} />
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-800">No Investors Found</h3>
                        <p className="text-slate-500 text-sm">No investor records match your search criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredInvestors.map((investor) => {
                            const invId = investor.id || investor.investorId;
                            const investorName = investor.fullName || investor.name || investor.user?.fullName || investor.email || investor.user?.email || `Investor #${invId}`;

                            return (
                                <div key={invId} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-5 hover:shadow-xl hover:border-orange-200 transition group">
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-md shadow-orange-500/20">
                                                    {investorName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-900 group-hover:text-orange-600 transition truncate max-w-[150px]" title={investorName}>
                                                        {investorName}
                                                    </h3>
                                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-100">Active VC</span>
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                                                    <button
                                                        onClick={() => handleOpenEditModal(investor)}
                                                        className="p-2 text-slate-400 hover:text-orange-600 transition rounded-lg hover:bg-white cursor-pointer"
                                                        title="Edit Investor"
                                                    >
                                                        <Edit size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(invId)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition rounded-lg hover:bg-white cursor-pointer"
                                                        title="Delete Investor"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
                                            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Focus</span>
                                                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">{investor.investmentFocus || 'General'}</span>
                                            </div>
                                            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                                                <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">Min Amount</span>
                                                <span className="text-xs font-bold text-slate-800 truncate block mt-0.5">${Number(investor.minimumAmount || 0).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <span className="font-extrabold text-slate-400 block uppercase text-[9px] tracking-wider">Strategic Offerings:</span>
                                        <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                                            {investor.whatInvestorOffers || 'Mentorship, seed capital, and networking support.'}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Add / Edit Professional Modal - Restricted to Admin */}
                {isModalOpen && isAdmin && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 border border-slate-100 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-xl font-black text-slate-900">
                                    {isEditing ? 'Edit Investor Profile' : 'Add New Venture Capitalist'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Investment Focus</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g., AI & SaaS Platforms"
                                        value={formData.investmentFocus}
                                        onChange={(e) => setFormData({ ...formData, investmentFocus: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Minimum Amount ($)</label>
                                        <input
                                            type="number"
                                            required
                                            placeholder="e.g., 50000"
                                            value={formData.minimumAmount}
                                            onChange={(e) => setFormData({ ...formData, minimumAmount: e.target.value })}
                                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Investor Email</label>
                                        <input
                                            type="email"
                                            placeholder="investor@domain.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">What Investor Offers</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Mentorship, network access, seed funding..."
                                        value={formData.whatInvestorOffers}
                                        onChange={(e) => setFormData({ ...formData, whatInvestorOffers: e.target.value })}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-orange-500 transition"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-2xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition shadow-lg shadow-orange-600/20 cursor-pointer"
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