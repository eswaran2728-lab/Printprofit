import { useEffect, useState } from 'react';
import { printersApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

const empty = { name: '', purchasePrice: '', powerW: '', lifetimeHours: '', annualMaintenance: '', annualHours: '1000' };

export default function Printers() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => printersApi.list().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await printersApi.update(editingId, form);
    else await printersApi.create(form);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (p) => {
    setForm({
      name: p.name,
      purchasePrice: p.purchasePrice,
      powerW: p.powerW,
      lifetimeHours: p.lifetimeHours,
      annualMaintenance: p.annualMaintenance,
      annualHours: p.annualHours,
    });
    setEditingId(p.id);
  };

  const remove = async (id) => {
    await printersApi.remove(id);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Printers & Machine Cost</h2>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <Field label="Printer Name">
            <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Purchase Price (RM)">
            <input type="number" step="0.01" className={inputCls} required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
          </Field>
          <Field label="Power (W)">
            <input type="number" className={inputCls} required value={form.powerW} onChange={(e) => setForm({ ...form, powerW: e.target.value })} />
          </Field>
          <Field label="Lifetime Hours">
            <input type="number" className={inputCls} required value={form.lifetimeHours} onChange={(e) => setForm({ ...form, lifetimeHours: e.target.value })} />
          </Field>
          <Field label="Annual Maintenance (RM)">
            <input type="number" step="0.01" className={inputCls} value={form.annualMaintenance} onChange={(e) => setForm({ ...form, annualMaintenance: e.target.value })} />
          </Field>
          <Field label="Annual Usage Hours">
            <input type="number" className={inputCls} value={form.annualHours} onChange={(e) => setForm({ ...form, annualHours: e.target.value })} />
          </Field>
          <div className="col-span-2 flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Add Printer'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setForm(empty); setEditingId(null); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((p) => (
          <Card key={p.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">
                  {rm(p.purchasePrice)} · {p.powerW}W · {p.lifetimeHours}h life
                </p>
                <p className="text-sm font-semibold text-purple-600 mt-1">{rm(p.costPerHour)}/hour</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="text-purple-600" onClick={() => edit(p)}>Edit</button>
                <button className="text-red-500" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && <p className="text-sm text-gray-400">No printers yet.</p>}
      </div>
    </div>
  );
}
