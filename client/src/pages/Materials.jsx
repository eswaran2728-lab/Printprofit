import { useEffect, useState } from 'react';
import { materialsApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

const empty = { material: '', color: '', costPerKg: '', stockGrams: '', minStockGrams: '' };

export default function Materials() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => materialsApi.list().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await materialsApi.update(editingId, form);
    else await materialsApi.create(form);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (item) => {
    setForm({ material: item.material, color: item.color, costPerKg: item.costPerKg, stockGrams: item.stockGrams, minStockGrams: item.minStockGrams });
    setEditingId(item.id);
  };

  const remove = async (id) => {
    await materialsApi.remove(id);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Materials Stock</h2>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <Field label="Material">
            <input className={inputCls} required value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
          </Field>
          <Field label="Color">
            <input className={inputCls} value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          </Field>
          <Field label="Cost/kg (RM)">
            <input type="number" step="0.01" className={inputCls} required value={form.costPerKg} onChange={(e) => setForm({ ...form, costPerKg: e.target.value })} />
          </Field>
          <Field label="Stock (g)">
            <input type="number" className={inputCls} required value={form.stockGrams} onChange={(e) => setForm({ ...form, stockGrams: e.target.value })} />
          </Field>
          <Field label="Min Stock (g)">
            <input type="number" className={inputCls} value={form.minStockGrams} onChange={(e) => setForm({ ...form, minStockGrams: e.target.value })} />
          </Field>
          <div className="col-span-2 flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Add Material'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setForm(empty); setEditingId(null); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((m) => (
          <Card key={m.id} className={m.stockGrams <= m.minStockGrams ? 'border-amber-300' : ''}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">
                  {m.material} {m.color && <span className="text-gray-400">({m.color})</span>}
                </p>
                <p className="text-xs text-gray-500">
                  {rm(m.costPerKg)}/kg · {rm(m.costPerKg / 1000)}/g · Stock: {m.stockGrams}g (min {m.minStockGrams}g)
                </p>
                {m.stockGrams <= m.minStockGrams && <p className="text-xs text-amber-600 font-medium">Reorder needed</p>}
              </div>
              <div className="flex gap-2 text-xs">
                <button className="text-purple-600" onClick={() => edit(m)}>Edit</button>
                <button className="text-red-500" onClick={() => remove(m.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No materials yet.</p>}
      </div>
    </div>
  );
}
