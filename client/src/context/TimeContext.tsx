import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface TimeContextType {
    clockDelta: number;
    correctedNow: () => number;
}

const TimeContext = createContext<TimeContextType>({ clockDelta: 0, correctedNow: () => Date.now() });

export function TimeProvider({ children }: { children: ReactNode }) {
    const [clockDelta, setClockDelta] = useState(0);

    const syncTime = () => {
        const t0 = Date.now();
        fetch(`${import.meta.env.VITE_API_URL}/api/time`, { credentials: "include" })
            .then((r) => r.json())
            .then((data: { serverTime: number }) => {
                const t1 = Date.now();
                const roundTrip = t1 - t0;
                const delta = data.serverTime - t0 - roundTrip / 2;
                setClockDelta(delta);
            })
            .catch(() => {});
    };

    useEffect(() => {
        syncTime();
        const interval = setInterval(syncTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const correctedNow = () => Date.now() + clockDelta;

    return (
        <TimeContext.Provider value={{ clockDelta, correctedNow }}>
            {children}
        </TimeContext.Provider>
    );
}

export function useTime() {
    return useContext(TimeContext);
}
