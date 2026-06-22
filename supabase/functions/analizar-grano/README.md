# Edge Function `analizar-grano` — panel de agentes expertos (Finkap)

Recibe la salida determinista del cerebro (`grano-cerebro.js`) + la ficha + la foto del
grano, y devuelve el análisis de varios expertos (catador, físico, agrónomo, tostador,
comercial) usando Claude **del lado servidor**. El rubro determinista decide los números;
la IA explica y marca alertas. Nunca inventa notas absolutas.

Modelo: `claude-opus-4-8` · thinking adaptativo · structured outputs (JSON validado) · visión.

## Requisitos (una vez)
1. Instalar Supabase CLI: https://supabase.com/docs/guides/cli
2. Loguearte y linkear el proyecto:
   ```
   supabase login
   supabase link --project-ref hgwiccmqzfcvcyvbylkx
   ```
3. Cargar la API key de Anthropic como **secreto** (NO va en el front ni en el repo):
   ```
   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...    (pegá tu key real)
   ```

## Deploy
```
supabase functions deploy analizar-grano
```
Queda en: `https://hgwiccmqzfcvcyvbylkx.supabase.co/functions/v1/analizar-grano`

## Cómo se llama desde el front (ej. certificar.html)
La función pide el header `Authorization: Bearer <publishable key>` (la misma de supabase-cfg.js).

```js
import * as Cerebro from './grano-cerebro.js';
const SB = window.FINKAP_SB;

async function analizarConIA(inp, feeds, fotoBase64, fotoMime){
  const r = Cerebro.evaluarLote(inp, feeds);             // determinista: decide
  const resp = await fetch(`${SB.url}/functions/v1/analizar-grano`, {
    method:'POST',
    headers:{ 'Authorization':'Bearer '+SB.key, 'apikey':SB.key, 'content-type':'application/json' },
    body: JSON.stringify({
      ficha: inp.ficha,
      scan:  inp.scan,
      cerebro: { score:r.score, tier:r.tier, precio:r.precio, confianza:r.confianza, nivel:r.nivel, lentes:r.lentes },
      foto_base64: fotoBase64,            // sin el prefijo "data:...;base64,"
      foto_media_type: fotoMime || 'image/jpeg'
    })
  });
  const j = await resp.json();
  return j.analisis;   // { resumen, categoria, coherencia_foto_ficha, confianza_visual, riesgos, lentes:[...] }
}
```

Para sacar el base64 de un File del input de foto:
```js
const b64 = await new Promise(res=>{ const fr=new FileReader();
  fr.onload=()=>res(String(fr.result).split(',')[1]); fr.readAsDataURL(file); });
```

## Notas
- La foto es opcional: sin foto, la función baja `confianza_visual` y analiza con ficha + scan.
- El costo lo paga tu key de Anthropic (Opus 4.8). El análisis es una sola llamada por lote.
- Para restringir quién puede llamarla, se puede exigir el JWT de Supabase (sesión del equipo)
  en vez de la publishable key — avisame y lo ajusto cuando definamos el flujo.
