import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calendar, User, Tag, Activity, DollarSign, Briefcase, Edit3, TrendingUp, PlusCircle, Users } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const StartupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [startup, setStartup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);

    const [availableTags, setAvailableTags] = useState([]);
    const [userRole, setUserRole] = useState('USER');

    const allSuggestedTags = [
        "Artificial Intelligence", "Machine Learning", "Data Science", "Computer Vision",
        "Deep Learning", "Natural Language Processing", "Predictive Modeling", "Raw Data Pipelines",
        "Algorithm Optimization", "Data Analytics", "CI/CD Pipelines", "Docker & Containerization",
        "System Automation", "Database Optimization", "Cloud Infrastructure", "API Development",
        "Microservices", "Enterprise Architecture", "System Logs", "Spring Boot Backend",
        "Java Full Stack", "Python Automation", "JPA / Hibernate", "MySQL Database",
        "RESTful Services", "IoT & Embedded Systems", "Sustainable Energy", "FinTech",
        "EdTech", "HealthTech", "Cloud Computing", "Cybersecurity", "Web Development",
        "Mobile App Development", "E-Commerce Solutions", "Autonomous Systems", "Neural Networks"
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);

    const [milestone, setMilestone] = useState(0);
    const [fundingRaised, setFundingRaised] = useState(0);
    const [valuation, setValuation] = useState('');
    const [newTimelineLog, setNewTimelineLog] = useState('Phase 1: Ideation & Setup Completed');
    const [category, setCategory] = useState('General');

    const [investorFundInput, setInvestorFundInput] = useState(1000);

    const fetchTagsList = async () => {
        try {
            const res = await api.get('/tags');
            setAvailableTags(res.data || []);
        } catch (error) {
            console.error("Failed to fetch tags for dropdown:", error);
        }
    };

    const fetchDetails = useCallback(async () => {
        const cleanId = id && id !== '0' && id !== ':0' ? id.split(':')[0] : (startup?.id || '1');
        const storedRole = localStorage.getItem('role') || localStorage.getItem('userRole') || 'USER';
        setUserRole(storedRole.toUpperCase());

        try {
            const [incubationRes, timelineRes] = await Promise.all([
                api.get(`/incubations`),
                api.get(`/progress/startup/${cleanId}`).catch(() => ({ data: [] }))
            ]);

            const startupsList = incubationRes.data || [];
            const timelinesList = timelineRes.data || [];

            const matched = startupsList.find(s => {
                const currentId = s.incubationId ?? s.incubation_id ?? s.id ?? s._id ?? s.startupId ?? s.projectId;
                if (!cleanId || cleanId === '0') return true;
                return Number(currentId) === Number(cleanId);
            }) || startupsList[0];

            if (matched) {
                const mentorName =
                    matched.mentor?.user?.name ||
                    matched.mentor?.name ||
                    matched.mentorName ||
                    matched.assignedMentor ||
                    'Not Assigned';

                const investorName =
                    matched.investor?.user?.name ||
                    matched.investor?.name ||
                    matched.investorEmail ||
                    matched.investor_email ||
                    matched.assignedInvestor ||
                    'Not Assigned';

                const currentCat = matched.category || matched.tag || matched.tagName || 'General';
                const currentProg = Number(matched.progressPercentage || matched.progress_percentage || matched.percentage || matched.completionPercentage || 0);
                const currentFunding = matched.funding || matched.fundingRaised || matched.budget || 0;
                const currentValuation = matched.valuation || matched.companyValuation || '';

                const rawDesc = matched.description || matched.details || '';
                const finalDescription = rawDesc.trim() !== '' ? rawDesc : 'Autonomous Aquatic Plastic Collection & Water Quality Monitor system designed to track and clean aquatic environments efficiently.';

                setStartup({
                    id: matched.incubationId ?? matched.incubation_id ?? matched.id ?? matched.startupId ?? cleanId,
                    title: matched.programName || matched.program_name || matched.name || matched.title || 'Untitled Incubation',
                    description: finalDescription,
                    category: currentCat,
                    status: matched.status || 'ACTIVE',
                    startDate: matched.startDate || matched.start_date || 'N/A',
                    assignedMentor: mentorName,
                    assignedInvestor: investorName,
                    fundingRaised: currentFunding !== null && currentFunding !== '' ? (String(currentFunding).startsWith('$') ? currentFunding : `$${currentFunding}`) : '$0',
                    valuation: currentValuation ? (String(currentValuation).startsWith('$') ? currentValuation : `$${currentValuation}`) : 'N/A',
                    progress: {
                        currentPhase: timelinesList.length > 0 ? timelinesList[timelinesList.length - 1].currentPhase : (matched.currentPhase || 'Phase 1: Ideation & Setup Completed'),
                        percentage: currentProg
                    },
                    timeline: timelinesList
                });

                setMilestone(currentProg);
                setFundingRaised(currentFunding !== null && currentFunding !== '' ? String(currentFunding).replace('$', '') : 0);
                setValuation(currentValuation ? String(currentValuation).replace('$', '') : '');
                setCategory(currentCat);
            } else {
                setStartup(null);
            }
        } catch (error) {
            console.error("Error fetching startup details from database:", error);
            setStartup(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchDetails();
        fetchTagsList();
    }, [fetchDetails]);

    const dbTagNames = availableTags.map(t => t.tagName);
    const combinedTags = Array.from(new Set(['General', ...dbTagNames, ...allSuggestedTags]));

    const handleOpenModal = () => {
        if (startup) {
            setMilestone(startup.progress?.percentage || 0);
            setFundingRaised(typeof startup.fundingRaised === 'string' ? startup.fundingRaised.replace('$', '') : (startup.fundingRaised || 0));
            setValuation(startup.valuation !== 'N/A' ? startup.valuation.replace('$', '') : '');
            setCategory(startup.category || 'General');
        }
        setIsModalOpen(true);
    };

    const handleAdminUpdate = async (e) => {
        e.preventDefault();
        const cleanId = startup?.id || (id && id !== '0' && id !== ':0' ? id.split(':')[0] : '1');

        try {
            const progressPayload = {
                startupId: Number(cleanId),
                incubationId: Number(cleanId),
                percentage: Number(milestone),
                progressPercentage: Number(milestone),
                phaseTitle: newTimelineLog,
                currentPhase: newTimelineLog
            };

            await api.post(`/progress`, progressPayload).catch(() => {});
            await api.post(`/incubations/${cleanId}/timeline-logs`, progressPayload).catch(() => {});

            const incubationDtoPayload = {
                progressPercentage: Number(milestone),
                fundingRaised: String(fundingRaised),
                valuation: valuation ? (String(valuation).startsWith('$') ? valuation : `$${valuation}`) : '',
                category: category
            };

            await api.put(`/incubations/${cleanId}/progress`, incubationDtoPayload).catch(async () => {
                await api.put(`/incubations/${cleanId}`, {
                    programName: startup?.title,
                    description: startup?.description,
                    status: startup?.status,
                    category: category,
                    funding: String(fundingRaised),
                    valuation: valuation,
                    progressPercentage: Number(milestone)
                });
            });

            setIsModalOpen(false);
            toast.success('Startup details and timeline updated successfully!', { position: "top-right", autoClose: 3000, theme: "dark" });
            fetchDetails();
        } catch (error) {
            console.error('Detailed API Error:', error.response?.data || error.message);
            toast.error(`Failed to update details: ${error.response?.data?.message || error.message}`, { position: "top-right", autoClose: 4000, theme: "dark" });
        }
    };

    const handleInvestorFundSubmit = async (e) => {
        e.preventDefault();
        const cleanId = startup?.id || (id && id !== '0' && id !== ':0' ? id.split(':')[0] : '1');

        try {
            const currentNumericFunding = Number(String(startup.fundingRaised).replace('$', '').replace(/,/g, '')) || 0;
            const addedAmount = Number(investorFundInput) || 0;
            const newTotalFunding = currentNumericFunding + addedAmount;

            let successFlag = false;

            try {
                await api.put(`/incubations/${cleanId}/fund`, { funding: newTotalFunding, fundingRaised: newTotalFunding });
                successFlag = true;
            } catch {
                try {
                    await api.put(`/incubations/${cleanId}/progress`, {
                        fundingRaised: String(newTotalFunding),
                        progressPercentage: Number(startup.progress?.percentage || 0),
                        category: startup.category
                    });
                    successFlag = true;
                } catch {
                    await api.put(`/incubations/${cleanId}`, {
                        programName: startup?.title,
                        description: startup?.description,
                        status: startup?.status,
                        category: startup?.category,
                        funding: String(newTotalFunding),
                        fundingRaised: String(newTotalFunding),
                        progressPercentage: Number(startup.progress?.percentage || 0)
                    });
                    successFlag = true;
                }
            }

            if (successFlag) {
                setIsInvestorModalOpen(false);
                setInvestorFundInput(1000);
                toast.success(`Successfully invested $${addedAmount}! Total funding updated.`, { position: "top-right", autoClose: 3000, theme: "dark" });
                fetchDetails();
            }
        } catch (error) {
            console.error('Investor Funding Error:', error.response?.data || error);
            toast.error(`Failed to submit investment funds: ${error.response?.data?.message || error.message || 'Server error'}`, { position: "top-right", autoClose: 4000, theme: "dark" });
        }
    };

    if (loading) {
        return (
            <div className="flex bg-slate-900 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-orange-400 font-bold text-lg animate-pulse flex items-center gap-3">
                        Loading Startup Details from Database...
                    </div>
                </main>
            </div>
        );
    }

    if (unauthorized || !startup) {
        return (
            <div className="flex bg-slate-900 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-slate-800 border border-slate-700/80 p-10 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white">Startup Not Found or Restricted</h2>
                        <button onClick={() => navigate(-1)} className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-bold text-sm cursor-pointer shadow-lg">
                            Go Back
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    const isInvestor = userRole.includes('INVESTOR');
    const isMentor = userRole.includes('MENTOR');
    const isAdminOrManager = userRole.includes('ADMIN') || userRole.includes('MANAGER') || userRole.includes('SUPER_ADMIN');

    return (
        <div className="flex bg-slate-900 min-h-screen text-slate-100 relative selection:bg-orange-500 selection:text-white">
            <Sidebar />
            <ToastContainer />
            <main className="flex-1 p-10">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-md cursor-pointer backdrop-blur-xl"
                    >
                        <ArrowLeft size={16} /> Back to Directory
                    </button>

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => navigate(`/collaboration-hub/${startup?.id}`)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer transition"
                        >
                            <Users size={16} /> Collaboration Hub
                        </button>

                        {isAdminOrManager && (
                            <button
                                onClick={handleOpenModal}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 cursor-pointer transition"
                            >
                                <Edit3 size={16} /> Admin View Controls
                            </button>
                        )}

                        {isInvestor && (
                            <button
                                onClick={() => setIsInvestorModalOpen(true)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition"
                            >
                                <PlusCircle size={16} /> Investor Portal (Fund Startup)
                            </button>
                        )}
                    </div>
                </div>

                <header className="mb-8 bg-slate-800/50 border border-slate-800 p-8 rounded-3xl backdrop-blur-xl shadow-lg">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl font-extrabold text-white tracking-tight">{startup?.title}</h1>
                            <span className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full font-bold uppercase flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                                {startup?.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs px-3 py-1 bg-slate-900 text-slate-300 border border-slate-700 rounded-full font-bold uppercase">
                                {isInvestor ? 'Investor View' : (isMentor ? 'Mentor View' : (isAdminOrManager ? 'Admin & Manager View' : 'User View'))}
                            </span>
                        </div>
                    </div>

                    <p className="text-slate-400 text-base mb-6 leading-relaxed">{startup?.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                            <Tag size={18} className="text-orange-400 shrink-0" />
                            <span>Category: <strong className="text-slate-200 block">{startup?.category}</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                            <Calendar size={18} className="text-orange-400 shrink-0" />
                            <span>Start Date: <strong className="text-slate-200 block">{startup?.startDate}</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                            <User size={18} className="text-amber-400 shrink-0" />
                            <span className="truncate">Mentor: <strong className="text-slate-200 block truncate">{startup?.assignedMentor}</strong></span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 font-medium bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
                            <Briefcase size={18} className="text-emerald-400 shrink-0" />
                            <span className="truncate">Investor: <strong className="text-slate-200 block truncate">{startup?.assignedInvestor}</strong></span>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Activity className="text-orange-400" size={22} /> Execution Progress
                            </h2>

                            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-2xl font-bold mb-6">
                                <CheckCircle2 size={20} className="text-orange-400 shrink-0" /> {startup?.progress?.currentPhase}
                            </div>

                            <div className="mb-2 flex justify-between text-sm font-bold text-slate-300">
                                <span>Milestone Completion</span>
                                <span className="text-orange-400">{startup?.progress?.percentage}% Completed</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-3 rounded-full transition-all duration-500 shadow-lg shadow-orange-500/30"
                                    style={{ width: `${startup?.progress?.percentage || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <DollarSign className="text-orange-400" size={22} /> Investment & Funding Overview
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Funding Raised By Investor</span>
                                    <h3 className="text-2xl font-black text-white mt-1">{startup?.fundingRaised}</h3>
                                </div>
                                <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Valuation</span>
                                    <h3 className="text-2xl font-black text-white mt-1">{startup?.valuation}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/80 border border-slate-700/80 p-8 rounded-3xl shadow-xl backdrop-blur-xl">
                        <h2 className="text-xl font-bold text-white mb-6">Timeline Log</h2>
                        <div className="space-y-6">
                            {startup?.timeline?.length > 0 ? (
                                startup.timeline.map((event, idx) => (
                                    <div key={event.id || idx} className="relative border-l-2 border-orange-500 pl-4 pb-2">
                                        <h4 className="font-bold text-slate-200 text-sm">{event.currentPhase}</h4>
                                        <p className="text-xs text-orange-400 mt-0.5 font-semibold">Progress: {event.percentage}%</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic">No timeline events found in database.</p>
                            )}
                        </div>
                    </div>
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TrendingUp className="text-orange-400" size={20} /> Admin: Update Startup Metrics
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                            </div>

                            <form onSubmit={handleAdminUpdate} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Category / Tag</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 max-h-40 overflow-y-auto"
                                    >
                                        {combinedTags.map((tagName, index) => (
                                            <option key={index} value={tagName}>{tagName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Milestone Completion (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={milestone}
                                        onChange={(e) => setMilestone(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Funding Raised ($)</label>
                                    <input
                                        type="number"
                                        value={fundingRaised}
                                        onChange={(e) => setFundingRaised(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Company Valuation</label>
                                    <input
                                        type="text"
                                        value={valuation}
                                        placeholder="e.g., 1.5M or N/A"
                                        onChange={(e) => setValuation(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Timeline Log Entry</label>
                                    <select
                                        value={newTimelineLog}
                                        onChange={(e) => setNewTimelineLog(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500"
                                    >
                                        <option value="Phase 1: Ideation & Setup Completed">Phase 1: Ideation & Setup Completed</option>
                                        <option value="Milestone 25%: Initial Architecture Ready">Milestone 25%: Initial Architecture Ready</option>
                                        <option value="Milestone 50%: Core Features Implemented">Milestone 50%: Core Features Implemented</option>
                                        <option value="Milestone 100%: Project Deployed Successfully">Milestone 100%: Project Deployed Successfully</option>
                                    </select>
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer">Cancel</button>
                                    <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md cursor-pointer">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {isInvestorModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                        <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 text-slate-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                                <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-400">
                                    <DollarSign size={20} /> Investor Portal: Provide Funds
                                </h3>
                                <button onClick={() => setIsInvestorModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
                            </div>

                            <form onSubmit={handleInvestorFundSubmit} className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-300 block mb-1">Amount to Invest / Add ($)</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={investorFundInput}
                                            onChange={(e) => setInvestorFundInput(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                                            placeholder="Enter fund amount"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setInvestorFundInput(prev => Number(prev || 0) + 5000)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl font-bold text-sm cursor-pointer shadow"
                                            title="Add +$5000"
                                        >
                                            +$5k
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-3 border-t border-slate-700">
                                    <button type="button" onClick={() => setIsInvestorModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer">Cancel</button>
                                    <button type="submit" className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer">Confirm Investment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StartupDetails;