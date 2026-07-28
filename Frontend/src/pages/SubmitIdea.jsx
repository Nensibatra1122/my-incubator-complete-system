import React, { useState, useEffect } from 'react';
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

    // Form state with pre-filled user details from localStorage if available
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        submitterName: localStorage.getItem('userName') || '',
        createdByEmail: localStorage.getItem('userEmail') || '',
        budget: '',
        githubUrl: '',
        companyName: '',
        tagId: ''
    });

    // Fetch available tags on component load
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await api.get('/tags');
                setTags(response.data || []);
            } catch (error) {
                console.error('Failed to fetch system tags for submission', error);
            }
        };
        fetchTags();
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

            showAlert('Success!', 'Idea submitted successfully!', 'success');
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
        <div className="flex bg-slate-50 min-h-screen relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <main className="flex-1 p-10">
                {/* Custom Gorgeous Popup Modal */}
                {modalConfig.show && (
                    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative">
                            <button
                                onClick={handleModalClose}
                                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-full transition cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                                modalConfig.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                            }`}>
                                {modalConfig.type === 'success' ? <CheckCircle2 size={30} /> : <AlertCircle size={30} />}
                            </div>

                            <h3 className="text-xl font-extrabold text-slate-900 mb-2">{modalConfig.title}</h3>
                            <p className="text-slate-600 text-sm mb-6 leading-relaxed">{modalConfig.message}</p>

                            <button
                                onClick={handleModalClose}
                                className={`w-full py-3.5 text-white rounded-2xl text-sm font-bold transition shadow-lg cursor-pointer ${
                                    modalConfig.type === 'success'
                                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                                        : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/25'
                                }`}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}

                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm mb-6 transition cursor-pointer"
                >
                    <ArrowLeft size={18} /> Back to Dashboard
                </button>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
                            <Lightbulb size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-900">Submit New Innovation Idea</h1>
                            <p className="text-slate-500 text-sm">Pitch your project proposal with full details, your name, official email, and repository.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileText size={14} /> Idea Title
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. AI-Driven Smart Healthcare Monitoring"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                            />
                        </div>

                        {/* Tag Selection Field */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Tag size={14} /> Categorical Tag
                            </label>
                            <select
                                value={formData.tagId}
                                onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition cursor-pointer"
                            >
                                <option value="">Select a Tag (Optional)</option>
                                {tags.map((tag) => (
                                    <option key={tag.tagId} value={tag.tagId}>
                                        {tag.tagName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Description Field with validation note */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} /> Project Description (Detailed Proposal)
                                </label>
                                <span className={`text-[10px] font-bold ${formData.description.trim().length < 50 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {formData.description.trim().length}/50 chars min
                                </span>
                            </div>
                            <textarea
                                required
                                rows={5}
                                placeholder="Describe your operational overview, system workflow, problem statement, and core technical architecture in detail (at least 50 characters)..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                            />
                        </div>

                        {/* Grid for Submitter Name & Official Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <User size={14} /> Submitter Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter full name"
                                    value={formData.submitterName}
                                    onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Mail size={14} /> Submitter Official Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@organization.com"
                                    value={formData.createdByEmail}
                                    onChange={(e) => setFormData({ ...formData, createdByEmail: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                                />
                            </div>
                        </div>

                        {/* Grid for Budget & GitHub URL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <DollarSign size={14} /> Proposed Fund ($) (Optional)
                                </label>
                                <input
                                    type="number"
                                    placeholder="e.g. 25000"
                                    value={formData.budget}
                                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Code size={14} /> GitHub Repository URL
                                </label>
                                <input
                                    type="url"
                                    placeholder="https://github.com/username/repo"
                                    value={formData.githubUrl}
                                    onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                                />
                            </div>
                        </div>

                        {/* Company Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Building2 size={14} /> Company / Organization Name
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Enterprise Innovations"
                                value={formData.companyName}
                                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-500 transition"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition flex items-center gap-3 shadow-lg shadow-orange-600/20 disabled:opacity-50 cursor-pointer"
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