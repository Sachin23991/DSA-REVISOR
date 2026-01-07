import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { subscribeToUserStats } from '../../lib/db';
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
    Bell,
    Sun,
    Moon,
    FileText,
    User
} from 'lucide-react';
// ProfileWidget removed

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard' },
    { icon: BookOpen, label: 'Syllabus', path: '/dashboard/syllabus' },
    { icon: Calendar, label: 'Planner', path: '/dashboard/planner' },
    { icon: Timer, label: 'Tracker', path: '/dashboard/tracker' },
    { icon: FileText, label: 'Notepad', path: '/dashboard/notepad' },
    { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: BookMarked, label: 'AI Tutor', path: '/dashboard/notes' },
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
        <div className="flex h-screen bg-slate-50 dark:bg-dark-bg transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-surface border-r border-slate-200 dark:border-dark-border transition-all duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-dark-border">
                    <NavLink to="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-royal-600 to-royal-500 rounded-xl flex items-center justify-center shadow-lg shadow-royal-500/20">
                            <span className="text-xl font-bold text-white font-serif">A</span>
                        </div>
                        <span className="text-xl font-bold text-slate-800 dark:text-white font-serif tracking-tight">
                            Admin<span className="text-gold-500">OS</span>
                        </span>
                    </NavLink>
                    <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Profile Stats Widget (Sidebar) - Removed */}

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto flex-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-royal-50 text-royal-700 dark:bg-royal-900/40 dark:text-royal-300 font-semibold shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-border hover:text-royal-600 dark:hover:text-white'
                                }`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className={`w-5 h-5 ${item.label === 'Notepad' ? 'text-emerald-500' : ''}`} />
                            <span className="font-medium">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-slate-100 dark:border-dark-border bg-white dark:bg-dark-surface">
                    <div className="flex gap-2 mb-2">
                        <button
                            onClick={toggleTheme}
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-dark-border transition-colors text-sm"
                        >
                            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            {darkMode ? 'Light' : 'Dark'}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-3 py-2 rounded-lg border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-900/20 dark:hover:bg-red-900/30 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar (Mobile) */}
                <header className="lg:hidden bg-white dark:bg-dark-surface border-b border-slate-200 dark:border-dark-border px-4 py-3 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-slate-600 dark:text-slate-300">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-bold text-slate-800 dark:text-white font-serif">AdminOS</span>
                    <div className="w-8 h-8 bg-royal-100 rounded-full flex items-center justify-center text-royal-700 font-bold text-xs">
                        <User className="w-5 h-5" />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-dark-bg transition-colors duration-300 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
