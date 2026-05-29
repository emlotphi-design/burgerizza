import React, { useState, useRef, useCallback, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import CategoryToolbar from '../components/CategoryToolbar';
import { usePizzaStore } from '../context/PizzaContext';
import { LABEL, calcPrice } from '../utils/pizzaUtils';

function buildUnlocked(dough, sauce, cheese) {
  return { dough: true, sauces: !!dough, cheese: !!sauce, meat: !!cheese, vegetables: !!cheese };
}

function buildCompleted(dough, sauce, cheese, meats, vegs) {
  return { dough: !!dough, sauces: !!sauce, cheese: !!cheese, meat: meats.length > 0, vegetables: vegs.length > 0 };
}

function lockMessage(dough, sauce, cheese) {
  if (!dough) return 'Please select a dough first';
  if (!sauce) return 'Please select a sauce first';
  if (!cheese) return 'Please select a cheese first';
  return 'Complete the previous step first';
}

function SavedPizzaCard({ pizza, onEdit, onDelete, onRename, exiting }) {
  const [renaming, setRenaming] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState(pizza.name);

  function commitRename() {
    const trimmed = nameDraft.trim();
    onRename(pizza.id, trimmed || pizza.name);
    setNameDraft(trimmed || pizza.name);
    setRenaming(false);
  }

  const price = calcPrice(pizza);
  const meats = Array.isArray(pizza.meats) ? pizza.meats : [];
  const vegetables = Array.isArray(pizza.vegetables) ? pizza.vegetables : [];
  const ingredients = [
    LABEL[pizza.dough],
    LABEL[pizza.sauce],
    LABEL[pizza.cheese],
    ...meats.map(id => LABEL[id]),
    ...vegetables.map(id => LABEL[id]),
  ].filter(Boolean);

  return (
    <div className={`bpc-card preview-card${exiting ? ' bpc-card--exit' : ''}`}>
      <div className="bpc-header">
        {renaming ? (
          <input
            className="bpc-name-input"
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={e => {
              if (e.key === 'Enter') { commitRename(); }
              if (e.key === 'Escape') { setNameDraft(pizza.name); setRenaming(false); }
            }}
            autoFocus
            maxLength={28}
          />
        ) : (
          <span className="bpc-name bpc-name--editable" onClick={() => { setNameDraft(pizza.name); setRenaming(true); }} title="Click to rename">
            {pizza.name}
          </span>
        )}
        <span className="bpc-price">€{price.toFixed(2)}</span>
      </div>
      <div className="bpc-image-wrap">
        <PizzaCanvas
          activeCategory=""
          selectedDough={pizza.dough}
          selectedSauce={pizza.sauce}
          selectedCheese={pizza.cheese}
          selectedMeats={meats}
          selectedVegetables={vegetables}
          size="88px"
        />
      </div>
      <p className="bpc-summary">
        {ingredients.slice(0, 3).join(' · ')}
        {ingredients.length > 3 && <span className="bpc-more"> +{ingredients.length - 3}</span>}
      </p>
      <div className="bpc-actions">
        <button className="bpc-edit-btn" onClick={() => onEdit(pizza)} aria-label="Edit pizza">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button className="bpc-remove-btn" onClick={() => onDelete(pizza.id)} aria-label="Remove pizza">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Remove
        </button>
      </div>
    </div>
  );
}

export default function PizzaBuilder() {
  const store = usePizzaStore();
  const {
    pizzas, draft,
    setDraft, clearDraft, saveDraftAsPizza,
    removePizza, renamePizza, startEditing,
  } = store;

  const {
    activeCategory,
    selectedDough, selectedSauce, selectedCheese,
    selectedMeats, selectedVegetables,
    draftName, editingId, editingName,
  } = draft;

  const [lockMsg, setLockMsg] = useState('');
  const [exitingIds, setExitingIds] = useState([]);
  const [toastVisible, setToastVisible] = useState(false);
  const lockTimer = useRef(null);
  const toastTimerRef = useRef(null);

  const pizzaItems = pizzas.filter(p => p.type !== 'burger');

  const canAddToCart = !!selectedDough && !!selectedSauce && !!selectedCheese;
  const isEditing = editingId !== null;
  const nextPizzaNumber = pizzas.length + 1;

  const handleAddToCart = useCallback(() => {
    if (!canAddToCart) return;
    saveDraftAsPizza();
    clearDraft();
    clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2800);
  }, [canAddToCart, saveDraftAsPizza, clearDraft]);

  const handleEditPizza = useCallback((pizza) => {
    startEditing(pizza);
  }, [startEditing]);

  const handleDeletePizza = useCallback((id) => {
    setExitingIds(prev => [...prev, id]);
    setTimeout(() => {
      removePizza(id);
      setExitingIds(prev => prev.filter(x => x !== id));
    }, 400);
  }, [removePizza]);

  // ── Lock html scroll + mark body while builder is mounted ───────────────
  useEffect(() => {
    const prev = document.documentElement.style.overflowY;
    document.documentElement.style.overflowY = 'hidden';
    document.body.classList.add('is-builder');
    return () => {
      document.documentElement.style.overflowY = prev;
      document.body.classList.remove('is-builder');
    };
  }, []);

  const unlocked = buildUnlocked(selectedDough, selectedSauce, selectedCheese);
  const completed = buildCompleted(selectedDough, selectedSauce, selectedCheese, selectedMeats, selectedVegetables);

  const handleCategoryChange = useCallback((id) => {
    if (!unlocked[id]) {
      const msg = lockMessage(selectedDough, selectedSauce, selectedCheese);
      setLockMsg(msg);
      clearTimeout(lockTimer.current);
      lockTimer.current = setTimeout(() => setLockMsg(''), 2200);
      return;
    }
    setDraft({ activeCategory: id });
  }, [unlocked, selectedDough, selectedSauce, selectedCheese, setDraft]);

  const handleDoughSelect = useCallback((id) => { setDraft({ selectedDough: id }); }, [setDraft]);
  const handleSauceSelect = useCallback((id) => { setDraft({ selectedSauce: id }); }, [setDraft]);
  const handleCheeseSelect = useCallback((id) => { setDraft({ selectedCheese: id }); }, [setDraft]);

  const handleMeatToggle = useCallback((id) => {
    setDraft(prev => {
      const cur = prev.selectedMeats;
      const next = cur.includes(id) ? cur.filter(m => m !== id)
        : cur.length >= 4 ? cur
          : [...cur, id];
      return { selectedMeats: next };
    });
  }, [setDraft]);

  const handleVegetableToggle = useCallback((id) => {
    setDraft(prev => {
      const cur = prev.selectedVegetables;
      const next = cur.includes(id) ? cur.filter(v => v !== id)
        : cur.length >= 6 ? cur
          : [...cur, id];
      return { selectedVegetables: next };
    });
  }, [setDraft]);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: '100svh', overflow: 'hidden', paddingTop: 'var(--nav-h, 74px)' }}>
      <Navbar />
      <main className="pb-main">
        <div className="builder-stage">
          {isEditing && (
            <div className="builder-edit-banner">
              BEARBEITUNG: {editingName || 'Pizza'}
            </div>
          )}
          <CategoryToolbar
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            unlocked={unlocked}
            completed={completed}
            lockMsg={lockMsg}
          />
          <div className="builder-center">
            <PizzaCanvas
              activeCategory={activeCategory}
              selectedDough={selectedDough}
              selectedSauce={selectedSauce}
              selectedCheese={selectedCheese}
              selectedMeats={selectedMeats}
              selectedVegetables={selectedVegetables}
              onDoughSelect={handleDoughSelect}
              onSauceSelect={handleSauceSelect}
              onCheeseSelect={handleCheeseSelect}
              onMeatToggle={handleMeatToggle}
              onVegetableToggle={handleVegetableToggle}
              size="min(540px, 88vw, calc(100vh - 232px))"
            />
            <div className="builder-name-wrap">
              <input
                className="builder-name-input"
                type="text"
                value={draftName}
                onChange={e => setDraft({ draftName: e.target.value })}
                placeholder={`Custom Pizza #${nextPizzaNumber}`}
                maxLength={32}
                aria-label="Pizza name"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </main>

      {pizzaItems.length > 0 && (
        <div className="bpc-panel">
          <p className="bpc-panel-label">YOUR PIZZAS</p>
          <div className="bpc-panel-list">
            {pizzaItems.map(pizza => (
              <SavedPizzaCard
                key={pizza.id}
                pizza={pizza}
                onEdit={handleEditPizza}
                onDelete={handleDeletePizza}
                onRename={renamePizza}
                exiting={exitingIds.includes(pizza.id)}
              />
            ))}
          </div>
        </div>
      )}

      <button
        className={`pb-order-btn${canAddToCart ? ' pb-order-btn--visible' : ''}`}
        onClick={handleAddToCart}
        aria-label="Order pizza"
      >
        ORDER NOW
      </button>

      {toastVisible && (
        <div className="pb-toast" role="status" aria-live="polite">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Pizza added to cart
        </div>
      )}

      <Socials />
    </div>
  );
}
