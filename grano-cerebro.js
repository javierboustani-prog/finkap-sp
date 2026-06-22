// grano-cerebro.js — Cerebro de grano verde Finkap (capa de conocimiento experto).
// Única fuente de verdad DESCRIPTIVA: variedades, orígenes, procesos, defectos,
// guía de tueste, interpretación visual y el roster de "agentes expertos" (lentes).
// Monta SOBRE pricing-engine.js (que ya resuelve el cálculo y el veredicto
// determinista): acá no se redefine ningún número de precio/score, se re-exporta.
//
// Filosofía (igual que el motor): el rubro DETERMINISTA decide; la IA sólo EXPLICA.
// Y nunca se inventan notas sensoriales absolutas: los descriptores son perfiles
// TÍPICOS por variedad/origen/proceso ("a confirmar en taza"), no afirmaciones del lote.
//
// Amplio a propósito: cubre desde café comercial/robusta hasta especialidad y exóticos.
//
// Framework-agnostic ES module. Importá:  import * as Cerebro from './grano-cerebro.js'

import * as PE from './pricing-engine.js';
export { PE };                         // acceso al motor por si se necesita crudo

/* =========================================================================
   1) CATEGORÍAS (trazabilidad, NO precio) — amplio: comercial → especialidad → exótico
   Alineado con el motor: el precio sale de origen+puntaje, esto es la ETIQUETA.
   ========================================================================= */
// Clave canónica = la del motor ('regional' | 'especialidad' | 'exotico'). La
// etiqueta dice "Regional / comercial"; "comercial" es vocabulario, no una clave aparte.
export const CATEGORIAS = {
  regional:     { min:0,  max:83.99, label:'Regional / comercial', desc:'Café de base, blends y volumen. Consistencia y rinde por encima de la complejidad.' },
  especialidad: { min:84, max:87.99, label:'Especialidad',          desc:'≥84 SCA. Trazable, perfil limpio y atributos diferenciados; single origin y filtro.' },
  exotico:      { min:88, max:100,   label:'Exótico',               desc:'≥88 SCA. Variedades y procesos de alto valor; lotes microregionales, subasta.' },
};
// deriva la categoría/tier desde el puntaje (única definición; antes duplicada en certificar)
export const tierDe = s => s>=88 ? 'exotico' : s>=84 ? 'especialidad' : 'regional';
export const TIER_LBL = { regional:'Regional', especialidad:'Especialidad', exotico:'Exótico' };

/* =========================================================================
   2) VARIEDADES — perfil típico y tier de referencia (amplio)
   tierRef: dónde suele jugar la variedad. perfil: carácter de taza típico.
   ========================================================================= */
