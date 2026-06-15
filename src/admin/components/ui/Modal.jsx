export default function Modal({ title, onClose, size, children }) {
    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div
                className={`admin-modal${size === 'sm' ? ' admin-modal--sm' : ''}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="admin-modal-header">
                    <span className="admin-modal-title">{title}</span>
                    <button className="admin-modal-close" type="button" onClick={onClose}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}
