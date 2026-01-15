import { useState, useEffect } from 'react';
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Toast context for global access
let toastQueue = [];
let listeners = [];

const addToast = (toast) => {
    const id = Date.now() + Math.random();
    toastQueue = [...toastQueue, { ...toast, id }];
    listeners.forEach(listener => listener(toastQueue));

    // Auto remove after duration
    setTimeout(() => {
        removeToast(id);
    }, toast.duration || 4000);

    return id;
};

const removeToast = (id) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    listeners.forEach(listener => listener(toastQueue));
};

// Public API
export const toast = {
    success: (message, duration = 4000) => addToast({ type: 'success', message, duration }),
    error: (message, duration = 5000) => addToast({ type: 'error', message, duration }),
    warning: (message, duration = 4000) => addToast({ type: 'warning', message, duration }),
    info: (message, duration = 4000) => addToast({ type: 'info', message, duration }),
};

// Toast item component
function ToastItem({ toast: { id, type, message }, onRemove }) {
    const icons = {
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    const colors = {
        success: 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white',
        error: 'bg-red-500 text-white border-red-500',
        warning: 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white',
        info: 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`flex items-center gap-3 px-4 py-3 rounded shadow-lg border ${colors[type]}`}
        >
            {icons[type]}
            <span className="font-medium">{message}</span>
            <button
                onClick={() => onRemove(id)}
                className="ml-2 p-1 hover:bg-white/20 dark:hover:bg-black/20 rounded transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

// Toast container component - render this once in your app
export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const listener = (newToasts) => setToasts([...newToasts]);
        listeners.push(listener);
        return () => {
            listeners = listeners.filter(l => l !== listener);
        };
    }, []);

    return (
        <AnimatePresence>
            {toasts.length > 0 && (
                <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
                    {toasts.map(t => (
                        <ToastItem key={t.id} toast={t} onRemove={removeToast} />
                    ))}
                </div>
            )}
        </AnimatePresence>
    );
}

export default toast;
