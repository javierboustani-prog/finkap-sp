// supabase/functions/analizar-grano/index.ts
// Edge Function "analizar-grano" — el panel de agentes expertos de Finkap.
//
// La "llave final": recibe la salida DETERMINISTA del cerebro (grano-cerebro.js)
// + la ficha del productor + la foto del grano, y hace que varios EXPERTOS
// (catador, clasificador físico, agrónomo, tostador, comercial) analicen y
// EXPLIQUEN el lote. El rubro determinista YA decidió puntaje/tier/precio:
// la IA no los cambia, solo interpreta, marca alertas y evalúa coherencia.
// Nunca inventa notas sensoriales absolutas. Amplio: de comercial a exótico.
//
// Seguridad: la API key vive como secreto del lado servidor (ANTHROPIC_API_KEY),
// nunca en el front. Deploy + secreto: ver README.md en esta carpeta.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

// esquema de salida (structured outputs): el panel devuelve JSON validado
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    resumen: { type: "string", description: "Consenso del panel en 2-3 frases, claro y profesional." },
    categoria: { type: "string", enum: ["regional", "especialidad", "exotico"],
      description: "Confirma la categoría que ya derivó el rubro determinista desde el puntaje." },
    coherencia_foto_ficha: { type: "string",
      description: "¿La foto del grano es coherente con lo declarado (origen, proceso, variedad, criba, humedad)? Concreto." },
    confianza_visual: { type: "integer", description: "0-100: qué tan confiable es el análisis a partir de esta foto." },
    riesgos: { type: "array", items: { type: "string" },
      description: "Alertas de green grading visibles o inferibles (defectos, secado, fermento, oxidación, humedad)." },
    lentes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", enum: ["sensorial", "fisico", "agronomo", "tostador", "comercial"] },
          rol: { type: "string" },
          lectura: { type: "string", description: "Lectura del experto. Notas SOLO como potenciales según variedad/origen/proceso, a confirmar en taza." },
          alertas: { type: "array", items: { type: "string" } },
        },
        required: ["id", "rol", "lectura", "alertas"],
      },
    },
  },
  required: ["resumen", "categoria", "coherencia_foto_ficha", "confianza_visual", "riesgos", "lentes"],
};

const SYSTEM = `Sos el panel de expertos en café verde de Finkap (Argentina), un grupo de especialistas que evalúa lotes de café de comercial a especialidad y exótico. El panel: Catador/Q-grader (sensorial), Clasificador físico (green grading), Agrónomo (origen/variedad/proceso/altitud), Tostador y Comercial.

REGLAS DURAS:
- El RUBRO DETERMINISTA ya decidió el puntaje, la categoría/tier y el precio. NO los cambies ni los recalcules: tu trabajo es INTERPRETAR, EXPLICAR y marcar ALERTAS.
- NUNCA inventes notas sensoriales absolutas del lote. Las notas son perfiles TÍPICOS por variedad/origen/proceso y van como "potenciales, a confirmar en taza".
- Sé honesto: si la foto es de baja calidad o no alcanza para concluir algo, decílo y bajá la confianza_visual.
- Evaluá coherencia entre la FOTO y la FICHA declarada: color/uniformidad/criba/defectos vs lo que dice el productor. Señalá inconsistencias.
- Amplio criterio: un café comercial bien presentado es tan válido como un exótico; no castigues por categoría.
- Tono profesional, sin emojis. Respondé en español rioplatense.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "usar POST" }, 405);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "falta ANTHROPIC_API_KEY (secreto del servidor)" }, 500);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "JSON inválido" }, 400); }

  // entrada: ficha + salida del cerebro determinista + foto
  const { ficha = {}, scan = null, cerebro = {}, foto_base64 = null, foto_media_type = "image/jpeg", foto_url = null } = body || {};

  // bloque de imagen (la foto del grano), opcional
  const imgBlock = foto_base64
    ? { type: "image", source: { type: "base64", media_type: foto_media_type, data: foto_base64 } }
    : foto_url
    ? { type: "image", source: { type: "url", url: foto_url } }
    : null;

  const contexto =
`FICHA DECLARADA POR EL PRODUCTOR:
${JSON.stringify(ficha, null, 2)}

SCAN (ProfilePrint / manual), si hay:
${scan ? JSON.stringify(scan, null, 2) : "sin scan físico aún (certificación provisoria)"}

LECTURA DETERMINISTA DEL CEREBRO (ground truth — no la cambies):
- Puntaje: ${cerebro.score ?? "—"}
- Categoría/tier: ${cerebro.tier ?? "—"}
- Precio estimado: ${cerebro.precio != null ? "USD " + cerebro.precio + "/kg" : "—"}
- Confianza: ${cerebro.confianza ?? "—"}
- Nivel de certificación: ${cerebro.nivel ?? "—"}
- Lentes (baseline determinista):
${(cerebro.lentes || []).map((l: any) => `  • ${l.rol}: ${l.lectura}`).join("\n") || "  (sin baseline)"}

${imgBlock ? "Abajo va la FOTO del grano verde para tu análisis visual." : "No se adjuntó foto: hacé el análisis sólo con ficha + scan y bajá la confianza_visual."}

Devolvé el análisis del panel completo.`;

  const userContent: any[] = [{ type: "text", text: contexto }];
  if (imgBlock) userContent.push(imgBlock);

  const payload = {
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: SCHEMA } },
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  };

  let r: Response;
  try {
    r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return json({ error: "no se pudo contactar a Anthropic", detalle: String(e) }, 502);
  }

  const data = await r.json();
  if (!r.ok) return json({ error: "Anthropic " + r.status, detalle: data?.error?.message || data }, 502);
  if (data.stop_reason === "refusal") return json({ error: "la IA declinó el análisis", detalle: data.stop_details }, 422);

  // output_config.format garantiza que el primer bloque text es JSON válido
  const txt = (data.content || []).find((b: any) => b.type === "text")?.text || "{}";
  let analisis: any;
  try { analisis = JSON.parse(txt); } catch { return json({ error: "respuesta no parseable", crudo: txt }, 502); }

  return json({ ok: true, analisis, uso: data.usage, modelo: data.model });
});
