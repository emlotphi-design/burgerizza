export default function GlassInput({ label, name, value, onChange, type = 'text', placeholder, required, locked }) {
  return (
    <div className="co-field">
      <label className="co-label">
        {label}{required && <span className="co-required">*</span>}
        {locked && (
          <span className="co-locked-badge">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            locked
          </span>
        )}
      </label>
      <input
        className={`co-input${locked ? ' co-input--locked' : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={locked ? undefined : onChange}
        readOnly={locked}
        placeholder={placeholder}
        autoComplete={name}
      />
    </div>
  );
}
