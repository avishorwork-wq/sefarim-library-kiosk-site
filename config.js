/* Backend endpoints. Defaults inside index.html point at the existing sheet-backed service. Override here to change the backend without editing index.html. */
window.KIOSK_CONFIG={
  hebrewCatalogUrl: './1-he303-v2-readonly.json',
  // dataEndpoint: 'https://.../?data=',   // must answer GET ?data=version|catalog|vectors with CORS
  googleClientId: '687200563299-f55ah9rpke9noq5u3plpl24ffgvmhtai.apps.googleusercontent.com',   // public OAuth Web client ID (not a secret); admin sign-in stays disabled while empty
  // requestEndpoint: 'https://...'        // must accept the request form POST (name, request, details, contact, website honeypot)
};
