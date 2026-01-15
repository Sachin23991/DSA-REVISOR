import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-white dark:bg-dark-bg flex transition-colors duration-300">
      {/* Left Panel - Portfolio Style with Illustration */}
      <div className="hidden lg:flex flex-1 bg-black items-center justify-center p-12 relative overflow-hidden">
        {/* Abstract Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <motion.div
          className="max-w-xl text-center relative z-10 text-white"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.img
            src="/loginpage.svg"
            alt="Secure Login"
            className="w-full max-w-md mx-auto mb-8 drop-shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
          <h2 className="text-4xl font-medium mb-4">
            Secure Admin <span className="text-stroke">Portal</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed font-light">
            "Success is the sum of small efforts, repeated day in and day out."
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Form - Portfolio Style */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-dark-surface">
        <motion.div
          className="w-full max-w-md space-y-8"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Back Link */}
          <motion.div whileHover={{ x: -5 }}>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#71717A] hover:text-black dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </motion.div>

          <div className="text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded border border-black dark:border-dark-border mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-medium">Welcome <span className="font-bold">Back</span></h1>
            <p className="text-[#71717A] mt-2 text-sm font-light">
              Please enter your credentials to access the dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-normal mb-2">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A] group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-normal mb-2">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A] group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                className="p-4 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded flex items-center gap-3 text-sm animate-fade-in"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-black dark:bg-white shrink-0" />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 rounded font-medium text-lg flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </motion.button>
          </form>

          <div className="text-center">
            <p className="text-xs text-[#71717A] font-light">
              Protected by 256-bit encryption. Authorized personnel only.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
