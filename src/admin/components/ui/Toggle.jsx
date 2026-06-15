export default function Toggle({ on, onChange, label, type = 'button' }) {
    return (
        <button
            type={type}
            className={`admin-toggle${on ? ' admin-toggle--on' : ''}`}
            onClick={onChange}
            aria-pressed={on}
            aria-label={label}
        >
            <span className="admin-toggle-knob" />
        </button>
    );
}
