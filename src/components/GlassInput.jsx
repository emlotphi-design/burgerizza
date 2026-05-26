export default function GlassInput({ label, name, value, onChange, type = 'text', placeholder, required }) {
  return (
    <div className="co-field">
      <label className="co-label">{label}{required && <span className="co-required">*</span>}</label>
      <input
        className="co-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={name}
      />
    </div>
  );
}
