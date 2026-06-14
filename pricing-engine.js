// pricing-engine.js — única fuente de verdad. Framework-agnostic.
// Finkap® · Grupo Kapselmaker · Brief de unificación · mayo 2026.
// Lógica validada (no modificar sin recalibrar los casos de la sección 7).

export const CONV = 0.0220462;            // ¢/lb -> USD/kg  (1 lb = 0,453592 kg)
export const KC_REF = 268.88;             // referencia de calibración (mayo 2026)

// --- Config: diferenciales sobre el "C" (¢/lb) ---
export const D_ORIGEN = { Colombia:25, Honduras:12, Brasil:5, Guatemala:28, 'Costa Rica':35,
  'Panamá':45, 'Perú':10, 'México':14, Nicaragua:12, 'El Salvador':20, Ecuador:30, Bolivia:22, Vietnam:-40 };

export const D_PROCESO = { Lavado:0, Washed:0, Honey:10, Natural:18, 'Anaeróbico':40, Nitro:25 };

// d_variedad: idealmente por VARIEDAD (ver sección 8). Fallback por tier:
export const D_VAR_TIER = { regional:0, especialidad:40, exotico:250 };

// --- Config: tiers calibrados al catálogo real ---
// slopeDn: castigo extra al PVP por punto POR DEBAJO del refScore (rota la cola
// baja sin mover los buenos). Calibra el café flojo: regional 81 ≈ FOB cobra-ya 7.90.
export const TIER = {
  regional:     { pvpRef:13.30, refScore:83, comm:0.05, slope:0.30, sens:0.65, slopeDn:0.671 },
  especialidad: { pvpRef:21.00, refScore:86, comm:0.09, slope:0.55, sens:0.40, slopeDn:0 },
  exotico:      { pvpRef:24.50, refScore:88, comm:0.14, slope:1.20, sens:0.15, slopeDn:0 },
};

// --- Config: costos, finanzas, reparto ---
export const COSTOS = { freight:0.45, duty:0.12, rate:0.015, storage:0.03 }; // freight/kg, duty %FOB (fallback), %/mes, almacén/kg/mes
export const SPLIT  = { productor:0.50, inversor:0.25, finkap:0.25 };

// --- Aranceles de importación a Argentina (% sobre FOB; NO son crédito fiscal) ---
// Exentos de DIE (solo 3% tasa de estadística): Brasil, Perú, Colombia, Panamá.
// Resto: 9% DIE + 3% estadística = 12%.
export const ARANCEL = { Brasil:0.03, 'Perú':0.03, Colombia:0.03, 'Panamá':0.03 };
export const ARANCEL_DEF = 0.12;
export function arancelRate(origen){ return ARANCEL[origen] ?? ARANCEL_DEF; }

// === Costo FOB REAL por origen (importaciones Lakaut SRD 2026) ===
// FOB/kg efectivamente pagado/declarado en los arribos IDA4. Es el ancla del costo
// real; reemplaza la estimación de mercado cuando se pide cfg.usarCostoReal=true.
// Fuente: módulo importaciones/data.js (verificado vs Lakaut 13/06/2026).
export const COSTO_REAL_ORIGEN = {
  Bolivia:  { fobKg:9.54,  fuente:'Lakaut IDA4002093E',       fecha:'2026-04-09' },
  Brasil:   { fobKg:7.71,  fuente:'Lakaut IDA4001760E',       fecha:'2026-03-17' },
  Honduras: { fobKg:7.18,  fuente:'Lakaut IDA4002258H (CFR)', fecha:'2026-04-16' },
  Colombia: { fobKg:10.23, fuente:'Proforma 282 (Harmony)',   fecha:'2025-12-07' },
};
export function fobRealOrigen(origen){ return COSTO_REAL_ORIGEN[origen] ? COSTO_REAL_ORIGEN[origen].fobKg : null; }

