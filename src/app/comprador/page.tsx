"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Heart,
  SlidersHorizontal,
  MapPin,
  BedDouble,
  Bath,
  Car,
  Maximize2,
  Calendar,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Compass,
  FileText,
  MessageCircle,
  BellRing,
  X,
  Building2,
  Eye,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSigiStore, PropertyItem } from "@/lib/store";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface PropertyMatchBreakdown {
  ai_match_score: number;
  rangoPresupuestal: number;
  espacioHomeOfficeFam: number;
  distanciaColegiosBilingues: number;
  alignmentHeadline: string;
  alignmentDescription: string;
}

interface TourRoomArea {
  id: string;
  name: string;
  orientation: string;
  surface: string;
  finishSpec: string;
  hotspotNote: string;
  image: string;
}

const TOUR_AREAS: TourRoomArea[] = [
  {
    id: "estancia",
    name: "Estancia & Doble Altura",
    orientation: "Orientación Sur-Oriente • 118° SE",
    surface: "84 m² libres • Altura 5.40 m",
    finishSpec: "Piso de Mármol Santo Tomás & Cristal Duovent Acústico",
    hotspotNote: "Iluminación escénica Lutron HomeWorks QS integrada",
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "cocina",
    name: "Cocina de Autor & Cuarzo",
    orientation: "Orientación Oriente • 88° E",
    surface: "42 m² • Isla Central Monolítica",
    finishSpec: "Cubierta de Cuarzo Calacatta & Equipos Sub-Zero / Wolf",
    hotspotNote: "Cava climatizada dual para 140 botellas y alacena oculta",
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "suite",
    name: "Master Suite & Walk-in Closet",
    orientation: "Orientación Poniente • 265° W",
    surface: "68 m² • Terraza Privada",
    finishSpec: "Duela de Ingeniería de Nogal Europeo & Baño Spa en Ónix",
    hotspotNote: "Aislamiento termoacústico certificable y persianas motorizadas",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "terraza",
    name: "Terraza Social & Alberca",
    orientation: "Orientación Sur • 182° S",
    surface: "110 m² Exteriores • Deck Cumarú",
    finishSpec: "Alberca Infinita con Bomba de Calor & Paneles Solares",
    hotspotNote: "Firepit perimetral y cocina exterior con asador de acero",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
  },
];

