'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function EnhancedToast({ message, type = 'success', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle2 className="text-success" size={24} />,
    error: <XCircle className="text-error" size={24} />,
    info: <Info className="text-info" size={24} />,
    warning: <AlertTriangle className="text-warning" size={24} />,
  };

  const bgColors = {
    success: 'bg-success/20 dark:bg-success/30 border-success/50 dark:border-success/30',
    error: 'bg-error/20 dark:bg-error/30 border-error/50 dark:border-error/30',
    info: 'bg-info/20 dark:bg-info/30 border-info/50 dark:border-info/30',
    warning: 'bg-warning/20 dark:bg-warning/30 border-warning/50 dark:border-warning/30',
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-xl border-2 shadow-2xl ${bgColors[type]} 
      ${isExiting ? 'animate-slideOut' : 'animate-slideIn'} max-w-md`}
    >
      {icons[type]}
      <p className="text-foreground font-medium flex-1">{message}</p>
      <button 
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose?.(), 300);
        }}
        className="text-muted-foreground hover:text-foreground transition"
      >
        <X size={18} />
      </button>
    </div>
  );
}

// Hook for using toast
export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration });
  };

  const ToastContainer = () => toast ? (
    <EnhancedToast
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      onClose={() => setToast(null)}
    />
  ) : null;

  return { showToast, ToastContainer };
}
