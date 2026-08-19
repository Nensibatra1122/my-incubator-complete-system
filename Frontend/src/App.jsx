import React from 'react';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './pages/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Startups from './pages/Startups';
import StartupDetails from './pages/StartupDetails';
import IdeaDetails from './pages/IdeaDetails';
import SubmitIdea from './pages/SubmitIdea';
import Analytics from './pages/Analytics';
import SystemLogs from './pages/SystemLogs';
import IdeaChat from './pages/IdeaChat';
import IdeaPipeline from './pages/IdeaPipeline';
import Notifications from './pages/Notifications';
import ProjectFinance from './pages/ProjectFinance';
import Profile from './pages/Profile';
import CommunityHub from './pages/CommunityHub.jsx';
import FeedbackPage from './pages/FeedbackPage';
import TagsPage from './pages/TagsPage';
import Mentors from './pages/Mentors';
import Investors from './pages/Investors';
import SessionManagement from './pages/SessionManagement';
import MentorChat from './pages/MentorChat';
import CollaborationHub from './pages/CollaborationHub';
import MentorBroadcastQnA from './pages/MentorBroadcastQnA';
import InvestorInterests from './pages/InvestorInterests'; // Import added

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Authentication Routes */}
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* System & Management Routes */}
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/logs" element={<SystemLogs />} />

                {/* Protected Dashboard & Operations Routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* User Profile Route */}
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                {/* Investor Interests Route */}
                <Route
                    path="/investor-interests"
                    element={
                        <ProtectedRoute>
                            <InvestorInterests />
                        </ProtectedRoute>
                    }
                />

                {/* Mentor Q&A & Broadcast Hub Route */}
                <Route
                    path="/mentor-broadcast-qna"
                    element={
                        <ProtectedRoute>
                            <MentorBroadcastQnA />
                        </ProtectedRoute>
                    }
                />

                {/* Community Hub Route (Unified Explore & Activity Feed) */}
                <Route
                    path="/community-ideas"
                    element={
                        <ProtectedRoute>
                            <CommunityHub />
                        </ProtectedRoute>
                    }
                />

                {/* Project Collaboration Hub Route */}
                <Route
                    path="/collaboration-hub/:projectId"
                    element={
                        <ProtectedRoute>
                            <CollaborationHub />
                        </ProtectedRoute>
                    }
                />

                {/* Mentors Directory Route */}
                <Route
                    path="/mentors"
                    element={
                        <ProtectedRoute>
                            <Mentors />
                        </ProtectedRoute>
                    }
                />

                {/* Mentor Collaboration Chat Routes */}
                <Route
                    path="/mentor-chat"
                    element={
                        <ProtectedRoute>
                            <MentorChat />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat"
                    element={
                        <ProtectedRoute>
                            <MentorChat />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/chat/rooms/:id"
                    element={
                        <ProtectedRoute>
                            <MentorChat />
                        </ProtectedRoute>
                    }
                />

                {/* Session Management & Booking Route */}
                <Route
                    path="/sessions"
                    element={
                        <ProtectedRoute>
                            <SessionManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Investors Directory Route */}
                <Route
                    path="/investors"
                    element={
                        <ProtectedRoute>
                            <Investors />
                        </ProtectedRoute>
                    }
                />

                {/* Success Stories & Feedback Route */}
                <Route
                    path="/feedback"
                    element={
                        <ProtectedRoute>
                            <FeedbackPage />
                        </ProtectedRoute>
                    }
                />

                {/* Tags Management Route */}
                <Route
                    path="/tags"
                    element={
                        <ProtectedRoute>
                            <TagsPage />
                        </ProtectedRoute>
                    }
                />

                {/* Redirect old /likes route directly to unified /community-ideas hub */}
                <Route
                    path="/likes"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/community-ideas" replace />
                        </ProtectedRoute>
                    }
                />

                {/* Notifications Route */}
                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute>
                            <Notifications />
                        </ProtectedRoute>
                    }
                />

                {/* Project Finance Routes */}
                <Route
                    path="/finance"
                    element={
                        <ProtectedRoute>
                            <ProjectFinance />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/project-finance"
                    element={
                        <ProtectedRoute>
                            <ProjectFinance />
                        </ProtectedRoute>
                    }
                />

                {/* Idea Pipeline Routes */}
                <Route
                    path="/ideas"
                    element={
                        <ProtectedRoute>
                            <IdeaPipeline />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/idea-pipeline"
                    element={
                        <ProtectedRoute>
                            <IdeaPipeline />
                        </ProtectedRoute>
                    }
                />

                {/* Submit New Idea Route */}
                <Route
                    path="/submit-idea"
                    element={
                        <ProtectedRoute>
                            <SubmitIdea />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/startups"
                    element={
                        <ProtectedRoute>
                            <Startups />
                        </ProtectedRoute>
                    }
                />

                {/* Redirect /my-invested-startups directly to /startups */}
                <Route
                    path="/my-invested-startups"
                    element={
                        <ProtectedRoute>
                            <Navigate to="/startups" replace />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/startup-details/:id"
                    element={
                        <ProtectedRoute>
                            <StartupDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Dedicated Idea Review Page Route */}
                <Route
                    path="/idea-details/:id"
                    element={
                        <ProtectedRoute>
                            <IdeaDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Mentor Discussion Chat Route */}
                <Route
                    path="/idea-chat/:id"
                    element={
                        <ProtectedRoute>
                            <IdeaChat />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;