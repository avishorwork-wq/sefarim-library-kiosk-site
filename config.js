/* Backend endpoints. Defaults inside index.html point at the existing sheet-backed service. Override here to change the backend without editing index.html. */
window.KIOSK_CONFIG={
  dataEndpoint: 'https://script.google.com/macros/s/AKfycbysgzWStmxSyhZgejGV6JobiUc6g3v_98RUviisAczv8yf1MbDA3hRWNrXlCcyfeCNz/exec',
  adminEndpoint: 'https://script.google.com/macros/s/AKfycbysgzWStmxSyhZgejGV6JobiUc6g3v_98RUviisAczv8yf1MbDA3hRWNrXlCcyfeCNz/exec',
  requestEndpoint: 'https://script.google.com/macros/s/AKfycbw-vwSy2xw8WTG7iXN9iopdrHoPCz3GoCFjetW6tdhANgN-wNWNmC2Q6tC0P-tkd20/exec',
  hebrewCatalogUrl: './1-he303-v2-readonly.json',
  // dataEndpoint: 'https://.../?data=',   // must answer GET ?data=version|catalog|vectors with CORS
  googleClientId: '687200563299-f55ah9rpke9noq5u3plpl24ffgvmhtai.apps.googleusercontent.com',   // public OAuth Web client ID (not a secret); admin sign-in stays disabled while empty
  // requestEndpoint: 'https://...'        // must accept the request form POST (name, request, details, contact, website honeypot)
};
