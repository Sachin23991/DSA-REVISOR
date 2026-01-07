import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
    royal: {
        name: 'Royal Gold',
        primary: 'gold',
        bg: 'dark',
        icon: '👑'
    },
    'light-yellow': {
        name: 'Light Yellow',
        primary: 'amber',
        bg: 'light',
        icon: '☀️'
    },
    green: {
        name: 'Emerald',
        primary: 'emerald',
        bg: 'dark',
        icon: '🌲'
    },
    'royal-blue': {
        name: 'Royal Blue',
        primary: 'blue',
        bg: 'dark',
        icon: '💎'
    }
};

const ThemeContext = createContext({});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('upsc-os-theme') || 'royal';
        }
        return 'royal';
    });

    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('upsc-os-theme', theme);
    }, [theme]);

    const cycleTheme = () => {
        const themeKeys = Object.keys(THEMES);
        const currentIndex = themeKeys.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeKeys.length;
        setTheme(themeKeys[nextIndex]);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES, currentTheme: THEMES[theme] }}>
            {children}
        </ThemeContext.Provider>
    );
};
