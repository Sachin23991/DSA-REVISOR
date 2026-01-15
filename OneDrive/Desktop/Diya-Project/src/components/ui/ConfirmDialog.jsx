import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable confirmation dialog component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the dialog is visible
 * @param {Function} props.onClose - Called when dialog is closed without confirming
 * @param {Function} props.onConfirm - Called when user confirms the action
 * @param {string} props.title - Dialog title
 * @param {string} props.message - Dialog message/description
 * @param {string} props.confirmText - Text for the confirm button (default: "Confirm")
 * @param {string} props.cancelText - Text for the cancel button (default: "Cancel")
 * @param {boolean} props.isDangerous - If true, uses red styling for confirm button
 */
export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false
}) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6 border border-black/10 dark:border-white/10"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1 text-[#71717A] hover:text-black dark:hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded flex items-center justify-center flex-shrink-0 border ${isDangerous
                                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                : 'border-black dark:border-white bg-black/5 dark:bg-white/5'
                                }`}>
                                <AlertTriangle className={`w-6 h-6 ${isDangerous ? 'text-red-500' : ''}`} />
                            </div>

                            <div className="flex-1">
                                <h3 className="text-lg font-bold mb-2">
                                    {title}
                                </h3>
                                <p className="text-[#71717A] text-sm font-light">
                                    {message}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6 justify-end">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="btn-outline px-5 py-2.5 rounded font-medium"
                            >
                                {cancelText}
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirm}
                                className={`px-5 py-2.5 rounded font-medium transition-colors ${isDangerous
                                    ? 'bg-red-500 hover:bg-red-600 text-white'
                                    : 'btn-primary'
                                    }`}
                            >
                                {confirmText}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

/**
 * Hook for managing confirmation dialog state
 * @returns {Object} { isOpen, confirm, close, dialogProps }
 */
export function useConfirmDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({});
    const [resolveRef, setResolveRef] = useState(null);

    const confirm = (options = {}) => {
        return new Promise((resolve) => {
            setConfig(options);
            setIsOpen(true);
            setResolveRef(() => resolve);
        });
    };

    const close = () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(false);
    };

    const handleConfirm = () => {
        setIsOpen(false);
        if (resolveRef) resolveRef(true);
    };

    return {
        isOpen,
        confirm,
        close,
        dialogProps: {
            isOpen,
            onClose: close,
            onConfirm: handleConfirm,
            ...config
        }
    };
}

export default ConfirmDialog;