// Castigo flat por "cobrar rápido": Finkap/el inversor compra y financia el contrato.
// Escala con (1-phi): full al adelantar todo, 0 si el productor banca la espera.
export const CASH_HAIRCUT = 0.05;

// Escalera de forma de pago del tostadero (modificador sobre PVP):
export const PAGO = {
  contado:-0.025, d30:0, d60:0.0275, d90:0.055, d120:0.0825, d150:0.11, d180:0.1375
};

// Adelanto al productor por etapa: [haircut, %/mes, cap]
export const ETAPA = {
  pre:[0.55,0.035,0.45], cosecha:[0.45,0.030,0.55], post:[0.35,0.025,0.65],
  bl:[0.20,0.020,0.80], zf:[0.10,0.015,0.90]
};

// === NUEVO (mayo 2026): capa financiera dinámica ===
// Prima por mantener el café (hold) para venderlo mes a mes a tostaderos.
// Cuanto más se aguanta, más caro se coloca → la torta crece con la espera.
export const HOLD = {
  premRateMes: 0.010,   // prima por mes de hold, sobre el precio efectivo (1%/mes)
  premCapMes:  12,      // tope de meses que acumulan prima
};
// Reparto de la PRIMA de espera (distinto del spread spot 50/25/25):
//   Finkap fijo 20%. Del 80% restante, el productor (dueño) toma prodBase=40% siempre,
//   y el 60% "del que espera" va a quien banca la maduración (phi→productor, 1-phi→inversor).
export const PRIMA_SPLIT = { finkap:0.20, prodBase:0.40 };

// Anticipo en tramos (cobro rápido): el productor puede cobrar antes con descuento.
export const PAGO_TRAMOS = { preembarque:0.30, bl:0.35, arribo:0.35 }; // suma 1.00
export const TRAMO_MESES = { preembarque:0, bl:2, arribo:4 };          // arribo = arribo + 30d
export const DISCOUNT    = { rateMesMax:0.030 };                        // descuento del cash adelantado (/mes)

const dScore = s => 12*(s-82) + 6*Math.max(0, s-86)**2;     // convexo
const nySens = (cw, kc) => cw*(kc/KC_REF) + (1-cw);          // (para % de movimiento; informativo)

// === FOB del productor: NY + diferencial (sin β; Regional < Especialidad < Exótico) ===
// cfg.usarCostoReal=true → ancla el costo real del origen (Lakaut) y le suma el
// premium varietal de mercado, preservando la diferencia por tier/score/proceso.
export function fob(lot, kc, cfg = {}){
  const dvar = lot.dVar ?? D_VAR_TIER[lot.tier] ?? 0;        // preferí dVar por variedad
  const diff = (D_ORIGEN[lot.origen] ?? 15) + dvar + (D_PROCESO[lot.proceso] ?? 0)
             + dScore(lot.score) + (lot.certClb ?? 0);
  const market = (kc + diff) * CONV;
  if(cfg.usarCostoReal){
    const real = COSTO_REAL_ORIGEN[lot.origen] ? COSTO_REAL_ORIGEN[lot.origen].fobKg : null;
    if(real != null){
      // base de mercado de un regional ref del mismo origen (ancla del promedio importado)
      const baseDiff = (D_ORIGEN[lot.origen] ?? 15) + D_VAR_TIER.regional
                     + D_PROCESO.Lavado + dScore(TIER.regional.refScore);
      const baseMarket = (kc + baseDiff) * CONV;
      return real + (market - baseMarket);    // costo real del origen + premium varietal
    }
  }
  return market;
}

// === Índice de Confianza (ProfilePrint) ===
export function confianza({ declarado, escaneo, humedad, sensorial=0.9, visual=0.8 }){
  const match = 1 - Math.min(1, Math.abs(declarado - escaneo)/2);
  const moOK  = (humedad>=9.5 && humedad<=12.5) ? 1 : 0.5;
  return 100*(0.4*match + 0.2*moOK + 0.2*sensorial + 0.2*visual);
}

