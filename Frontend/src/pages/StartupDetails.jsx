import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';

const StartupDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [startup, setStartup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unauthorized, setUnauthorized] = useState(false);

    // Get current logged-in user role and email/ID from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = (localStorage.getItem('userRole') || localStorage.getItem('role') || storedUser.role || 'USER').trim().toUpperCase();
    const userEmail = (localStorage.getItem('userEmail') || storedUser.email || '').toLowerCase();

    useEffect(() => {
        let isMounted = true;

        const fetchDetails = async () => {
            const cleanId = id ? id.split(':')[0] : '1';

            try {
                let ideaData = { title: `Startup Project #${cleanId}`, description: 'Operational overview and milestone tracking.' };
                let progressData = { currentPhase: "Prototype Execution", percentage: 65 };
                let timelineData = [
                    { id: 1, eventName: 'Project Kickoff & Registration', eventDate: '2026-07-02' },
                    { id: 2, eventName: 'MVP Prototype & Core Backend', eventDate: '2026-08-15' },
                    { id: 3, eventName: 'Investor Pitch & Demo Day', eventDate: '2026-09-10' }
                ];

                try {
                    const ideaRes = await api.get(`/ideas`);
                    const ideas = ideaRes.data || [];
                    const matched = ideas.find(i => Number(i.id ?? i['ideaId'] ?? i['idea_id'] ?? 0) === Number(cleanId));

                    if (matched) {
                        ideaData = matched;

                        // Role-Based Authorization Check including MENTOR:
                        const creatorEmail = (matched.createdByEmail || matched.userEmail || matched.email || '').toLowerCase();
                        const isOwner = creatorEmail && userEmail && creatorEmail === userEmail;

                        // Admin, Investor, and Mentor are allowed to view startup tracking details
                        const canViewEverything = userRole === 'ADMIN' || userRole === 'INVESTOR' || userRole === 'MENTOR';

                        if (!canViewEverything && !isOwner && userRole !== 'STUDENT') {
                            if (isMounted) setUnauthorized(true);
                            setLoading(false);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Using default idea details");
                }

                try {
                    const progRes = await api.get(`/progress`);
                    const progList = progRes.data || [];
                    const matchedProg = progList.find(p => Number(p.id ?? p['ideaId'] ?? p['idea_id'] ?? p['startupId'] ?? 0) === Number(cleanId));
                    if (matchedProg) {
                        progressData = {
                            currentPhase: matchedProg['currentPhase'] ?? matchedProg.status ?? matchedProg['current_phase'] ?? "Active Incubation",
                            percentage: Number(matchedProg['completionPercentage'] ?? matchedProg.percentage ?? matchedProg['completion_percentage'] ?? 65)
                        };
                    }
                } catch (e) {
                    console.warn("Using default progress details");
                }

                if (isMounted) {
                    setStartup({
                        programName: ideaData.title ?? ideaData.name ?? ideaData['projectName'] ?? `Startup Project #${cleanId}`,
                        description: ideaData.description ?? ideaData.details ?? 'Operational overview and milestone tracking for this incubated startup.',
                        progress: progressData,
                        timeline: timelineData
                    });
                }
            } catch (error) {
                console.error("Error loading startup details:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchDetails().catch(err => console.error(err));

        return () => {
            isMounted = false;
        };
    }, [id, userRole, userEmail]);

    if (loading) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="text-slate-600 font-semibold text-lg animate-pulse">Loading Startup Details...</div>
                </main>
            </div>
        );
    }

    // Access Denied UI for Unauthorized Users
    if (unauthorized) {
        return (
            <div className="flex bg-slate-50 min-h-screen">
                <Sidebar />
                <main className="flex-1 p-10 flex items-center justify-center">
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
                        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert size={28} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900">Access Restricted</h2>
                        <p className="text-slate-500 text-sm">
                            You do not have the required permissions to view this startup’s confidential tracking details.
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-2xl font-bold text-sm transition cursor-pointer"
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
            <main className="flex-1 p-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition shadow-sm cursor-pointer"
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <header className="mb-8">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold text-slate-900">{startup?.programName}</h1>
                        <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-bold uppercase">
                            {userRole} View
                        </span>
                    </div>
                    <p className="text-slate-500 mt-1">{startup?.description}</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Execution Progress</h2>

                        <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl font-bold mb-6">
                            <CheckCircle2 size={20} /> Current Phase: {startup?.progress?.currentPhase}
                        </div>

                        <div className="mb-2 flex justify-between text-sm font-bold text-slate-700">
                            <span>Completion Rate</span>
                            <span>{startup?.progress?.percentage}% Completed</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                            <div
                                className="bg-orange-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${startup?.progress?.percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Timeline Log</h2>
                        <div className="space-y-6">
                            {startup?.timeline?.length > 0 ? (
                                startup.timeline.map((event, idx) => (
                                    <div key={event.id || idx} className="relative border-l-2 border-orange-500 pl-4 pb-2">
                                        <h4 className="font-bold text-slate-800 text-sm">{event.eventName}</h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "No Date"}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm italic">No timeline events found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default StartupDetails;