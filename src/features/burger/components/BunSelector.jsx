import classicPreview  from '../../../assets/burgers/buns/buns-preview.png/classicbun-preview.png';
import charcoalPreview from '../../../assets/burgers/buns/buns-preview.png/charcoalbun-preview.png';
import beetrootPreview from '../../../assets/burgers/buns/buns-preview.png/beetrootbun-preview.png';
import parsleyPreview  from '../../../assets/burgers/buns/buns-preview.png/parsleybun-preview.png';
import { BURGER_BUNS } from '../utils/burgerData';
import { useBurgerStore } from '../store/burgerStore.jsx';

const BUN_PREVIEWS = {
  classicbun:  classicPreview,
  charcoalbun: charcoalPreview,
  beetrootbun: beetrootPreview,
  parsleybun:  parsleyPreview,
};

export default function BunSelector() {
  const { draft, setDraft } = useBurgerStore();

  return (
    <div className="bb-grid">
      {BURGER_BUNS.map(bun => (
        <button
          key={bun.id}
          className={`bb-card ing-card${draft.bun === bun.id ? ' bb-card--selected' : ''}`}
          onClick={() => setDraft({ bun: bun.id })}
        >
          <img src={BUN_PREVIEWS[bun.id]} alt={bun.name} className="bb-card__preview-img" />
          <span className="bb-card__name">{bun.name}</span>
          <span className="bb-card__price">€{bun.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
