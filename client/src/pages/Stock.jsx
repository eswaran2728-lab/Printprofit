import { useEffect, useState } from 'react';
import { materialsApi, hardwareApi } from '../api/client';
import { Blueprint, Field, inputCls, Button, Tag, Seg, rm } from '../components/ui';

const emptyMaterial = { material: '', color: '', costPerKg: '', stockGrams: '', minStockGrams: '' };
const emptyHardware = { item: '', costPerUnit: '', stock: '', minStock: '' };

export default function Stock() {
  const [tab, setTab] = useState('materials');
  const [materials, setMaterials] = useState([]);
  const [hardware, setHardware] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [materialForm, setMaterialForm] = useState(emptyMaterial);
  const [hardwareForm, setHardwareForm] = useState(emptyHardware);

  const loadMaterials = () => materialsApi.list().then(setMaterials);
  const loadHardware = () => hardwareApi.list().then(setHardware);

  useEffect(() => {
    loadMaterials();
    loadHardware();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setMaterialForm(emptyMaterial);
    setHardwareForm(emptyHardware);
    setShowForm(true);
  };

  const openEditMaterial = (m) => {
    setEditingId(m.id);
    setMaterialForm({ material: m.material, color: m.color, costPerKg: m.costPerKg, stockGrams: m.stockGrams, minStockGrams: m.minStockGrams });
    setShowForm(true);
  };
  const openEditHardware = (h) => {
    setEditingId(h.id);
    setHardwareForm({ item: h.item, costPerUnit: h.costPerUnit, stock: h.stock, minStock: h.minStock });
    setShowForm(true);
  };

  const submitMaterial = async (e) => {
    e.preventDefault();
    if (editingId) await materialsApi.update(editingId, materialForm);
    else await materialsApi.create(materialForm);
    setShowForm(false);
    loadMaterials();
  };
  const submitHardware = async (e) => {
    e.preventDefault();
    if (editingId) await hardwareApi.update(editingId, hardwareForm);
    else await hardwareApi.create(hardwareForm);
    setShowForm(false);
    loadHardware();
  };

  const removeMaterial = async () => {
    await materialsApi.remove(editingId);
    setShowForm(false);
    loadMaterials();
  };
  const removeHardware = async () => {
    await hardwareApi.remove(editingId);
    setShowForm(false);
    loadHardware();
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <h2 className="m-0 text-[24px]">Stock</h2>
        <Button onClick={openAdd}>+ {tab === 'materials' ? 'Material' : 'Hardware'}</Button>
      </div>

      <Seg
        name="stockTab"
        value={tab}
        onChange={(v) => { setTab(v); setShowForm(false); }}
        className="self-start"
        options={[
          { value: 'materials', label: 'Materials' },
          { value: 'hardware', label: 'Hardware' },
        ]}
      />

      {showForm && tab === 'materials' && (
        <Blueprint className="p-3.5">
          <form onSubmit={submitMaterial} className="flex flex-col gap-2.5">
            <h6 className="m-0 text-accent-700">{editingId ? 'Edit material' : 'New material'}</h6>
            <div className="flex gap-2.5">
              <Field label="Material" className="flex-1">
                <input className={inputCls} required value={materialForm.material} onChange={(e) => setMaterialForm({ ...materialForm, material: e.target.value })} />
              </Field>
              <Field label="Color" className="flex-1">
                <input className={inputCls} value={materialForm.color} onChange={(e) => setMaterialForm({ ...materialForm, color: e.target.value })} />
              </Field>
            </div>
            <Field label="Cost/kg (RM)">
              <input type="number" step="0.01" className={inputCls} required value={materialForm.costPerKg} onChange={(e) => setMaterialForm({ ...materialForm, costPerKg: e.target.value })} />
            </Field>
            <div className="flex gap-2.5">
              <Field label="Stock (g)" className="flex-1">
                <input type="number" className={inputCls} required value={materialForm.stockGrams} onChange={(e) => setMaterialForm({ ...materialForm, stockGrams: e.target.value })} />
              </Field>
              <Field label="Min stock (g)" className="flex-1">
                <input type="number" className={inputCls} value={materialForm.minStockGrams} onChange={(e) => setMaterialForm({ ...materialForm, minStockGrams: e.target.value })} />
              </Field>
            </div>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              {editingId && <Button type="button" variant="danger" onClick={removeMaterial}>Delete</Button>}
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </Blueprint>
      )}

      {showForm && tab === 'hardware' && (
        <Blueprint className="p-3.5">
          <form onSubmit={submitHardware} className="flex flex-col gap-2.5">
            <h6 className="m-0 text-accent-700">{editingId ? 'Edit hardware' : 'New hardware'}</h6>
            <Field label="Item">
              <input className={inputCls} required value={hardwareForm.item} onChange={(e) => setHardwareForm({ ...hardwareForm, item: e.target.value })} />
            </Field>
            <Field label="Cost/unit (RM)">
              <input type="number" step="0.01" className={inputCls} required value={hardwareForm.costPerUnit} onChange={(e) => setHardwareForm({ ...hardwareForm, costPerUnit: e.target.value })} />
            </Field>
            <div className="flex gap-2.5">
              <Field label="Stock" className="flex-1">
                <input type="number" className={inputCls} required value={hardwareForm.stock} onChange={(e) => setHardwareForm({ ...hardwareForm, stock: e.target.value })} />
              </Field>
              <Field label="Min stock" className="flex-1">
                <input type="number" className={inputCls} value={hardwareForm.minStock} onChange={(e) => setHardwareForm({ ...hardwareForm, minStock: e.target.value })} />
              </Field>
            </div>
            <div className="mt-1 flex gap-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              {editingId && <Button type="button" variant="danger" onClick={removeHardware}>Delete</Button>}
              <Button type="submit" className="flex-1">Save</Button>
            </div>
          </form>
        </Blueprint>
      )}

      {tab === 'materials' && (
        <div className="flex flex-col gap-2">
          {materials.map((m) => {
            const low = m.stockGrams <= m.minStockGrams;
            return (
              <Blueprint
                key={m.id}
                corners={['tl', 'br']}
                cornerColor={low ? 'var(--color-warn-700)' : undefined}
                onClick={() => openEditMaterial(m)}
                className={`flex cursor-pointer items-center gap-3 px-3.5 py-3 ${low ? 'bg-warn-100 border-warn-700' : ''}`}
              >
                <div className="flex-1">
                  <div className="text-[14px] font-medium">
                    {m.material} <span className="font-normal text-muted">{m.color}</span>
                  </div>
                  <div className="text-[11px] text-muted">{rm(m.costPerKg)}/kg · {rm(m.costPerKg / 1000)}/g</div>
                </div>
                <div className="text-right">
                  <div className="pp-num text-[16px]">{m.stockGrams}g</div>
                  {low && <Tag tone="warn">Reorder</Tag>}
                </div>
              </Blueprint>
            );
          })}
          {materials.length === 0 && <p className="text-sm text-muted">No materials yet.</p>}
        </div>
      )}

      {tab === 'hardware' && (
        <div className="flex flex-col gap-2">
          {hardware.map((h) => {
            const low = h.stock <= h.minStock;
            return (
              <Blueprint
                key={h.id}
                corners={['tl', 'br']}
                cornerColor={low ? 'var(--color-warn-700)' : undefined}
                onClick={() => openEditHardware(h)}
                className={`flex cursor-pointer items-center gap-3 px-3.5 py-3 ${low ? 'bg-warn-100 border-warn-700' : ''}`}
              >
                <div className="flex-1">
                  <div className="text-[14px] font-medium">{h.item}</div>
                  <div className="text-[11px] text-muted">{rm(h.costPerUnit)}/unit</div>
                </div>
                <div className="text-right">
                  <div className="pp-num text-[16px]">{h.stock}</div>
                  {low && <Tag tone="warn">Reorder</Tag>}
                </div>
              </Blueprint>
            );
          })}
          {hardware.length === 0 && <p className="text-sm text-muted">No hardware items yet.</p>}
        </div>
      )}
    </div>
  );
}
