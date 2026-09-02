import { useEffect, useState } from 'react';
import { hardwareApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

const empty = { item: '', costPerUnit: '', stock: '', minStock: '' };

export default function Hardware() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => hardwareApi.list().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await hardwareApi.update(editingId, form);
    else await hardwareApi.create(form);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (h) => {
    setForm({ item: h.item, costPerUnit: h.costPerUnit, stock: h.stock, minStock: h.minStock });
    setEditingId(h.id);
  };

  const remove = async (id) => {
    await hardwareApi.remove(id);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Hardware / Consumables</h2>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <Field label="Item">
            <input className={inputCls} required value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </Field>
          <Field label="Cost/Unit (RM)">
            <input type="number" step="0.01" className={inputCls} required value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })} />
          </Field>
          <Field label="Stock">
            <input type="number" className={inputCls} required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </Field>
          <Field label="Min Stock">
            <input type="number" className={inputCls} value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
          </Field>
          <div className="col-span-2 flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Add Item'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setForm(empty); setEditingId(null); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((h) => (
          <Card key={h.id} className={h.stock <= h.minStock ? 'border-amber-300' : ''}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{h.item}</p>
                <p className="text-xs text-gray-500">
                  {rm(h.costPerUnit)}/unit · Stock: {h.stock} (min {h.minStock})
                </p>
                {h.stock <= h.minStock && <p className="text-xs text-amber-600 font-medium">Reorder needed</p>}
              </div>
              <div className="flex gap-2 text-xs">
                <button className="text-purple-600" onClick={() => edit(h)}>Edit</button>
                <button className="text-red-500" onClick={() => remove(h.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No hardware items yet.</p>}
      </div>
    </div>
  );
}
