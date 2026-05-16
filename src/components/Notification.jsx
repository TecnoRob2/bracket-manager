import { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Notification.css';

export default function Notification({ open, message, type = 'info', duration = 3000, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className={`notification notification--${type}`} role="status" aria-live="polite">
      <div className="notification__content">
        <span className="notification__message">{message}</span>
        <button
          type="button"
          className="notification__close"
          onClick={onClose}
          aria-label="Cerrar notificacion"
        >
          <FaTimes size={14} />
        </button>
      </div>
      <div className="notification__bar" style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
}
