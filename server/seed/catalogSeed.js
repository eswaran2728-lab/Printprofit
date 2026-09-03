import { nanoid } from 'nanoid';

// One-time catalog seed built from the user's TikTok Shop price list + size/material assumptions.
export function buildCatalogSeed() {
  const mat = {
    plaWhite: nanoid(),
    plaBlack: nanoid(),
    petgWhite: nanoid(),
  };
  const materials = [
    { id: mat.plaWhite, material: 'PLA', color: 'White', costPerKg: 40, stockGrams: 0, minStockGrams: 200 },
    { id: mat.plaBlack, material: 'PLA', color: 'Black', costPerKg: 40, stockGrams: 0, minStockGrams: 200 },
    { id: mat.petgWhite, material: 'PETG', color: 'White', costPerKg: 43, stockGrams: 0, minStockGrams: 200 },
  ];

  const printer = {
    a1mini: nanoid(),
    p1s: nanoid(),
  };
  const printers = [
    { id: printer.a1mini, name: 'Bambu Lab A1 Mini', purchasePrice: 899, powerW: 100, lifetimeHours: 8000, annualMaintenance: 100, annualHours: 1500 },
    { id: printer.p1s, name: 'Bambu Lab P1S', purchasePrice: 2199, powerW: 150, lifetimeHours: 8000, annualMaintenance: 150, annualHours: 1500 },
  ];

  const PAINTING_SELF_TASK_ID = 'seed-6'; // matches default seeded labor row in utils/store.js

  const TIERS = {
    mini5cm: { materialId: mat.plaWhite, grams: 35, printerId: printer.a1mini, printTimeHours: 0.75, paintHours: 0.17, packagingCost: 4 },
    in35: { materialId: mat.plaWhite, grams: 60, printerId: printer.a1mini, printTimeHours: 2.5, paintHours: 0.42, packagingCost: 4 },
    in4pla: { materialId: mat.plaWhite, grams: 70, printerId: printer.p1s, printTimeHours: 3, paintHours: 0.5, packagingCost: 4 },
    in4petg: { materialId: mat.petgWhite, grams: 70, printerId: printer.p1s, printTimeHours: 3, paintHours: 0.5, packagingCost: 4 },
    in5pla: { materialId: mat.plaWhite, grams: 80, printerId: printer.p1s, printTimeHours: 5, paintHours: 0.92, packagingCost: 6 },
    in5petg: { materialId: mat.petgWhite, grams: 80, printerId: printer.p1s, printTimeHours: 6, paintHours: 0.92, packagingCost: 6 },
    in9: { materialId: mat.plaBlack, grams: 600, printerId: printer.p1s, printTimeHours: 15, paintHours: 2.5, packagingCost: 6 },
  };

  function productFrom(name, tierKey, packagingUsed = 'Standard box + bubble wrap') {
    const t = TIERS[tierKey];
    return {
      id: nanoid(),
      name,
      materialsUsed: [{ materialId: t.materialId, grams: t.grams }],
      printTimeHours: t.printTimeHours,
      printerId: t.printerId,
      failureRatePct: 5,
      packagingUsed,
      packagingCost: t.packagingCost,
      laborTasksUsed: [{ taskId: PAINTING_SELF_TASK_ID, hours: t.paintHours }],
    };
  }

  const products = [
    productFrom('Divine Murugan Home Idol', 'in4petg'),
    productFrom('Kunci NFC Kontak Custom TikTok – Keychain', 'mini5cm'),
    productFrom('Sri Ganesha Aura Patung Ganesha Putih', 'in35'),
    productFrom('Divine Mahadev Statue (Shivan)', 'in35'),
    productFrom('Thalapathy CM Tribute Sculpture', 'in35'),
    productFrom('ROUND LOTUS FINISH MINI KOVIL', 'in5pla'),
    productFrom('Premium Jadamuni Statue', 'in4pla'),
    productFrom('Dhyanam Muniswarar Premium Statue', 'in35'),
    productFrom('3D Printed Lord Shiva Meditation Statue', 'in4pla'),
    productFrom('Chinna Karuppu – Dashboard Edition', 'in35'),
    productFrom('Bala Murugan Golden Edition', 'in4pla'),
    productFrom('Jalan Baru Veera Muniswarar Car Dashboard', 'in5pla'),
    productFrom('Baby Kaali Car Dashboard', 'in35'),
    productFrom('Madura Veeran – Guardian Warrior Statue', 'in4pla'),
    productFrom('Hanuman Idol Car Dashboard', 'in5pla'),
    productFrom('Angalamman Divine Edition', 'in5petg'),
    productFrom('Mariamman Divine Edition', 'in5petg'),
    productFrom('Pechi Amman Divine Edition', 'in5petg'),
    productFrom('Sri Karumariamman Divine Idol', 'in35'),
    productFrom('Amman Paatham', 'in35'),
    productFrom('Mini Ganesha 3D Printed', 'mini5cm'),
    productFrom('Shivan Paatham', 'in35'),
    productFrom('Kaliamman Idol Car Dashboard', 'in5pla'),
    productFrom('Varahi Amman – Black Addition', 'in5petg'),
    productFrom('Baby Hanuman Car Dashboard', 'mini5cm'),
    productFrom('Murugan & Hanuman Dashboard Mini Statue', 'in5pla'),
    productFrom('Durgai Amman', 'in5petg'),
    productFrom('Lakshmi Black Edition', 'in4pla'),
    productFrom('Sagili Karupar Statue', 'in9'),
  ];

  return { materials, printers, products };
}
