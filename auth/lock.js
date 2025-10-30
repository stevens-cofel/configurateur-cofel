<!-- /auth/lock.js -->
<script type="module">
  import { AUTH_SETTINGS } from "./config.js";

  const TOKEN_KEY = `auth_token_${AUTH_SETTINGS.siteId}`;

  function getToken() {
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); }
    catch { return null; }
  }

  function isTokenValid(tok) {
    if (!tok || typeof tok !== "object") return false;
    if (!tok.exp || Date.now() > tok.exp) return false;
    // Optionnel : on lie le token à l’UA pour limiter un peu le partage.
    if (tok.ua && tok.ua !== navigator.userAgent) return false;
    return true;
  }

  function logoutIfRequested() {
    const url = new URL(location.href);
    if (url.searchParams.get("logout") === "1") {
      localStorage.removeItem(TOKEN_KEY);
      // Nettoie le paramètre et redirige vers la page de connexion
      url.searchParams.delete("logout");
      const back = encodeURIComponent(url.toString());
      location.replace(`/auth/login.html?return=${back}`);
    }
  }

  function ensureAuth() {
    logoutIfRequested();

    const tok = getToken();
    if (isTokenValid(tok)) return; // OK, on laisse afficher la page

    // sinon, redirection vers la page de connexion
    const ret = encodeURIComponent(location.href);
    location.replace(`/auth/login.html?return=${ret}&site=${encodeURIComponent(AUTH_SETTINGS.siteId)}`);
  }

  ensureAuth();
</script>