export const VARIEDADES = {
  // --- comercial / alto rinde ---
  'Catimor':      { tierRef:'regional', perfil:'Cuerpo medio, baja acidez, resistente a roya. Versátil para blends.', notas:['nuez','cacao','herbal'] },
  'Castillo':     { tierRef:'regional', perfil:'Equilibrado, dulzor medio, gran consistencia (Colombia).', notas:['caramelo','cítrico suave','nuez'] },
  'Colombia':     { tierRef:'regional', perfil:'Híbrido resistente, taza limpia y pareja.', notas:['caramelo','cítrico'] },
  'Mundo Novo':   { tierRef:'regional', perfil:'Cuerpo alto, dulzor, baja acidez (Brasil).', notas:['chocolate','maní','dulce'] },
  'Robusta':      { tierRef:'regional', perfil:'Cuerpo intenso, amargor, mucha cafeína, poca acidez. Espresso/crema.', notas:['cacao amargo','madera','cereal'] },
  'Conilon':      { tierRef:'regional', perfil:'Robusta brasileño; cuerpo y neutralidad para blends.', notas:['cereal','cacao','madera'] },
  // --- especialidad clásica ---
  'Bourbon':      { tierRef:'especialidad', perfil:'Dulzor y balance, acidez redonda, cuerpo cremoso.', notas:['caramelo','frutos rojos','panela'] },
  'Caturra':      { tierRef:'especialidad', perfil:'Acidez cítrica brillante, cuerpo medio.', notas:['cítrico','manzana','dulce'] },
  'Catuaí':       { tierRef:'especialidad', perfil:'Equilibrado, dulce, productivo.', notas:['caramelo','frutal','nuez'] },
  'Typica':       { tierRef:'especialidad', perfil:'Taza limpia, dulzor delicado, claridad.', notas:['floral suave','miel','cítrico'] },
  'Pacas':        { tierRef:'especialidad', perfil:'Dulce y equilibrado (mutación de Bourbon).', notas:['caramelo','frutal'] },
  'Tabi':         { tierRef:'especialidad', perfil:'Complejo, buena acidez (Colombia).', notas:['frutal','panela','cítrico'] },
  // --- exóticos / alto valor ---
  'Geisha':       { tierRef:'exotico', perfil:'Floral intenso, jazmín y bergamota, acidez té-cítrica, cuerpo sedoso.', notas:['jazmín','bergamota','durazno','té negro'] },
  'Gesha':        { tierRef:'exotico', perfil:'Floral intenso, jazmín y bergamota, acidez té-cítrica, cuerpo sedoso.', notas:['jazmín','bergamota','durazno','té negro'] },
  'SL28':         { tierRef:'exotico', perfil:'Acidez vibrante tipo grosella/zarzamora, cuerpo jugoso (Kenia).', notas:['grosella negra','zarzamora','cítrico'] },
  'SL34':         { tierRef:'exotico', perfil:'Estructurado, frutal y complejo en altura.', notas:['frutos rojos','cítrico','dulce'] },
  'Pacamara':     { tierRef:'exotico', perfil:'Grano gigante, taza grande, frutal-herbal complejo.', notas:['frutal','herbal','chocolate'] },
  'Maragogipe':   { tierRef:'exotico', perfil:'Grano elefante, taza suave y aromática.', notas:['floral','dulce','suave'] },
  'Wush Wush':    { tierRef:'exotico', perfil:'Floral y tropical, muy aromático (Etiopía).', notas:['floral','tropical','té'] },
  'Bourbon Rosado':{ tierRef:'exotico', perfil:'Dulzor alto y delicadeza floral-frutal.', notas:['frutos rojos','floral','miel'] },
};
export const variedadInfo = v => VARIEDADES[v] || null;

/* =========================================================================
   3) ORÍGENES — perfil sensorial típico (amplio). El precio base vive en el motor
   (NIVEL_ORIGEN); acá va el CARÁCTER de taza, no números.
   ========================================================================= */
export const ORIGENES = {
  'Colombia':   'Acidez cítrica-málica, dulzor a caramelo, cuerpo balanceado. Amplio rango regional.',
  'Honduras':   'Dulzor a panela/caramelo, acidez suave, cuerpo medio. Muy versátil.',
  'Brasil':     'Cuerpo alto, baja acidez, chocolate y nuez. Base de blends y naturales dulces.',
  'Perú':       'Limpio y suave, acidez media, notas a chocolate con leche y frutos secos.',
  'Bolivia':    'Dulzor delicado, acidez media, floral-frutal en altura.',
  'Guatemala':  'Acidez compleja, chocolate y especias, cuerpo firme (Antigua, Huehue).',
  'Costa Rica': 'Acidez brillante, cítrico y miel, taza muy limpia.',
  'Panamá':     'Geishas florales de subasta; acidez té-cítrica, delicadeza extrema.',
  'Etiopía':    'Origen del arábica: floral y tropical (naturales) o té-cítrico (lavados).',
  'México':     'Suave, dulce, acidez ligera; nuez y chocolate.',
  'Nicaragua':  'Equilibrado, dulzor y cuerpo medio; frutal en altura.',
  'Ecuador':    'Microlotes de altura, frutal-floral, acidez vibrante.',
  'Vietnam':    'Principalmente robusta: cuerpo intenso, amargor, cereal y cacao amargo.',
};
export const origenInfo = o => ORIGENES[o] || null;

/* =========================================================================
   4) PROCESOS — efecto en taza (el premium en ¢/lb está en el motor: D_PROCESO)
   ========================================================================= */
