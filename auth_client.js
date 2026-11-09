// Page-side admin sign-in (DRAFT). Only the public client ID is here. No secrets.
// Session token is kept in memory only (lost on reload = sign in again).
(function () {
  var cfg = window.KIOSK_CONFIG || {};
  var session = null, timer = null;
  function rand() { var a = new Uint8Array(32); crypto.getRandomValues(a); return Array.from(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  async function sha256Hex(s) { var d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(d), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  async function post(body) {
    var r = await fetch(cfg.requestEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    return r.json();
  }
  window.AdminAuth = {
    isSignedIn: function () { return !!session; },
    call: function (action, payload) { return post(Object.assign({ action: action, session: session }, payload || {})); },
    signIn: async function () {
      var verifier = rand();
      var ch = await post({ action: 'authChallenge', verifierHash: await sha256Hex(verifier) });
      if (!ch.ok) throw new Error(ch.error);
      return new Promise(function (resolve, reject) {
        var client = google.accounts.oauth2.initCodeClient({
          client_id: cfg.googleClientId, scope: 'openid email', ux_mode: 'popup', state: ch.challenge,
          callback: async function (resp) {
            if (resp.error || resp.state !== ch.challenge) return reject(new Error('auth_cancelled'));
            var r = await post({ action: 'authExchange', code: resp.code, state: ch.challenge, verifier: verifier });
            if (!r.ok) return reject(new Error(r.error));
            session = r.session; clearTimeout(timer); timer = setTimeout(function () { session = null; }, r.ttl * 1000);
            resolve(r.email);
          }
        });
        client.requestCode();
      });
    },
    signOut: async function () { var s = session; session = null; if (s) await post({ action: 'authLogout', session: s }); }
  };
})();
