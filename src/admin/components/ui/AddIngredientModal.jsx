import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { supabase } from '../../../services/supabase';
import { useCustomIngredients } from '../../../context/CustomIngredientsContext';
import { useIngredientConfig } from '../../../context/IngredientConfigContext';
import { useNutritionConfig } from '../../../context/NutritionConfigContext';
import { CATEGORY_LABELS, buildersForCategory } from '../../../utils/customIngredients';

const EMPTY_FORM = { name: '', price: '', calories: '', weight: '' };

/** category is fixed by which section's "+" card was clicked — not editable here. */
export default function AddIngredientModal({ category, onClose }) {
  const { createCustomIngredient } = useCustomIngredients();
  const { updateIngredient } = useIngredientConfig();
  const { updateNutrition } = useNutritionConfig();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const previewUrlRef = useRef('');

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] ?? null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    setImageFile(file);
    const url = file ? URL.createObjectURL(file) : '';
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Name is required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setErr('Enter a valid price.'); return; }
    const calories = parseFloat(form.calories);
    if (isNaN(calories) || calories < 0) { setErr('Enter valid calories.'); return; }
    let weight = null;
    if (form.weight !== '') {
      weight = parseFloat(form.weight);
      if (isNaN(weight) || weight < 0) { setErr('Enter a valid weight.'); return; }
    }
    if (!imageFile) { setErr('An image is required.'); return; }

    setSaving(true);
    setErr('');
    try {
      const id = `custom-${crypto.randomUUID()}`;
      const ext = (imageFile.name.split('.').pop() || 'png').toLowerCase();
      const path = `${category}/${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('ingredient-images')
        .upload(path, imageFile, { upsert: false });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ingredient-images')
        .getPublicUrl(path);

      await createCustomIngredient({
        id,
        name: form.name.trim(),
        category,
        price,
        calories,
        weight_g: weight,
        image_url: publicUrl,
        enabled: true,
      });

      const builders = buildersForCategory(category);
      await Promise.all(builders.flatMap(builder => [
        updateIngredient(builder, id, { price, enabled: true }),
        updateNutrition(builder, id, { weight, calories }),
      ]));

      onClose();
    } catch (e) {
      setErr(e.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Add Ingredient — ${CATEGORY_LABELS[category] ?? category}`} onClose={onClose}>
      <form className="adm-modal-body adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-row">
          <label className="adm-form-label">Category</label>
          <div className="ing-locked-category">{CATEGORY_LABELS[category] ?? category}</div>
        </div>

        <div className="adm-form-row">
          <label className="adm-form-label">Ingredient Name *</label>
          <input className="adm-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Jalapeños" />
        </div>

        <div className="adm-form-2col">
          <div className="adm-form-row">
            <label className="adm-form-label">Price (€) *</label>
            <input className="adm-input" type="number" step="0.10" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1.49" />
          </div>
          <div className="adm-form-row">
            <label className="adm-form-label">Calories (kcal) *</label>
            <input className="adm-input" type="number" step="1" min="0" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="adm-form-row">
          <label className="adm-form-label">Weight (g)</label>
          <input className="adm-input" type="number" step="1" min="0" value={form.weight} onChange={e => set('weight', e.target.value)} placeholder="—" />
        </div>

        <div className="adm-form-row">
          <label className="adm-form-label">Image Upload *</label>
          <input className="adm-input" type="file" accept="image/*" onChange={handleFileChange} />
          {previewUrl && (
            <img src={previewUrl} alt="Preview" className="ing-add-modal-preview" />
          )}
        </div>

        {err && <div style={{ color: 'var(--adm-danger, #e03d3d)', fontSize: 13 }}>{err}</div>}

        <div className="adm-modal-footer">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
