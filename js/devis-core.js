(function () {
  const STORAGE_KEY = "devisCourant_v1";
  const PUBLIC_FACTOR = 1.5; 
  const TVA = 0.20;

  function uid() {
    return "L" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function round2(n) {
    return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
  }

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

  function addLine(line) {
    const devis = readStore();
    line.id = uid();
    devis.lignes.push(line);
    writeStore(devis);
  }

  function computeTotals() {
    const devis = readStore();
