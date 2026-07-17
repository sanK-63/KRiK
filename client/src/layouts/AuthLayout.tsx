import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen text-white" style={{ background: "var(--color-bg-primary)" }}>
            <Outlet />
        </div>
    );
}