export default function CompradorPage() {
  const {
    properties,
    currentUser,
    scheduleVisit,
    applyAiMatchedProperties,
  } = useSigiStore();

  // Estados interactivos de cabecera y filtros
  const [operationMode, setOperationMode] = useState<"comprar" | "rentar">(
    "comprar"
  );
  const [zoneFilter, setZoneFilter] = useState("Juriquilla, Querétaro");
  const [maxBudgetMillions, setMaxBudgetMillions] = useState<number>(18.5);
  const [typologyFilter, setTypologyFilter] = useState("Residencial / Villa");

  // Estado del motor IA (/api/ai-match)
  const [matchedList, setMatchedList] = useState<PropertyItem[]>([]);
  const [breakdownsByFolio, setBreakdownsByFolio] = useState<
    Record<string, PropertyMatchBreakdown>
  >({});
  const [isCalculatingAi, setIsCalculatingAi] = useState(false);
  const [filterStatusToast, setFilterStatusToast] = useState<string | null>(
    null
  );

  // Propiedades mostradas en el carrusel tipo acordeón (ordenadas por el motor de IA)
  const sourceProperties = matchedList.length > 0 ? matchedList : properties;
  const carouselProperties = sourceProperties.slice(0, 4);

  const [expandedId, setExpandedId] = useState<string>(
    carouselProperties[0]?.id || "prop-juriquilla-089"
  );
  const [favorites, setFavorites] = useState<Record<string, boolean>>({
    "prop-juriquilla-089": true,
  });

  // Modales y notificaciones interactivas
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [visitPropertyTitle, setVisitPropertyTitle] = useState(
    "Residencia Cumbres de Juriquilla"
  );
  const [visitDate, setVisitDate] = useState("Mañana, 11:30 AM");

  // Estado de Alerta en Tiempo Real
  const [alertActivated, setAlertActivated] = useState(false);
  const [alertConfirmationMsg, setAlertConfirmationMsg] = useState<
    string | null
  >(null);

  // Estado del Visor 360° Matterport 4K
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [selectedTourAreaId, setSelectedTourAreaId] =
    useState<string>("estancia");
  const [tourYawAngle, setTourYawAngle] = useState<number>(180);
  const [tourZoom, setTourZoom] = useState<number>(1.05);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);

  const [advisorToast, setAdvisorToast] = useState<string | null>(null);

  const activeProperty =
    carouselProperties.find((p) => p.id === expandedId) ||
    carouselProperties[0] ||
    properties[0];

  const activeBreakdown: PropertyMatchBreakdown = (activeProperty &&
    breakdownsByFolio[activeProperty.folio]) || {
    ai_match_score: activeProperty?.aiMatch || 96,
    rangoPresupuestal: 100,
    espacioHomeOfficeFam: activeProperty?.aiMatch || 96,
    distanciaColegiosBilingues: Math.max(
      86,
      (activeProperty?.aiMatch || 96) - 2
    ),
    alignmentHeadline: `${
      activeProperty?.aiMatch || 96
    }% Alineación Excepcional`,
    alignmentDescription: `Supera el ${Math.max(
      85,
      (activeProperty?.aiMatch || 96) - 2
    )}% de las propiedades analizadas en tu perfil patrimonial.`,
  };

  // Llamada al motor /api/ai-match
  const runAiMatchEngine = useCallback(
    async (opts?: { manualButton?: boolean }) => {
      if (opts?.manualButton) {
        setIsCalculatingAi(true);
      }
      try {
        const response = await fetch("/api/ai-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            budget: maxBudgetMillions,
            zone: zoneFilter,
            typology: typologyFilter,
            mode: operationMode === "rentar" ? "Rentar" : "Comprar",
            persist: Boolean(opts?.manualButton),
            properties,
          }),
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (Array.isArray(data.properties) && data.properties.length > 0) {
          const nextBreakdowns: Record<string, PropertyMatchBreakdown> = {};
          const nextProps: PropertyItem[] = data.properties.map(
            (item: Record<string, unknown>) => {
              const folio = String(item.folio || "MX-QRO-2025-089");
              const score = Number(item.ai_match_score ?? item.aiMatch ?? 94);
              const bd = (item.breakdown || {}) as Record<string, number>;

              nextBreakdowns[folio] = {
                ai_match_score: score,
                rangoPresupuestal: Number(bd.rangoPresupuestal ?? 98),
                espacioHomeOfficeFam: Number(bd.espacioHomeOfficeFam ?? 95),
                distanciaColegiosBilingues: Number(
                  bd.distanciaColegiosBilingues ?? 93
                ),
                alignmentHeadline: String(
                  item.alignmentHeadline || `${score}% Alineación Excepcional`
                ),
                alignmentDescription: String(
                  item.alignmentDescription ||
                    `Supera el ${
                      score - 2
                    }% de las propiedades analizadas en tu perfil patrimonial.`
                ),
              };

              return {
                ...(item as unknown as PropertyItem),
                aiMatch: score,
                aiMatchDisplay: `${score}%`,
              };
            }
          );

          setBreakdownsByFolio(nextBreakdowns);
          setMatchedList(nextProps);

          if (opts?.manualButton) {
            applyAiMatchedProperties(nextProps);
            if (nextProps[0]) {
              setExpandedId(nextProps[0].id);
            }
            setFilterStatusToast(
              `Motor SIGI Match v4.8 actualizado: ${nextProps.length} propiedades ordenadas para ${zoneFilter} (${
                operationMode === "rentar" ? "Rentar" : "Comprar"
              } • Máx. $${maxBudgetMillions.toFixed(
                1
              )}M MXN • ${typologyFilter}). Mejor coincidencia: ${
                nextProps[0]?.title
              } (${nextProps[0]?.aiMatchDisplay}).`
            );
          }
        }
      } catch {
        // Mantener último estado calculado si ocurre un error de red
      } finally {
        if (opts?.manualButton) {
          setIsCalculatingAi(false);
        }
      }
    },
    [
      maxBudgetMillions,
      zoneFilter,
      typologyFilter,
      operationMode,
      properties,
      applyAiMatchedProperties,
    ]
  );

  // Recalcular en vivo cada vez que cambian los filtros superiores
  useEffect(() => {
    let active = true;
    fetch("/api/ai-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budget: maxBudgetMillions,
        zone: zoneFilter,
        typology: typologyFilter,
        mode: operationMode === "rentar" ? "Rentar" : "Comprar",
        persist: false,
        properties,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data || !Array.isArray(data.properties)) return;
        const nextBreakdowns: Record<string, PropertyMatchBreakdown> = {};
        const nextProps: PropertyItem[] = data.properties.map(
          (item: Record<string, unknown>) => {
            const folio = String(item.folio || "MX-QRO-2025-089");
            const score = Number(item.ai_match_score ?? item.aiMatch ?? 94);
            const bd = (item.breakdown || {}) as Record<string, number>;

            nextBreakdowns[folio] = {
              ai_match_score: score,
              rangoPresupuestal: Number(bd.rangoPresupuestal ?? 98),
              espacioHomeOfficeFam: Number(bd.espacioHomeOfficeFam ?? 95),
              distanciaColegiosBilingues: Number(
                bd.distanciaColegiosBilingues ?? 93
              ),
              alignmentHeadline: String(
                item.alignmentHeadline || `${score}% Alineación Excepcional`
              ),
              alignmentDescription: String(
                item.alignmentDescription ||
                  `Supera el ${
                    score - 2
                  }% de las propiedades analizadas en tu perfil patrimonial.`
              ),
            };

            return {
              ...(item as unknown as PropertyItem),
              aiMatch: score,
              aiMatchDisplay: `${score}%`,
            };
          }
        );
        setBreakdownsByFolio(nextBreakdowns);
        setMatchedList(nextProps);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [zoneFilter, maxBudgetMillions, typologyFilter, operationMode, properties]);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openScheduleModal = (title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVisitPropertyTitle(title);
    setVisitModalOpen(true);
  };

  // Botón WhatsApp funcional (https://wa.me/525589201200 con Folio SIGI prellenado)
  const handleOpenWhatsApp = () => {
    const folio = activeProperty?.folio || "MX-QRO-2025-089";
    const title = activeProperty?.title || "Residencia Cumbres de Juriquilla";
    const priceLabel =
      operationMode === "rentar" && activeProperty?.rentPriceDisplay
        ? `${activeProperty.rentPriceDisplay} MXN/mes`
        : activeProperty?.salePriceDisplay || "$4,350,000 MXN";
    const matchLabel = activeProperty?.aiMatchDisplay || "96%";

    const text = `Hola Lic. Mariana De la Vega, solicito información y atención prioritaria sobre la propiedad "${title}" con Folio SIGI: ${folio} (${priceLabel} • ${matchLabel} Match IA) vista en el portal Coldwell Banker México.`;
    const whatsappUrl = `https://wa.me/525589201200?text=${encodeURIComponent(
      text
    )}`;

    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }

    setAdvisorToast(
      `Enlace WhatsApp abierto con Lic. Mariana De la Vega (+52 55 8920 1200) para Folio SIGI ${folio}.`
    );
  };

  // Botón Ficha PDF funcional (window.print() con layout limpio de ficha catastral)
  const handlePrintFichaPdf = () => {
    const folio = activeProperty?.folio || "MX-QRO-2025-089";
    setAdvisorToast(
      `Dossier Técnico Certificado generado para impresión/descarga PDF (Folio ${folio}).`
    );
    if (typeof window !== "undefined") {
      setTimeout(() => {
        window.print();
      }, 120);
    }
  };

  // Botón Activar Alerta en Tiempo Real funcional (persiste suscripción y muestra notificación verde)
  const handleToggleRealtimeAlert = async () => {
    const nextActive = !alertActivated;
    setAlertActivated(nextActive);

    if (nextActive) {
      const msg = `Suscripción activa y sincronizada: recibirás alertas vía WhatsApp para propiedades en ${zoneFilter} (${typologyFilter} • hasta $${maxBudgetMillions.toFixed(
        1
      )}M MXN) con Match IA superior al 90%.`;
      setAlertConfirmationMsg(msg);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            "sigi_realtime_match_alert_v1",
            JSON.stringify({
              active: true,
              zone: zoneFilter,
              budgetMillions: maxBudgetMillions,
              typology: typologyFilter,
              mode: operationMode,
              message: msg,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {
          // Ignore storage error
        }
      }

      if (isSupabaseConfigured) {
        try {
          const userEmail =
            currentUser?.email || "regina.lujan@inversionista.mx";
          await supabase.from("visits").insert({
            property_folio: activeProperty?.folio || "MX-QRO-2025-089",
            visitor_name: currentUser?.fullName || "Lic. Regina Luján",
            visitor_phone: currentUser?.phone || "+52 55 8920 1200",
            schedule_label: `Alerta Match >90% (${zoneFilter})`,
            buyer_score_badge: `Presupuesto $${maxBudgetMillions.toFixed(1)}M`,
            visit_purpose: `Suscripción Alerta Tiempo Real (${userEmail})`,
            status: "Activa",
          });
        } catch {
          // Fallback local ya guardado
        }
      }
    } else {
      setAlertConfirmationMsg(null);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem("sigi_realtime_match_alert_v1");
        } catch {
          // Ignore
        }
      }
    }
  };

  const activeTourArea =
    TOUR_AREAS.find((a) => a.id === selectedTourAreaId) || TOUR_AREAS[0];

  const getCoordinatesForZone = (zone?: string, location?: string) => {
    const s = `${zone || ""} ${location || ""}`.toLowerCase();
    if (s.includes("san pedro") || s.includes("n.l")) {
      return {
        corridor: "San Pedro Garza García • Corredor Valle Oriente & Chipinque",
        coords: "25.6574° N, 100.3688° W • Zona Metropolitana Monterrey",
      };
    }
    if (s.includes("polanco") || s.includes("cdmx") || s.includes("elíseos")) {
      return {
        corridor: "Polanco IV Sección • Corredor Masaryk & Campos Elíseos",
        coords: "19.4285° N, 99.1964° W • Miguel Hidalgo, CDMX",
      };
    }
    return {
      corridor: "Juriquilla Santa Fe • A 4 min de Antea Lifestyle Center",
      coords: "20.7089° N, 100.4462° W • Corredor Premium Querétaro",
    };
  };

  const locationMeta = getCoordinatesForZone(
    activeProperty?.zone,
    activeProperty?.location
  );

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Barra de Navegación Superior (oculta al imprimir PDF) */}
      <div className="print:hidden">
        <Navbar />
      </div>

      {/* Layout exclusivo para Impresión / Descarga de Ficha PDF Catastral */}
      <section className="hidden print:block p-8 bg-white text-slate-900 space-y-6">
        <div className="flex items-center justify-between border-b-2 border-[#0B1F3A] pb-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#0B1F3A]">
              COLDWELL BANKER MÉXICO • SISTEMA INTEGRAL DE GESTIÓN INMOBILIARIA
              (SIGI v4.8)
            </p>
            <h1 className="text-2xl font-extrabold text-[#0B1F3A] mt-1">
              DOSSIER TÉCNICO &amp; FICHA CATASTRAL CERTIFICADA
            </h1>
            <p className="text-xs text-slate-600">
              Expediente auditado bajo la norma oficial NOM-247-SE-2021 y
              LFPDPPP
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-extrabold text-[#0B1F3A]">
              FOLIO SIGI: {activeProperty?.folio || "MX-QRO-2025-089"}
            </span>
            <p className="text-xs font-bold text-emerald-700 mt-1">
              Compatibilidad Algorítmica:{" "}
              {activeProperty?.aiMatchDisplay || "96%"} Match
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase text-slate-500">
              Propiedad Patrimonial
            </p>
            <h2 className="text-xl font-extrabold text-[#0B1F3A]">
              {activeProperty?.title}
            </h2>
            <p className="text-xs text-slate-700">{activeProperty?.location}</p>
            <p className="text-xs font-semibold text-slate-600">
              Zona: {activeProperty?.zone || zoneFilter} | Tipología:{" "}
              {activeProperty?.typology || typologyFilter}
            </p>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-xs font-bold uppercase text-slate-500">
              Valuación Oficial de Mercado
            </p>
            <p className="text-2xl font-extrabold text-[#0B1F3A]">
              {activeProperty?.salePriceDisplay} MXN
            </p>
            {activeProperty?.rentPriceDisplay && (
              <p className="text-xs font-bold text-sky-700">
                Renta Mensual Estimada: {activeProperty.rentPriceDisplay}{" "}
                MXN/mes
              </p>
            )}
            <p className="text-xs text-emerald-700 font-semibold">
              Plusvalía Anual: {activeProperty?.plusvalia || "+11.8%"} • Cap
              Rate: {activeProperty?.capRate || "8.8% Anual"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 border-y border-slate-200 py-4 text-xs">
          <div>
            <span className="text-slate-500 block">Superficie de Terreno</span>
            <strong className="text-sm text-[#0B1F3A]">
              {activeProperty?.landAreaDisplay}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">
              Superficie Construcción
            </span>
            <strong className="text-sm text-[#0B1F3A]">
              {activeProperty?.constructionAreaDisplay}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Distribución</span>
            <strong className="text-sm text-[#0B1F3A]">
              {activeProperty?.bedroomsDisplay} •{" "}
              {activeProperty?.bathroomsDisplay}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Estacionamiento</span>
            <strong className="text-sm text-[#0B1F3A]">
              {activeProperty?.parkingDisplay || "2 Autos"}
            </strong>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase text-[#0B1F3A]">
            Desglose Algorítmico SIGI Match v4.8
          </h3>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Rango Presupuestal</span>
              <strong className="text-emerald-700">
                {activeBreakdown.rangoPresupuestal}% OK
              </strong>
            </div>
            <div className="p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">
                Espacio para Home Office &amp; Fam
              </span>
              <strong className="text-emerald-700">
                {activeBreakdown.espacioHomeOfficeFam}% OK
              </strong>
            </div>
            <div className="p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">
                Distancia a Colegios Bilingües
              </span>
              <strong className="text-emerald-700">
                {activeBreakdown.distanciaColegiosBilingues}% OK
              </strong>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            <strong>Asesor Inmobiliario Certificado:</strong> Lic. Mariana De la
            Vega (Senior Luxury Specialist • Certificación AMPI)
          </div>
          <div>Contacto Directo: +52 55 8920 1200 • coldwellbanker.com.mx</div>
        </div>
      </section>

      <main className="print:hidden flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Cabecera Principal */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1F3A] text-sky-300 text-[11px] font-extrabold tracking-wider uppercase mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>• ALGORITMO SIGI MATCH 4.8</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
              Propiedades para Ti
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl">
              Recomendaciones personalizadas según tu perfil de búsqueda para
              residencia premium y patrimonial en México.
            </p>
          </div>

          {/* Switch interactivo Comprar | Rentar y Badge 48 Verificadas */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <button
                type="button"
                onClick={() => setOperationMode("comprar")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  operationMode === "comprar"
                    ? "bg-[#0B1F3A] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                Comprar
              </button>
              <button
                type="button"
                onClick={() => setOperationMode("rentar")}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  operationMode === "rentar"
                    ? "bg-[#0B1F3A] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#0B1F3A]"
                }`}
              >
                Rentar
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              48 Verificadas
            </span>
          </div>
        </section>

        {/* Barra de Filtros Interactiva conectada a /api/ai-match */}
        <section className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Zona de Interés */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Zona de Interés
            </label>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0B1F3A] shrink-0" />
              <select
                value={zoneFilter}
                onChange={(e) => setZoneFilter(e.target.value)}
                aria-label="Zona de Interés"
                className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1F3A] focus:outline-none cursor-pointer"
              >
                <option value="Juriquilla, Querétaro">
                  Juriquilla, Querétaro
                </option>
                <option value="San Pedro Garza García, N.L.">
                  San Pedro Garza García, N.L.
                </option>
                <option value="Polanco IV Sección, CDMX">
                  Polanco IV Sección, CDMX
                </option>
                <option value="Riviera Maya & Tulum">
                  Riviera Maya &amp; Tulum
                </option>
              </select>
            </div>
          </div>

          {/* Slider de Presupuesto Máximo */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:px-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Presupuesto Máximo
              </span>
              <span className="text-xs font-extrabold text-[#0B1F3A]">
                ${maxBudgetMillions.toFixed(1)}M MXN
              </span>
            </div>
            <input
              type="range"
              min={4.0}
              max={45.0}
              step={0.5}
              value={maxBudgetMillions}
              onChange={(e) => setMaxBudgetMillions(parseFloat(e.target.value))}
              aria-label="Presupuesto Máximo"
              className="w-full accent-[#0B1F3A] cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
          </div>

          {/* Selector de Tipología */}
          <div className="md:col-span-3 pb-2 md:pb-0 md:px-2">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              Tipología Patrimonial
            </label>
            <select
              value={typologyFilter}
              onChange={(e) => setTypologyFilter(e.target.value)}
              aria-label="Tipología Patrimonial"
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#0B1F3A] focus:outline-none cursor-pointer"
            >
              <option value="Residencial / Villa">Residencial / Villa</option>
              <option value="Penthouse & Sky Residence">
                Penthouse &amp; Sky Residence
              </option>
              <option value="Terreno Golf & Club">
                Terreno Golf &amp; Club
              </option>
            </select>
          </div>

          {/* Botón oscuro Filtros conectado a /api/ai-match */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={() => void runAiMatchEngine({ manualButton: true })}
              className="w-full md:w-auto px-4 py-3 rounded-2xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{isCalculatingAi ? "IA..." : "Filtros"}</span>
            </button>
          </div>
        </section>

        {filterStatusToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              {filterStatusToast}
            </span>
            <button
              type="button"
              onClick={() => setFilterStatusToast(null)}
              className="text-emerald-700 hover:underline shrink-0 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Carrusel Tipo Acordeón Horizontal: FEATURED DEALS CAROUSEL */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
                FEATURED DEALS CAROUSEL
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                Propiedades que más te podrían interesar
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Haz clic en cualquier tarjeta vertical para expandir su vista y
              actualizar su análisis algorítmico
            </span>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 min-h-[440px]">
            {carouselProperties.map((prop) => {
              const isExpanded = prop.id === activeProperty?.id;
              const isFav = !!favorites[prop.id];

              if (isExpanded) {
                return (
                  <div
                    key={prop.id}
                    className="lg:flex-[3.2] relative rounded-3xl overflow-hidden shadow-xl bg-[#0B1F3A] min-h-[420px] flex flex-col justify-between transition-all duration-500 border border-slate-200/40"
                  >
                    <img
                      src={prop.image}
                      alt={prop.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-[#0B1F3A]/45 to-black/20" />

                    {/* Top badges & Botón de Corazón Favoritos */}
                    <div className="relative z-10 p-6 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-extrabold tracking-wide shadow-sm">
                          • {prop.aiMatchDisplay} MATCH PREFERENCIAS
                        </span>
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                          Exclusiva SIGI
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(prop.id, e)}
                        aria-label="Guardar en Favoritos"
                        className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
                          isFav
                            ? "bg-rose-500 text-white shadow-md"
                            : "bg-white/20 text-white hover:bg-white/35"
                        }`}
                      >
                        <Heart
                          className={`w-5 h-5 ${isFav ? "fill-current" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Información Inferior de la Propiedad Expandida */}
                    <div className="relative z-10 p-6 sm:p-8 text-white">
                      <p className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                        Folio {prop.folio} • {prop.location}
                      </p>
                      <h3 className="text-2xl sm:text-3xl font-extrabold mt-1">
                        {prop.title}
                      </h3>

                      <div className="mt-3 space-y-1">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
                          {operationMode === "rentar"
                            ? "RENTA MENSUAL"
                            : "PRECIO DE VENTA"}
                        </p>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="text-2xl sm:text-3xl font-extrabold text-white">
                            {operationMode === "rentar" && prop.rentPriceDisplay
                              ? `${prop.rentPriceDisplay} MXN/mes`
                              : prop.salePriceDisplay.includes("MXN")
                              ? prop.salePriceDisplay
                              : `${prop.salePriceDisplay} MXN`}
                          </span>
                        </div>
                        {prop.rentPriceDisplay && (
                          <p className="text-xs sm:text-sm font-semibold text-sky-200">
                            o Renta: {prop.rentPriceDisplay} MXN/mes
                          </p>
                        )}
                      </div>

                      {/* Métricas y Botón Blanco Agendar Visita */}
                      <div className="mt-5 pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-slate-100">
                          <span className="inline-flex items-center gap-1.5">
                            <BedDouble className="w-4 h-4 text-sky-300" />
                            {prop.bedroomsDisplay}
                          </span>
                          <span>|</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Bath className="w-4 h-4 text-sky-300" />
                            {prop.bathroomsDisplay}
                          </span>
                          <span>|</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-sky-300" />
                            {prop.parkingDisplay || "2 Autos"}
                          </span>
                          <span>|</span>
                          <span className="inline-flex items-center gap-1.5">
                            <Maximize2 className="w-4 h-4 text-sky-300" />
                            {prop.constructionAreaDisplay} Const.
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => openScheduleModal(prop.title, e)}
                          className="px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-[#0B1F3A] font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          <Calendar className="w-4 h-4 text-[#0B1F3A]" />
                          <span>Agendar Visita</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Tarjetas verticales colapsadas con nombre y precio rotados verticalmente (-rotate-90 whitespace-nowrap)
              return (
                <div
                  key={prop.id}
                  onClick={() => setExpandedId(prop.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setExpandedId(prop.id);
                    }
                  }}
                  className="lg:flex-1 relative rounded-3xl overflow-hidden shadow-md bg-[#0B1F3A] min-h-[180px] lg:min-h-[420px] flex flex-col justify-between p-4 cursor-pointer group hover:ring-2 hover:ring-sky-400 transition-all duration-300"
                >
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051122]/90 via-[#0B1F3A]/55 to-black/25" />

                  {/* Parte superior: badge de % Match y botón circular de corazón */}
                  <div className="relative z-10 flex items-center justify-between gap-1">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/95 text-white text-[11px] font-extrabold">
                      {prop.aiMatchDisplay} Match
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(prop.id, e)}
                      aria-label="Favorito"
                      className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center shrink-0"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Cuerpo central con nombre y precio rotados verticalmente en texto blanco limpio */}
                  <div className="relative z-10 flex-1 flex items-center justify-center py-6">
                    <span className="-rotate-90 whitespace-nowrap text-sm sm:text-base font-extrabold tracking-wide text-white drop-shadow-sm">
                      {prop.title} •{" "}
                      {operationMode === "rentar" && prop.rentPriceDisplay
                        ? `${prop.rentPriceDisplay}/mes`
                        : prop.salePriceDisplay}
                    </span>
                  </div>

                  <div className="relative z-10 h-2" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Bloque Inferior Dinámico: FICHA TÉCNICA & ANÁLISIS ALGORÍTMICO */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-[#0B1F3A] uppercase">
              FICHA TÉCNICA &amp; ANÁLISIS ALGORÍTMICO (FOLIO SIGI:{" "}
              {activeProperty?.folio || "MX-QRO-2025-089"})
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Auditoría Jurídica &amp; Valuación Verificada •{" "}
              {activeProperty?.title}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 4 Tarjetas Métricas Dinámicas según la tarjeta seleccionada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                    {activeProperty?.landAreaDisplay || "315 m²"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Superficie Terreno
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Frente de{" "}
                    {Math.max(
                      12,
                      Math.round((activeProperty?.landArea || 315) / 21.7)
                    )}
                    .5 m
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                    {activeProperty?.constructionAreaDisplay || "280 m²"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Construcción
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeProperty?.typology
                      ?.toLowerCase()
                      .includes("penthouse")
                      ? "Sky Level + Terraza"
                      : "2 Niveles + Roof"}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-600">
                    {activeProperty?.plusvalia || "+11.8%"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Plusvalía Anual Proy.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {activeProperty?.zone || "Zona Querétaro Nte."}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-sky-700">
                    {activeProperty?.capRate || "8.8% Anual"}
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Cap Rate Renta
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Estimación Certificada
                  </p>
                </div>
              </div>

              {/* 2 Fotografías de interiores + Tarjeta interactiva Tour Virtual 360° Matterport 4K Activo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  onClick={() => {
                    setSelectedTourAreaId("estancia");
                    setTourModalOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTourAreaId("estancia");
                      setTourModalOpen(true);
                    }
                  }}
                  className="relative rounded-2xl overflow-hidden h-48 shadow-xs group cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80"
                    alt="Estancia principal doble altura"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white">
                      Estancia &amp; Doble Altura
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setSelectedTourAreaId("cocina");
                    setTourModalOpen(true);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedTourAreaId("cocina");
                      setTourModalOpen(true);
                    }
                  }}
                  className="relative rounded-2xl overflow-hidden h-48 shadow-xs group cursor-pointer"
                >
                  <img
                    src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=800&q=80"
                    alt="Cocina de autor con isla de cuarzo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
                    <span className="text-xs font-bold text-white">
                      Cocina de Autor &amp; Cuarzo
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTourModalOpen(true)}
                  className="relative rounded-2xl overflow-hidden h-48 bg-[#0B1F3A] text-white p-5 flex flex-col justify-between text-left shadow-md hover:bg-[#122e55] transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-300 group-hover:scale-110 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                      <Eye className="w-3 h-3" /> Inmersivo
                    </span>
                    <p className="text-sm font-extrabold leading-snug mt-1">
                      Tour Virtual 360° Matterport 4K Activo
                    </p>
                    <p className="text-[11px] text-sky-200 mt-1 underline">
                      Explorar recorrido digital →
                    </p>
                  </div>
                </button>
              </div>

              {/* Badges de AMENIDADES & PRIVILEGIOS RESIDENCIALES */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F3A]">
                  AMENIDADES &amp; PRIVILEGIOS RESIDENCIALES
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    "Acceso Controlado 24/7",
                    "Alberca Climatizada & Deck",
                    "Paneles Solares Integrados",
                    "Parque Lineal Privado",
                    "Cargador Eléctrico Nivel 2",
                  ].map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-[#0B1F3A]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mapa Visual UBICACIÓN ESTRATÉGICA dinámico */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0B1F3A]" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                      UBICACIÓN ESTRATÉGICA: {locationMeta.corridor}
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {activeProperty?.location}
                  </span>
                </div>

                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <div
                    className="absolute inset-0 opacity-35"
                    style={{
                      backgroundImage:
                        "radial-gradient(#0B1F3A 1px, transparent 1px), linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)",
                      backgroundSize: "20px 20px, 40px 40px, 40px 40px",
                    }}
                  />
                  <div className="relative z-10 px-4 py-2.5 rounded-2xl bg-[#0B1F3A] text-white shadow-lg flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <div className="text-xs">
                      <p className="font-extrabold">{activeProperty?.title}</p>
                      <p className="text-[10px] text-sky-300">
                        {locationMeta.coords}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: DESGLOSE DE COMPATIBILIDAD conectado en vivo a /api/ai-match */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F3A]">
                    DESGLOSE DE COMPATIBILIDAD
                  </h3>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>

                {/* Aro verde dinámico con el % de afinidad de la propiedad activa */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-white shrink-0 shadow-xs">
                    <span className="text-lg font-extrabold text-emerald-700">
                      {activeBreakdown.ai_match_score}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      {activeBreakdown.alignmentHeadline}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {activeBreakdown.alignmentDescription}
                    </p>
                  </div>
                </div>

                {/* Barras de progreso dinámicas de los 3 criterios */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Rango Presupuestal</span>
                      <span className="text-emerald-700">
                        {activeBreakdown.rangoPresupuestal}% OK
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${activeBreakdown.rangoPresupuestal}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Espacio para Home Office &amp; Fam</span>
                      <span className="text-emerald-700">
                        {activeBreakdown.espacioHomeOfficeFam}% OK
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${activeBreakdown.espacioHomeOfficeFam}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Distancia a Colegios Bilingües</span>
                      <span className="text-emerald-700">
                        {activeBreakdown.distanciaColegiosBilingues}% OK
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${activeBreakdown.distanciaColegiosBilingues}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: ASESOR INMOBILIARIO CERTIFICADO */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                  ASESOR INMOBILIARIO CERTIFICADO
                </p>

                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#0B1F3A] text-white font-extrabold text-sm flex items-center justify-center shrink-0">
                    MV
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
                      Lic. Mariana De la Vega
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Senior Luxury Specialist • Certificación AMPI
                    </p>
                  </div>
                </div>

                {advisorToast && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center justify-between gap-2">
                    <span>{advisorToast}</span>
                    <button
                      type="button"
                      onClick={() => setAdvisorToast(null)}
                      className="text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      openScheduleModal(
                        activeProperty?.title ||
                          "Residencia Cumbres de Juriquilla"
                      )
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar Cita Privada</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleOpenWhatsApp}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintFichaPdf}
                      className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0B1F3A] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Ficha PDF</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 3: Azul Claro Alerta Automática de Match */}
              <div className="rounded-3xl bg-sky-50 border border-sky-200/80 p-6 space-y-3">
                <div className="flex items-center gap-2 text-[#0B1F3A]">
                  <BellRing className="w-5 h-5 text-sky-600" />
                  <h4 className="text-sm font-extrabold">
                    Alerta Automática de Match
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Recibe notificación prioritaria vía WhatsApp cuando ingrese al
                  MLS privado una propiedad con compatibilidad superior al 90%.
                </p>

                {alertActivated && alertConfirmationMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{alertConfirmationMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void handleToggleRealtimeAlert()}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    alertActivated
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-[#0B1F3A] hover:bg-[#143159] text-white"
                  }`}
                >
                  {alertActivated
                    ? "✓ Alerta en Tiempo Real Activada"
                    : "Activar Alerta en Tiempo Real"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Confirmación Exitosa para Agendar Visita */}
      {visitModalOpen && (
        <div className="print:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <button
                type="button"
                onClick={() => setVisitModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                CONFIRMACIÓN OFICIAL SIGI
              </span>
              <h3 className="text-xl font-extrabold text-[#0B1F3A] mt-1">
                Visita Privada Agendada con Éxito
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
                Tu recorrido personalizado para{" "}
                <strong className="text-[#0B1F3A]">{visitPropertyTitle}</strong>{" "}
                ha sido asignado a la <strong>Lic. Mariana De la Vega</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Folio de Seguridad:</span>
                <span className="font-bold text-[#0B1F3A]">
                  {activeProperty?.folio || "MX-QRO-2025-089"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Horario Preferente:</span>
                <select
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="font-bold text-[#0B1F3A] bg-white border border-slate-200 rounded-lg px-2 py-1"
                >
                  <option value="Mañana, 11:30 AM">Mañana, 11:30 AM</option>
                  <option value="Jueves, 04:30 PM">Jueves, 04:30 PM</option>
                  <option value="Sábado, 10:30 AM">Sábado, 10:30 AM</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await scheduleVisit({
                  propertyFolio: activeProperty?.folio || "MX-QRO-2025-089",
                  propertyTitle: visitPropertyTitle,
                  scheduleLabel: visitDate,
                });
                setVisitModalOpen(false);
                setAdvisorToast(
                  `Visita privada confirmada y registrada en Supabase (public.visits) para ${visitPropertyTitle} (${visitDate}).`
                );
              }}
              className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white font-bold text-xs sm:text-sm cursor-pointer"
            >
              Entendido y Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Modal Interactivo de Tour Virtual 360° Matterport 4K */}
      {tourModalOpen && (
        <div className="print:hidden fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0B1F3A] text-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-white/15 space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Cabecera del visor 360° */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Tour Virtual 360° Matterport 4K Activo • Folio{" "}
                  {activeProperty?.folio || "MX-QRO-2025-089"}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold mt-0.5">
                  {activeProperty?.title} — {activeTourArea.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTourModalOpen(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Áreas Arquitectónicas de la Residencia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TOUR_AREAS.map((area) => {
                const isSelected = area.id === activeTourArea.id;
                return (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => {
                      setSelectedTourAreaId(area.id);
                      setTourYawAngle(180);
                    }}
                    className={`px-3 py-2.5 rounded-xl text-left text-xs font-extrabold transition-all cursor-pointer border ${
                      isSelected
                        ? "bg-sky-500/25 border-sky-300 text-white shadow-sm"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <p className="truncate">{area.name}</p>
                    <p className="text-[10px] text-sky-300 font-medium truncate mt-0.5">
                      {area.surface}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Lienzo Panorámico 360° Interactivo */}
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 select-none">
              <img
                src={activeTourArea.image}
                alt={activeTourArea.name}
                className="w-full h-full object-cover transition-transform duration-300"
                style={{
                  transform: `scale(${tourZoom}) translateX(${
                    (180 - tourYawAngle) * 0.25
                  }px)`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061326]/90 via-transparent to-black/35" />

              {/* Brújula y ángulo superior */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 font-bold text-sky-200">
                  {activeTourArea.orientation} • Giro {tourYawAngle}°
                </span>
                <button
                  type="button"
                  onClick={() => setShowHotspots((prev) => !prev)}
                  className="px-3 py-1 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-md border border-white/15 font-bold text-emerald-300 cursor-pointer"
                >
                  {showHotspots ? "Ocultar Cota Técnica" : "Ver Cota Técnica"}
                </button>
              </div>

              {/* Hotspot Arquitectónico Interactivo */}
              {showHotspots && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-sm w-[90%] p-4 rounded-2xl bg-[#0B1F3A]/90 backdrop-blur-md border border-sky-400/40 shadow-xl text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-300 font-extrabold uppercase tracking-wider text-[10px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    Escaneo Láser LiDAR Matterport 4K
                  </div>
                  <p className="font-extrabold text-white text-sm">
                    {activeTourArea.finishSpec}
                  </p>
                  <p className="text-slate-200 text-[11px]">
                    {activeTourArea.hotspotNote}
                  </p>
                </div>
              )}

              {/* Controles de rotación 360° e inmersión al pie del visor */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/60 backdrop-blur-md p-3 rounded-2xl border border-white/15">
                <div className="flex items-center gap-2 flex-1">
                  <MoveHorizontal className="w-4 h-4 text-sky-300 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-200 shrink-0">
                    Paneo 360°:
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={tourYawAngle}
                    onChange={(e) => setTourYawAngle(Number(e.target.value))}
                    aria-label="Ángulo de rotación 360 grados"
                    className="w-full accent-sky-400 cursor-pointer h-1.5"
                  />
                </div>

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setTourZoom((z) => Math.max(1, +(z - 0.15).toFixed(2)))
                    }
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title="Alejar vista"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTourZoom((z) => Math.min(1.6, +(z + 0.15).toFixed(2)))
                    }
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                    title="Acercar vista"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTourYawAngle(180);
                      setTourZoom(1.05);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Centrar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <span>
                Superficie Auditada:{" "}
                <strong className="text-white">
                  {activeProperty?.constructionAreaDisplay} construidos
                </strong>{" "}
                •{" "}
                <strong className="text-white">
                  {activeProperty?.landAreaDisplay} terreno
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTourModalOpen(false);
                  openScheduleModal(
                    activeProperty?.title || "Residencia Cumbres de Juriquilla"
                  );
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold cursor-pointer"
              >
                Agendar Visita Presencial a esta Residencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Oscuro Corporativo */}
      <footer className="print:hidden w-full bg-[#0B1F3A] text-white py-6 px-4 sm:px-6 lg:px-8 mt-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-sky-300 shrink-0" />
            <span className="font-extrabold tracking-wider">
              COLDWELL BANKER MÉXICO SIGI | Sistema Integral de Gestión
              Inmobiliaria de Alta Gama
            </span>
          </div>
          <span className="text-slate-300 text-[11px]">
            Cumplimiento NOM-247-SE-2021 &amp; LFPDPPP • Todos los derechos
            reservados
          </span>
        </div>
      </footer>
    </div>
  );
}
