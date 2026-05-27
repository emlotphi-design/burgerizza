import { useState, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Socials from '../../components/Socials';
import BurgerSidebar from './components/BurgerSidebar';
import { useBurgerStore } from './store/burgerStore.jsx';
import { usePizzaStore } from '../../context/PizzaContext';
import { BURGER_BUNS, BURGER_MEATS, BURGER_SAUCES } from './utils/burgerData';

import blackWrapper from '../../assets/burgers/wrappers/black-wrapper.png';
import classicPaper from '../../assets/burgers/wrappers/classic-paper.png';
import kraftPaper   from '../../assets/burgers/wrappers/kraft-paper.png';

import classicBase   from '../../assets/burgers/buns/buns-base.png/classicbun-base.png';
import classic2Base  from '../../assets/burgers/buns/buns-base.png/classicbun-base2.png';
import charcoalBase  from '../../assets/burgers/buns/buns-base.png/charcoalbun-base.png';
import beetrootBase  from '../../assets/burgers/buns/buns-base.png/beetrootbun-base.png';
import parsleyBase   from '../../assets/burgers/buns/buns-base.png/parsleybun-base.png';

import classicPreview  from '../../assets/burgers/buns/buns-preview.png/classicbun-preview.png';
import classic2Preview from '../../assets/burgers/buns/buns-preview.png/classicbun-preview2.png';
import charcoalPreview from '../../assets/burgers/buns/buns-preview.png/charcoalbun-preview.png';
import beetrootPreview from '../../assets/burgers/buns/buns-preview.png/beetrootbun-preview.png';
import parsleyPreview  from '../../assets/burgers/buns/buns-preview.png/parsleybun-preview.png';

import classicTop   from '../../assets/burgers/buns/top-buns/classicbun-top..png';
import classic2Top  from '../../assets/burgers/buns/top-buns/classicbuntop2..png';
import charcoalTop  from '../../assets/burgers/buns/top-buns/charcoalbun-top.png';
import beetrootTop  from '../../assets/burgers/buns/top-buns/beetrootbun-top.png';
import parsleyTop   from '../../assets/burgers/buns/top-buns/parsleybun-top.png';

import chickenBase      from '../../assets/burgers/meats/meat-base/chicken-base.png';
import baconBase        from '../../assets/burgers/meats/meat-base/bacon-base.png';
import friedchickenBase from '../../assets/burgers/meats/meat-base/friedchicken-base.png';
import beefBase         from '../../assets/burgers/meats/meat-base/beef-base.png';
import beefpattyBase    from '../../assets/burgers/meats/meat-base/beefpatty-base.png';
import eggBase          from '../../assets/burgers/meats/meat-base/egg-base.png';

import chickenPreview      from '../../assets/burgers/meats/meat-preview/chicken-preview.png';
import baconPreview        from '../../assets/burgers/meats/meat-preview/bacon-preview.png';
import friedchickenPreview from '../../assets/burgers/meats/meat-preview/friedchicken-preview.png';
import beefPreview         from '../../assets/burgers/meats/meat-preview/beef-preview.png';
import beefpattyPreview    from '../../assets/burgers/meats/meat-preview/beefpatty-preview.png';
import eggPreview          from '../../assets/burgers/meats/meat-preview/egg-preview.png';

import ketchupBase        from '../../assets/burgers/sauces/sauce-base/ketchup-base.png';
import mayonnaiseBase     from '../../assets/burgers/sauces/sauce-base/mayonnaise-base.png';
import mustardBase        from '../../assets/burgers/sauces/sauce-base/mustard-base.png';
import picklesauceBase    from '../../assets/burgers/sauces/sauce-base/picklesauce-base.png';
import mushroomsauceBase  from '../../assets/burgers/sauces/sauce-base/mushroomsauce-base.png';

import ketchupPreview       from '../../assets/burgers/sauces/sauce-preview/ketchup-preview.png';
import mayonnaisePreview    from '../../assets/burgers/sauces/sauce-preview/mayonnaise-preview.png';
import mustardPreview       from '../../assets/burgers/sauces/sauce-preview/mustard-preview.png';
import picklesaucePreview   from '../../assets/burgers/sauces/sauce-preview/picklesauce-preview.png';
import mushroomsaucePreview from '../../assets/burgers/sauces/sauce-preview/mushroom-sauce-preview.png';

// ─── Lookup tables ──────────────────────────────────────────────────────────

const wrappers = [blackWrapper, classicPaper, kraftPaper];

const BUN_BASES = {
  classicbun:  classicBase,
  classicbun2: classic2Base,
  charcoalbun: charcoalBase,
  beetrootbun: beetrootBase,
  parsleybun:  parsleyBase,
};

const BUN_PREVIEWS = {
  classicbun:  classicPreview,
  classicbun2: classic2Preview,
  charcoalbun: charcoalPreview,
  beetrootbun: beetrootPreview,
  parsleybun:  parsleyPreview,
};

const BUN_TOPS = {
  classicbun:  classicTop,
  classicbun2: classic2Top,
  charcoalbun: charcoalTop,
  beetrootbun: beetrootTop,
  parsleybun:  parsleyTop,
};

// Pentagon r=42%, 72° steps from top
const BUN_POSITIONS = {
  classicbun:  { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  classicbun2: { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  charcoalbun: { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  beetrootbun: { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  parsleybun:  { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

const MEAT_BASES = {
  chicken:      chickenBase,
  bacon:        baconBase,
  friedchicken: friedchickenBase,
  beef:         beefBase,
  beefpatty:    beefpattyBase,
  egg:          eggBase,
};

const MEAT_PREVIEWS = {
  chicken:      chickenPreview,
  bacon:        baconPreview,
  friedchicken: friedchickenPreview,
  beef:         beefPreview,
  beefpatty:    beefpattyPreview,
  egg:          eggPreview,
};

// Hexagon r=42%, 60° steps from top
const MEAT_POSITIONS = {
  chicken:      { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  bacon:        { top: '29%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  friedchicken: { top: '71%', left: '86.4%', transform: 'translate(-50%, -50%)' },
  beef:         { top: '92%', left: '50%',   transform: 'translate(-50%, -50%)' },
  beefpatty:    { top: '71%', left: '13.6%', transform: 'translate(-50%, -50%)' },
  egg:          { top: '29%', left: '13.6%', transform: 'translate(-50%, -50%)' },
};

const SAUCE_BASES = {
  ketchup:       ketchupBase,
  mayonnaise:    mayonnaiseBase,
  mustard:       mustardBase,
  picklesauce:   picklesauceBase,
  mushroomsauce: mushroomsauceBase,
};

const SAUCE_PREVIEWS = {
  ketchup:       ketchupPreview,
  mayonnaise:    mayonnaisePreview,
  mustard:       mustardPreview,
  picklesauce:   picklesaucePreview,
  mushroomsauce: mushroomsaucePreview,
};

// Pentagon r=42%, 72° steps from top
const SAUCE_POSITIONS = {
  ketchup:       { top: '8%',  left: '50%',   transform: 'translate(-50%, -50%)' },
  mayonnaise:    { top: '37%', left: '89.9%', transform: 'translate(-50%, -50%)' },
  mustard:       { top: '84%', left: '74.7%', transform: 'translate(-50%, -50%)' },
  picklesauce:   { top: '84%', left: '25.3%', transform: 'translate(-50%, -50%)' },
  mushroomsauce: { top: '37%', left: '10.1%', transform: 'translate(-50%, -50%)' },
};

const MAX_MEAT_QTY = 5;

const previewBtn = {
  width: '100%',
  height: '100%',
  padding: 0,
  background: 'none',
  border: 'none',
  borderRadius: 0,
  cursor: 'pointer',
  overflow: 'visible',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function BurgerBuilder() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem]   = useState('bun');
  const [isOrdering, setIsOrdering]   = useState(false);
  const { draft, setDraft, clearDraft } = useBurgerStore();
  const { addBurger }                 = usePizzaStore();

  // Snapshot captured at click time so the timer commit uses the correct data
  const orderSnapshotRef = useRef(null);

  // ── Wrapper persistence ──────────────────────────────────────────────────
  const initWrapperIdx = useRef(Math.floor(Math.random() * wrappers.length));
  useEffect(() => {
    if (draft.wrapper === null || draft.wrapper === undefined) {
      setDraft({ wrapper: initWrapperIdx.current });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const wrapperIndex    = draft.wrapper ?? initWrapperIdx.current;
  const selectedWrapper = wrappers[wrapperIndex] ?? wrappers[0];

  // ── Derived state ────────────────────────────────────────────────────────
  const bunBase       = draft.bun ? BUN_BASES[draft.bun] : null;
  const selectedBun   = draft.bun ? BURGER_BUNS.find(b => b.id === draft.bun) : null;
  const bunWidth      = selectedBun?.baseWidth ?? '36%';
  const topBunSrc     = draft.bun ? BUN_TOPS[draft.bun] : null;

  const selectedMeats  = draft.meats  ?? {};
  const selectedSauces = draft.sauces ?? [];

  const meatLayers = Object.entries(selectedMeats).flatMap(([meatId, qty]) =>
    Array.from({ length: qty }, (_, j) => ({ meatId, layerKey: `${meatId}-${j}` }))
  );

  const hasMeat = meatLayers.length > 0;

  // ── Order flow ───────────────────────────────────────────────────────────
  const handleOrder = () => {
    if (!hasMeat || isOrdering) return;
    const snapshot = { ...draft };
    if (topBunSrc) {
      orderSnapshotRef.current = snapshot;
      setIsOrdering(true);  // mounts top-bun img, starts CSS animation
    } else {
      // No bun selected — commit immediately, no animation
      flushSync(() => { addBurger(snapshot); clearDraft(); });
      navigate('/cart');
    }
  };

  // After top-bun animation (550ms) + 100ms buffer → commit atomically
  useEffect(() => {
    if (!isOrdering) return;
    const timer = setTimeout(() => {
      const snapshot = orderSnapshotRef.current;
      orderSnapshotRef.current = null;
      if (snapshot) {
        // All state mutations in one flushSync so Cart.jsx renders with
        // the burger already in the list — no empty-cart flash
        flushSync(() => {
          addBurger(snapshot);
          clearDraft();
          setIsOrdering(false);
        });
        navigate('/cart');
      } else {
        setIsOrdering(false);
      }
    }, 650);
    return () => clearTimeout(timer);
  }, [isOrdering]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="bb-stage">
      <Navbar />
      <BurgerSidebar activeItem={activeItem} onSelect={setActiveItem} />

      <div className="bb-workspace">
        <div className="bb-builder-canvas">

          {/* Wrapper paper */}
          <img
            className="bb-wrapper-img"
            src={selectedWrapper}
            alt="Burger wrapper"
            onError={e => {
              if (e.currentTarget.src !== classicPaper) e.currentTarget.src = classicPaper;
            }}
          />

          {/* Bottom bun */}
          {bunBase && (
            <img
              className="bb-bun-img"
              src={bunBase}
              alt="Selected bun"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* Sauce layers — z-index 3–4 */}
          {selectedSauces.map((sauceId, i) =>
            SAUCE_BASES[sauceId] ? (
              <img
                key={sauceId}
                className="bb-sauce-img"
                src={SAUCE_BASES[sauceId]}
                alt={sauceId}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 3 + i,
                }}
              />
            ) : null
          )}

          {/* Meat layers — z-index 5+ */}
          {meatLayers.map(({ meatId, layerKey }, idx) =>
            MEAT_BASES[meatId] ? (
              <img
                key={layerKey}
                className="bb-meat-img"
                src={MEAT_BASES[meatId]}
                alt={meatId}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 5 + idx,
                }}
              />
            ) : null
          )}

          {/* Top bun — drops in above all layers when ORDER is clicked */}
          {isOrdering && topBunSrc && (
            <img
              className="bb-top-bun-img"
              src={topBunSrc}
              alt="Top bun"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) rotate(-2deg)',
                width: bunWidth,
              }}
            />
          )}

          {/* ── Orbital previews (hidden during ordering animation) ── */}

          {!isOrdering && activeItem === 'bun' && BURGER_BUNS.map((bun, i) => {
            const isSelected = draft.bun === bun.id;
            return (
              <div
                key={bun.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...BUN_POSITIONS[bun.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  onClick={() => setDraft({ bun: bun.id })}
                  aria-label={bun.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={BUN_PREVIEWS[bun.id]}
                    alt={bun.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>
                <span className="bb-preview-label">{bun.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'sauce' && BURGER_SAUCES.map((sauce, i) => {
            const isSelected  = selectedSauces.includes(sauce.id);
            const atLimit     = selectedSauces.length >= 2;
            const isDisabled  = atLimit && !isSelected;
            return (
              <div
                key={sauce.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}${isDisabled ? ' bb-preview-wrap--disabled' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...SAUCE_POSITIONS[sauce.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return;
                    setDraft(prev => ({
                      sauces: prev.sauces.includes(sauce.id)
                        ? prev.sauces.filter(s => s !== sauce.id)
                        : [...prev.sauces, sauce.id],
                    }));
                  }}
                  aria-label={sauce.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={SAUCE_PREVIEWS[sauce.id]}
                    alt={sauce.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>
                <span className="bb-preview-label">{sauce.name}</span>
              </div>
            );
          })}

          {!isOrdering && activeItem === 'meat' && BURGER_MEATS.map((meat, i) => {
            const qty        = selectedMeats[meat.id] ?? 0;
            const isSelected = qty > 0;
            return (
              <div
                key={meat.id}
                className={`bb-preview-wrap${isSelected ? ' bb-preview-wrap--selected' : ''}`}
                style={{
                  position: 'absolute', width: '16%', height: '16%',
                  zIndex: 30, animationDelay: `${i * 55}ms`,
                  ...MEAT_POSITIONS[meat.id],
                }}
              >
                <button
                  className="bb-preview-btn"
                  onClick={() => setDraft(prev => {
                    const meats = { ...prev.meats };
                    if (meats[meat.id]) { delete meats[meat.id]; } else { meats[meat.id] = 1; }
                    return { meats };
                  })}
                  aria-label={meat.name}
                  aria-pressed={isSelected}
                  style={previewBtn}
                >
                  <img
                    src={MEAT_PREVIEWS[meat.id]}
                    alt={meat.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </button>

                {isSelected && meat.hasQty && (
                  <div className="bb-qty-bar">
                    <button
                      className="bb-qty-btn"
                      aria-label={`Remove one ${meat.name}`}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const meats = { ...prev.meats };
                          if ((meats[meat.id] ?? 0) <= 1) { delete meats[meat.id]; }
                          else { meats[meat.id] -= 1; }
                          return { meats };
                        });
                      }}
                    >−</button>
                    <span className="bb-qty-count">{qty}</span>
                    <button
                      className="bb-qty-btn"
                      aria-label={`Add one ${meat.name}`}
                      disabled={qty >= MAX_MEAT_QTY}
                      onClick={e => {
                        e.stopPropagation();
                        setDraft(prev => {
                          const current = prev.meats[meat.id] ?? 0;
                          if (current >= MAX_MEAT_QTY) return prev;
                          return { meats: { ...prev.meats, [meat.id]: current + 1 } };
                        });
                      }}
                    >+</button>
                  </div>
                )}

                <span className="bb-preview-label">{meat.name}</span>
              </div>
            );
          })}

        </div>
      </div>

      {/* ORDER NOW — fixed pill, visible only when meat selected and not ordering */}
      <button
        className={`bb-order-btn${hasMeat && !isOrdering ? ' bb-order-btn--visible' : ''}`}
        onClick={handleOrder}
        aria-label="Order now"
      >
        ORDER NOW
      </button>

      <Socials />
    </div>
  );
}
