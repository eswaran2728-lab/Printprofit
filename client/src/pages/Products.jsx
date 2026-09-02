import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { productsApi, materialsApi, printersApi, laborApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, rm } from '../components/ui';

const emptyForm = {
  name: '',
  materialsUsed: [],
  printTimeHours: '',
  printerId: '',
  failureRatePct: '5',
  packagingUsed: '',
  packagingCost: '',
  laborTasksUsed: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [printers, setPrinters] = useState([]);
  const [labor, setLabor] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = () => productsApi.list().then(setProducts);

  useEffect(() => {
    load();
    materialsApi.list().then(setMaterials);
    printersApi.list().then(setPrinters);
    laborApi.list().then(setLabor);
  }, []);

  const addMaterialRow = () => setForm({ ...form, materialsUsed: [...form.materialsUsed, { materialId: '', grams: '' }] });
  const updateMaterialRow = (i, key, value) => {
    const rows = [...form.materialsUsed];
    rows[i] = { ...rows[i], [key]: value };
    setForm({ ...form, materialsUsed: rows });
  };
  const removeMaterialRow = (i) => setForm({ ...form, materialsUsed: form.materialsUsed.filter((_, idx) => idx !== i) });

  const addLaborRow = () => setForm({ ...form, laborTasksUsed: [...form.laborTasksUsed, { taskId: '', hours: '' }] });
  const updateLaborRow = (i, key, value) => {
    const rows = [...form.laborTasksUsed];
    rows[i] = { ...rows[i], [key]: value };
    setForm({ ...form, laborTasksUsed: rows });
  };
  const removeLaborRow = (i) => setForm({ ...form, laborTasksUsed: form.laborTasksUsed.filter((_, idx) => idx !== i) });

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      materialsUsed: p.materialsUsed || [],
      printTimeHours: p.printTimeHours,
      printerId: p.printerId || '',
      failureRatePct: p.failureRatePct,
      packagingUsed: p.packagingUsed || '',
      packagingCost: p.packagingCost || '',
      laborTasksUsed: p.laborTasksUsed || [],
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await productsApi.update(editingId, form);
    else await productsApi.create(form);
    setShowForm(false);
    load();
  };

  const remove = async () => {
    await productsApi.remove(editingId);
    setShowForm(false);
    load();
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <NavLink to="/more" className="btn-ghost px-0">← More</NavLink>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[24px]">Products</h2>
        <Button onClick={openAdd}>+ Product</Button>
      </div>

      {showForm && (
        <Blueprint className="p-3.5">
          <form onSubmit={submit} className="flex flex-col gap-3">
            <h6 className="m-0 text-accent-700">{editingId ? 'Edit product' : 'New product'}</h6>
            <Field label="Product name">
              <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] text-muted">Materials used</span>
                <button type="button" className="btn-ghost text-[11px]" onClick={addMaterialRow}>+ Add</button>
              </div>
              {form.materialsUsed.map((row, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <select className={`${inputCls} flex-1`} value={row.materialId} onChange={(e) => updateMaterialRow(i, 'materialId', e.target.value)}>
                    <option value="">Select material</option>
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>{m.material} {m.color}</option>
                    ))}
                  </select>
                  <input type="number" placeholder="grams" className={`${inputCls} w-24`} value={row.grams} onChange={(e) => updateMaterialRow(i, 'grams', e.target.value)} />
                  <button type="button" className="btn-danger text-xs" onClick={() => removeMaterialRow(i)}>✕</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <Field label="Print time (h)" className="flex-1">
                <input type="number" step="0.1" className={inputCls} value={form.printTimeHours} onChange={(e) => setForm({ ...form, printTimeHours: e.target.value })} />
              </Field>
              <Field label="Printer" className="flex-1">
                <select className={inputCls} value={form.printerId} onChange={(e) => setForm({ ...form, printerId: e.target.value })}>
                  <option value="">Select printer</option>
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="flex gap-2.5">
              <Field label="Failure/waste rate %" className="flex-1">
                <input type="number" step="0.1" className={inputCls} value={form.failureRatePct} onChange={(e) => setForm({ ...form, failureRatePct: e.target.value })} />
              </Field>
              <Field label="Packaging cost (RM)" className="flex-1">
                <input type="number" step="0.01" className={inputCls} value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
              </Field>
            </div>
            <Field label="Packaging used (notes)">
              <input className={inputCls} value={form.packagingUsed} onChange={(e) => setForm({ ...form, packagingUsed: e.target.value })} />
            </Field>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[13px] text-muted">Labor tasks used</span>
                <button type="button" className="btn-ghost text-[11px]" onClick={addLaborRow}>+ Add</button>
              </div>
              {form.laborTasksUsed.map((row, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <select className={`${inputCls} flex-1`} value={row.taskId} onChange={(e) => updateLaborRow(i, 'taskId', e.target.value)}>
                    <option value="">Select task</option>
                    {labor.map((l) => (
                      <option key={l.id} value={l.id}>{l.task} ({rm(l.rate)}/h)</option>
                    ))}
                  </select>
                  <input type="number" step="0.1" placeholder="hours" className={`${inputCls} w-24`} value={row.hours} onChange={(e) => updateLaborRow(i, 'hours', e.target.value)} />
                  <button type="button" className="btn-danger text-xs" onClick={() => removeLaborRow(i)}>✕</button>
                </div>
              ))}
            </div>

            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              {editingId && <Button type="button" variant="danger" onClick={remove}>Delete</Button>}
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </Blueprint>
      )}

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <Blueprint key={p.id} onClick={() => openEdit(p)} className="cursor-pointer px-3.5 py-3">
            <div className="text-[14px] font-medium">{p.name}</div>
            <div className="mt-1 text-[11px] text-muted">
              Material {rm(p.cost.materialCost)} · Printer {rm(p.cost.printerCost)} · Labor {rm(p.cost.laborCost)} · Packaging {rm(p.cost.packagingCost)}
            </div>
            <div className="pp-num mt-1 text-[15px] text-accent-700">Total cost: {rm(p.cost.totalCost)}</div>
          </Blueprint>
        ))}
        {products.length === 0 && <p className="text-sm text-muted">No products yet.</p>}
      </div>
    </div>
  );
}
