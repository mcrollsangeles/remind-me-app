import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { loadReminders, saveReminders } from '../utils/storage';
import { scheduleReminder, cancelReminder } from '../utils/notifications';
import { uuid } from '../utils/helpers';

const RemindersContext = createContext(null);

export function RemindersProvider({ children }) {
    const [reminders, setReminders] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const ref = useRef(reminders);

    useEffect(() => {
        (async () => {
            const data = await loadReminders();
            ref.current = data;
            setReminders(data);
            setLoaded(true);
            for (const r of data) {
                if (r.enabled && r.repeatEveryMinutes && r.repeatEveryMinutes > 0) {
                    scheduleReminder(r);
                }
            }
        })();
    }, []);

    const persist = useCallback(async (next) => {
        ref.current = next;
        setReminders(next);
        await saveReminders(next);
    }, []);

    const addReminder = useCallback(
        async (data) => {
            const reminder = { ...data, id: uuid(), enabled: true, createdAt: Date.now() };
            await persist([reminder, ...ref.current]);
            scheduleReminder(reminder);
            return reminder;
        },
        [persist]
    );

    const updateReminder = useCallback(
        async (id, patch) => {
            const old = ref.current.find((r) => r.id === id);
            const next = ref.current.map((r) => (r.id === id ? { ...r, ...patch, id } : r));
            const target = next.find((r) => r.id === id);
            if (!target) return;
            await persist(next);
            if (old) await cancelReminder(old);
            await scheduleReminder(target);
        },
        [persist]
    );

    const deleteReminder = useCallback(
        async (id) => {
            const old = ref.current.find((r) => r.id === id);
            const next = ref.current.filter((r) => r.id !== id);
            await persist(next);
            if (old) await cancelReminder(old);
        },
        [persist]
    );

    const toggleReminder = useCallback(
        async (id) => {
            const old = ref.current.find((r) => r.id === id);
            const next = ref.current.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
            const target = next.find((r) => r.id === id);
            if (!target) return;
            await persist(next);
            if (target.enabled) await scheduleReminder(target);
            else if (old) await cancelReminder(old);
        },
        [persist]
    );

    return (
        <RemindersContext.Provider
            value={{
                reminders,
                loaded,
                addReminder,
                updateReminder,
                deleteReminder,
                toggleReminder,
            }}
        >
            {children}
        </RemindersContext.Provider>
    );
}

export function useReminders() {
    const ctx = useContext(RemindersContext);
    if (!ctx) throw new Error('useReminders must be used within a RemindersProvider');
    return ctx;
}
