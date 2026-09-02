import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { printersApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, rm } from '../components/ui';

const empty = { name: '', purchasePrice: '', powerW: '', lifetimeHours: '', annualMaintenance: '', annualHours: '1000' };

export default function Printers() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => printersApi.list().then(setItems);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(empty); setShowForm(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, purchasePrice: p.purchasePrice, powerW: p.powerW, lifetimeHours: p.lifetimeHours, annualMaintenance: p.annualMaintenance, annualHours: p.annualHours });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await printersApi.update(editingId, form);
    else await printersApi.create(form);
    setShowForm(false);
    load();
  };
  const remove = async () => {
    await printersApi.remove(editingId);
    setShowForm(false);
    load();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <NavLink to="/more" className="btn-ghost px-0">← More</NavLink>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[24px]">Printers</h2>
        <Button onClick={openAdd}>+ Printer</Button>
      </div>

      {showForm && (
        <Blueprint className="p-3.5">
          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <h6 className="m-0 text-accent-700">{editingId ? 'Edit printer' : 'New printer'}</h6>
            <Field label="Printer name">
              <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <div className="flex gap-2.5">
              <Field label="Purchase price (RM)" className="flex-1">
                <input type="number" step="0.01" className={inputCls} required value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} />
              </Field>
              <Field label="Power (W)" className="flex-1">
                <input type="number" className={inputCls} required value={form.powerW} onChange={(e) => setForm({ ...form, powerW: e.target.value })} />
              </Field>
            </div>
            <div className="flex gap-2.5">
              <Field label="Lifetime hours" className="flex-1">
                <input type="number" className={inputCls} required value={form.lifetimeHours} onChange={(e) => setForm({ ...form, lifetimeHours: e.target.value })} />
              </Field>
              <Field label="Annual maintenance (RM)" className="flex-1">
                <input type="number" step="0.01" className={inputCls} value={form.annualMaintenance} onChange={(e) => setForm({ ...form, annualMaintenance: e.target.value })} />
              </Field>
            </div>
            <Field label="Annual usage hours">
              <input type="number" className={inputCls} value={form.annualHours} onChange={(e) => setForm({ ...form, annualHours: e.target.value })} />
            </Field>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              {editingId && <Button type="button" variant="danger" onClick={remove}>Delete</Button>}
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </Blueprint>
      )}

      {items.map((p) => (
        <Blueprint key={p.id} onClick={() => openEdit(p)} className="cursor-pointer px-3.5 py-3">
          <div className="text-[15px] font-medium">{p.name}</div>
          <div className="mt-1.5 flex gap-4">
            <div>
              <div className="text-[10px] uppercase text-accent-700">Cost/hr</div>
              <div className="pp-num text-[16px]">{rm(p.costPerHour)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-accent-700">Purchase</div>
              <div className="pp-num text-[16px]">{rm(p.purchasePrice)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-accent-700">Lifetime</div>
              <div className="pp-num text-[16px]">{p.lifetimeHours.toLocaleString()} hr</div>
            </div>
          </div>
        </Blueprint>
      ))}
      {items.length === 0 && <p className="text-sm text-muted">No printers yet.</p>}
    </div>
  );
}
