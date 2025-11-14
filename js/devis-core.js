// VERSION NETTOYÉE ET AMÉLIORÉE — devis-core.js
// ------------------------------------------------
// 🔧 Principes :
// - PLUS AUCUNE REMISE DANS LE DEVIS (0% forcé)
// - Les configurateurs envoient déjà des prix remisés
// - Le transport n’est jamais remisé
// - Totaux propres et robustes
// - Moteur simplifié sans logique cachée

const Devis = (function () {

  const STORAGE_KEY = "devisCourant_v1";

  function readStore() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch { return {}; }
  }

  function writeStore(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  function reload() {
    const st = readStore();
    if (!st.lignes) st.lignes = [];
    writeStore(st);
  }

  function clearAll(hard = false) {
    const st = readStore();
    st.lignes = [];
    writeStore(st);
  }

  function addLine(line) {
    const st = readStore();
    if (!st.lignes) st.lignes = [];

    const id = "L" + Date.now() + Math.random().toString(16).slice(2);

    st.lignes.push({
      id,
      designation: line.designation || "Ligne",
      quantite: Number(line.quantite || 1),
      pu_public_ht: Number(line.pu_public_ht || 0),
      total_ligne_ht: Number((line.quantite || 1) * (line.pu_public_ht || 0)),
      type: line.type || "" // "transport" ou normal
    });

    writeStore(st);
    return id;
  }

  function removeLine(id) {
    const st = readStore();
    if (!st.lignes) st.lignes = [];
    st.lignes = st.lignes.filter(l => l.id !== id);
    writeStore(st);
  }

  function updateQty(id, q) {
    q = Number(q);
    if (!(q > 0)) return;
    const st = readStore();
    if (!st.lignes) st.lignes = [];
    const l = st.lignes.find(x => x.id === id);
    if (!l) return;
    l.quantite = q;
    l.total_ligne_ht = Number((l.pu_public_ht || 0) * q);
    writeStore(st);
  }

  function computeTotals() {
    const st = readStore();
    if (!st.lignes) st.lignes = [];

    const lignes = st.lignes;

    // 🔥 Remise désactivée
    const remise_pct = 0;

    let sumNonTransport = 0;
    let sumTransport = 0;

    for (const l of lignes) {
      const t = Number(l.total_ligne_ht || 0);

      if ((l.type || "").toLowerCase() === "transport")
        sumTransport += t;
      else
        sumNonTransport += t;
    }

    // Remise appliquée UNIQUEMENT sur les lignes non-transport
    const afterDiscount = sumNonTransport * (1 - remise_pct / 100);

    const total_ht = afterDiscount + sumTransport;
    const tva = total_ht * 0.20;
    const total_ttc = total_ht + tva;

    return {
      remise_pct,
      lignes,
      total_ht: +total_ht.toFixed(2),
      tva: +tva.toFixed(2),
      total_ttc: +total_ttc.toFixed(2)
    };
  }

  function setRemise(v) {
    // Désactivé — toujours 0%
    const st = readStore();
    st.remise_pct = 0;
    writeStore(st);
  }

  return {
    reload,
    clearAll,
    addLine,
    removeLine,
    updateQty,
    computeTotals,
    setRemise
  };
})();

// Fin du fichier
