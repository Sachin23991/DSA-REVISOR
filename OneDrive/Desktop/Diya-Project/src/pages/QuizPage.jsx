import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Trophy, Loader2, CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { saveQuizResult } from '../lib/db';

export default function QuizPage() {
    const { user } = useAuth();
    const [step, setStep] = useState('setup'); // setup, loading, quiz, result
    const [topic, setTopic] = useState('');
    const [questionCount, setQuestionCount] = useState(5);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [score, setScore] = useState(0);
    const [error, setError] = useState('');

    const generateQuiz = async () => {
        if (!topic.trim()) return;
        setStep('loading');
        setError('');

        try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "AdminOS Quiz",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "model": "google/gemini-2.0-flash-001",
                    "messages": [
                        {
                            "role": "user",
                            "content": `Generate a UPSC quiz with ${questionCount} multiple-choice questions on the topic "${topic}". 
                            Return the response strictly in this JSON format:
                            {
                                "title": "Quiz Title",
                                "questions": [
                                    {
                                        "id": 1,
                                        "question": "Question text here?",
                                        "options": ["Option A", "Option B", "Option C", "Option D"],
                                        "correctAnswer": "Option A",
                                        "explanation": "Brief explanation of why A is correct."
                                    }
                                ]
                            }
                            Do not include any markdown formatting like \`\`\`json. Just the raw JSON.`
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const rawContent = data.choices[0].message.content;

            // Clean up potentially dirty JSON (sometimes models add backticks)
            const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const quizData = JSON.parse(cleanContent);

            setQuestions(quizData.questions);
            setStep('quiz');
        } catch (err) {
            console.error(err);
            setError('Failed to generate quiz. Please try again or check your API key.');
            setStep('setup');
        }
    };

    const handleAnswer = (option) => {
        setSelectedAnswer(option);
        if (option === questions[currentQuestionIndex].correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const nextQuestion = () => {
        setSelectedAnswer(null);
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setStep('result');
        if (user) {
            await saveQuizResult(user.uid, {
                topic,
                score,
                totalQuestions: questions.length,
                date: new Date().toISOString()
            });
        }
    };

    const restartQuiz = () => {
        setStep('setup');
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setScore(0);
        setError('');
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Quiz Generator</h1>
                    <p className="text-slate-500">Test your knowledge on any UPSC topic</p>
                </div>
            </div>

            <div className="card p-8 dark:bg-dark-surface dark:border-dark-border min-h-[400px] relative">
                <AnimatePresence mode="wait">
                    {/* STEP 1: SETUP */}
                    {step === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    What topic do you want to practice?
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Indus Valley Civilization, Article 21, Monetary Policy..."
                                    className="w-full text-xl p-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-200 dark:border-dark-border rounded-xl focus:border-purple-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                                    onKeyDown={(e) => e.key === 'Enter' && generateQuiz()}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                    Number of Questions
                                </label>
                                <div className="flex gap-4">
                                    {[5, 10, 15].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setQuestionCount(num)}
                                            className={`flex-1 py-4 rounded-xl text-lg font-bold border-2 transition-all ${questionCount === num
                                                ? 'border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                                : 'border-slate-200 dark:border-dark-border text-slate-500 hover:border-purple-300'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={generateQuiz}
                                disabled={!topic.trim()}
                                className="w-full btn-primary py-4 rounded-xl text-lg font-bold shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:shadow-none"
                            >
                                Start Quiz
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 2: LOADING */}
                    {step === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-center"
                        >
                            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Generating Quiz...</h3>
                            <p className="text-slate-500 mt-2">Crafting questions on "{topic}"</p>
                        </motion.div>
                    )}

                    {/* STEP 3: QUIZ */}
                    {step === 'quiz' && questions.length > 0 && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full flex flex-col"
                        >
                            <div className="flex justify-between items-center mb-6 text-sm font-medium text-slate-500">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className="text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded-full">
                                    Score: {score}
                                </span>
                            </div>

                            {/* Question */}
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-8 leading-relaxed">
                                {questions[currentQuestionIndex].question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3 mb-8">
                                {questions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
                                    const showResult = selectedAnswer !== null;

                                    let btnClass = "border-slate-200 dark:border-dark-border hover:border-purple-300";
                                    if (showResult) {
                                        if (isCorrect) btnClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700";
                                        else if (isSelected) btnClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700";
                                        else btnClass = "opacity-50";
                                    } else if (isSelected) {
                                        btnClass = "border-purple-500 bg-purple-50 text-purple-700";
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => !showResult && handleAnswer(option)}
                                            disabled={showResult}
                                            className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                                        >
                                            <span>{option}</span>
                                            {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                                            {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Explanation & Next */}
                            <div className="mt-auto">
                                {selectedAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-slate-50 dark:bg-dark-bg rounded-xl text-slate-600 dark:text-slate-300 text-sm"
                                    >
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        {questions[currentQuestionIndex].explanation}
                                    </motion.div>
                                )}

                                <button
                                    onClick={nextQuestion}
                                    disabled={!selectedAnswer}
                                    className="w-full btn-primary py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 4: RESULT */}
                    {step === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-10"
                        >
                            <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trophy className="w-12 h-12 text-yellow-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Quiz Completed!</h2>
                            <p className="text-slate-500 mb-8">You scored</p>

                            <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-8">
                                {score} / {questions.length}
                            </div>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={restartQuiz}
                                    className="px-6 py-3 rounded-xl border-2 border-slate-200 dark:border-dark-border font-bold text-slate-600 hover:border-purple-500 hover:text-purple-600 transition-colors flex items-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Another Topic
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
