/* =====================================================================
   devis-core.js — moteur de devis unifié (SANS uplift +50 %)
   ---------------------------------------------------------------------
   Rôle :
   - Stocker les lignes de devis (localStorage)
   - Gérer la remise commerciale (en %)
   - Calculer les totaux HT / TVA / TTC
   - Exposer des helpers CRUD (add / list / update / remove / clear)
   IMPORTANT : AUCUNE MAJORATION +50 % ICI. 
               Les configurateurs doivent envoyer un PU public déjà majoré.
   ===================================================================== */

(function (global) {
  "use strict";

  const STORAGE_KEY = "devisCourant_v1"; // clé unique (lignes + client + remise)

  // --- Config globale ---
  const TVA_RATE = 0.20;          // TVA fixe 20 %
  const MAX_REM = 90;             // garde-fou pour la remise
  const MIN_REM = 0;

  // --- Utilitaires ---
  const clamp = (n, a, b) => Math.max(a, Math.min(b, Number(n) || 0));

  function uid() {
    // petit id lisible
    const s = Math.random().toString(36).slice(2, 8);
    const t = Date.now().toString(36).slice(-6);
    return `L${s}${t}`;
  }

  function readStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return { lignes: [], remise_pct: 0, client: {} };
      }
      const parsed = JSON.parse(raw);
      // normalisation douce
      if (!Array.isArray(parsed.lignes)) parsed.lignes = [];
      parsed.remise_pct = clamp(parsed.remise_pct, MIN_REM, MAX_REM);
      if (!parsed.client || typeof parsed.client !== "object") parsed.client = {};
      return parsed;
    } catch {
      return { lignes: [], remise_pct: 0, client: {} };
    }
  }

  function writeStore(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // --- Cœur CRUD ---
  function addLine(payload) {
    // payload attendu minimal :
    // { designation, quantite, pu_interne_ht OU pu_public_ht, type?, options?, dimensions? }
    // >>> Ici, ON STOCKE LE PRIX TEL QU’ON LE REÇOIT COMME "PU NET" (pas d’uplift).
    const st = readStore();

    const {
      type = "",
      designation = "-",
      options = "",
      dimensions = "",
      // par convention : si le configurateur envoie pu_public_ht, on le prend.
      // sinon, si pu_interne_ht est fourni, on le prend tel quel (TEMPORAIRE).
      pu_public_ht,
      pu_interne_ht,
      quantite = 1,
    } = payload || {};

    const pu_net_ht = Number.isFinite(pu_public_ht)
      ? Number(pu_public_ht)
      : Number(pu_interne_ht) || 0;

    const line = {
      id: uid(),
      type,
      designation,
      options,
      dimensions,
      quantite: Math.max(1, Number(quantite) || 1),
      // Très important : on stocke le PU “tel quel”.
      // Les configurateurs doivent envoyer le PU PUBLIC (+50 %) dorénavant.
      pu_net_ht: pu_net_ht,
    };

    st.lignes.push(line);
    writeStore(st);
    return line.id;
  }

  function listLines() {
    const st = readStore();
    // Calcul “total_ligne_ht” à la volée
    return st.lignes.map((l) => ({
      ...l,
      total_ligne_ht: (Number(l.pu_net_ht) || 0) * Math.max(1, Number(l.quantite) || 1),
    }));
  }

  function updateQty(lineId, newQty) {
    const st = readStore();
    const q = Math.max(1, Number(newQty) || 1);
    const i = st.lignes.findIndex((x) => x.id === lineId);
    if (i >= 0) {
      st.lignes[i].quantite = q;
      writeStore(st);
      return true;
    }
    return false;
  }

  function removeLine(lineId) {
    const st = readStore();
    const before = st.lignes.length;
    st.lignes = st.lignes.filter((l) => l.id !== lineId);
    writeStore(st);
    return st.lignes.length !== before;
  }

  function clearAll(hard = false) {
    if (hard) {
      // tout effacer (lignes + client + remise)
      localStorage.removeItem(STORAGE_KEY);
      return true;
    }
    // seulement les lignes
    const st = readStore();
    st.lignes = [];
    writeStore(st);
    return true;
  }

  // --- Remise ---
  function setRemise(pct) {
    const st = readStore();
    st.remise_pct = clamp(pct, MIN_REM, MAX_REM);
    writeStore(st);
  }

  function getRemise() {
    return readStore().remise_pct || 0;
  }

  // --- Totaux ---
  function computeTotals() {
    const st = readStore();
    const remise = clamp(st.remise_pct, MIN_REM, MAX_REM);

    // Somme des lignes “telles quelles” (PU déjà publics envoyés par configurateurs)
    const lignes = listLines();

    const total_ht_brut = lignes.reduce((s, l) => s + (Number(l.total_ligne_ht) || 0), 0);

    // Application de la remise commerciale UNIQUEMENT ici
    const total_ht = total_ht_brut * (1 - remise / 100);
    const tva = total_ht * TVA_RATE;
    const total_ttc = total_ht + tva;

    return {
      lignes,
      remise_pct: remise,
      total_ht_brut,
      total_ht,
      tva,
      total_ttc,
    };
  }

  // --- Exposition publique ---
  const api = {
    addLine,
    listLines,
    updateQty,
    removeLine,
    clearAll,
    setRemise,
    getRemise,
    computeTotals,
    // constants utiles
    TVA_RATE,
  };

  // UMD
  global.Devis = api;
})(window);
