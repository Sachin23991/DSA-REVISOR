import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const ALLOWED_UID = "EC4mgfegv4NtQiutuIau7i6TIba2";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user.uid !== ALLOWED_UID) {
        await auth.signOut();
        setError("Access Denied: Admin privileges required.");
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (err.code === 'auth/wrong-password') {
        setError("Incorrect password.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex transition-colors duration-300">
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-royal-900 to-emerald-900 items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract Shapes */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gold-500 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-500 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl text-center relative z-10 text-white">
          <img 
            src="/login_girl.png?v=2" 
            alt="Secure Login" 
            className="w-full max-w-md mx-auto mb-8 drop-shadow-2xl animate-float"
          />
          <h2 className="text-4xl font-serif font-bold mb-4 text-gold-400">
            Secure Admin Portal
          </h2>
          <p className="text-royal-200 text-lg leading-relaxed">
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-dark-surface">
        <div className="w-full max-w-md space-y-8">
          {/* Back Link */}
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-slate-500 hover:text-royal-600 dark:text-slate-400 dark:hover:text-royal-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-royal-100 text-royal-600 mb-4 dark:bg-royal-900/30 dark:text-royal-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Welcome Back</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Please enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-royal-500 transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent transition-all dark:bg-dark-bg dark:border-dark-border dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-royal-500 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-transparent transition-all dark:bg-dark-bg dark:border-dark-border dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-royal-600 to-royal-500 hover:from-royal-700 hover:to-royal-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-royal-500/30 hover:shadow-xl hover:shadow-royal-500/40 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Protected by 256-bit encryption. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
