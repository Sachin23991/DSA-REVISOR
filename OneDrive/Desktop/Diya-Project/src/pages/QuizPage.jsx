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
                <div className="w-14 h-14 bg-black dark:bg-white rounded flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white dark:text-black" />
                </div>
                <div>
                    <h1 className="text-2xl font-medium">AI Quiz <span className="font-bold">Generator</span></h1>
                    <p className="text-[#71717A] font-light">Test your knowledge on any UPSC topic</p>
                </div>
            </div>

            <div className="card p-8 min-h-[400px] relative">
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
                                <label className="block text-sm font-medium uppercase tracking-wide text-[#71717A]">
                                    What topic do you want to practice?
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., Indus Valley Civilization, Article 21, Monetary Policy..."
                                    className="input-field text-xl"
                                    onKeyDown={(e) => e.key === 'Enter' && generateQuiz()}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium uppercase tracking-wide text-[#71717A]">
                                    Number of Questions
                                </label>
                                <div className="flex gap-4">
                                    {[5, 10, 15].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setQuestionCount(num)}
                                            className={`flex-1 py-4 rounded text-lg font-bold border-2 transition-all ${questionCount === num
                                                ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                                                : 'border-black/10 dark:border-white/10 text-[#71717A] hover:border-black dark:hover:border-white'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded flex items-center gap-2 text-sm border border-red-200 dark:border-red-800">
                                    <AlertCircle className="w-5 h-5" />
                                    {error}
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={generateQuiz}
                                disabled={!topic.trim()}
                                className="w-full btn-primary py-4 rounded text-lg font-bold disabled:opacity-50"
                            >
                                Start Quiz
                            </motion.button>
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
                            <Loader2 className="w-12 h-12 text-black dark:text-white animate-spin mb-4" />
                            <h3 className="text-xl font-bold">Generating Quiz...</h3>
                            <p className="text-[#71717A] mt-2 font-light">Crafting questions on "{topic}"</p>
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
                            <div className="flex justify-between items-center mb-6 text-sm font-medium text-[#71717A]">
                                <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className="font-bold bg-black/5 dark:bg-white/10 px-3 py-1 rounded text-black dark:text-white">
                                    Score: {score}
                                </span>
                            </div>

                            {/* Question */}
                            <h2 className="text-xl font-bold mb-8 leading-relaxed">
                                {questions[currentQuestionIndex].question}
                            </h2>

                            {/* Options */}
                            <div className="space-y-3 mb-8">
                                {questions[currentQuestionIndex].options.map((option, idx) => {
                                    const isSelected = selectedAnswer === option;
                                    const isCorrect = option === questions[currentQuestionIndex].correctAnswer;
                                    const showResult = selectedAnswer !== null;

                                    let btnClass = "border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white";
                                    if (showResult) {
                                        if (isCorrect) btnClass = "border-black dark:border-white bg-black/5 dark:bg-white/10";
                                        else if (isSelected) btnClass = "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400";
                                        else btnClass = "opacity-50";
                                    } else if (isSelected) {
                                        btnClass = "border-black dark:border-white bg-black/5 dark:bg-white/10";
                                    }

                                    return (
                                        <motion.button
                                            key={idx}
                                            whileHover={!showResult ? { x: 4 } : {}}
                                            onClick={() => !showResult && handleAnswer(option)}
                                            disabled={showResult}
                                            className={`w-full text-left p-4 rounded border-2 font-medium transition-all flex items-center justify-between ${btnClass}`}
                                        >
                                            <span>{option}</span>
                                            {showResult && isCorrect && <CheckCircle className="w-5 h-5 text-black dark:text-white" />}
                                            {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* Explanation & Next */}
                            <div className="mt-auto">
                                {selectedAnswer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 bg-[#FAFAFA] dark:bg-dark-surface rounded text-sm border border-black/5 dark:border-white/5"
                                    >
                                        <span className="font-bold block mb-1">Explanation:</span>
                                        {questions[currentQuestionIndex].explanation}
                                    </motion.div>
                                )}

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={nextQuestion}
                                    disabled={!selectedAnswer}
                                    className="w-full btn-primary py-3 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                </motion.button>
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
                            <div className="w-24 h-24 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-black dark:border-white">
                                <Trophy className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                            <p className="text-[#71717A] mb-8 font-light">You scored</p>

                            <div className="text-6xl font-bold mb-8">
                                {score} / {questions.length}
                            </div>

                            <div className="flex justify-center gap-4">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={restartQuiz}
                                    className="btn-outline px-6 py-3 rounded font-bold flex items-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Try Another Topic
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
