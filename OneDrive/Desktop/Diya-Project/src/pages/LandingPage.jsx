import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BarChart2, BookOpen, Clock, Shield, Sparkles, Flame, Target, Brain, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import ThreeBackground from '../components/3d/ThreeBackground';

const anim = { initial: { opacity: 0 }, whileInView: { opacity: 1 }, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }, viewport: { once: true, margin: "-50px" } };

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-black dark:text-white transition-colors duration-300 relative">
            {/* Three.js Background */}
            <ThreeBackground />

            {/* Navigation - Portfolio Style */}
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-sm p-5 px-5 lg:px-28 transition-shadow duration-300 border-b border-black/5 dark:border-white/10"
            >
                <div className="container mx-auto flex justify-between items-center">
                    <motion.h1
                        whileHover={{ scale: 1.1 }}
                        className="text-2xl font-bold cursor-pointer tracking-wider text-black dark:text-white"
                    >
                        UPSC<span className="text-[#71717A]">OS</span>
                    </motion.h1>

                    <ul className="hidden lg:flex items-center gap-x-7 font-normal">
                        {['Features', 'About', 'Contact'].map((s) => (
                            <motion.li key={s} className="group text-black dark:text-white hover:text-[#71717A] transition-colors" whileHover={{ scale: 1.1 }}>
                                <a href={`#${s.toLowerCase()}`}>{s}</a>
                            </motion.li>
                        ))}
                    </ul>

                    {user ? (
                        <Link to="/dashboard" className="bg-black dark:bg-white text-white dark:text-black rounded px-6 py-2 font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity">
                            Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    ) : (
                        <Link to="/login" className="bg-black dark:bg-white text-white dark:text-black rounded px-6 py-2 font-medium text-sm hover:opacity-80 transition-opacity">
                            Get Started
                        </Link>
                    )}
                </div>
            </motion.nav>

            {/* Hero Section - Portfolio Style */}
            <section className="pt-32 pb-20 px-5 lg:px-28 overflow-hidden min-h-screen flex items-center" id="home">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center w-full">
                    <motion.div
                        className="space-y-8"
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        viewport={{ once: true }}
                    >
                        <h1 className="text-4xl lg:text-6xl font-medium leading-tight text-black dark:text-white">
                            Hello, <span className="font-bold bg-gradient-to-r from-black to-gray-500 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">UPSC</span>
                            <br />
                            Aspirant
                            <br />
                            Based In <span className="font-bold">India.</span>
                        </h1>

                        <p className="text-[#71717A] text-sm lg:text-base font-light max-w-xl">
                            A comprehensive dashboard to track your preparation, analyze study patterns, and leverage AI-powered insights for exam success.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to={user ? "/dashboard" : "/login"}
                                className="bg-black dark:bg-white text-white dark:text-black rounded px-8 py-4 font-medium text-center flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
                            >
                                {user ? 'Access Dashboard' : 'Start Preparation'} <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="#features"
                                className="border border-black dark:border-white text-black dark:text-white rounded px-8 py-4 font-medium text-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            >
                                Learn More
                            </a>
                        </div>

                        {/* Stats instead of social icons */}
                        <div className="flex items-center gap-6 pt-4">
                            {[
                                { value: '10K+', label: 'Study Hours Logged' },
                                { value: '500+', label: 'Active Users' },
                                { value: '95%', label: 'Success Rate' },
                            ].map((stat, i) => (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="text-center"
                                >
                                    <p className="text-2xl font-bold text-black dark:text-white">{stat.value}</p>
                                    <p className="text-xs text-[#71717A] font-light">{stat.label}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative lg:h-[600px] flex items-center justify-center"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                        viewport={{ once: true }}
                    >
                        <img
                            src="/welcome.svg"
                            alt="Study Illustration"
                            className="relative z-10 w-full max-w-lg drop-shadow-2xl"
                        />

                        {/* Floating Cards - Portfolio Style */}
                        <motion.div
                            className="absolute top-20 right-0 bg-white dark:bg-[#1a1a1a] p-4 rounded border border-black/10 dark:border-white/10 shadow-lg"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-black dark:text-white" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717A]">Focus Time</p>
                                    <p className="font-bold text-black dark:text-white">4h 30m</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="absolute bottom-20 left-0 bg-white dark:bg-[#1a1a1a] p-4 rounded border border-black/10 dark:border-white/10 shadow-lg"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center">
                                    <Flame className="w-5 h-5 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-[#71717A]">Streak</p>
                                    <p className="font-bold text-black dark:text-white">12 Days 🔥</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid - Portfolio Style */}
            <section id="features" className="py-20 bg-[#FAFAFA] dark:bg-[#111111] px-5 lg:px-28">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        className="text-center max-w-2xl mx-auto mb-16"
                        {...anim}
                        initial={{ opacity: 0, y: -15 }}
                    >
                        <span className="text-sm text-[#71717A] uppercase tracking-wider font-medium">Features</span>
                        <h2 className="text-3xl lg:text-4xl font-light mt-4 text-black dark:text-white">
                            Everything you need to <span className="font-bold">Succeed</span>
                        </h2>
                        <p className="text-[#71717A] text-sm mt-4 font-light">
                            Streamline your preparation with tools designed specifically for UPSC aspirants.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { icon: BookOpen, title: 'Smart Syllabus', desc: 'Track every topic with a hierarchical syllabus manager. Never miss a sub-topic again.' },
                            { icon: Clock, title: 'Focus Tracker', desc: 'Built-in Pomodoro timer and stopwatch to log deep work sessions with detailed notes.' },
                            { icon: BarChart2, title: 'Deep Analytics', desc: 'Visualize your progress with charts, trends, and downloadable PDF reports.' },
                            { icon: Brain, title: 'AI Quiz & Tutor', desc: 'Generate AI-powered quizzes and get instant explanations for any UPSC topic.' },
                            { icon: Calendar, title: 'Study Calendar', desc: 'Color-coded calendar showing your daily productivity with detailed breakdowns.' },
                            { icon: Target, title: 'PYQ Practice', desc: 'Access previous year questions with AI-generated papers for exam preparation.' },
                        ].map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                className="bg-white dark:bg-[#1a1a1a] p-8 rounded border border-black/5 dark:border-white/10 hover:border-black dark:hover:border-white transition-colors text-center"
                                initial={{ opacity: 0, y: 15 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1], delay: i * 0.1 }}
                                viewport={{ once: true, margin: "-30px" }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="w-16 h-16 mx-auto mb-4 bg-black dark:bg-white rounded flex items-center justify-center">
                                    <feature.icon className="w-8 h-8 text-white dark:text-black" />
                                </div>
                                <h3 className="text-xl font-medium mb-3 text-black dark:text-white">{feature.title}</h3>
                                <p className="text-[#71717A] text-sm font-light">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-5 lg:px-28 bg-white dark:bg-[#0a0a0a]">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl lg:text-5xl font-medium mb-6 text-black dark:text-white">
                            Ready to <span className="font-bold">Transform</span> Your Preparation?
                        </h2>
                        <p className="text-[#71717A] mb-8 font-light max-w-2xl mx-auto">
                            Join thousands of UPSC aspirants who are already using UPSC OS to achieve their dreams.
                        </p>
                        <Link
                            to={user ? "/dashboard" : "/login"}
                            className="inline-flex items-center gap-2 bg-black dark:bg-white text-white dark:text-black rounded px-8 py-4 font-medium hover:opacity-80 transition-opacity"
                        >
                            {user ? 'Go to Dashboard' : 'Start Free Today'} <ArrowRight className="w-5 h-5" />
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Footer - Portfolio Style */}
            <footer className="border-t border-black/5 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#111111] px-5 lg:px-28">
                <div className="py-10 lg:py-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 max-w-7xl mx-auto">
                    <div>
                        <h3 className="text-2xl font-medium text-black dark:text-white">UPSC <span className="text-[#71717A]">OS</span></h3>
                        <p className="mt-2 text-[#71717A] text-sm font-light">Your Complete Study Companion</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4 text-sm text-[#71717A]">
                            <a href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</a>
                            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Terms</a>
                        </div>
                        <p className="text-xs font-light text-[#71717A]">© {new Date().getFullYear()} UPSC OS. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
