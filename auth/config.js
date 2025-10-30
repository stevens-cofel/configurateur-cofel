<!-- /auth/config.js -->
<script type="module">
  // Identifiant de "zone" protégée (si vous protégez d'autres pages plus tard).
  export const AUTH_SETTINGS = {
    siteId: "cofel-configs",
    // Empreinte SHA-256 du mot de passe "Cofel2025!" (à changer si besoin).
    // Utilisez /auth/hash.html pour générer l'empreinte de votre propre mot de passe.
    passwordHash: "b9c772f6b5e2b4a4f7d5630f4d0f5b1c1a13f02f5c1d4b2c8b1a4c6322b7a4e8",
    tokenDays: 7 // durée de validité du jeton
  };
</script>