// === PVP al tostadero ===
// Modo A (recomendado): pvpReal = precio_usd_kg del catálogo.
// Modo B (sugerencia): flotado con NY desde el ref del tier.
export function pvpSugerido(lot, kc){
  const t = TIER[lot.tier];
  return t.pvpRef * (1 + t.sens*(kc/KC_REF - 1)) + (lot.score - t.refScore) * t.slope
       - (t.slopeDn ?? 0) * Math.max(0, t.refScore - lot.score);   // castigo cola baja
}

// === Nivel de mercado por ORIGEN (precio base de referencia, USD/kg) ===
// Calibrado con el catálogo real de Finkap. El precio NO depende del tier de
// trazabilidad: depende del ORIGEN (a cuánto se coloca ese origen) + el PUNTAJE
// (que dispara el premium de las variedades top/exóticas). Ajustá estos números.
// Calibrado con el catálogo real de Finkap (jun 2026): Honduras 13,3 · Brasil 11,9 ·
// Bolivia 12,9 · Perú 13,5 · Colombia regional 15 (los Geshas vuelan por el puntaje) ·
// robusta Vietnam ~8 a su nivel de score. Editá estos números cuando cambie el mercado.
export const NIVEL_ORIGEN = {
  Honduras:13.3, Brasil:11.9, Colombia:15.0, 'Perú':13.5, Bolivia:12.9,
  Guatemala:13.5, 'Costa Rica':15.0, 'Panamá':16.0, 'Etiopía':16.0, 'México':13.0,
  Nicaragua:13.0, Ecuador:14.0, Vietnam:10.0,
};
export const NIVEL_ORIGEN_DEF = 13.0;
// slopeUp suave en la zona comercial (83→86) y slopeExo empinado para exóticos (>86).
export const PVP_EST = { refScore:83, slopeUp:0.4, exoFrom:86, slopeExo:2.3, slopeDn:0.4, castigoCap:2.5, sensKC:0.45 };

// PVP estimado para un lote NUEVO (sin precio de catálogo): origen + puntaje.
// El tier (trazabilidad) NO entra acá — es etiqueta de categoría, no precio.
export function pvpEstimado(lot, feeds){
  const kc = (feeds && feeds.kc) || KC_REF;
  const c = PVP_EST;
  const base = (NIVEL_ORIGEN[lot.origen] ?? NIVEL_ORIGEN_DEF) * (1 + c.sensKC*(kc/KC_REF - 1));
  const s = lot.score ?? c.refScore;
  const premio  = Math.max(0, s - c.refScore)*c.slopeUp + Math.max(0, s - c.exoFrom)*c.slopeExo; // convexo (exóticos)
  const castigo = Math.min(c.castigoCap ?? Infinity, Math.max(0, c.refScore - s)*c.slopeDn);      // cola baja (con tope)
  return +(base + premio - castigo).toFixed(2);
}

