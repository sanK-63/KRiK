import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ForumPage from "./pages/ForumPage";
import PortalPage from "./pages/PortalPage";

import ConstitutionPage from "./pages/ConstitutionPage";
import ViolationsPage from "./pages/ViolationsPage";
import UsersPage from "./pages/UsersPage";
import LogsPage from "./pages/LogsPage";
import SearchPage from "./pages/SearchPage";
import ThreadPage from "./pages/ThreadPage";
import TournamentPage from "./pages/TournamentPage";
import ArchivePage from "./pages/ArchivePage";
import MemesPage from "./pages/MemesPage";
import TavernPage from "./pages/TavernPage";
import WorkersPage from "./pages/WorkersPage";
import UserPublicProfilePage from "./pages/UserPublicProfilePage";
import ProfilePage from "./pages/ProfilePage";
import SoftwarePage from "./pages/SoftwarePage";
import CinemaPage from "./pages/CinemaPage";
import EventsPage from "./pages/EventsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import FeedPage from "./pages/FeedPage";
import LibraryPage from "./pages/LibraryPage";
import AdminPage from "./pages/AdminPage";
import MessagesPage from "./pages/MessagesPage";
import ResearchPage from "./pages/ResearchPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function App() {
    return (
        <SocketProvider>
        <UserProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AuthLayout />}>
                        <Route path="/login" element={<LoginPage />} />
                    </Route>

                    <Route
                        element={
                            <ProtectedRoute>
                                <MainLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/forum" element={<ForumPage />} />
                        <Route path="/forum/:id" element={<ThreadPage />} />
                        <Route path="/portal" element={<PortalPage />} />
                        <Route path="/constitution" element={<ConstitutionPage />} />
                        <Route path="/violations" element={<ViolationsPage />} />
                        <Route path="/users" element={<UsersPage />} />
                        <Route path="/tournament" element={<TournamentPage />} />
                        <Route path="/archive" element={<ArchivePage />} />
                        <Route path="/memes" element={<MemesPage />} />
                        <Route path="/tavern" element={<TavernPage />} />
                        <Route path="/workers" element={<WorkersPage />} />
                        <Route path="/user/:id" element={<UserPublicProfilePage />} />
                        <Route path="/software" element={<SoftwarePage />} />
                        <Route path="/cinema" element={<CinemaPage />} />
                        <Route path="/events" element={<EventsPage />} />
                        <Route path="/leaderboard" element={<LeaderboardPage />} />
                        <Route path="/feed" element={<FeedPage />} />
                        <Route path="/library" element={<LibraryPage />} />
                        <Route path="/logs" element={<LogsPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/messages" element={<MessagesPage />} />
                        <Route path="/messages/:id" element={<MessagesPage />} />
                        <Route path="/research" element={<ResearchPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </UserProvider>
        </SocketProvider>
    );
}

export default App;
