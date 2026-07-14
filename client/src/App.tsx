import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import AuthLayout from "./layouts/AuthLayout";
import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import ForumPage from "./pages/ForumPage";
import PortalPage from "./pages/PortalPage";
import AppealsPage from "./pages/AppealsPage";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function App() {
    return (
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
                        <Route path="/logs" element={<LogsPage />} />
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </UserProvider>
    );
}

export default App;
