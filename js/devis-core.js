(function () {
  const STORAGE_KEY = "devisCourant_v1";
  const PUBLIC_FACTOR = 1.5;     // +50% pour tarif public
  const TVA = 0.20;

  // Utils
  function uid() {
    return "L" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }
  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

  // Store helpers
  function createEmptyDevis() {
    return {
      id: "D-" + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      remise_client_pct: 0,
      tva: TVA,
      client: { societe: "", contact: "", email: "", tel: "", adresse: "" },
      lignes: [],
    };
  }
  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createEmptyDevis();
      const obj = JSON.parse(raw);
      if (!obj || !Array.isArray(obj.lignes)) return createEmptyDevis();
      return obj;
    } catch {
      return createEmptyDevis();
    }
  }
  function writeStore(devis) {
    devis.updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(devis));
  }

  // --- API lignes ---
  function addLine(line) {
    const devis = readStore();
    if (!line || !Number(line.quantite) || line.pu_interne_ht === undefined) {
      throw new Error("Ligne invalide (quantite et pu_interne_ht requis)");
    }
    line.id = uid();
    line.quantite = Math.max(1, Number(line.quantite));
    line.pu_interne_ht = Number(line.pu_interne_ht);
    devis.lignes.push(line);
    writeStore(devis);
    return line.id;
  }

  function listLines() {
    return readStore().lignes.slice();
  }

  function removeLine(id) {
    const devis = readStore();
    const before = devis.lignes.length;
    devis.lignes = devis.lignes.filter(l => l.id !== id);
    writeStore(devis);
    return before !== devis.lignes.length;
  }

  function updateQty(id, qty) {
    const devis = readStore();
    const q = Math.max(1, Math.floor(Number(qty) || 1));
    const row = devis.lignes.find(l => l.id === id);
    if (!row) return false;
    row.quantite = q;
    writeStore(devis);
    return true;
  }

  function clearAll(confirm = false) {
    if (!confirm) return false;
    writeStore(createEmptyDevis());
    return true;
  }

  // --- Calculs ---
  function computeTotals() {
    const devis = readStore();
    const remise = Number(devis.remise_client_pct || 0) / 100;

    const lignes = devis.lignes.map((l) => {
      const pu_public = Number(l.pu_interne_ht) * PUBLIC_FACTOR;
      const pu_net = round2(pu_public * (1 - remise));
      const total_ht = round2(pu_net * Number(l.quantite));
      return { ...l, pu_net_ht: pu_net, total_ligne_ht: total_ht };
    });

    const total_ht = round2(lignes.reduce((s, x) => s + x.total_ligne_ht, 0));
    const tva = round2(total_ht * TVA);
    const total_ttc = round2(total_ht + tva);

    return { lignes, total_ht, tva, total_ttc, remise_pct: devis.remise_client_pct };
  }

  // --- Remise ---
  function setRemise(pct) {
    const devis = readStore();
    const v = Number(pct);
    devis.remise_client_pct = isNaN(v) ? 0 : Math.min(90, Math.max(0, v));
    writeStore(devis);
  }
  function getRemise() {
    return readStore().remise_client_pct || 0;
  }

  // Expose
  window.Devis = {
    addLine,
    listLines,
    removeLine,
    updateQty,
    clearAll,
    computeTotals,
    setRemise,
    getRemise
  };
})();
