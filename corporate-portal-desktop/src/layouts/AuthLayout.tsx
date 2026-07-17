import { Outlet } from "react-router-dom";

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-[#212121] text-white">
            <Outlet />
        </div>
    );
}
