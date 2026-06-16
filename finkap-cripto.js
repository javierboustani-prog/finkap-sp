/* finkap-cripto.js — cifrado real de datos sensibles (AES-GCM + PBKDF2).
   La clave del equipo NUNCA se guarda: deriva una llave que cifra/descifra.
   Sin la clave correcta, el descifrado FALLA (no devuelve basura, tira error).
   Usado por encriptar-datos.html (cifrar) y por entrar.html de la Torre (descifrar). */
(function(){
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64  = buf => { let s=''; const u=new Uint8Array(buf); for(let i=0;i<u.length;i++) s+=String.fromCharCode(u[i]); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));

  async function deriveKey(pass, salt){
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name:'PBKDF2', salt, iterations:200000, hash:'SHA-256' },
      base, { name:'AES-GCM', length:256 }, false, ['encrypt','decrypt']);
  }

  window.finkapEncrypt = async function(obj, pass){
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv   = crypto.getRandomValues(new Uint8Array(12));
    const key  = await deriveKey(pass, salt);
    const ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(obj)));
    return { v:1, salt:b64(salt), iv:b64(iv), ct:b64(ct) };
  };

  window.finkapDecrypt = async function(blob, pass){
    const salt = unb64(blob.salt), iv = unb64(blob.iv), ct = unb64(blob.ct);
    const key  = await deriveKey(pass, salt);
    const pt   = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);  // tira si la clave es incorrecta
    return JSON.parse(dec.decode(pt));
  };
})();
