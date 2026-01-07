import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';

// Lazy loaded components for bundle optimization
const Login = lazy(() => import('./pages/Login'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SyllabusManager = lazy(() => import('./pages/SyllabusManager'));
const Planner = lazy(() => import('./pages/Planner'));
const Tracker = lazy(() => import('./pages/Tracker'));
const Analytics = lazy(() => import('./pages/Analytics'));
const NotesAI = lazy(() => import('./pages/NotesAI'));
const Notepad = lazy(() => import('./pages/Notepad'));
const QuizPage = lazy(() => import('./pages/QuizPage'));

// Loading spinner component
function LoadingSpinner() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-royal-200 border-t-royal-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-royal-500 font-medium">Loading...</p>
            </div>
        </div>
    );
}

// Page loading wrapper
function PageLoader({ children }) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-500 rounded-full animate-spin"></div>
            </div>
        }>
            {children}
        </Suspense>
    );
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) return <LoadingSpinner />;

    if (!user) return <Navigate to="/login" />;

    return children;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<Login />} />

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }>
                            <Route index element={<PageLoader><Dashboard /></PageLoader>} />
                            <Route path="syllabus" element={<PageLoader><SyllabusManager /></PageLoader>} />
                            <Route path="planner" element={<PageLoader><Planner /></PageLoader>} />
                            <Route path="tracker" element={<PageLoader><Tracker /></PageLoader>} />
                            <Route path="analytics" element={<PageLoader><Analytics /></PageLoader>} />
                            <Route path="notepad" element={<PageLoader><Notepad /></PageLoader>} />
                            <Route path="notes" element={<PageLoader><NotesAI /></PageLoader>} />
                            <Route path="quiz" element={<PageLoader><QuizPage /></PageLoader>} />
                        </Route>

                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </Suspense>
            </Router>
        </AuthProvider>
    );
}

export default App;