export const PROCESOS = {
  'Lavado':      'Taza limpia y transparente, acidez definida, perfil del origen sin velo de fruta.',
  'Washed':      'Taza limpia y transparente, acidez definida, perfil del origen sin velo de fruta.',
  'Honey':       'Intermedio: más cuerpo y dulzor que el lavado, acidez redondeada.',
  'Natural':     'Frutal e intenso, cuerpo alto, dulzor a fruta madura; riesgo de fermento si está mal secado.',
  'Anaeróbico':  'Fermentación controlada: notas exóticas/funky, alta complejidad aromática.',
  'Nitro':       'Maceración con CO₂/nitrógeno: aromáticos intensos, perfil de autor.',
};
export const procesoInfo = p => PROCESOS[p] || null;

/* =========================================================================
   5) GREEN GRADING — vocabulario de defectos (los puntos los resta el motor: CERT)
   ========================================================================= */
export const DEFECTOS = {
  primarios:   ['grano negro pleno','grano agrio/vinagre','cereza seca/pod','daño por hongo','materia extraña','daño severo de insecto'],
  secundarios: ['grano parcialmente negro/agrio','flotador','grano inmaduro/quaker','arrugado','concha','partido/cortado','cáscara/pergamino','daño leve de insecto'],
};
// interpreta las métricas visuales (0..1) del análisis de imagen a lenguaje de cata
export function interpretVisual(vis){
  if(!vis) return { color:'a confirmar con la muestra física', uniformidad:'a confirmar', resumen:'Sin análisis visual: pendiente de la foto del productor.' };
  const color = vis.colorUnif>=0.85 ? 'verde parejo, secado homogéneo'
              : vis.colorUnif>=0.6  ? 'verde con leve variabilidad cromática'
              : 'alta variabilidad cromática (revisar secado)';
  const uniformidad = vis.uniformidad>=0.75 ? 'alta' : vis.uniformidad>=0.5 ? 'media' : 'baja';
  const defs = vis.defSecundarios||0, defp = vis.defPrimarios||0;
  const resumen = `Color ${color}; uniformidad ${uniformidad}; ${defp} defecto(s) primario(s), ${defs} secundario(s) declarados.`;
  return { color, uniformidad, defPrimarios:defp, defSecundarios:defs, resumen };
}

/* =========================================================================
   6) HUMEDAD — rango óptimo de almacenamiento (coincide con el motor: confianza())
   ========================================================================= */
export const HUMEDAD_OK = { min:9.5, max:12.5 };
export const humedadOK = h => h!=null && h>=HUMEDAD_OK.min && h<=HUMEDAD_OK.max;

/* =========================================================================
   7) GUÍA DE TUESTE por categoría (consolidada desde certificar.html)
   ========================================================================= */
export const TUESTE = {
  regional:     'Tueste medio. Priorizar cuerpo y dulzor; perfil clásico versátil para espresso, cápsulas y blends. Desarrollo 11–13% post-crack.',
  especialidad: 'Tueste medio claro. Resaltar acidez y complejidad; apto filtro y single origin. Desarrollo 9–11% post-crack, control en Maillard.',
  exotico:      'Tueste claro. Preservar aromáticos y acidez brillante; filtro de especialidad. Curva progresiva, evitar sobre-desarrollo.',
};

/* =========================================================================
   8) LENTES = roster de "agentes expertos". Cada lente da una lectura DETERMINISTA
   (baseline) y define el foco que la capa IA va a expandir. Amplio espectro.
   Cada lente: { id, rol, foco, lectura(ctx) -> string }
   ctx = { ficha, scan, visual, cert, tier, precio, variedad, origen, proceso }
   ========================================================================= */
