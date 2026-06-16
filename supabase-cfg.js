/* ============================================================
   FINKAP · Config de Supabase (segura para el navegador)
   La clave "publishable" es pública por diseño: la seguridad
   real la dan las políticas RLS de la base (ver supabase-schema.sql).
   ============================================================ */
window.FINKAP_SB = {
  url: "https://hgwiccmqzfcvcyvbylkx.supabase.co",
  key: "sb_publishable_XjtdOaGjHtpaeopBPWLtPw_vjiw5vZB"
};

/* Cliente REST minimalista (sin SDK, sin build) ------------- */
window.sbInsert = async function(table, row){
  const r = await fetch(`${FINKAP_SB.url}/rest/v1/${table}`, {
    method:"POST",
    headers:{
      "apikey":FINKAP_SB.key,
      "Authorization":"Bearer "+FINKAP_SB.key,
      "Content-Type":"application/json",
      "Prefer":"return=representation"
    },
    body: JSON.stringify(row)
  });
  if(!r.ok){ throw new Error("Supabase "+r.status+": "+await r.text()); }
  return (await r.json())[0];
};
