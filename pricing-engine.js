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
export const TIER = {
  regional:     { pvpRef:13.30, refScore:83, comm:0.07, slope:0.30, sens:0.65 },
  especialidad: { pvpRef:21.00, refScore:86, comm:0.11, slope:0.55, sens:0.40 },
  exotico:      { pvpRef:24.50, refScore:88, comm:0.16, slope:1.20, sens:0.15 },
};

// --- Config: costos, finanzas, reparto ---
export const COSTOS = { freight:0.45, duty:0.12, rate:0.015, storage:0.03 }; // freight/kg, duty %FOB, %/mes, almacén/kg/mes
export const SPLIT  = { productor:0.50, inversor:0.25, finkap:0.25 };

// Escalera de forma de pago del tostadero (modificador sobre PVP):
export const PAGO = {
  contado:-0.025, d30:0, d60:0.0275, d90:0.055, d120:0.0825, d150:0.11, d180:0.1375
};

// Adelanto al productor por etapa: [haircut, %/mes, cap]
export const ETAPA = {
  pre:[0.55,0.035,0.45], cosecha:[0.45,0.030,0.55], post:[0.35,0.025,0.65],
  bl:[0.20,0.020,0.80], zf:[0.10,0.015,0.90]
};

const dScore = s => 12*(s-82) + 6*Math.max(0, s-86)**2;     // convexo
const nySens = (cw, kc) => cw*(kc/KC_REF) + (1-cw);          // (para % de movimiento; informativo)

// === FOB del productor: NY + diferencial (sin β; Regional < Especialidad < Exótico) ===
export function fob(lot, kc){
  const dvar = lot.dVar ?? D_VAR_TIER[lot.tier] ?? 0;        // preferí dVar por variedad
  const diff = (D_ORIGEN[lot.origen] ?? 15) + dvar + (D_PROCESO[lot.proceso] ?? 0)
             + dScore(lot.score) + (lot.certClb ?? 0);
  return (kc + diff) * CONV;
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
  return t.pvpRef * (1 + t.sens*(kc/KC_REF - 1)) + (lot.score - t.refScore) * t.slope;
}

// === Cálculo completo del lote ===
export function calcular(lot, feeds, cfg = {}){
  const kc = feeds.kc, tc = feeds.tc;
  const costos = { ...COSTOS, ...cfg.costos };
  const split  = { ...SPLIT,  ...cfg.split  };
  const t = TIER[lot.tier];
  const F   = fob(lot, kc);
  const landing = costos.freight + costos.duty * F;
  const carry   = (F*costos.rate + costos.storage) * (lot.T/2);
  // PVP: usá el real del catálogo si está; si no, el sugerido
  const pvp = lot.pvpReal ?? pvpSugerido(lot, kc);
  const volDisc = lot.volDisc ?? 0;
  const payMod  = PAGO[lot.pago] ?? 0;
  const efectivo = pvp * (1 - volDisc) * (1 + payMod);
  const iva = efectivo*0.21, conIva = efectivo+iva, ars = conIva*tc;
  const taper = Math.min(0.03, Math.floor(Math.max(0, lot.kg-1000)/5000)*0.01);
  const commRate = t.comm - taper;
  const comm = commRate * efectivo;
  const spread = efectivo - F - landing - carry - comm;
  const sp = Math.max(0, spread);
  const waterfall = {
    productor: F + sp*split.productor,
    inversor:  carry + sp*split.inversor,
    finkap:    comm + sp*split.finkap,
  };
  return { fob:F, pvp, efectivo, iva, conIva, ars, landing, carry,
           commRate, comm, spread, waterfall,
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
  const sp  = Math.max(0, base.spread);
  const finSlice  = base.carry + sp * SPLIT.inversor;     // slice de financiación/espera
  const productor = base.fob + sp * SPLIT.productor + phi * finSlice;
  const inversor  = (1 - phi) * finSlice;
  const finkap    = base.comm + sp * SPLIT.finkap;
  return { productor, inversor, finkap, finSlice, phi,
           upliftProductor: base.fob>0 ? productor/base.fob - 1 : 0 };
}
