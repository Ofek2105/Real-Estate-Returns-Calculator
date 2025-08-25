import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import './ToastProvider.css';

type Toast = { id: string; message: string };
type Ctx = {
    addToast: (msg: string) => void;
};

const ToastContext = createContext<Ctx | null>(null);

export const useToasts = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToasts must be used within <ToastProvider>');
    return ctx;
};

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = useCallback((message: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [...prev, { id, message }]);
        // auto-remove after 4s
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const value = useMemo(() => ({ addToast }), [addToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toast-container">
                {toasts.map(t => (
                    <div className="toast" key={t.id}>{t.message}</div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
