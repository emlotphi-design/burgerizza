import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Socials from '../components/Socials';
import PizzaCanvas from '../components/PizzaCanvas';
import CategoryToolbar from '../components/CategoryToolbar';
import { usePizzaStore } from '../context/PizzaContext';

const LABEL = {
  american: 'Würstchenrand', americanp: 'Käserand', thin: 'Dünn',
  bbq: 'BBQ', garlic: 'Knoblauch', ketchup: 'Ketchup', pestos: 'Pesto', spicy: 'Spicy',
  mozzarella: 'Mozzarella', chedar: 'Cheddar', gouda: 'Gouda',
  pepperoni: 'Pepperoni', salami: 'Salami', bacon: 'Bacon', chicken: 'Chicken',
  meatball: 'Meatball', beefhum: 'Beef Ham', fleisch: 'Fleisch',
  turkeyhum: 'Turkey Ham', cheesesausage: 'Cheese Sausage',
  mushroom: 'Mushroom', bellpepper: 'Bell Pepper', sweetcorn: 'Sweet Corn',
  cherrytomato: 'Cherry Tomato', redonion: 'Red Onion', broccoli: 'Broccoli',
  eggplant: 'Eggplant', zucchini: 'Zucchini', dicedtomato: 'Diced Tomato',
  greenolives: 'Green Olives', blackolive: 'Black Olive', babyspinach: 'Baby Spinach',
  bluecheese: 'Blue Cheese', pestocheese: 'Pesto Cheese',
};

const BASE_PRICE = 10.99;
const CHEESE_ADD = 1.50;
const MEAT_ADD = 1.20;
const VEG_ADD = 0.80;

function calcPrice(pizza) {
  return BASE_PRICE + CHEESE_ADD + pizza.meats.length * MEAT_ADD + pizza.vegetables.length * VEG_ADD;
}

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
  const ingredients = [
    LABEL[pizza.dough],
    LABEL[pizza.sauce],
    LABEL[pizza.cheese],
    ...pizza.meats.map(id => LABEL[id]),
    ...pizza.vegetables.map(id => LABEL[id]),
  ];

  return (
    <div className={`saved-pizza-card${exiting ? ' saved-pizza-card--exit' : ''}`}>
      <div className="spc-header">
        {renaming ? (
          <input
            className="spc-name-input"
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
          <span className="spc-name spc-name--editable" onClick={() => { setNameDraft(pizza.name); setRenaming(true); }} title="Click to rename">
            {pizza.name}
          </span>
        )}
        <span className="spc-price">€{price.toFixed(2)}</span>
      </div>
      <div className="spc-preview">
        <PizzaCanvas
          activeCategory=""
          selectedDough={pizza.dough}
          selectedSauce={pizza.sauce}
          selectedCheese={pizza.cheese}
          selectedMeats={pizza.meats}
          selectedVegetables={pizza.vegetables}
          size="88px"
        />
      </div>
      <p className="spc-ingredients">
        {ingredients.slice(0, 3).join(' · ')}
        {ingredients.length > 3 && <span className="spc-more"> +{ingredients.length - 3}</span>}
      </p>
      <div className="spc-actions">
        <button className="spc-edit-btn" onClick={() => onEdit(pizza)} aria-label="Edit pizza">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Edit
        </button>
        <button className="spc-delete-btn" onClick={() => onDelete(pizza.id)} aria-label="Remove pizza">
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
  const navigate = useNavigate();
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
  const lockTimer = useRef(null);

  const canAddToCart = !!selectedDough && !!selectedSauce && !!selectedCheese;
  const hasPizzas = canAddToCart || pizzas.length > 0;
  const totalCount = pizzas.length + (canAddToCart ? 1 : 0);
  const isEditing = editingId !== null;
  const nextPizzaNumber = pizzas.length + 1;

  const handleBuildAnother = useCallback(() => {
    if (!canAddToCart) return;
    saveDraftAsPizza();
    clearDraft();
  }, [canAddToCart, saveDraftAsPizza, clearDraft]);

  const handleAddToCart = useCallback(() => {
    if (canAddToCart) {
      saveDraftAsPizza();
      clearDraft();
    }
    navigate('/cart');
  }, [navigate, canAddToCart, saveDraftAsPizza, clearDraft]);

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
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', paddingTop: 'var(--nav-h, 74px)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 16px 72px', overflow: 'hidden', minHeight: 0 }}>
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

      {pizzas.length > 0 && (
        <div className="saved-pizzas-panel">
          <p className="saved-pizzas-label">YOUR PIZZAS</p>
          <div className="saved-pizzas-list">
            {pizzas.map(pizza => (
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

      <div className={`builder-actions${hasPizzas ? ' builder-actions--visible' : ''}`}>
        {canAddToCart && (
          <button className="build-another-btn" onClick={handleBuildAnother} aria-label="Build another pizza">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            BUILD ANOTHER
          </button>
        )}
        <button
          className="add-to-cart-btn"
          onClick={handleAddToCart}
          aria-label="In den Warenkorb"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0 }}>
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          IN DEN WARENKORB
          {totalCount > 1 && <span className="cart-btn-badge">{totalCount}</span>}
        </button>
      </div>

      <Socials />
    </div>
  );
}
