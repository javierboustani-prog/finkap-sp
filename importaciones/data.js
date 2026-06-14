/* ============================================================
   Finkap · Torre de Control de Importaciones — datos
   ------------------------------------------------------------
   Fuente de verdad del módulo. Se carga como <script> para
   funcionar abriendo el HTML directo (file://) sin servidor.

   Convenciones:
   - montos FOB en USD (number).
   - null  = dato que todavía falta (lo completamos con el Excel
             "Reporte Detallado de Operaciones" de Lakaut o a mano).
   - estado de pago: "ok" | "parcial" | "pendiente" | "trabado".
   ============================================================ */
window.FINKAP_IMPO = {
  meta: {
    empresa: "KAPSELMAKER S.A.",
    cuit: "30715976273",
    despachante: "Lisa Eliana Gálvez (27374555680)",
    moneda: "USD",
    actualizado: "2026-06-13",
    verificadoLakaut: "2026-06-13 · 8 despachos DIGI 2026 leídos en vivo de Lakaut SRD (Mis Despachos) coinciden exacto con este módulo. El IC06006020F (49.142,55) aún en OFIC, no digitalizado en SRD (consistente).",
    nota: "FOB/fecha/Sigea/tipo reales de Lakaut (verificados). Origen, kg y proveedor por despacho cruzados con facturas comerciales."
  },

  /* ---- Catálogo de proveedores por origen ---- */
  proveedores: [
    { id:"labareda",  pais:"Brasil",    nombre:"Labareda",                modalidad:"Directo",                  activo:true,  link:"cuenta-corriente.html?cc=Labareda", nota:"Importación 2026. Factura LB 012/2026. Abrí la cuenta corriente por variedad." },
    { id:"growhaus",  pais:"Colombia",  nombre:"Grow Haus",               modalidad:"Vía Harmony · financiado",  activo:true,  link:"colombia.html", nota:"Origen del café (proforma 282). En 2026 lo importó Harmony y te lo revende en $ financiado." },
    { id:"totaling",  pais:"Bolivia",   nombre:"Total Ingredients SpA",   modalidad:"Vía Chile · financiación", activo:true,  link:"cuenta-corriente.html?cc=Bolivia", nota:"Café boliviano vía empresa en Chile (financia). Abrí la cuenta corriente (2025+2026) con tu garantía personal." },
    { id:"choacapa",  pais:"Honduras",  nombre:"Cooperativa Choacapa",    modalidad:"Directo",                  activo:true,  link:"cuenta-corriente.html?cc=Honduras", nota:"Importación 2026. Factura 01681. Abrí la cuenta corriente discriminada por lote/finca." },
    { id:"colegaperu",pais:"Perú",      nombre:"Iván Mulvihill",          modalidad:"Canje / intercambio",      activo:true,  link:"canje-peru.html", nota:"Intercambio de café medido en USD (no hay pago en plata). Abrí el detalle del canje." },
    { id:"vietnam",   pais:"Vietnam",   nombre:"—",                       modalidad:"Inactivo 2026",            activo:false, nota:"Se trajo en 2025. En 2026 no se pudo anticipar por el saldo trabado." }
  ],

  /* ---- Embarques / despachos (reales de Lakaut SRD, 2026) ----
     tipo:  "IDA4" = arribo a depósito fiscal (suspensivo)
            "IC06" = despacho parcial a consumo (nacionalización)
     proveedorId / pais / cafe / kg: por completar con el Excel.   */
  embarques: [
    { despacho:"26001IDA4001760E", tipo:"IDA4", embarque:"BR-LABAREDA-2026", sigea:"16003485", fob:106875.00, kg:13860, deposito:"Fiscal", fechaOfic:"2026-03-17", estadoAfip:"DIGI", proveedorId:"labareda", pais:"Brasil", cafe:"Verde arábica (Labareda Regional, Bom Jesus, Moka, Microlote)", ncm:"0901.11.10", factura:"LB 012/2026 (19/02/2026)", pago:"100% diferido", nota:"Arribo a depósito · 232 bolsas. Nacionalizado 100% = IC06003264M + IC06005485T (34.825 + 72.050 = 106.875 exacto)." },
    { despacho:"26001IC06003264M", tipo:"IC06", embarque:"BR-LABAREDA-2026", cancela:"26001IDA4001760E", sigea:"16003945", fob:34825.00, kg:4500, fechaOfic:"2026-03-17", estadoAfip:"DIGI", proveedorId:"labareda", pais:"Brasil", cafe:"Verde arábica", ncm:"0901.11.10", nota:"1ra nacionalización Labareda (1ra transferencia)." },
    { despacho:"26001IC06005485T", tipo:"IC06", embarque:"BR-LABAREDA-2026", cancela:"26001IDA4001760E", sigea:"16040424", fob:72050.00, kg:9360, fechaOfic:"2026-05-22", estadoAfip:"DIGI", proveedorId:"labareda", pais:"Brasil", cafe:"Verde arábica", ncm:"0901.11.10", nota:"2da nacionalización Labareda (2da transferencia, Galicia)." },
    { despacho:"26001IDA4002093E", tipo:"IDA4", embarque:"BO-TOTALING-2026", sigea:"16013502", fob:162275.40, kg:17010, deposito:"Fiscal", fechaOfic:"2026-04-09", estadoAfip:"DIGI", proveedorId:"totaling", pais:"Bolivia", cafe:"Verde arábica (Café Bolivia Illampu)", ncm:"0901.11.10", factura:"Total Ingredients N° 00002 / Specialty Coffee Bolivia FC N° 36", pago:"30 días, transferencia bancaria", nota:"Arribo a depósito · 367 sacos (200×60kg + 167×30kg). Se nacionaliza por parciales." },
    { despacho:"26001IC06003985W", tipo:"IC06", embarque:"BO-TOTALING-2026", cancela:"26001IDA4002093E", sigea:"16017764", fob:40068.00, kg:4200, fechaOfic:"2026-04-10", estadoAfip:"DIGI", proveedorId:"totaling", pais:"Bolivia", cafe:"Verde arábica (Illampu)", ncm:"0901.11.10", nota:"Parcial Bolivia." },
    { despacho:"26001IC06005357R", tipo:"IC06", embarque:"BO-TOTALING-2026", cancela:"26001IDA4002093E", sigea:"16040424", fob:34344.00, kg:3600, fechaOfic:"2026-05-19", estadoAfip:"DIGI", proveedorId:"totaling", pais:"Bolivia", cafe:"Verde arábica (Illampu)", ncm:"0901.11.10", nota:"Parcial Bolivia · 3.600 kg. (Corrige suposición previa: NO es Labareda.)" },
    { despacho:"26001IC06004390N", tipo:"IC06", embarque:"HN-CHOACAPA-2026", cancela:"26001IDA4002258H", sigea:"16022086", fob:28761.68, kg:4002, fechaOfic:"2026-04-20", estadoAfip:"DIGI", proveedorId:"choacapa", pais:"Honduras", cafe:"Verde arábica HG/SHG EP (microlotes)", ncm:"0901.11.10", nota:"1ª nacionalización Honduras (≈4.002 kg)." },
    { despacho:"26001IC06006020F", tipo:"IC06", embarque:"HN-CHOACAPA-2026", cancela:"26001IDA4002258H", sigea:null, fob:49142.55, kg:6854, fechaOfic:"2026-06-10", estadoAfip:"OFIC", proveedorId:"choacapa", pais:"Honduras", cafe:"Verde arábica HG/SHG EP (microlotes)", ncm:"0901.11.10", nota:"2ª y última nacionalización (10/06/2026) · 6.854 kg. Completa el arribo: 28.762 + 49.143 = 77.904 = 100%. Aún no digitalizado en SRD (sube la semana próxima)." },
    { despacho:"26001IDA4002258H", tipo:"IDA4", embarque:"HN-CHOACAPA-2026", sigea:"16017836", fob:77904.23, kg:10856, deposito:"Fiscal", fechaOfic:"2026-04-16", estadoAfip:"DIGI", proveedorId:"choacapa", pais:"Honduras", cafe:"Verde arábica HG/SHG EP cosecha 2025/26 (microlotes: Rutilio Benitos, Iván Valdez, Javier Sauceda, Nahún Sánchez)", ncm:"0901.11.10", factura:"Choacapa N° 01681 (07/03/2026) · USD 79.212 CFR", pago:"Net cash contra presentación de documentos (a la vista)", nota:"Arribo a depósito · 236 bolsas × 46kg = 10.856 kg. Vía Inter American Cargo (buque Hutton). NACIONALIZADO 100% (IC06004390N + IC06006020F)." }
  ],

  /* ---- Pagos al exterior ---- */
  /* Pago = contra el TOTAL de la factura del proveedor (no por despacho).
     Se va saldando en cuotas a medida que se nacionaliza / según plazo. */
  pagos: [
    { id:"pago-labareda", proveedorId:"labareda", banco:"Galicia", facturaTotal:106875.00, pagado:69650.00, saldo:37225.00, estado:"parcial", tipo:"B06 diferido · en cuotas", doc:"2× SWIFT USD 34.825 (T675460 10/05 + T693213 11/06)", nota:"Factura LB 012/2026 = 106.875. Pagado 69.650 (2 depósitos iguales de 34.825). Saldo 37.225. 100% nacionalizado. Dest. Rabobank Brasil RABOBRSP, interm. JPMorgan." },
    { id:"pago-totaling", proveedorId:"totaling", banco:"Galicia → Nación", facturaTotal:162275.40, pagado:0, saldo:162275.40, estado:"pendiente", tipo:"30 días / financiación (2026)", doc:"RAYPE Bolivia + Certificación de deuda", nota:"Bolivia 2026 · Factura Total Ingredients 00002 = 162.275,40. Nacionalizado parcial 74.412 (con saldo en Galicia: 40.068 + 34.344). Se pasa a Nación para financiar." },
    { id:"pago-totaling-2025", proveedorId:"totaling", banco:"Nación", facturaTotal:107304.00, pagado:80478.00, saldo:26826.00, estado:"parcial", tipo:"Anticipo + diferido (2025)", doc:"DJ saldo 12/06/2026 · Factura 00001 · Transf. 000329663 (53.652 · 10/06/25) + 000127988 (26.826 · 12/11/25)", nota:"Bolivia 2025 · Factura 00001 = 107.304. Pagado 80.478. Saldo técnico USD 26.826 a girar por Nación — pero comercialmente YA CUBIERTO con dinero personal (ene-2026): al girarlo se descuenta de la factura 2026 y se recupera. Ver 'Capital personal'." },
    { id:"pago-choacapa", proveedorId:"choacapa", banco:"Nación", facturaTotal:79212.00, pagado:0, saldo:79212.00, estado:"pendiente", tipo:"Contra documentos (a la vista)", doc:"Factura Choacapa N° 01681", nota:"Factura 01681 = 79.212 CFR. 100% nacionalizado. Trámite en Banco Nación." }
  ],

  /* Capital PERSONAL de Javier puesto en las operaciones (garantías líquidas).
     Es SEPARADO de la deuda técnica con los bancos: cuando se cierra lo técnico,
     este dinero se le reintegra. Sirve para ver la deuda real reclamable y el timing. */
  garantias: [
    { id:"gar-bo-2025", op:"Bolivia 2025", monto:26826.00, fecha:"2026-01", concepto:"Saldo de la factura 2025 pagado con dinero personal para cerrar la operación (sobre-stock al iniciar el negocio).", recupero:"Al girar el saldo técnico (26.826) se descuenta de la factura 2026 → se recupera el dinero." },
    { id:"gar-bo-2026", op:"Bolivia 2026", monto:40000.00, fecha:null, concepto:"Garantía líquida personal del nuevo embarque (no se pudo anticipar por el anticipo trabado de Honduras).", recupero:"Reintegro al terminar de pagar todo lo técnico." }
  ],

  /* ---- "El librito de cada banco" (checklists por transferencia) ---- */
  bancos: [
    { id:"galicia", nombre:"Galicia", dificultad:"Fácil", nota:"Operatoria cómoda.",
      checklist:["Factura comercial","Despacho de importación nacionalizado","DDJJ correspondiente"] },
    { id:"nacion",  nombre:"Nación",  dificultad:"Burocrático", nota:"Pide muchos formularios. Una transferencia (jun-2026) quedó frenada por falta de certificación contable.",
      checklist:["Certificación contable del saldo a transferir ⚠️","Factura comercial","Despacho nacionalizado","DDJJ","Registro RAYPE al día"] }
  ],

  /* ---- Alertas del día a día ---- */
  alertas: [
    { nivel:"danger", titulo:"Anticipo Honduras 2025 trabado · dif. ~USD 13.153", detalle:"Anticipo MSD0001100000018 (Nación) = USD 126.147 (saldo exacto de la factura 01481 del 1er contenedor), presentado contra la proforma del 2º. El 2º contenedor llegó por menos: factura 01655 = USD 112.993,90. Diferencia 126.147 − 112.993,90 ≈ 13.153 (>10k) → no se puede cancelar el anticipo y bloquea anticipos nuevos.", accion:"Plan: con la transferencia de financiación, girar un saldo para cerrar el anticipo + el resto a la factura nueva, de modo que el saldo por despacho quede <10k y cierren ambos (a Choacapa le ingresa el mismo dinero)." },
    { nivel:"warn", titulo:"Honduras (Choacapa) — 100% nacionalizado · pago x Nación", detalle:"Arribo IDA4002258H nacionalizado completo: IC06004390N (28.762) + IC06006020F (49.143, 10/06/2026) = 77.904. Factura 01681 · USD 79.212 CFR. La última nacionalización sube al SRD la semana próxima.", accion:"Adelantar trámites de la transferencia en Banco Nación." },
    { nivel:"warn",   titulo:"Nación — transferencia frenada", detalle:"Faltó la certificación contable que declara el saldo a transferir.", accion:"Pedir la certificación contable al contador y reintentar." }
  ],

  /* ============================================================
     COLOMBIA · HARMONY — caso aparte: NO es importación directa.
     Growth Haus (origen) → Harmony importó/nacionalizó → revende
     a Kapselmaker en PESOS, financiado (cheques). El negocio se
     piensa en USD (FOB/kg + recargo), se paga en pesos a TC factura.
     ============================================================ */
  colombia: {
    origen: {
      exportador:"Growth Haus S.A.S (Armenia, Quindío - Colombia)",
      proforma:"282 · 04/11/2025 · FOB Cartagena · embarque 07/12/2025",
      kg:12040, fobUsd:123116.70, fobKg:10.23, incoterm:"FOB",
      variedades:[
        { nombre:"Café Arábigo Supremo Gaitania", kg:4200, usdKg:10.32, usd:43344.00 },
        { nombre:"Café Arábigo Supremo Herrera",  kg:4200, usdKg:10.22, usd:42924.00 },
        { nombre:"Café Arábigo Blend Finkap",     kg:3290, usdKg:9.83,  usd:32340.70 },
        { nombre:"Café Arábigo Colombia Natural", kg:350,  usdKg:12.88, usd:4508.00 }
      ]
    },
    importador:"Productos Alimenticios Harmony S.A. · CUIT 30-70814042-9 · IVA RI",
    condicion:"Pago en $ pesos · cheques 60 días c/ entrega de valores en 15 d · precio gestionado en USD (FOB/kg + recargo)",
    facturas:[
      { tipo:"Factura A", nro:"0003-00056569", fecha:"2026-03-30", venc:"2026-05-29", kg:4270, tc:1405, subtotalArs:79023241.50, ivaArs:16594880.72, totalArs:95618122.22, usdEq:56244.30, usdKg:13.17 },
      { tipo:"Factura A", nro:"0003-00057631", fecha:"2026-06-09", venc:"2026-06-24", kg:2870, tc:1460, subtotalArs:54827234.00, ivaArs:11513719.14, totalArs:66340953.14, usdEq:37552.90, usdKg:13.08 },
      { tipo:"Nota de Débito", nro:"0003-00006758", fecha:"2026-05-08", venc:"2026-05-15", kg:0, tc:1420, subtotalArs:3727286.74, ivaArs:782730.22, totalArs:4510016.96, usdEq:2624.85, usdKg:null, concepto:"Intereses por cheques (FA 55367/56569)" }
    ],
    retiros:[
      { etapa:"Entrega 1", ref:"Fact. 56569", kg:4270, estado:"facturado" },
      { etapa:"Entrega 2", ref:"Fact. 57631", kg:2870, estado:"facturado" },
      { etapa:"Retiro 3", ref:"+55 días", kg:1633, estado:"pendiente" },
      { etapa:"Retiro 4", ref:"+110 días", kg:1633, estado:"pendiente" },
      { etapa:"Retiro 5", ref:"+165 días", kg:1634, estado:"pendiente" }
    ],
    nota:"Pago en pesos (cheques) pero la deuda se mide en USD: cancelás dólares a TC fecha factura. Faltan cargar los cheques emitidos y el costo financiero en pesos para el resultado final."
  },

  /* ============================================================
     CANJE / INTERCAMBIO con Iván Mulvihill (Perú) — barter medido en USD.
     Kapselmaker le entrega café (Honduras/Brasil/Moka/Bolivia) y él entrega
     café peruano. Se compensa por valor USD. Saldo = entregamos − recibimos.
     ============================================================ */
  canje: {
    socio:"Iván Mulvihill",
    pais:"Perú",
    nota:"Intercambio de café medido en USD: vos le entregás café y él te entrega café peruano. No hay pago en plata; se compensa por valor. Honduras revalorizado a USD 13/kg.",
    entregamos:{
      items:[
        { item:"Honduras", kg:3036, usdKg:13.00, valor:39468 },
        { item:"Brasil",   kg:1800, usdKg:10.50, valor:18900 },
        { item:"Moka",     kg:900,  usdKg:9.60,  valor:8640 },
        { item:"Bolivia",  kg:150,  usdKg:11.50, valor:1725 }
      ],
      kg:5886, valor:68733
    },
    recibimos:{
      items:[
        { item:"Selva",                bolsas:50, kg:1500, valor:17250 },
        { item:"Rufasto Elias",        bolsas:11, kg:330,  valor:4158 },
        { item:"Florentino Ocaña",     bolsas:10, kg:300,  valor:3750 },
        { item:"Julia Ruiz de Garcia", bolsas:10, kg:300,  valor:3840 },
        { item:"Maria Teresa Vidarte", bolsas:10, kg:300,  valor:3858 },
        { item:"Luz Maritsa",          bolsas:10, kg:300,  valor:3780 }
      ],
      bolsas:101, kg:3030, valor:36636
    }
  },

  /* ============================================================
     CUENTAS CORRIENTES por proveedor, discriminadas por variedad/lote.
     (Arrancamos por Honduras/Choacapa. Datos de la factura comercial.)
     ============================================================ */
  ccHonduras: {
    proveedor:"Cooperativa Choacapa",
    pais:"Honduras",
    factura:"N° 000-001-01-000-01681",
    fecha:"2026-03-07",
    contrato:"CHN02-2026",
    despacho:"26001IDA4002258H",
    condicion:"Net cash contra presentación de documentos (a la vista)",
    cosecha:"2024/2025 · HG EP / SHG EP",
    precioRealKg:9.00,
    conceptoFinkap:"Compartir ganancia por darnos crédito — se paga AL FINAL de todo el giro. La factura documenta 7,00–7,50/kg, pero el precio real acordado es USD 9/kg FOB; la diferencia es este concepto.",
    pagado:0,
    lotes:[
      { lote:"Rutilio Benitos Lote 2",          bolsas:11, kg:506,  usdKg:7.25, valor:3668.50 },
      { lote:"Josué Cruz El Sarco",             bolsas:32, kg:1472, usdKg:7.25, valor:10672.00 },
      { lote:"Iván Valdez La Tormenta",         bolsas:15, kg:690,  usdKg:7.00, valor:4830.00 },
      { lote:"Iván Valdez Oliva",               bolsas:39, kg:1794, usdKg:7.00, valor:12558.00 },
      { lote:"Javier Sauceda La Tranquila",     bolsas:12, kg:552,  usdKg:7.25, valor:4002.00 },
      { lote:"Nahún Sánchez La Última",         bolsas:29, kg:1334, usdKg:7.25, valor:9671.50 },
      { lote:"Iván Valdez Ocotillo",            bolsas:54, kg:2484, usdKg:7.50, valor:18630.00 },
      { lote:"Javier Sauceda Piedra Habladora", bolsas:37, kg:1702, usdKg:7.50, valor:12765.00 },
      { lote:"Nahún Sánchez Dos Hermanos",      bolsas:7,  kg:322,  usdKg:7.50, valor:2415.00 }
    ]
  },

  ccLabareda: {
    proveedor:"Labareda do Caititu", pais:"Brasil",
    factura:"LB 012/2026", fecha:"2026-02-19", contrato:"002/1281/0019", despacho:"26001IDA4001760E",
    condicion:"100% diferido (se paga en cuotas)", cosecha:"2026",
    pagado:69650,
    lotes:[
      { lote:"Labareda Regional",   bolsas:100, kg:6000, usdKg:7.75,    valor:46500.00 },
      { lote:"Bom Jesus",           bolsas:80,  kg:4800, usdKg:7.9167,  valor:38000.00 },
      { lote:"Moka + Grinders",     bolsas:50,  kg:3000, usdKg:7.00,    valor:21000.00 },
      { lote:"Microlote (sacas 30kg)", bolsas:2, kg:60,  usdKg:22.9167, valor:1375.00 }
    ]
  },

  ccBolivia: {
    proveedor:"Total Ingredients SpA", pais:"Bolivia",
    factura:"00002 (2026)", fecha:"2026-03-30", despacho:"26001IDA4002093E",
    condicion:"30 días · financiación (pasa de Galicia a Nación)", cosecha:"2026",
    pagado:0,
    movimientos:[
      { fecha:"2025-06-10", concepto:"Anticipo 2025 · Transf. 000329663", debe:0, haber:53652 },
      { fecha:"2025-07-31", concepto:"Factura 00001 (2025) · Illampu", debe:107304, haber:0 },
      { fecha:"2025-11-12", concepto:"Pago 2025 · Transf. 000127988", debe:0, haber:26826 },
      { fecha:"2026-01-15", concepto:"Saldo 2025 cubierto con dinero personal (a recuperar)", debe:0, haber:26826 }
    ],
    garantiaPersonal:[
      { concepto:"Saldo factura 2025 pagado con plata personal (ene-2026)", monto:26826 },
      { concepto:"Garantía líquida del embarque 2026 (no se pudo anticipar)", monto:40000 }
    ],
    lotes:[
      { lote:"Illampu · sacos 30 kg", bolsas:167, kg:5010,  usdKg:9.54, valor:47795.40 },
      { lote:"Illampu · sacos 60 kg", bolsas:200, kg:12000, usdKg:9.54, valor:114480.00 }
    ]
  },

  /* ============================================================
     STOCK FÍSICO — leído de la planilla de Drive que carga el equipo
     ('Stock de granos Honduras Kapselmaker'). SOLO LECTURA.
     Conecta con la importación por el "depósito fiscal".
     ============================================================ */
  stock: {
    fuente:"Planilla Drive 'Stock de granos Honduras Kapselmaker' (la carga el equipo · Jesús)",
    leida:"2026-06-13",
    porOrigen:[
      { origen:"Brasil",   local:9960, fiscal:0 },
      { origen:"Bolivia",  local:3060, fiscal:9210 },
      { origen:"Honduras", local:8924, fiscal:0 },
      { origen:"Colombia", local:4003, fiscal:null, modalidad:"Vía Harmony" },
      { origen:"Perú",     local:2040, fiscal:null, modalidad:"Canje / intercambio" },
      { origen:"Vietnam",  local:3000, fiscal:null, modalidad:"Inactivo 2026" }
    ]
  }
};
