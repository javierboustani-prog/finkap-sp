/* gate.js — acceso interno Finkap (disuasivo client-side).
   Oculta la vista hasta ingresar la clave. Una vez correcta, queda abierta toda
   la sesión (sessionStorage). OJO: esto disuade el acceso casual; NO encripta —
   los datos siguen en el código fuente. Para datos sensibles (bancos/pagos) se
   usa encriptación real, no este gate.
   Clave por defecto: "finkap2026". Cambiala con set-clave.html (pegá el hash nuevo).

   "Recordar en este equipo": si tildás la casilla, guardamos el hash de la clave
   vigente en localStorage de ESTE dispositivo y no se vuelve a pedir. Como guardamos
   el hash de la clave actual, si rotás la clave con set-clave.html el recuerdo viejo
   deja de valer solo y se vuelve a pedir. Para olvidar este equipo: borrá los datos
   del sitio en el navegador, o usá set-clave para rotar la clave. */
(function(){
  var KEY='finkap_gate_v1';          // sesión activa (se borra al cerrar el navegador)
  var PKEY='finkap_gate_persist_v1';  // equipo recordado (persiste); guarda el hash vigente
  var PASS_HASH='4654edf5ac7faee59d171823146053056ddb8893055396bf33e9d63ae61117bc'; // SHA-256 de la clave
  if(sessionStorage.getItem(KEY)==='ok') return;
  // equipo recordado con la clave vigente -> abrir sin pedir nada
  try{ if(localStorage.getItem(PKEY)===PASS_HASH){ sessionStorage.setItem(KEY,'ok'); return; } }catch(e){}

  var hide=document.createElement('style');
  hide.id='gate-hide'; hide.textContent='body{visibility:hidden !important}';
  document.documentElement.appendChild(hide);

  async function sha(s){
    var h=await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return Array.from(new Uint8Array(h)).map(function(b){return b.toString(16).padStart(2,'0');}).join('');
  }
  function build(){
    var o=document.createElement('div'); o.id='gate-ov';
    o.style.cssText='position:fixed;inset:0;z-index:99999;background:#0d0d0f;display:flex;align-items:center;justify-content:center;font-family:Inter,system-ui,sans-serif;visibility:visible';
    o.innerHTML=''
      +'<div style="width:300px;max-width:88vw;text-align:center;color:#f5f5f7">'
      +'<div style="width:46px;height:46px;border-radius:50%;border:2.5px solid #F97316;display:grid;place-items:center;color:#F97316;font-weight:900;font-size:22px;margin:0 auto 16px">f</div>'
      +'<div style="font-weight:800;font-size:18px;margin-bottom:4px">Finkap · acceso interno</div>'
      +'<div style="color:#9b9ba6;font-size:12px;margin-bottom:16px">Vista privada. Ingresá la clave del equipo.</div>'
      +'<input id="gate-pw" type="password" autocomplete="current-password" placeholder="Clave" style="width:100%;padding:11px 12px;border-radius:10px;border:1px solid #3a3a43;background:#222228;color:#f5f5f7;font-size:14px;outline:none;font-family:inherit;margin-bottom:8px">'
      +'<div id="gate-err" style="color:#ef5350;font-size:12px;min-height:16px;margin-bottom:8px"></div>'
      +'<button id="gate-go" style="width:100%;padding:11px;border-radius:10px;border:none;background:#F97316;color:#fff;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit">Entrar</button>'
      +'<label for="gate-rm" style="display:flex;align-items:center;justify-content:center;gap:7px;margin-top:12px;color:#9b9ba6;font-size:12px;cursor:pointer;user-select:none">'
      +'<input id="gate-rm" type="checkbox" checked style="width:15px;height:15px;accent-color:#F97316;cursor:pointer">Recordar en este equipo</label>'
      +'</div>';
    document.documentElement.appendChild(o);
    var pw=o.querySelector('#gate-pw'), err=o.querySelector('#gate-err'), rm=o.querySelector('#gate-rm');
    async function go(){
      var h=await sha(pw.value);
      if(h===PASS_HASH){
        sessionStorage.setItem(KEY,'ok');
        try{ if(rm.checked) localStorage.setItem(PKEY,PASS_HASH); else localStorage.removeItem(PKEY); }catch(e){}
        o.remove(); var hs=document.getElementById('gate-hide'); if(hs) hs.remove();
      }
      else { err.textContent='Clave incorrecta'; pw.value=''; pw.focus(); }
    }
    o.querySelector('#gate-go').addEventListener('click', go);
    pw.addEventListener('keydown', function(e){ if(e.key==='Enter') go(); });
    pw.focus();
  }
  if(document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
