/* ============================================================
   FINKAP · Config de Supabase (segura para el navegador)
   La clave "publishable" es pública por diseño: la seguridad
   real la dan las políticas RLS de la base (ver supabase-schema.sql).
   ============================================================ */
window.FINKAP_SB = {
  url: "https://hgwiccmqzfcvcyvbylkx.supabase.co",
  key: "sb_publishable_XjtdOaGjHtpaeopBPWLtPw_vjiw5vZB"
};

/* Cliente REST minimalista (sin SDK, sin build) -------------
   El público NO inserta directo en la tabla (RLS lo bloquea):
   crea pedidos vía la función controlada crear_pedido(), que
   fuerza estado='nuevo' y devuelve el código de pedido. */
window.sbRpc = async function(fn, args){
  const r = await fetch(`${FINKAP_SB.url}/rest/v1/rpc/${fn}`, {
    method:"POST",
    headers:{
      "apikey":FINKAP_SB.key,
      "Authorization":"Bearer "+FINKAP_SB.key,
      "Content-Type":"application/json"
    },
    body: JSON.stringify(args||{})
  });
  if(!r.ok){ throw new Error("Supabase "+r.status+": "+await r.text()); }
  return r.json();
};

/* Subir un archivo (foto de grano) al banco de imágenes (Storage).
   El bucket es privado: el público sube pero no lista/lee las demás. */
window.sbUpload = async function(bucket, path, file){
  const r = await fetch(`${FINKAP_SB.url}/storage/v1/object/${bucket}/${path}`, {
    method:"POST",
    headers:{
      "apikey":FINKAP_SB.key,
      "Authorization":"Bearer "+FINKAP_SB.key,
      "Content-Type": file.type || "application/octet-stream"
    },
    body: file
  });
  if(!r.ok){ throw new Error("Storage "+r.status+": "+await r.text()); }
  return r.json(); // { Key, Id }
};
