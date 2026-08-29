import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'remindme.theme.v1';

export const lightColors = {
    background: '#FFFDF6',
    card: '#FFFFFF',
    primary: '#FFC400',
    primarySoft: '#FFF4D1',
    primaryDark: '#E0A700',
    onPrimary: '#FFFFFF',
    danger: '#F04452',
    dangerSoft: '#FEECEE',
    text: '#171A23',
    textMuted: '#8A8170',
    border: '#EFE8D6',
    disabled: '#D8D0BE',
    success: '#2BB673',
};

export const darkColors = {
    background: '#141519',
    card: '#1E2026',
    primary: '#FFC400',
    primarySoft: '#3B3316',
    primaryDark: '#E0A700',
    onPrimary: '#FFFFFF',
    danger: '#FF6B73',
    dangerSoft: '#3A1F24',
    text: '#F2F3F5',
    textMuted: '#9BA1AC',
    border: '#2C2F37',
    disabled: '#454A54',
    success: '#35C985',
};

const ThemeContext = createContext({
    isDark: false,
    colors: lightColors,
    setDark: () => { },
    toggleDark: () => { },
});

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY);
                if (stored !== null) setIsDark(stored === 'true');
            } catch (e) {
                // ignore storage read errors
            }
        })();
    }, []);

    const setDark = useCallback((value) => {
        const next = Boolean(value);
        setIsDark(next);
        AsyncStorage.setItem(STORAGE_KEY, String(next)).catch(() => { });
    }, []);

    const toggleDark = useCallback(() => {
        setIsDark((prev) => {
            AsyncStorage.setItem(STORAGE_KEY, String(!prev)).catch(() => { });
            return !prev;
        });
    }, []);

    const value = useMemo(
        () => ({
            isDark,
            colors: isDark ? darkColors : lightColors,
            setDark,
            toggleDark,
        }),
        [isDark, setDark, toggleDark]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    return useContext(ThemeContext);
}

