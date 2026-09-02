import { useEffect, useState } from 'react';
import { laborApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

const empty = { task: '', rate: '', notes: '' };

export default function Labor() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const load = () => laborApi.list().then(setItems);
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await laborApi.update(editingId, form);
    else await laborApi.create(form);
    setForm(empty);
    setEditingId(null);
    load();
  };

  const edit = (l) => {
    setForm({ task: l.task, rate: l.rate, notes: l.notes });
    setEditingId(l.id);
  };

  const remove = async (id) => {
    await laborApi.remove(id);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Labor & Painter Rates</h2>

      <Card>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <Field label="Task">
            <input className={inputCls} required value={form.task} onChange={(e) => setForm({ ...form, task: e.target.value })} />
          </Field>
          <Field label="Hourly Rate (RM)">
            <input type="number" step="0.01" className={inputCls} required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </Field>
          <Field label="Notes">
            <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          <div className="col-span-2 flex gap-2">
            <Button type="submit">{editingId ? 'Update' : 'Add Task'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setForm(empty); setEditingId(null); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {items.map((l) => (
          <Card key={l.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{l.task}</p>
                <p className="text-xs text-gray-500">{rm(l.rate)}/hour {l.notes && `· ${l.notes}`}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="text-purple-600" onClick={() => edit(l)}>Edit</button>
                <button className="text-red-500" onClick={() => remove(l.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
