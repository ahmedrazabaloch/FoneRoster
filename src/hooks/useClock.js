import { useState, useEffect } from 'react';

export const useClock = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const currentHour = time.getHours();

    return { time, currentHour };
};
