import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const token = localStorage.getItem("token");
    if (!token) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function App() {
    return (
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
                    <Route path="/portal" element={<PortalPage />} />
                    <Route path="/constitution" element={<ConstitutionPage />} />
                    <Route path="/violations" element={<ViolationsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
