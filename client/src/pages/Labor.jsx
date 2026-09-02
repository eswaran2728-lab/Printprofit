import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { laborApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, rm } from '../components/ui';

const empty = { task: '', rate: '', notes: '' };

export default function Labor() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => laborApi.list().then(setItems);
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditingId(null); setForm(empty); setShowForm(true); };
  const openEdit = (l) => { setEditingId(l.id); setForm({ task: l.task, rate: l.rate, notes: l.notes }); setShowForm(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await laborApi.update(editingId, form);
    else await laborApi.create(form);
    setShowForm(false);
    load();
  };
  const remove = async () => {
    await laborApi.remove(editingId);
    setShowForm(false);
    load();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <NavLink to="/more" className="btn-ghost px-0">← More</NavLink>
        <Button onClick={openAdd}>+ Task</Button>
      </div>
      <h2 className="m-0 text-[24px]">Labor &amp; Painter Rates</h2>

      {showForm && (
        <Blueprint className="p-3.5">
          <form onSubmit={submit} className="flex flex-col gap-2.5">
            <h6 className="m-0 text-accent-700">{editingId ? 'Edit task' : 'New task'}</h6>
            <Field label="Task">
              <input className={inputCls} required value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
            </Field>
            <Field label="Hourly rate (RM)">
              <input type="number" step="0.01" className={inputCls} required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
            </Field>
            <Field label="Notes">
              <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              {editingId && <Button type="button" variant="danger" onClick={remove}>Delete</Button>}
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </Blueprint>
      )}

      <div className="flex flex-col gap-2">
        {items.map((l) => (
          <Blueprint key={l.id} corners={['tl', 'br']} onClick={() => openEdit(l)} className="flex cursor-pointer items-center justify-between px-3.5 py-3">
            <div>
              <div className="text-[14px] font-medium">{l.task}</div>
              <div className="text-[11px] text-muted">{l.notes}</div>
            </div>
            <div className="pp-num text-[16px]">{rm(l.rate)}/hr</div>
          </Blueprint>
        ))}
        {items.length === 0 && <p className="text-sm text-muted">No labor rates yet.</p>}
      </div>
    </div>
  );
}
