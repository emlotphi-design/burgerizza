export default function AddIngredientCard({ onClick }) {
  return (
    <button type="button" className="ing-add-card" onClick={onClick}>
      <span className="ing-add-card-plus">+</span>
      <span className="ing-add-card-label">Add Ingredient</span>
    </button>
  );
}