// === Cálculo completo del lote ===
export function calcular(lot, feeds, cfg = {}){
  const kc = feeds.kc, tc = feeds.tc;
  const costos = { ...COSTOS, ...cfg.costos };
  const split  = { ...SPLIT,  ...cfg.split  };
  const t = TIER[lot.tier];
  const F   = fob(lot, kc, cfg);                               // cfg.usarCostoReal → costo Lakaut
  const aranRate = cfg.arancel ?? arancelRate(lot.origen);     // por país (FOB)
  const landing = costos.freight + aranRate * F;
  const carry   = (F*costos.rate + costos.storage) * (lot.T/2);
  // PVP: usá el real del catálogo si está; si no, el sugerido
  const pvp = lot.pvpReal ?? pvpSugerido(lot, kc);
  const volDisc = lot.volDisc ?? 0;
  const payMod  = PAGO[lot.pago] ?? 0;
  const efectivoLista = pvp * (1 + payMod);            // precio de lista (sin descuento de volumen)
  const efectivo = efectivoLista * (1 - volDisc);      // realizado (con el descuento aplicado)
  const descVolMonto = Math.max(0, efectivoLista - efectivo);
  const iva = efectivo*0.21, conIva = efectivo+iva, ars = conIva*tc;
  const taper = Math.min(0.03, Math.floor(Math.max(0, lot.kg-1000)/5000)*0.01);
  const commRate = t.comm - taper;
  const comm = commRate * efectivo;
  const spread = efectivo - F - landing - carry - comm;            // spread realizado (informativo)
  const sp = Math.max(0, spread);
  const prima = primaHold(efectivo, lot.T);
  // === Reparto del descuento de volumen ===
  // El PRODUCTOR se calcula sobre la LISTA: el descuento de volumen NO lo toca
  // (vendió su café a un precio, cobra su FOB + 50% del spread de lista). El
  // descuento lo absorben INVERSOR y FINKAP, a prorrata de su parte del spread
  // (25/25 → mitad cada uno). El piso duro (piso()/effDisc en la venta) impide
  // descontar más de lo que ese pool financiero aguanta → nunca se toca al productor.
  const commLista = commRate * efectivoLista;
  const spreadLista = efectivoLista - F - landing - carry - commLista;
  const spL = Math.max(0, spreadLista);
  const poolShare = (split.inversor + split.finkap) || 1;
  const waterfall = {
    productor: F + spL*split.productor,                                              // protegido (sobre lista)
    inversor:  carry    + spL*split.inversor - descVolMonto*(split.inversor/poolShare),
    finkap:    commLista + spL*split.finkap  - descVolMonto*(split.finkap /poolShare),
  };
  return { fob:F, pvp, efectivo, efectivoLista, descVolMonto, iva, conIva, ars, landing, carry, arancel:aranRate,
           commRate, comm, spread, prima, waterfall,
           upliftProductor: waterfall.productor/F - 1,
           markup: efectivo/(F+landing+carry) - 1 };
}

// === Adelanto al productor por etapa ===
export function adelanto(F, etapa, conf){
  const [haircut, rate, cap] = ETAPA[etapa];
  const hcEff = haircut * (1 - 0.5*conf/100);
  const perKg = F * Math.min(cap, 1 - hcEff);
  return { perKg, rateMes: rate, pctFob: perKg/F };
}

// === Reparto centrado en el productor (roles combinables + espera) ===
// phi ∈ [0,1]: fracción de la "espera/financiación" que banca el propio productor.
//   phi=1 → autofinancia: se lleva FOB + 50% del spread + (carry + 25% del spread).
//   phi=0 → entra un inversor que financia la espera y toma (carry + 25% del spread);
//           el productor cobra antes (adelanto) pero se lleva sólo FOB + 50% del spread.
// Finkap siempre mantiene comisión + 25% del spread (intermediación transparente, fija).
// Recibe el objeto que devuelve calcular() como `base`.
export function repartoProductor(base, phi = 1){
  phi = Math.max(0, Math.min(1, phi));
  const sp   = Math.max(0, base.spread);
  const prm  = Math.max(0, base.prima || 0);
  const finSlice  = base.carry + sp * SPLIT.inversor;     // slice de financiación/espera (spot)

  // --- Reparto de la PRIMA de espera (split dinámico) ---
  // Finkap fijo. Del resto, el productor toma prodBase siempre (dueño) y
  // el tramo "del que espera" lo capta quien banca la maduración (phi).
  const prmFinkap = PRIMA_SPLIT.finkap * prm;
  const prmRest   = prm - prmFinkap;                       // 80%
  const prmWait   = prmRest * (1 - PRIMA_SPLIT.prodBase);  // 60% → al que espera
  const prmProd   = prmRest * PRIMA_SPLIT.prodBase + prmWait * phi;
  const prmInv    = prmWait * (1 - phi);

  let productor = base.fob + sp * SPLIT.productor + phi * finSlice + prmProd;
  let inversor  = (1 - phi) * finSlice + prmInv;
  const finkap  = base.comm + sp * SPLIT.finkap + prmFinkap;

  // Flete + aranceles (landing): el productor cobra FOB y NO banca los costos de
  // importación sobre la parte que cobra ya. Quien tiene la posición de importación
  // los paga: el inversor cuando el productor cobra ya, el propio productor sólo si
  // se lo guarda. Releva (1-phi)·50% del landing (lo que el productor absorbía vía su
  // 50% del spread) y se lo pasa al inversor. phi=0 → productor limpio de flete.
  const landingRelief = (1 - phi) * SPLIT.productor * (base.landing || 0);
  productor += landingRelief;
  inversor  -= landingRelief;

  // Castigo "cobro rápido": 5%·(1-phi) de lo del productor → a quien compra/financia el contrato.
  const cashHcRate = CASH_HAIRCUT * (1 - phi);
  const cashHc = cashHcRate * productor;
  productor -= cashHc;
  inversor  += cashHc;

  return { productor, inversor, finkap, finSlice, prima:prm, phi, cashHc, cashHcRate,
           landingRelief, upliftProductor: base.fob>0 ? productor/base.fob - 1 : 0 };
}