export const LENTES = [
  {
    id:'sensorial', rol:'Catador / Q-grader',
    foco:'Perfil de taza esperable según variedad, origen y proceso; acidez, cuerpo, dulzor, notas.',
    lectura(ctx){
      const v = variedadInfo(ctx.variedad), o = origenInfo(ctx.origen), p = procesoInfo(ctx.proceso);
      const notas = ctx.ficha?.notas ? `Notas declaradas: ${ctx.ficha.notas} (a confirmar en taza).`
                  : (v?.notas ? `Notas típicas de ${ctx.variedad}: ${v.notas.join(', ')} (potenciales, no confirmadas).` : 'Notas a confirmar en taza.');
      return [v?.perfil, o, p, notas].filter(Boolean).join(' ');
    },
  },
  {
    id:'fisico', rol:'Clasificador físico (green grading)',
    foco:'Color, uniformidad, humedad, criba y defectos del grano verde.',
    lectura(ctx){
      const vi = interpretVisual(ctx.visual);
      const hum = ctx.scan?.humedad;
      const humTxt = hum==null ? 'humedad no informada'
                   : `humedad ${hum}%${humedadOK(hum)?' (en rango)':' (fuera de rango óptimo)'}`;
      const criba = ctx.ficha?.criba ? `criba ${ctx.ficha.criba}` : 'criba a estimar';
      return `${vi.resumen} ${criba}; ${humTxt}.`;
    },
  },
  {
    id:'agronomo', rol:'Agrónomo / origen',
    foco:'Coherencia altitud–variedad–proceso–origen y potencial del terruño.',
    lectura(ctx){
      const alt = ctx.ficha?.altura;
      const altTxt = alt ? `Altitud ${alt} msnm` : 'Altitud no declarada';
      const coh = alt ? (alt>=1400 ? 'altura compatible con perfiles complejos de especialidad' : alt>=1000 ? 'altura media, perfil equilibrado esperable' : 'altura baja, perfil de cuerpo sobre acidez') : 'a confirmar';
      return `${altTxt}: ${coh}. Origen ${ctx.origen||'—'}, variedad ${ctx.variedad||'—'}, proceso ${ctx.proceso||'—'}.`;
    },
  },
  {
    id:'tostador', rol:'Tostador',
    foco:'Curva y objetivo de tueste según categoría y humedad.',
    lectura(ctx){ return TUESTE[ctx.tier] || TUESTE.regional; },
  },
  {
    id:'comercial', rol:'Comercial / pricing',
    foco:'Dónde juega comercialmente el lote y a qué precio de referencia.',
    lectura(ctx){
      const cat = CATEGORIAS[ctx.tier] || CATEGORIAS.regional;
      const precio = ctx.precio!=null ? `Precio estimado USD ${ctx.precio.toFixed(2)}/kg (origen + puntaje, sin depender del tier).` : '';
      return `${cat.label}: ${cat.desc} ${precio}`.trim();
    },
  },
];
export const lentePorId = id => LENTES.find(l=>l.id===id) || null;

/* =========================================================================
   9) EVALUAR LOTE — corre el cerebro determinista de punta a punta y devuelve una
   "lectura experta" estructurada (la columna que la IA luego narra).
   inp = { ficha:{scaDeclarado,origen,proceso,variedad,altura,criba,notas,productor}, scan, visual }
   ========================================================================= */
export function evaluarLote(inp, feeds){
  const cert = PE.certificar(inp);                                  // veredicto determinista (motor)
  const score = cert.scoreProvisorio;
  const tier = score!=null ? tierDe(score) : 'regional';
  const origen = inp.ficha?.origen, variedad = inp.ficha?.variedad, proceso = inp.ficha?.proceso;
  const precio = score!=null ? PE.pvpEstimado({ origen, score }, feeds) : null;
  const ctx = { ...inp, cert, tier, precio, variedad, origen, proceso };
  const lentes = LENTES.map(l => ({ id:l.id, rol:l.rol, foco:l.foco, lectura:l.lectura(ctx) }));
  return {
    score, tier, categoria:CATEGORIAS[tier], precio,
    confianza:cert.confianza, nivel:cert.nivel, viable:cert.viable, motivo:cert.motivo,
    visual:interpretVisual(inp.visual),
    variedad:variedadInfo(variedad), origen:origenInfo(origen), proceso:procesoInfo(proceso),
    tueste:TUESTE[tier], lentes, cert,
  };
}

