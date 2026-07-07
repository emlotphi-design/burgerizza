import { useEffect } from 'react';

export default function Modal({ title, onClose, size, cardClassName, closing = false, children }) {
    // ESC closes the modal; body scroll is locked while any modal is open so
    // the backdrop can't scroll behind the popup.
    useEffect(() => {
        function handleKey(e) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', handleKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [onClose]);

    const cardClasses = [
        'adm-modal-card',
        size === 'sm' && 'adm-modal-card--sm',
        cardClassName,
        closing && 'adm-modal-card--closing',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={`adm-modal-overlay${closing ? ' adm-modal-overlay--closing' : ''}`}
            onClick={onClose}
        >
            <div className={cardClasses} onClick={e => e.stopPropagation()}>
                <div className="adm-modal-header">
                    <span className="adm-modal-title">{title}</span>
                    <button className="adm-modal-close" type="button" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}