// === Piso de precio: NY-C puro + mitad del diferencial = (FOB + NY·C)/2 ===
export function piso(lot, kc){
  const bare = kc * CONV;                 // commodity pelado de NY
  return (fob(lot, kc) + bare) / 2;
}

// === Prima por mantener el café T meses (venta mes a mes a tostaderos) ===
export function primaHold(efectivo, T = 0){
  const m = Math.min(HOLD.premCapMes, Math.max(0, T || 0));
  return efectivo * HOLD.premRateMes * m;
}

// === Anticipo en tramos + descuento hacia el piso ===
// precio   = lo que cobraría esperando cada tramo en fecha (ej. productor del reparto)
// pisoPrecio = piso(lot, kc): el "todo ya" nunca cae por debajo de esto.
// Devuelve el calendario 30/35/35 y el valor si pide todo el cash hoy (con descuento).
export function anticipo(precio, pisoPrecio, cfg = {}){
  const r  = cfg.rateMes ?? DISCOUNT.rateMesMax;
  const tm = { ...TRAMO_MESES, ...cfg.meses  };
  const w  = { ...PAGO_TRAMOS, ...cfg.tramos };
  const pvFactor = w.preembarque * 1
                 + w.bl     * Math.max(0, 1 - r * tm.bl)
                 + w.arribo * Math.max(0, 1 - r * tm.arribo);
  const alContadoRaw = precio * pvFactor;
  const alContado    = Math.max(pisoPrecio, alContadoRaw);
  return {
    porTramos: precio,                              // cobrando cada tramo en fecha
    alContado,                                      // todo hoy, con descuento (piso aplicado)
    descuentoPct: precio > 0 ? 1 - alContado / precio : 0,
    piso: pisoPrecio,
    tramos: {
      preembarque: { pct:w.preembarque, mes:tm.preembarque, monto:precio * w.preembarque },
      bl:          { pct:w.bl,          mes:tm.bl,          monto:precio * w.bl },
      arribo:      { pct:w.arribo,      mes:tm.arribo,      monto:precio * w.arribo },
    },
  };
}

// === Liquidación por validación física (clawback por calidad) ===
// Compuerta 2: compara el grado PROVISORIO sellado cuando el productor subió la
// foto contra el grado FINAL del lote físico (ProfilePrint + green grading) y
// resuelve cuánto cobra. Determinista y auditable: mismas entradas → misma
// liquidación. La foto sólo abrió el mercado; acá el físico define la plata.
//   lot   : lote del contrato (origen, proceso… del grado provisorio)
//   feeds : { kc, tc }
//   prov  : { score, tier?, precio }            grado y precio CERRADOS (sellados al subir la foto)
//   final : { score, tier?, defectoGrave? }     grado físico real al arribo
//   cfg   : { tol, bandaMayor, pisoPct, cap }
//
// Tres estados:
//   validado : física coincide (Δ ≤ tolerancia)            → 100%
//   reprecio : bajó de grado de buena fe (Δ ≤ banda mayor)  → precio de mercado del grado REAL
//   liquidado: las muestras no son las mismas               → piso de rescate (40-50%), contrato invalidado
export const LIQUIDACION = { tol:1, bandaMayor:4, pisoPct:0.45, cap:1.00 };
const TIER_RANK = { regional:0, especialidad:1, exotico:2 };

