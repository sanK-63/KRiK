import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface UserData {
    id: number;
    uuid: string;
    username: string;
    displayName: string;
    surname: string | null;
    patronymic: string | null;
    dateOfBirth: string | null;
    phone: string | null;
    email: string;
    avatar: string | null;
    status: string;
    createdAt: string;
    lastLogin: string | null;
    roles: { roleId: number; name: string; color: string | null; priority: number }[];
    profile: {
        discord: string | null;
        steam: string | null;
        ea: string | null;
        battleNet: string | null;
        country: string | null;
        bio: string | null;
    } | null;
}

interface UserContextType {
    user: UserData | null;
    loading: boolean;
    setUser: (u: UserData | null) => void;
    logout: () => void;
}

const UserContext = createContext<UserContextType>({ user: null, loading: true, setUser: () => {}, logout: () => {} });

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            credentials: "include",
        })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data) => setUser(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const logout = () => {
        setUser(null);
    };

    return <UserContext.Provider value={{ user, loading, setUser, logout }}>{children}</UserContext.Provider>;
}

export function useUser() {
    return useContext(UserContext);
}
