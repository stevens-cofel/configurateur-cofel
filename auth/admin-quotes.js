// ============================================================================
// Admin - Liste des devis Cofel
// Charge les devis depuis le Worker + filtres dynamiques + bouton Voir
// ============================================================================

const API_URL = "https://cofel-auth.sonveven.workers.dev";

const tbody = document.querySelector("#tableQuotes tbody");
const fEmail = document.getElementById("searchEmail");
const fCompany = document.getElementById("searchCompany");
const fProduct = document.getElementById("searchProduct");
const fDate = document.getElementById("searchDate");

let allQuotes = [];

// ======================= CHARGEMENT DES DEVIS =======================
async function loadQuotes(){
  tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;color:var(--txt-dim);text-align:center;">Chargement...</td></tr>`;

  try{
    const res = await fetch(API_URL + "/list-quotes");
    const data = await res.json();

    if(!data.ok){ throw new Error("Erreur API"); }

    allQuotes = data.quotes || [];
    renderQuotes();

  }catch(err){
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;color:red;text-align:center;">Erreur de chargement</td></tr>`;
  }
}

// ======================= AFFICHAGE DES LIGNES =======================
function renderQuotes(){

  const emailVal = fEmail.value.toLowerCase().trim();
  const compVal = fCompany.value.toLowerCase().trim();
  const prodVal = fProduct.value;
  const dateVal = fDate.value;

  const filtered = allQuotes.filter(q => {
    if(emailVal && !q.client_email.toLowerCase().includes(emailVal)) return false;
    if(compVal && !(q.client_company||"").toLowerCase().includes(compVal)) return false;
    if(prodVal && q.product_type !== prodVal) return false;
    if(dateVal && !q.created_at.startsWith(dateVal)) return false;
    return true;
  });

  if(filtered.length === 0){
    tbody.innerHTML = `<tr><td colspan="7" style="padding:20px;text-align:center;color:var(--txt-dim);">Aucun devis trouvé</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(q => `
      <tr>
        <td>${formatDate(q.created_at)}</td>
        <td>${q.client_email}</td>
        <td>${q.client_company || "-"}</td>
        <td>${q.client_name || "-"}</td>
        <td>${q.product_type}</td>
        <td>${formatEuros(q.total_ht)}</td>
        <td><button class="btn-view" onclick="viewQuote(${q.id})">Voir</button></td>
      </tr>
  `).join("");
}

// ======================= FORMATAGE =======================
function formatDate(iso){
  try{
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR") + " " + d.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"});
  }catch{
    return iso;
  }
}

function formatEuros(n){
  return Number(n).toFixed(2).replace('.', ',') + " €";
}

// ======================= ACTION : VOIR DEVIS =======================
function viewQuote(id){
  alert("(A venir) Voir devis ID: " + id);
  // Plus tard : page détail devis
  // window.location.href = `admin-quote-detail.html?id=${id}`;
}

// ======================= ÉCOUTEURS DE FILTRES =======================
[fEmail, fCompany, fProduct, fDate].forEach(el => {
  el.addEventListener("input", renderQuotes);
});

// ======================= INITIALISATION =======================
loadQuotes();
