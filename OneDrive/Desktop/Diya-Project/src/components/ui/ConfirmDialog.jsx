import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-dark-surface rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scale-in">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${isDangerous
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        }`}>
                        <AlertTriangle className={`w-6 h-6 ${isDangerous ? 'text-red-500' : 'text-amber-500'
                            }`} />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                            {title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-dark-border dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${isDangerous
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-royal-500 hover:bg-royal-600 text-white'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
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
