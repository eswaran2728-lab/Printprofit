import { useEffect, useState } from 'react';
import { productsApi, materialsApi, printersApi, laborApi } from '../api/client';
import { Card, Field, inputCls, Button, rm } from '../components/ui';

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

  const submit = async (e) => {
    e.preventDefault();
    if (editingId) await productsApi.update(editingId, form);
    else await productsApi.create(form);
    setForm(emptyForm);
    setEditingId(null);
    load();
  };

  const edit = (p) => {
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
    setEditingId(p.id);
  };

  const remove = async (id) => {
    await productsApi.remove(id);
    load();
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-700">Product Cost Calculator</h2>

      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Product Name">
            <input className={inputCls} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Materials Used</span>
              <button type="button" className="text-xs text-purple-600" onClick={addMaterialRow}>+ Add</button>
            </div>
            {form.materialsUsed.map((row, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className={`${inputCls} flex-1`} value={row.materialId} onChange={(e) => updateMaterialRow(i, 'materialId', e.target.value)}>
                  <option value="">Select material</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>{m.material} {m.color}</option>
                  ))}
                </select>
                <input type="number" placeholder="grams" className={`${inputCls} w-24`} value={row.grams} onChange={(e) => updateMaterialRow(i, 'grams', e.target.value)} />
                <button type="button" className="text-red-500 text-xs" onClick={() => removeMaterialRow(i)}>✕</button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Print Time (h)">
              <input type="number" step="0.1" className={inputCls} value={form.printTimeHours} onChange={(e) => setForm({ ...form, printTimeHours: e.target.value })} />
            </Field>
            <Field label="Printer">
              <select className={inputCls} value={form.printerId} onChange={(e) => setForm({ ...form, printerId: e.target.value })}>
                <option value="">Select printer</option>
                {printers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Failure/Waste Rate %">
              <input type="number" step="0.1" className={inputCls} value={form.failureRatePct} onChange={(e) => setForm({ ...form, failureRatePct: e.target.value })} />
            </Field>
            <Field label="Packaging Cost (RM)">
              <input type="number" step="0.01" className={inputCls} value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
            </Field>
            <Field label="Packaging Used (notes)">
              <input className={inputCls} value={form.packagingUsed} onChange={(e) => setForm({ ...form, packagingUsed: e.target.value })} />
            </Field>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-600">Labor Tasks Used</span>
              <button type="button" className="text-xs text-purple-600" onClick={addLaborRow}>+ Add</button>
            </div>
            {form.laborTasksUsed.map((row, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <select className={`${inputCls} flex-1`} value={row.taskId} onChange={(e) => updateLaborRow(i, 'taskId', e.target.value)}>
                  <option value="">Select task</option>
                  {labor.map((l) => (
                    <option key={l.id} value={l.id}>{l.task} ({rm(l.rate)}/h)</option>
                  ))}
                </select>
                <input type="number" step="0.1" placeholder="hours" className={`${inputCls} w-24`} value={row.hours} onChange={(e) => updateLaborRow(i, 'hours', e.target.value)} />
                <button type="button" className="text-red-500 text-xs" onClick={() => removeLaborRow(i)}>✕</button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit">{editingId ? 'Update Product' : 'Add Product'}</Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-500">
                  Material {rm(p.cost.materialCost)} · Printer {rm(p.cost.printerCost)} · Labor {rm(p.cost.laborCost)} · Packaging {rm(p.cost.packagingCost)}
                </p>
                <p className="text-sm font-semibold text-purple-600 mt-1">Total Cost: {rm(p.cost.totalCost)}</p>
              </div>
              <div className="flex gap-2 text-xs">
                <button className="text-purple-600" onClick={() => edit(p)}>Edit</button>
                <button className="text-red-500" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          </Card>
        ))}
        {products.length === 0 && <p className="text-sm text-gray-400">No products yet.</p>}
      </div>
    </div>
  );
}
