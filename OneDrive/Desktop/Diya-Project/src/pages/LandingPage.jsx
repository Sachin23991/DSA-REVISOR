import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BarChart2, BookOpen, Clock, Shield, Sparkles } from 'lucide-react';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-royal-50 dark:bg-dark-bg transition-colors duration-300">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md border-b border-royal-100 dark:border-dark-border">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-royal-700 to-gold-500 rounded-xl flex items-center justify-center shadow-lg shadow-royal-500/20">
                            <span className="text-xl font-bold text-white font-serif">A</span>
                        </div>
                        <span className="text-xl font-bold text-royal-900 dark:text-royal-100 font-serif tracking-tight">
                            Admin<span className="text-gold-500">OS</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="btn-primary px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"
                            >
                                Dashboard <ArrowRight className="w-4 h-4" />
                            </Link>
                        ) : (
                            <Link
                                to="/login"
                                className="btn-gold px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                            >
                                Admin Login
                            </Link>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-royal-100 border border-royal-200 dark:bg-royal-900/30 dark:border-royal-800 text-royal-800 dark:text-royal-300 font-medium text-sm">
                            <Sparkles className="w-4 h-4 text-gold-500" />
                            <span>AI-Powered UPSC Preparation</span>
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-bold text-royal-950 dark:text-royal-50 leading-tight font-serif">
                            Master Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal-700 via-gold-500 to-royal-600 animate-pulse-slow">
                                UPSC Journey
                            </span>
                        </h1>

                        <p className="text-lg text-royal-800/80 dark:text-royal-200/80 leading-relaxed max-w-xl">
                            A comprehensive dashboard to track your preparation, analyze study patterns, and leverage AI-powered insights for exam success.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to={user ? "/dashboard" : "/login"}
                                className="btn-primary px-8 py-4 rounded-xl font-bold text-lg text-center flex items-center justify-center gap-2"
                            >
                                {user ? 'Access Dashboard' : 'Start Preparation'} <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="#features"
                                className="px-8 py-4 rounded-xl border border-royal-200 dark:border-royal-800 hover:bg-white dark:hover:bg-dark-surface text-royal-800 dark:text-royal-200 font-bold text-lg text-center transition-all hover:shadow-md hover:border-gold-400"
                            >
                                Learn More
                            </a>
                        </div>

                        <div className="flex items-center gap-8 pt-8 border-t border-royal-200 dark:border-royal-900/50">
                            <div>
                                <p className="text-3xl font-bold text-royal-700 dark:text-royal-400">850+</p>
                                <p className="text-sm text-royal-600/70 dark:text-royal-400/60">Topics</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-gold-500">100%</p>
                                <p className="text-sm text-royal-600/70 dark:text-royal-400/60">Syllabus</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-yellow-500">AI</p>
                                <p className="text-sm text-royal-600/70 dark:text-royal-400/60">Powered</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative lg:h-[600px] flex items-center justify-center">
                        {/* Background Blob */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-royal-400/30 via-gold-300/20 to-yellow-300/30 dark:from-royal-600/20 dark:via-gold-500/10 dark:to-yellow-500/10 rounded-full blur-[80px] opacity-100" />

                        <img
                            src="/hero_girl.png?v=2"
                            alt="Study Illustration"
                            className="relative z-10 w-full max-w-lg drop-shadow-2xl animate-float"
                        />

                        {/* Floating Cards - Royal Style */}
                        <div className="absolute top-20 right-0 bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-xl shadow-royal-900/10 animate-bounce-slow border border-royal-100 dark:border-royal-800/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-royal-100 dark:bg-royal-900/40 rounded-full flex items-center justify-center text-royal-600 dark:text-royal-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-royal-500/60 dark:text-royal-400/60">Focus Time</p>
                                    <p className="font-bold text-royal-900 dark:text-white">4h 30m</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-20 left-0 bg-white dark:bg-dark-surface p-4 rounded-2xl shadow-xl shadow-gold-500/10 animate-bounce-slow delay-700 border border-gold-100 dark:border-gold-900/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-100 dark:bg-gold-900/20 rounded-full flex items-center justify-center text-gold-600 dark:text-gold-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-gold-600/60 dark:text-gold-400/60">Streak</p>
                                    <p className="font-bold text-royal-900 dark:text-white">12 Days 🔥</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-20 bg-white dark:bg-dark-surface border-t border-royal-100 dark:border-royal-900/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-royal-900 dark:text-white mb-4">Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal-600 to-gold-500">Succeed</span></h2>
                        <p className="text-royal-600/70 dark:text-royal-300/70">Streamline your preparation with tools designed specifically for UPSC aspirants.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={BookOpen}
                            title="Smart Syllabus"
                            desc="Track every topic with a hierarchical syllabus manager. Never miss a sub-topic again."
                            color="royal"
                        />
                        <FeatureCard
                            icon={Clock}
                            title="Focus Tracker"
                            desc="Built-in Pomodoro timer and stopwatch to log deep work sessions with detailed notes."
                            color="gold"
                        />
                        <FeatureCard
                            icon={BarChart2}
                            title="Deep Analytics"
                            desc="Visualize your progress with charts, trends, and downloadable PDF reports."
                            color="yellow"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, color }) {
    const colors = {
        royal: 'bg-royal-100 text-royal-700 dark:bg-royal-900/30 dark:text-royal-400',
        gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/20 dark:text-gold-400',
        yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
    };

    return (
        <div className="p-8 rounded-3xl bg-royal-50/50 dark:bg-dark-bg border border-royal-100 dark:border-royal-900/30 hover:border-gold-400 dark:hover:border-gold-500/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-gold-500/5">
            <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center mb-6`}>
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-royal-900 dark:text-white mb-3">{title}</h3>
            <p className="text-royal-600/80 dark:text-royal-300/60 leading-relaxed">{desc}</p>
        </div>
    );
}
