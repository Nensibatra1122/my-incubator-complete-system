import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { Plus, ArrowLeft, TrendingDown, TrendingUp, Trash2, Edit3, Tag, X, CheckCircle2, Briefcase, Download } from 'lucide-react';

const ProjectFinance = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Robust role resolution: handles values like "INVESTOR", "ROLE_INVESTOR",
    // "role_investor", extra whitespace, or arrays/JSON strings from different auth setups.
    const resolveUserRole = () => {
        const rawStoredUser = localStorage.getItem('user');
        let userObjectRole = '';
        if (rawStoredUser) {
            try {
                const parsedUser = JSON.parse(rawStoredUser);
                userObjectRole = parsedUser.role || parsedUser.userRole || (Array.isArray(parsedUser.roles) ? parsedUser.roles[0] : '') || '';
            } catch {
                userObjectRole = '';
            }
        }

        const rawRole = localStorage.getItem('userRole') || localStorage.getItem('role') || userObjectRole || 'USER';
        return String(rawRole).trim().toUpperCase().replace(/^ROLE_/, '');
    };

    const userRole = resolveUserRole();
    const isAdmin = userRole === 'ADMIN';
    const isInvestor = userRole === 'INVESTOR';
    const isStudent = userRole === 'STUDENT' || userRole === 'USER';

    // Allow both Admin and Student (or standard users) to add/modify transactions, restrict only Investors
    const canModify = !isInvestor;

    const categoryOptions = [
        'Server Hosting',
        'Cloud API',
        'Marketing & Ads',
        'Hardware & Equipment',
        'Office Supplies',
        'Software Licenses',
        'Consulting Fees',
        'Travel & Transport',
        'Legal & Compliance',
        'Utilities & Electricity',
        'Maintenance & Repairs',
        'Research & Development',
        'Salaries & Stipends',
        'General Operational'
    ];

    const [showAddModal, setShowAddModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('EXPENSE');
    const [description, setDescription] = useState('Server Hosting');

    const [successMessage, setSuccessMessage] = useState('');

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editAmount, setEditAmount] = useState('');
    const [editType, setEditType] = useState('EXPENSE');
    const [editDescription, setEditDescription] = useState('');

    const fetchTransactions = useCallback(async (projectId) => {
        try {
            const response = await api.get(`/finance-transactions/by-project/${projectId}`);
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    }, []);

    const fetchProjects = useCallback(async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserEmail = (storedUser.email || localStorage.getItem('userEmail') || '').toLowerCase();

            const response = await api.get('/incubations');
            let allPortfolios = Array.isArray(response.data) ? response.data : (response.data?.startups || response.data?.incubations || response.data?.data || []);

            let mappedStartups = allPortfolios.map(s => {
                const identifier = s.incubationId || s.incubation_id || s.id || s._id || s.startupId || s.projectId;
                const resolvedTitle = s.programName || s.program_name || s.name || s.startupName || s.title || s.idea?.title || `Startup #${identifier}`;
                return {
                    id: identifier,
                    projectId: identifier,
                    startupId: identifier,
                    title: resolvedTitle,
                    budget: Number(s.funding || s.fundingRequested || s.budget || 120000),
                    createdByEmail: s.founderEmail || s.createdByEmail || s.idea?.createdByEmail || '',
                    mentorEmail: (s.mentorEmail || s.mentor?.email || '').toLowerCase(),
                    investorEmail: (s.investorEmail || s.investor?.email || '').toLowerCase(),
                    studentEmail: (s.studentEmail || s.student?.email || s.userEmail || '').toLowerCase()
                };
            });

            if (!isAdmin) {
                mappedStartups = mappedStartups.filter(proj => {
                    const createdBy = (proj.createdByEmail || '').toLowerCase();
                    const studentEmail = (proj.studentEmail || '').toLowerCase();

                    if (isInvestor) {
                        return proj.investorEmail === currentUserEmail;
                    }

                    if (isStudent) {
                        return studentEmail === currentUserEmail || createdBy === currentUserEmail;
                    }

                    return proj.mentorEmail === currentUserEmail ||
                        studentEmail === currentUserEmail ||
                        createdBy === currentUserEmail ||
                        createdBy === 'admin' ||
                        createdBy === '';
                });
            }

            setProjects(mappedStartups);
            if (mappedStartups.length > 0) {
                setSelectedProject(prev => prev || mappedStartups[0]);
            }
        } catch (error) {
            console.error('Error fetching registered portfolios:', error);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, isInvestor, isStudent]);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    useEffect(() => {
        if (selectedProject) {
            const pId = selectedProject.id || selectedProject.startupId || selectedProject.projectId;
            const cleanId = String(pId).split(':')[0];
            fetchTransactions(cleanId);
        }
    }, [selectedProject, fetchTransactions]);

    const showNotification = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 4000);
    };

    const handleAddTransaction = async (e) => {
        e.preventDefault();
        if (!canModify) return;

        let rawId = selectedProject?.id || selectedProject?.startupId || selectedProject?.projectId;
        const projId = String(rawId).split(':')[0];

        if (!amount || !projId) return;

        if (!description || description.trim() === '') {
            showNotification("Please provide or select a description/category!");
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = storedUser.email || localStorage.getItem('userEmail') || '';

        try {
            await api.post(`/finance-transactions/project/${projId}`, {
                amount: parseFloat(amount),
                type: type.toUpperCase(),
                description: description.trim(),
                createdByEmail: userEmail
            });

            showNotification(`Successfully added transaction of $${amount}!`);

            setAmount('');
            setDescription('Server Hosting');
            setShowAddModal(false);
            await fetchTransactions(projId);
            await fetchProjects();
        } catch (error) {
            console.error('Error adding transaction:', error);
            showNotification("Failed to add transaction.");
        }
    };

    const handleUpdateTransaction = async (e) => {
        e.preventDefault();
        if (!canModify || !selectedTransaction || !editAmount) return;

        if (!editDescription || editDescription.trim() === '') {
            showNotification("Description cannot be empty!");
            return;
        }

        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userEmail = storedUser.email || localStorage.getItem('userEmail') || '';

        try {
            await api.put(`/finance-transactions/${selectedTransaction.id}`, {
                amount: parseFloat(editAmount),
                type: editType.toUpperCase(),
                description: editDescription.trim(),
                createdByEmail: userEmail
            });

            showNotification(`Transaction successfully updated!`);

            setSelectedTransaction(null);
            setIsEditing(false);
            const projId = selectedProject?.id || selectedProject?.startupId || selectedProject?.projectId;
            const cleanId = String(projId).split(':')[0];
            await fetchTransactions(cleanId);
            await fetchProjects();
        } catch (error) {
            console.error('Error updating transaction:', error);
            showNotification("Failed to update transaction.");
        }
    };

    const handleDeleteTransaction = async (id, e) => {
        if (e) e.stopPropagation();
        if (!canModify) return;
        try {
            await api.delete(`/finance-transactions/${id}`);
            showNotification(`Transaction deleted successfully!`);

            const projId = selectedProject?.id || selectedProject?.startupId || selectedProject?.projectId;
            const cleanId = String(projId).split(':')[0];
            await fetchTransactions(cleanId);
            await fetchProjects();
            if (selectedTransaction?.id === id) setSelectedTransaction(null);
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    const handleExportCSV = () => {
        if (!selectedProject || transactions.length === 0) {
            showNotification("No transactions available to export!");
            return;
        }

        const headers = ["Transaction ID", "Type", "Amount ($)", "Description / Category", "Created By", "Date", "Time"];
        const rows = transactions.map(tx => {
            const dateObj = tx.createdAt ? new Date(tx.createdAt) : null;
            const dateStr = dateObj ? dateObj.toLocaleDateString() : 'N/A';
            const timeStr = dateObj ? dateObj.toLocaleTimeString() : 'N/A';

            return [
                tx.id,
                tx.type,
                tx.amount,
                `"${(tx.description || '').replace(/"/g, '""')}"`,
                `"${tx.createdByEmail || 'System'}"`,
                dateStr,
                timeStr
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${selectedProject.title.replace(/\s+/g, '_')}_Financial_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification("Financial report exported successfully as CSV!");
    };

    const openDetailsModal = (tx) => {
        setSelectedTransaction(tx);
        setIsEditing(false);
    };

    const openEditModal = (tx, e) => {
        e.stopPropagation();
        if (!canModify) return;
        setSelectedTransaction(tx);
        setEditAmount(tx.amount);
        setEditType(tx.type);
        setEditDescription(tx.description || '');
        setIsEditing(true);
    };

    const totalExpenses = transactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const initialBudget = Number(selectedProject?.budget || 0);
    const remainingBudget = initialBudget - totalExpenses;
    const isOverSpent = remainingBudget < 0;
    const spentPercentage = initialBudget > 0 ? Math.min(Math.round((totalExpenses / initialBudget) * 100), 100) : 0;

    return (
        <div className="flex bg-[#0b1120] min-h-screen relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                {successMessage && (
                    <div className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-bounce">
                        <CheckCircle2 className="text-emerald-400" size={24} />
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Notification</p>
                            <p className="text-sm font-semibold">{successMessage}</p>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white font-bold text-sm mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Startup Finance & Portfolios</h1>
                        <p className="text-slate-400 text-sm mt-1">Track confidential startup budgets, expenses, and monitor transaction logs ({userRole} view).</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedProject && transactions.length > 0 && (
                            <button
                                onClick={handleExportCSV}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-md cursor-pointer text-sm border border-slate-700"
                            >
                                <Download size={18} /> Export CSV Report
                            </button>
                        )}
                        {selectedProject && canModify && (
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 transition shadow-lg shadow-orange-600/20 cursor-pointer text-sm"
                            >
                                <Plus size={20} /> Add Transaction
                            </button>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-slate-400 font-semibold">Loading secure startup financial data...</div>
                ) : projects.length === 0 ? (
                    <div className="bg-slate-900 p-12 rounded-3xl border border-slate-800 text-center space-y-3 shadow-sm">
                        <Briefcase className="mx-auto text-slate-600" size={48} />
                        <p className="text-slate-400 font-medium">No registered startup portfolios found.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm space-y-4 h-fit">
                            <h2 className="text-lg font-bold text-white pb-2 border-b border-slate-800">Assigned Portfolios</h2>
                            <div className="space-y-2">
                                {projects.map((proj) => {
                                    const pId = proj.id || proj.startupId || proj.projectId;
                                    const isSelected = (selectedProject?.id || selectedProject?.startupId || selectedProject?.projectId) === pId;
                                    return (
                                        <div
                                            key={pId}
                                            onClick={() => setSelectedProject(proj)}
                                            className={`p-4 rounded-2xl cursor-pointer transition border ${
                                                isSelected
                                                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 font-bold'
                                                    : 'bg-slate-800/50 border-slate-800 text-slate-300 hover:bg-slate-800'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm">{proj.title}</span>
                                                <span className="text-xs px-2.5 py-1 bg-slate-900 rounded-xl shadow-xs border border-slate-700 font-semibold text-slate-300">
                                                    ${proj.budget}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedProject && (
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-lg space-y-6 border border-slate-800">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Confidential Startup</p>
                                            <h2 className="text-2xl font-extrabold mt-1">{selectedProject.title}</h2>
                                            <p className="text-xs text-slate-500 mt-2">Created by: {selectedProject.createdByEmail || 'Admin'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Remaining Budget</p>
                                            <h3 className={`text-3xl font-extrabold mt-1 ${isOverSpent ? 'text-red-400' : 'text-orange-400'}`}>
                                                {isOverSpent ? `-$${Math.abs(remainingBudget)}` : `$${remainingBudget}`}
                                            </h3>
                                            {isOverSpent && (
                                                <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded-md border border-red-500/30">
                                                    Budget Exceeded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-2 border-t border-slate-800">
                                        <div className="flex justify-between text-xs font-bold text-slate-500">
                                            <span>Spent: ${totalExpenses} ({spentPercentage}%)</span>
                                            <span>Initial Total: ${initialBudget}</span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${isOverSpent ? 'bg-red-500' : 'bg-orange-500'}`}
                                                style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm">
                                    <h3 className="text-md font-bold text-white mb-4">Transaction History (Click to view details)</h3>
                                    {transactions.length === 0 ? (
                                        <p className="text-slate-500 text-sm text-center py-6">No transactions recorded for this startup yet.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {transactions.map((tx) => {
                                                const formattedDate = tx.createdAt
                                                    ? new Date(tx.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'Recent';

                                                return (
                                                    <div
                                                        key={tx.id}
                                                        onClick={() => openDetailsModal(tx)}
                                                        className="flex justify-between items-center p-4 bg-slate-800/40 hover:bg-orange-500/10 rounded-2xl border border-slate-800 cursor-pointer transition"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2.5 rounded-xl ${tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                                                {tx.type === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-white">{tx.description || tx.type}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    By: <span className="font-semibold text-slate-300">{tx.createdByEmail || 'System'}</span> • <span className="text-slate-500">{formattedDate}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`font-extrabold text-sm ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                                {tx.type === 'INCOME' ? `+${tx.amount}` : `-${tx.amount}`}
                                                            </span>
                                                            {canModify && (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => openEditModal(tx, e)}
                                                                        title="Edit Transaction"
                                                                        className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition cursor-pointer"
                                                                    >
                                                                        <Edit3 size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => handleDeleteTransaction(tx.id, e)}
                                                                        title="Delete Transaction"
                                                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ADD TRANSACTION MODAL */}
                {showAddModal && canModify && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl relative space-y-4 border border-slate-800">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                            <h3 className="text-xl font-extrabold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                                <Tag className="text-orange-500" size={22} /> Add Transaction Record
                            </h3>
                            <form onSubmit={handleAddTransaction} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount ($)</label>
                                    <input
                                        type="number"
                                        placeholder="Enter amount"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Transaction Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="EXPENSE">Expense</option>
                                        <option value="INCOME">Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Category Tag / Quick Select <span className="text-red-400">*</span></label>
                                    <div className="flex flex-wrap gap-1.5 mb-2 max-h-36 overflow-y-auto pr-1">
                                        {categoryOptions.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setDescription(tag)}
                                                className={`text-[11px] px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                                                    description === tag
                                                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Description required (Type or click tag)..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                        className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl font-bold text-sm transition cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-bold text-sm transition cursor-pointer shadow-lg shadow-orange-600/20"
                                    >
                                        Add Record
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* TRANSACTION DETAILS & EDIT MODAL */}
                {selectedTransaction && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <div className="bg-slate-900 p-8 rounded-3xl max-w-md w-full shadow-2xl relative space-y-4 border border-slate-800">
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                            <h3 className="text-xl font-extrabold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                                {isEditing ? <Edit3 className="text-orange-500" size={22} /> : <Tag className="text-orange-500" size={22} />}
                                {isEditing ? 'Edit Transaction Record' : 'Transaction Details'}
                            </h3>

                            {isEditing ? (
                                <form onSubmit={handleUpdateTransaction} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Amount ($)</label>
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            required
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Transaction Type</label>
                                        <select
                                            value={editType}
                                            onChange={(e) => setEditType(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-orange-500"
                                        >
                                            <option value="EXPENSE">Expense</option>
                                            <option value="INCOME">Income</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description / Category</label>
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={(e) => setEditDescription(e.target.value)}
                                            required
                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl font-bold text-sm transition cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-bold text-sm transition cursor-pointer shadow-lg shadow-orange-600/20"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800 space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Type</span>
                                            <span className={`font-extrabold ${selectedTransaction.type === 'INCOME' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {selectedTransaction.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Amount</span>
                                            <span className="text-white font-extrabold">${selectedTransaction.amount}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Category</span>
                                            <span className="text-white font-semibold">{selectedTransaction.description || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Created By</span>
                                            <span className="text-slate-300 font-medium">{selectedTransaction.createdByEmail || 'System'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500 uppercase font-bold">Date & Time</span>
                                            <span className="text-slate-300">
                                                {selectedTransaction.createdAt ? new Date(selectedTransaction.createdAt).toLocaleString() : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={() => setSelectedTransaction(null)}
                                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-3 rounded-2xl font-bold text-sm transition cursor-pointer"
                                        >
                                            Close
                                        </button>
                                        {canModify && (
                                            <button
                                                onClick={(e) => openEditModal(selectedTransaction, e)}
                                                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-2xl font-bold text-sm transition cursor-pointer shadow-lg shadow-orange-600/20"
                                            >
                                                Edit Record
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ProjectFinance;