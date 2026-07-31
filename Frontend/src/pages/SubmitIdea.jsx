import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import { ArrowLeft, Lightbulb, Send, Code, Building2, DollarSign, Mail, FileText, User, AlertCircle, CheckCircle2, X, Tag } from 'lucide-react';

const SubmitIdea = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [tags, setTags] = useState([]);

    // Custom Modal States
    const [modalConfig, setModalConfig] = useState({
        show: false,
        type: 'error',
        title: '',
        message: ''
    });

    // Helper to safely extract logged-in user data from various possible localStorage keys or parsed user object
    const getStoredUserDetail = (keyType) => {
        try {
            // Check direct keys first
            if (keyType === 'name') {
                return localStorage.getItem('userName') ||
                    localStorage.getItem('name') ||
                    localStorage.getItem('submitterName') || '';
            } else {
                return localStorage.getItem('userEmail') ||
                    localStorage.getItem('email') ||
                    localStorage.getItem('createdByEmail') || '';
            }
        } catch (e) {
            return '';
        }
    };

    // Form state initialized directly from active session localStorage
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        submitterName: getStoredUserDetail('name'),
        createdByEmail: getStoredUserDetail('email'),
        budget: '',
        githubUrl: '',
        companyName: '',
        tagId: ''
    });

    // Fetch tags on component load
    useEffect(() => {
        (async () => {
            try {
                const tagRes = await api.get('/tags');
                setTags(tagRes.data || []);
            } catch (error) {
                console.error('Failed to fetch system tags', error);
            }

            // Fallback: If localStorage was missing name/email, check if a general 'user' object is stored
            if (!formData.submitterName || !formData.createdByEmail) {
                try {
                    const storedUserStr = localStorage.getItem('user') || localStorage.getItem('currentUser');
                    if (storedUserStr) {
                        const parsedUser = JSON.parse(storedUserStr);
                        setFormData(prev => ({
                            ...prev,
                            submitterName: prev.submitterName || parsedUser.name || parsedUser.fullName || parsedUser.username || '',
                            createdByEmail: prev.createdByEmail || parsedUser.email || parsedUser.userEmail || ''
                        }));
                    }
                } catch (err) {
                    console.error('Error parsing stored user object', err);
                }
            }
        })();
    }, []);

    const showAlert = (title, message, type = 'error') => {
        setModalConfig({ show: true, title, message, type });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.description) {
            showAlert('Missing Fields', 'Please fill in both Title and Description.');
            return;
        }

        if (formData.description.trim().length < 50) {
            showAlert('Description Too Short', 'Please provide full details for your proposal in the description (at least 50 characters required).');
            return;
        }

        setLoading(true);
        try {
            await api.post('/ideas', {
                title: formData.title,
                description: formData.description,
                submitterName: formData.submitterName,
                createdByEmail: formData.createdByEmail,
                budget: formData.budget ? parseFloat(formData.budget) : null,
                githubUrl: formData.githubUrl,
                companyName: formData.companyName,
                tagId: formData.tagId ? parseInt(formData.tagId) : null
            });

            showAlert('Success!', 'Idea successfully submitted and notification sent!', 'success');
        } catch (error) {
            console.error('Error submitting idea:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to submit idea. You might not have permission or your session expired.';
            showAlert('Access / Submission Notice', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleModalClose = () => {
        const isSuccess = modalConfig.type === 'success';
        setModalConfig({ show: false, type: 'error', title: '', message: '' });
        if (isSuccess) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="flex bg-slate-50/50 min-h-screen relative selection:bg-orange-500 selection:text-white font-sans">
            <Sidebar />
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                {/* Custom Popup Modal */}
                {modalConfig.show && (
                    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative transform transition-all scale-100">
                            <button
                                onClick={handleModalClose}
                                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100/80 hover:bg-slate-200 rounded-full transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner ${
                                modalConfig.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                                {modalConfig.type === 'success' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                            </div>

                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">{modalConfig.title}</h3>
                            <p className="text-slate-600 text-sm mb-7 leading-relaxed font-medium">{modalConfig.message}</p>

                            <button
                                onClick={handleModalClose}
                                className={`w-full py-4 text-white rounded-2xl text-sm font-bold transition shadow-xl cursor-pointer ${
                                    modalConfig.type === 'success'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
                                }`}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}

                {/* Back to Dashboard Button */}
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm mb-8 transition group cursor-pointer"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-xl group-hover:border-slate-300 shadow-sm transition">
                        <ArrowLeft size={16} />
                    </div>
                    Back to Dashboard
                </button>

                {/* Form Container Card */}
                <div className="bg-white p-8 lg:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 pb-6 mb-8 border-b border-slate-100">
                        <div className="p-4 bg-orange-500 text-white rounded-2xl shadow-lg shadow-orange-500/30">
                            <Lightbulb size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Submit New Innovation Idea</h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Pitch your project proposal with complete metrics, automated session credentials, and tech stack.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title Field */}
                        <div>
                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                <FileText size={15} className="text-orange-500" /> Idea Title <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. AI-Driven Smart Healthcare Monitoring & Predictive Ops"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                            />
                        </div>

                        {/* Tag Selection Field */}
                        <div>
                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                <Tag size={15} className="text-orange-500" /> Categorical Tag
                            </label>
                            <select
                                value={formData.tagId}
                                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                                className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200 cursor-pointer"
                            >
                                <option value="">Select a Domain Tag (Optional)</option>
                                {tags.map((tag) => (
                                    <option key={tag.tagId} value={tag.tagId}>
                                        {tag.tagName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description Field */}
                        <div>
                            <div className="flex justify-between items-center mb-2.5">
                                <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={15} className="text-orange-500" /> Project Description & Architecture <span className="text-orange-500">*</span>
                                </label>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                                    formData.description.trim().length < 50
                                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}>
                                    {formData.description.trim().length} / 50 chars min
                                </span>
                            </div>
                            <textarea
                                required
                                rows={5}
                                placeholder="Describe your operational overview, system workflow, problem statement, and core technical architecture in detail (at least 50 characters)..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                            />
                        </div>

                        {/* Submitter Name & Email Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/60">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <User size={14} className="text-slate-400" /> Submitter Name (Active Session)
                                </label>
                                <input
                                    type="text"
                                    required
                                    disabled
                                    value={formData.submitterName}
                                    placeholder="No active user name found"
                                    className="w-full p-3.5 bg-slate-200/70 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed select-none"
                                />
                                <span className="text-[11px] text-slate-400 font-medium mt-1 block">Auto-synced from active profile</span>
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400" /> Official Email (Active Session)
                                </label>
                                <input
                                    type="email"
                                    required
                                    disabled
                                    value={formData.createdByEmail}
                                    placeholder="No active email found"
                                    className="w-full p-3.5 bg-slate-200/70 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed select-none"
                                />
                                <span className="text-[11px] text-slate-400 font-medium mt-1 block">Secured to system user login</span>
                            </div>
                        </div>

                        {/* Budget & GitHub URL Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                    <DollarSign size={15} className="text-orange-500" /> Proposed Fund ($) (Optional)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 25000"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                    <Code size={15} className="text-orange-500" /> GitHub Repository URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/username/repo"
                                    value={formData.githubUrl}
                                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                    className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div>
                            <label className="block text-xs font-extrabold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                                <Building2 size={15} className="text-orange-500" /> Company / Organization Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Utopia Industries / Enterprise Innovations"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full p-4 bg-slate-50/70 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all duration-200"
                            />
                        </div>

                        {/* Submit Action Button */}
                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-9 py-4 bg-orange-600 text-white font-extrabold rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all duration-200 flex items-center gap-3 shadow-xl shadow-orange-600/25 disabled:opacity-50 cursor-pointer"
                            >
                                <Send size={18} /> {loading ? 'Submitting Proposal...' : 'Submit Idea'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default SubmitIdea;