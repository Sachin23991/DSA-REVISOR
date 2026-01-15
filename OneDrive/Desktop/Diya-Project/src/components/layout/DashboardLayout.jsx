import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { subscribeToUserStats } from '../../lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    BarChart3,
    BookMarked,
    Timer,
    LogOut,
    Menu,
    X,
    Sun,
    Moon,
    FileText,
    User,
    Brain,
    ClipboardList
} from 'lucide-react';

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: BookOpen, label: 'Syllabus', path: '/dashboard/syllabus' },
    { icon: Calendar, label: 'Planner', path: '/dashboard/planner' },
    { icon: Timer, label: 'Tracker', path: '/dashboard/tracker' },
    { icon: FileText, label: 'Notepad', path: '/dashboard/notepad' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: BookMarked, label: 'AI Tutor', path: '/dashboard/notes' },
    { icon: Brain, label: 'Quiz', path: '/dashboard/quiz' },
    { icon: ClipboardList, label: 'PYQ', path: '/dashboard/pyq' },
];

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('theme') === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        }

        if (user) {
            const unsub = subscribeToUserStats(user.uid, (data) => setStats(data));
            return () => unsub();
        }
    }, [user]);

    const toggleTheme = () => {
        setDarkMode(!darkMode);
        if (!darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
            {/* Sidebar - Portfolio Style */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#FAFAFA] dark:bg-dark-surface border-r border-black/5 dark:border-dark-border transition-all duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo - Portfolio Style */}
                <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-dark-border">
                    <NavLink to="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-black dark:bg-white rounded flex items-center justify-center">
                            <span className="text-xl font-bold text-white dark:text-black">U</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">
                            UPSC<span className="text-[#71717A]">OS</span>
                        </span>
                    </NavLink>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#71717A]">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation - Portfolio Style */}
                <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded transition-all duration-200 border ${isActive
                                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-medium'
                                    : 'text-[#71717A] border-transparent hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                                }`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions - Portfolio Style */}
                <div className="p-4 border-t border-black/5 dark:border-dark-border bg-[#FAFAFA] dark:bg-dark-surface">
                    <div className="flex gap-2 mb-2">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={toggleTheme}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-sm"
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {darkMode ? 'Light' : 'Dark'}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="px-3 py-2 rounded border border-black/10 dark:border-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </motion.button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar (Mobile) - Portfolio Style */}
                <header className="lg:hidden bg-white dark:bg-dark-surface border-b border-black/5 dark:border-dark-border px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-black dark:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold tracking-tight">UPSC<span className="text-[#71717A]">OS</span></span>
                    <div className="w-8 h-8 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-white dark:bg-dark-bg transition-colors duration-300 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