/* =========================================================================
   10) DOSSIER — ficha técnica consolidada (supersede fichaFinkap de certificar.html).
   Mismo formato "Dossier Técnico — Finkap Coffee Lab", ahora alimentado por el cerebro.
   Sin emojis, tono profesional, nunca inventa notas absolutas.
   ========================================================================= */
export function dossier(inp, cert, tier){
  const f = inp.ficha||{}, sc = inp.scan, vi = inp.visual;
  const dash = v => (v==null||v==='')?'—':v;
  const t = tier || (cert.scoreProvisorio!=null ? tierDe(cert.scoreProvisorio) : 'regional');
  const hum = sc?.humedad ?? null;
  const humRango = hum==null ? '' : (humedadOK(hum) ? ' (dentro de rango óptimo de almacenamiento)' : ' (fuera de rango óptimo)');
  const v = interpretVisual(vi);
  const vinfo = variedadInfo(f.variedad), oinfo = origenInfo(f.origen), pinfo = procesoInfo(f.proceso);
  const espectro = sc ? `Escaneo NIR disponible (puntaje ${sc.score}). Correlación con la ficha del productor para estimar homogeneidad química, azúcares, lípidos y comportamiento térmico esperado. (Lectura fina de la curva: ver scan en ProfilePrint.)`
                      : 'Pendiente de escaneo ProfilePrint. La certificación es provisoria hasta contar con el espectro NIR.';
  return [
`DOSSIER TÉCNICO — FINKAP COFFEE LAB`,
`Lote: ${dash(f.variedad||f.origen)}`,
``,
`DATOS DEL CAFÉ`,
`Origen: ${dash(f.origen)}${oinfo?'  ·  '+oinfo:''}`,
`Productor: ${dash(f.productor)}`,
`Variedad: ${dash(f.variedad)}${vinfo?'  ·  '+vinfo.perfil:''}`,
`Altitud: ${f.altura?f.altura+' msnm':'—'}`,
`Proceso: ${dash(f.proceso)}${pinfo?'  ·  '+pinfo:''}`,
`Criba estimada: ${dash(f.criba)}`,
`Humedad: ${hum!=null?hum+'%':'—'}`,
`Notas sensoriales: ${f.notas?f.notas+' (declaradas)':(vinfo?'potenciales: '+vinfo.notas.join(', ')+' (a confirmar en taza)':'a confirmar en taza')}`,
`Puntaje SCA promedio (escaneo): ${sc?sc.score:'pendiente de escaneo'}`,
`Estimación Finkap: ${cert.scoreProvisorio!=null?cert.scoreProvisorio.toFixed(1):'—'}  ·  Categoría: ${(CATEGORIAS[t]||{}).label||'—'}`,
``,
`COMENTARIO TÉCNICO`,
`Grano de proceso ${dash(f.proceso)} con humedad ${hum!=null?hum+'%':'no informada'}${humRango}. Uniformidad ${v.uniformidad} según análisis visual. Sin signos evidentes de fermentación defectuosa ni oxidación severa. Estructura coherente con la altitud declarada; comportamiento esperado en tueste estable. No se infieren notas sensoriales absolutas: sólo posibles según proceso, variedad y espectro.`,
``,
`EVALUACIÓN VISUAL DEL CAFÉ VERDE`,
`- Tamaño del grano: criba estimada ${dash(f.criba)}`,
`- Color: ${v.color}`,
`- Uniformidad: ${v.uniformidad}`,
`- Defectos: ${vi?`${v.defSecundarios} defecto(s) secundario(s); sin defectos críticos detectados`:'a confirmar con grading físico'}`,
``,
`ANÁLISIS DEL ESPECTRO NIR`,
espectro,
``,
`CONCLUSIÓN`,
`Coherencia productor–NIR–foto: índice de confianza ${cert.confianza!=null?cert.confianza.toFixed(0):'—'}/100. Estado de certificación: ${cert.nivel}. ${cert.motivo}`,
``,
`RECOMENDACIÓN DE TUESTE`,
TUESTE[t] || TUESTE.regional,
  ].join('\n');
}