export function liquidar(lot, feeds, prov, final, cfg = {}){
  const c = { ...LIQUIDACION, ...cfg };
  const kc = feeds.kc;
  const tierProv  = prov.tier  ?? lot.tier;
  const tierFinal = final.tier ?? lot.tier;
  // valor implícito del motor en cada grado (sensible al puntaje y al tier)
  const vProv  = pvpSugerido({ ...lot, tier:tierProv,  score:prov.score  }, kc);
  const vFinal = pvpSugerido({ ...lot, tier:tierFinal, score:final.score }, kc);
  const ratio  = vProv > 0 ? vFinal / vProv : 0;

  const dScore   = prov.score - final.score;            // + = llegó PEOR que lo declarado
  const bajaTier = (TIER_RANK[tierFinal] ?? 0) < (TIER_RANK[tierProv] ?? 0);
  const grave    = !!final.defectoGrave;

  let estado, payoutPct, motivo;
  if(!grave && dScore <= c.tol && !bajaTier){
    estado = 'validado';
    payoutPct = c.cap;                                  // 100%
    motivo = 'La muestra física coincide con lo declarado (dentro de la tolerancia). Cobra el precio pactado.';
  } else if(!grave && dScore <= c.bandaMayor){
    estado = 'reprecio';                                // buena fe: precio justo del grado real
    payoutPct = Math.min(c.cap, Math.max(c.pisoPct, ratio));
    motivo = 'Bajó de grado de buena fe: se liquida al precio de mercado de lo realmente entregado.';
  } else {
    estado = 'liquidado';                               // mismatch grosero / defecto grave
    payoutPct = c.pisoPct;
    motivo = 'Las muestras no son las mismas: contrato invalidado al precio pactado, se liquida a valor de rescate.';
  }

  const montoLiq = prov.precio * payoutPct;
  return {
    estado, payoutPct, montoLiq,
    precioProv: prov.precio, precioLiq: montoLiq,
    quita: prov.precio - montoLiq, quitaPct: 1 - payoutPct,
    dScore, bajaTier, grave, ratio, vProv, vFinal, motivo,
  };
}

// === Certificación provisoria (Compuerta 1) ===
// Fusiona las tres fuentes que ya usa Finkap en un veredicto AUTOMÁTICO, sin
// intervención humana: scan de ProfilePrint (ancla objetiva), ficha del productor
// (declarado) y observación visual de la foto. El puntaje sale de un RUBRO
// determinista —no de un chat—: mismas entradas → mismo veredicto.
// Los pesos son placeholders para que los calibre el Q-grader (config, no código).
//   inp.scan   : { score, humedad } | null      (ProfilePrint; ancla fuerte)
//   inp.ficha  : { scaDeclarado, origen, proceso, altura?, variedad? }
//   inp.visual : { defPrimarios, defSecundarios, colorUnif(0..1), uniformidad(0..1) } | null
// Devuelve: scoreProvisorio, confianza, nivel (certificado|provisorio|rechazado), viable…
export const CERT = {
  pesoScan: 0.65, pesoFicha: 0.35,        // mezcla del puntaje base (se renormaliza por fuentes presentes)
  defPrimario: 2.0, defSecundario: 0.5,   // puntos restados por defecto visible (green grading)
  penalColor: 1.5, penalUnif: 1.5,        // castigo máx por color/uniformidad pobres (0..1)
  pisoVendible: 80,                       // ningún lote entra al mercado por debajo de esto
  minConfianza: 60, minConfProvisorio: 45,// fuerte vs provisorio
  factorSinScan: 0.6,                     // sin ancla física la confianza vale menos
};
const clamp01 = x => Math.max(0, Math.min(1, +x || 0));

