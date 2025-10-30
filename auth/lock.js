// /auth/lock.js
import { AUTH_SETTINGS } from "./config.js";

const TOKEN_KEY = `auth_token_${AUTH_SETTINGS.siteId}`;

function getToken() {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY) || "null"); }
  catch { return null; }
}
function isTokenValid(tok) {
  if (!tok || typeof tok !== "object") return false;
  if (!tok.exp || Date.now() > tok.exp) return false;
  if (tok.ua && tok.ua !== navigator.userAgent) return false;
  return true;
}

// base du "project site" GitHub Pages -> "/<repo-name>/"
function getProjectBase() {
  const parts = location.pathname.split("/").filter(Boolean);
  const project = parts.length ? parts[0] : "";
  return `/${project}/`;
}

function redirectToLogin() {
  const base = getProjectBase(); // ex: "/configurateur-cofel/"
  const loginURL = new URL(base + "auth/login.html", location.origin);
  loginURL.searchParams.set("return", location.href);
  location.replace(loginURL.toString());
}

(function ensureAuth(){
  // logout via ?logout=1
  const url = new URL(location.href);
  if (url.searchParams.get("logout") === "1") {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    url.searchParams.delete("logout");
    history.replaceState({}, "", url.toString());
    redirectToLogin();
    return;
  }

  const tok = getToken();
  if (!isTokenValid(tok)) redirectToLogin();
})();
