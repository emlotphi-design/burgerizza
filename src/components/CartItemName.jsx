import { useState } from 'react';
import { usePizzaStore } from '../store/PizzaContext';

/**
 * Cart-card title the customer can tap to rename (pizza or burger).
 * Replaces the old name input that sat on the builder pages.
 */
export default function CartItemName({ item }) {
  const { renamePizza } = usePizzaStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name || '');

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.name) renamePizza(item.id, trimmed);
    setDraft(trimmed || item.name || '');
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        className="cart-pizza-name cart-name-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') e.currentTarget.blur();
          if (e.key === 'Escape') { setDraft(item.name || ''); setEditing(false); }
        }}
        maxLength={32}
        aria-label="Name"
        spellCheck={false}
        autoFocus
        onFocus={e => e.currentTarget.select()}
      />
    );
  }

  return (
    <button
      type="button"
      className="cart-pizza-name cart-name-btn"
      onClick={() => { setDraft(item.name || ''); setEditing(true); }}
      aria-label="Name ändern"
      title="Name ändern"
    >
      <span className="cart-name-text">{item.name}</span>
      <svg className="cart-name-pencil" width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    </button>
  );
}
