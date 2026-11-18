"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ShieldCheck,
  Compass,
  Sparkles,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const SLIDE_LABELS = [
  "01 / 03 ARQUITECTURA & SEDES",
  "02 / 03 CARTERA GLOBAL LUXURY",
  "03 / 03 RED NACIONAL DE OFICINAS",
];

export default function SobreNosotrosPage() {
  const [slideIndex, setSlideIndex] = useState(0);

  const handlePrevSlide = () => {
    setSlideIndex((prev) => (prev === 0 ? SLIDE_LABELS.length - 1 : prev - 1));
  };

  const handleNextSlide = () => {
    setSlideIndex((prev) => (prev === SLIDE_LABELS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col">
      {/* Navbar Superior */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
        {/* Bloque Superior: Izquierda (Editorial limpia) + Derecha (2 Tarjetas Fotográficas Escalonadas) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Columna Izquierda Editorial */}
          <div className="lg:col-span-5 flex flex-col justify-between py-2">
            <div>
              <p className="text-xs font-extrabold tracking-[0.18em] text-sky-700 uppercase">
                — TRAYECTORIA &amp; LIDERAZGO
              </p>

              <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold text-[#0B1F3A] tracking-tight">
                Sobre Nosotros
              </h1>

              <div className="mt-6 space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  En Coldwell Banker México, entendemos que una residencia de
                  alta gama trasciende su estructura física: constituye un
                  santuario personal y el ancla estratégica del patrimonio
                  familiar.
                </p>
                <p>
                  Nuestra misión consiste en articular transacciones fluidas y
                  con absoluto rigor analítico, guiando a inversionistas y
                  familias en el descubrimiento de entornos extraordinarios con
                  la confianza de la firma inmobiliaria de mayor prestigio
                  global.
                </p>
              </div>
            </div>

            {/* Controles circulares <- -> (el derecho en azul marino #0B1F3A con flecha blanca) y texto 01 / 03 ARQUITECTURA & SEDES */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Anterior sede"
                  className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:border-[#0B1F3A] text-slate-700 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Siguiente sede"
                  className="w-11 h-11 rounded-full bg-[#0B1F3A] hover:bg-[#132d54] text-white flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </div>

              <span className="text-xs font-extrabold tracking-[0.14em] text-[#0B1F3A] uppercase">
                {SLIDE_LABELS[slideIndex]}
              </span>
            </div>
          </div>

          {/* Columna Derecha: 2 Tarjetas Fotográficas Residenciales de Lujo Escalonadas Verticalmente */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-6 items-start">
            {/* Tarjeta Fotográfica 1 (Más grande a la izquierda): SEDE CENTRAL POLANCO */}
            <div className="sm:col-span-7 relative rounded-3xl overflow-hidden shadow-xl min-h-[450px] flex flex-col justify-between bg-[#0B1F3A] group">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80"
                alt="Sede Central Polanco - Dirección General & Private Client Office"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061325] via-[#0B1F3A]/40 to-transparent" />

              <div className="relative z-10 p-6">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/90 backdrop-blur-md border border-white/15 text-[11px] font-extrabold tracking-wider text-sky-300 uppercase">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  SEDE CENTRAL POLANCO
                </span>
              </div>

              <div className="relative z-10 p-6 sm:p-7 text-white">
                <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">
                  Dirección General &amp; Private Client Office
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                  Ciudad de México • Gestión de Activos Institucionales
                </p>
              </div>
            </div>

            {/* Tarjeta Fotográfica 2 (A su derecha ligeramente más baja / escalonada): RIVIERA MAYA & BAJÍO */}
            <div className="sm:col-span-5 sm:mt-10 relative rounded-3xl overflow-hidden shadow-xl min-h-[390px] flex flex-col justify-end bg-[#0B1F3A] group">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80"
                alt="Riviera Maya & Bajío - Expansión de Desarrollos"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061325] via-[#0B1F3A]/45 to-transparent" />

              <div className="relative z-10 p-6 text-white">
                <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-300 uppercase">
                  RIVIERA MAYA &amp; BAJÍO
                </p>
                <h3 className="mt-1 text-lg sm:text-xl font-extrabold leading-snug">
                  Expansión de Desarrollos
                </h3>
                <p className="mt-1.5 text-xs text-slate-200/90">
                  Corredores turísticos e industriales de alto rendimiento
                  patrimonial.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bloque Inferior en Card Blanca Redondeada: FUNDAMENTOS ESTRATÉGICOS */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/80">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[0.16em] text-sky-700 uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              FUNDAMENTOS ESTRATÉGICOS
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
              Doble Compromiso: Excelencia para Asesores y Certeza para
              Inversionistas
            </h2>
          </div>

          {/* 3 Tarjetas en fila (#F7F9FB) con ícono cuadrado superior (#0B1F3A, #375573 y #064E3B) */}
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1: #0B1F3A */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center mb-4 shadow-xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700 uppercase">
                  RED DE FRANQUICIAS
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                  Misión Operativa
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Empoderar a nuestros franquiciatarios con el modelo
                  inmobiliario más robusto y rentable de la industria,
                  integrando tecnología PropTech de vanguardia (CRM con IA
                  predictiva, firma digital y aplicaciones móviles
                  especializadas) para optimizar la gestión de prospectos de
                  alto patrimonio y acelerar el ciclo de cierre.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/70 text-[11px] font-bold text-[#0B1F3A]">
                RED DE FRANQUICIAS | Misión Operativa
              </div>
            </div>

            {/* Tarjeta 2: #375573 */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#375573] text-white flex items-center justify-center mb-4 shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700 uppercase">
                  HACIA EL CLIENTE
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                  Misión Comercial
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Brindar soluciones inmobiliarias integrales bajo los más altos
                  estándares de transparencia y seguridad jurídica. Garantizamos
                  una experiencia sin fricciones en operaciones de adquisición,
                  enajenación o arrendamiento corporativo y residencial en
                  México y América Latina.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/70 text-[11px] font-bold text-[#0B1F3A]">
                HACIA EL CLIENTE | Misión Comercial
              </div>
            </div>

            {/* Tarjeta 3: #064E3B */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-white flex items-center justify-center mb-4 shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <p className="text-[11px] font-extrabold tracking-[0.14em] text-sky-700 uppercase">
                  HORIZONTE 2030
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[#0B1F3A]">
                  Visión de Liderazgo
                </h3>
                <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Consolidarnos como el ecosistema de intermediación premium de
                  mayor prestigio en la región, impulsando a nuestra red de
                  asesores certificados a través del respaldo de una marca
                  global centenaria, mentoreo continuo y el liderazgo absoluto
                  en propiedades residenciales de alta plusvalía.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/70 text-[11px] font-bold text-[#0B1F3A]">
                HORIZONTE 2030 | Visión de Liderazgo
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
