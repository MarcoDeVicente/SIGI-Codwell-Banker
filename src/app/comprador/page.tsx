"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSigiStore } from "@/lib/store";

export default function CompradorPage() {
  const { properties } = useSigiStore();

  // Estados interactivos de cabecera y filtros
  const [operationMode, setOperationMode] = useState<"comprar" | "rentar">(
    "comprar"
  );
  const [zoneFilter, setZoneFilter] = useState("Juriquilla, Querétaro");
  const [maxBudgetMillions, setMaxBudgetMillions] = useState<number>(18.5);
  const [typologyFilter, setTypologyFilter] = useState("Residencial / Villa");

  // Propiedades del carrusel tipo acordeón (primeras 4 de store + cualquier nueva agregada)
  const carouselProperties = properties.slice(0, 4);
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
  const [alertActivated, setAlertActivated] = useState(false);
  const [tourModalOpen, setTourModalOpen] = useState(false);
  const [advisorToast, setAdvisorToast] = useState<string | null>(null);

  const activeProperty =
    carouselProperties.find((p) => p.id === expandedId) ||
    carouselProperties[0];

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openScheduleModal = (title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setVisitPropertyTitle(title);
    setVisitModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Barra de Navegación Superior */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Cabecera Principal */}
        <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0B1F3A] text-sky-300 text-[11px] font-extrabold tracking-wider uppercase mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>• ALGORITMO SIGI MATCH 4.2</span>
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

        {/* Barra de Filtros Interactiva */}
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

          {/* Botón oscuro Filtros */}
          <div className="md:col-span-1 flex justify-end">
            <button
              type="button"
              className="w-full md:w-auto px-4 py-3 rounded-2xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros</span>
            </button>
          </div>
        </section>

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
              Haz clic en cualquier tarjeta vertical para expandir su vista
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

                      <div className="mt-3 flex flex-wrap items-baseline gap-3">
                        <span className="text-2xl sm:text-3xl font-extrabold text-white">
                          {operationMode === "rentar" && prop.rentPriceDisplay
                            ? `${prop.rentPriceDisplay} MXN/mes`
                            : `${prop.salePriceDisplay} MXN`}
                        </span>
                        {prop.rentPriceDisplay && (
                          <span className="text-xs sm:text-sm font-semibold text-sky-200 bg-white/10 px-3 py-1 rounded-full">
                            o Renta: {prop.rentPriceDisplay} MXN/mes
                          </span>
                        )}
                      </div>

                      {/* Métricas y Botón Agendar Visita */}
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
                          className="px-5 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-[#0B1F3A] font-extrabold text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Agendar Visita</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // Tarjetas verticales colapsadas
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
                  className="lg:flex-1 relative rounded-3xl overflow-hidden shadow-md bg-[#0B1F3A] min-h-[180px] lg:min-h-[420px] flex flex-col justify-between p-5 cursor-pointer group hover:ring-2 hover:ring-sky-400 transition-all duration-300"
                >
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#051122] via-[#0B1F3A]/55 to-black/20" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 text-white text-[11px] font-extrabold">
                      {prop.aiMatchDisplay} Match
                    </span>
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(prop.id, e)}
                      aria-label="Favorito"
                      className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isFav ? "fill-rose-500 text-rose-500" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="relative z-10 text-white">
                    <h4 className="text-base sm:text-lg font-extrabold leading-snug">
                      {prop.title}
                    </h4>
                    <p className="text-xs sm:text-sm font-bold text-sky-300 mt-0.5">
                      • {prop.salePriceDisplay} - {prop.aiMatchDisplay} Match
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bloque Inferior: FICHA TÉCNICA & ANÁLISIS ALGORÍTMICO (FOLIO SIGI: MX-QRO-2025-089) */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <h2 className="text-sm sm:text-base font-extrabold tracking-wider text-[#0B1F3A] uppercase">
              FICHA TÉCNICA &amp; ANÁLISIS ALGORÍTMICO (FOLIO SIGI:
              MX-QRO-2025-089)
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              Auditoría Jurídica &amp; Valuación Verificada
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* 4 Tarjetas Métricas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                    315 m²
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Superficie Terreno
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Frente de 14.5 m
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                    280 m²
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Construcción
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    2 Niveles + Roof
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-emerald-600">
                    +11.8%
                  </p>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    Plusvalía Anual Proy.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Zona Querétaro Nte.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
                  <p className="text-lg sm:text-xl font-extrabold text-sky-700">
                    8.8% Anual
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
                <div className="relative rounded-2xl overflow-hidden h-48 shadow-xs group">
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

                <div className="relative rounded-2xl overflow-hidden h-48 shadow-xs group">
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

              {/* Mapa Visual UBICACIÓN ESTRATÉGICA */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#0B1F3A]" />
                    <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                      UBICACIÓN ESTRATÉGICA: Juriquilla Santa Fe • A 4 min de
                      Antea Lifestyle Center
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Paseo de la Alborada #104, QRO.
                  </span>
                </div>

                <div className="relative h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                  {/* Representación visual limpia de cartografía SIGI */}
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
                      <p className="font-extrabold">
                        Residencia Cumbres de Juriquilla
                      </p>
                      <p className="text-[10px] text-sky-300">
                        20.7089° N, 100.4462° W • Corredor Premium Querétaro
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Card 1: DESGLOSE DE COMPATIBILIDAD */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F3A]">
                    DESGLOSE DE COMPATIBILIDAD
                  </h3>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>

                {/* Aro verde 96% Alineación Excepcional */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70">
                  <div className="w-16 h-16 rounded-full border-4 border-emerald-500 flex items-center justify-center bg-white shrink-0 shadow-xs">
                    <span className="text-lg font-extrabold text-emerald-700">
                      96%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      96% Alineación Excepcional
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Supera el 94% de las propiedades analizadas en tu perfil
                      patrimonial.
                    </p>
                  </div>
                </div>

                {/* Barras de progreso */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Rango Presupuestal</span>
                      <span className="text-emerald-700">100% OK</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Espacio para Home Office &amp; Fam</span>
                      <span className="text-emerald-700">96% OK</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[96%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-bold text-slate-700 mb-1">
                      <span>Distancia a Colegios Bilingües</span>
                      <span className="text-emerald-700">94% OK</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full w-[94%]" />
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
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                    {advisorToast}
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      openScheduleModal("Residencia Cumbres de Juriquilla")
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Agendar Cita Privada</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setAdvisorToast(
                          "Enlace WhatsApp Business conectado con Lic. Mariana De la Vega (+52 55 8920 1200)."
                        )
                      }
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setAdvisorToast(
                          "Descargando Ficha Técnica Certificada (Folio MX-QRO-2025-089.pdf)..."
                        )
                      }
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
                <button
                  type="button"
                  onClick={() => setAlertActivated((prev) => !prev)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    alertActivated
                      ? "bg-emerald-600 text-white"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
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
                ha sido asignado a la{" "}
                <strong>Lic. Mariana De la Vega</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Folio de Seguridad:</span>
                <span className="font-bold text-[#0B1F3A]">
                  MX-QRO-2025-089
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
              onClick={() => setVisitModalOpen(false)}
              className="w-full py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white font-bold text-xs sm:text-sm cursor-pointer"
            >
              Entendido y Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Tour Virtual 360° Matterport */}
      {tourModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0B1F3A] text-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-white/15 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300">
                Tour Virtual 360° Matterport 4K Activo • Folio MX-QRO-2025-089
              </span>
              <button
                type="button"
                onClick={() => setTourModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative h-72 rounded-2xl overflow-hidden border border-white/15">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                alt="Vista 360 Residencia Cumbres de Juriquilla"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center text-center p-4">
                <Compass className="w-12 h-12 text-sky-300 animate-pulse mb-2" />
                <p className="text-base font-extrabold">
                   Gemelo Digital 3D Matterport 4K Activo
                </p>
                <p className="text-xs text-slate-200 max-w-md mt-1">
                  Recorrido espacial de 280 m² construidos, terraza social y
                  suite principal en Juriquilla.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Oscuro Corporativo */}
      <footer className="w-full bg-[#0B1F3A] text-white py-6 px-4 sm:px-6 lg:px-8 mt-10">
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