export function certificar(inp, cfg = {}){
  const c = { ...CERT, ...cfg };
  const ficha = inp.ficha || {};
  const scan  = inp.scan || null;
  const vis   = inp.visual || null;

  // 1) puntaje base: scan (ancla) + ficha (declarado), renormalizando por presencia
  const partes = [];
  if(scan && scan.score!=null)  partes.push([scan.score, c.pesoScan]);
  if(ficha.scaDeclarado!=null)  partes.push([ficha.scaDeclarado, c.pesoFicha]);
  const wTot = partes.reduce((s,[,w])=>s+w,0);
  const base = wTot>0 ? partes.reduce((s,[v,w])=>s+v*w,0)/wTot : null;

  // 2) la foto RESTA (no suma): defectos + color/uniformidad pobres
  let deduc = 0;
  if(vis){
    deduc += (vis.defPrimarios||0)*c.defPrimario + (vis.defSecundarios||0)*c.defSecundario;
    if(vis.colorUnif!=null)   deduc += c.penalColor*(1-clamp01(vis.colorUnif));
    if(vis.uniformidad!=null) deduc += c.penalUnif *(1-clamp01(vis.uniformidad));
  }
  const scoreProvisorio = base!=null ? +(base - deduc).toFixed(2) : null;

  // 3) confianza (reusa el índice ProfilePrint del motor)
  let conf = confianza({
    declarado: ficha.scaDeclarado ?? base ?? 83,
    escaneo:   scan?.score ?? ficha.scaDeclarado ?? base ?? 83,
    humedad:   scan?.humedad ?? 11,
    visual:    vis ? clamp01(((vis.colorUnif??0.8)+(vis.uniformidad??0.8))/2) : 0.6,
  });
  if(!scan) conf *= c.factorSinScan;
  conf = +conf.toFixed(1);

  // 4) compuerta de viabilidad → entra al marketplace o no
  const faltan = [];
  if(!ficha.origen)            faltan.push('origen');
  if(ficha.scaDeclarado==null) faltan.push('SCA declarado');
  if(!ficha.proceso)           faltan.push('proceso');
  const fichaCompleta = faltan.length===0;

  let nivel, motivo, viable;
  if(scoreProvisorio==null || scoreProvisorio<c.pisoVendible || !fichaCompleta){
    nivel='rechazado'; viable=false;
    motivo = !fichaCompleta ? ('Faltan datos de ficha: '+faltan.join(', '))
           : scoreProvisorio==null ? 'Sin puntaje: cargá un scan de ProfilePrint o el SCA declarado.'
           : `Puntaje ${scoreProvisorio} por debajo del piso vendible (${c.pisoVendible}).`;
  } else if(scan && conf>=c.minConfianza){
    nivel='certificado'; viable=true;
    motivo='Con ancla física (ProfilePrint) y alta confianza: certificación fuerte.';
  } else if(conf>=c.minConfProvisorio){
    nivel='provisorio'; viable=true;
    motivo = scan ? `Confianza ${conf} en rango provisorio.`
                  : 'Sólo visual + declarado: provisorio, sujeto a validación física al arribo.';
  } else {
    nivel='rechazado'; viable=false;
    motivo=`Confianza ${conf} por debajo del mínimo (${c.minConfProvisorio}).`;
  }

  return { scoreProvisorio, confianza:conf, nivel, viable, fichaCompleta, faltan,
           base: base!=null?+base.toFixed(2):null, deduccion:+deduc.toFixed(2),
           tieneScan:!!scan, tieneVisual:!!vis, motivo };
}
