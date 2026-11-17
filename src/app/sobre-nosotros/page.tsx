"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ShieldCheck,
  Compass,
  Sparkles,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSigiStore, UserRole } from "@/lib/store";

const SLIDE_LABELS = [
  "01 / 03 ARQUITECTURA & SEDES",
  "02 / 03 CARTERA GLOBAL LUXURY",
  "03 / 03 RED NACIONAL DE OFICINAS",
];

function getRoleConfig(role?: UserRole) {
  switch (role) {
    case "propietario":
      return {
        roleTitle: "Propietario / Inversionista Patrimonial",
        targetHref: "/propietario",
        buttonText: "Ir a mi Panel de Propietario",
        badgeText: "CARTERA PATRIMONIAL ACTIVA",
      };
    case "asesor":
      return {
        roleTitle: "Asesor Inmobiliario Certificado CB",
        targetHref: "/asesor",
        buttonText: "Ir a mi Consola CRM de Asesor",
        badgeText: "ENLACE ACADEMIA & MLS ACTIVO",
      };
    case "comprador":
    default:
      return {
        roleTitle: "Comprador / Arrendatario Selecto",
        targetHref: "/comprador",
        buttonText: "Ir al Catálogo de Propiedades (Comprador)",
        badgeText: "MATCH ALGORÍTMICO 96% IA",
      };
  }
}

export default function SobreNosotrosPage() {
  const { currentUser, loginOrSetRole } = useSigiStore();
  const [slideIndex, setSlideIndex] = useState(0);

  const activeRole: UserRole = currentUser?.role || "comprador";
  const roleConfig = getRoleConfig(activeRole);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Banner de Bienvenida con botón directo al Panel según el rol del usuario */}
        <section className="rounded-3xl bg-gradient-to-r from-[#0B1F3A] via-[#102A4E] to-[#0B1F3A] text-white p-6 sm:p-7 shadow-lg border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-extrabold tracking-wider uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>SESIÓN ACTIVA • {roleConfig.badgeText}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Bienvenido(a),{" "}
              <span className="text-sky-300">
                {currentUser?.fullName || "Lic. Regina Luján"}
              </span>{" "}
              — Perfil: {roleConfig.roleTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Tu identidad y preferencias conforme a la LFPDPPP han sido
              validadas. Explora nuestra filosofía institucional o accede
              directamente a tu panel operativo en SIGI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            {/* Selector rápido de rol en el banner por si desea probar otro panel */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-xs">
              {(["comprador", "propietario", "asesor"] as UserRole[]).map(
                (r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() =>
                      loginOrSetRole({
                        role: r,
                        fullName: currentUser?.fullName,
                        email: currentUser?.email,
                      })
                    }
                    className={`px-2.5 py-1.5 rounded-lg font-bold capitalize transition-colors cursor-pointer ${
                      activeRole === r
                        ? "bg-white text-[#0B1F3A]"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                )
              )}
            </div>

            <Link
              href={roleConfig.targetHref as never}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-400 hover:bg-sky-300 text-[#0B1F3A] font-extrabold text-xs sm:text-sm shadow-md transition-all"
            >
              <span>{roleConfig.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Bloque Superior: Izquierda (Trayectoria & Liderazgo) + Derecha (2 Tarjetas Fotográficas Verticales) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Columna Izquierda */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-slate-200/80 flex flex-col justify-between">
            <div>
              <p className="text-xs font-extrabold tracking-[0.18em] text-sky-700 uppercase">
                — TRAYECTORIA &amp; LIDERAZGO
              </p>

              <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] tracking-tight">
                Sobre Nosotros
              </h1>

              <div className="mt-5 space-y-4 text-sm sm:text-base text-slate-600 leading-relaxed">
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

            {/* Controles circulares <- -> y texto 01 / 03 ARQUITECTURA & SEDES */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  aria-label="Anterior sede"
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  aria-label="Siguiente sede"
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-[#0B1F3A] hover:bg-[#0B1F3A] hover:text-white text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs font-extrabold tracking-[0.14em] text-[#0B1F3A] uppercase">
                {SLIDE_LABELS[slideIndex]}
              </span>
            </div>
          </div>

          {/* Columna Derecha: 2 Tarjetas Fotográficas Verticales Redondeadas */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Tarjeta Fotográfica 1: SEDE CENTRAL POLANCO */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg min-h-[420px] flex flex-col justify-between bg-[#0B1F3A] group">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80"
                alt="Sede Central Polanco - Dirección General & Private Client Office"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061325] via-[#0B1F3A]/45 to-transparent" />

              <div className="relative z-10 p-6">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/90 backdrop-blur-md border border-white/15 text-[11px] font-extrabold tracking-wider text-sky-300 uppercase">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  SEDE CENTRAL POLANCO
                </span>
              </div>

              <div className="relative z-10 p-6 text-white">
                <h3 className="text-xl sm:text-2xl font-extrabold leading-snug">
                  Dirección General &amp; Private Client Office
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-200 font-medium">
                  Ciudad de México • Gestión de Activos Institucionales
                </p>
              </div>
            </div>

            {/* Tarjeta Fotográfica 2: RIVIERA MAYA & BAJÍO */}
            <div className="relative rounded-3xl overflow-hidden shadow-lg min-h-[420px] flex flex-col justify-end bg-[#0B1F3A] group">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1000&q=80"
                alt="Riviera Maya & Bajío - Expansión de Desarrollos"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#061325] via-[#0B1F3A]/45 to-transparent" />

              <div className="relative z-10 p-6 text-white">
                <p className="text-xs font-extrabold tracking-[0.16em] text-sky-300 uppercase">
                  RIVIERA MAYA &amp; BAJÍO
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-extrabold leading-snug">
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

          {/* 3 Tarjetas en fila (#F7F9FB) */}
          <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta 1 */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-sky-300 flex items-center justify-center mb-4">
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

            {/* Tarjeta 2 */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-emerald-300 flex items-center justify-center mb-4">
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

            {/* Tarjeta 3 */}
            <div className="rounded-2xl bg-[#F7F9FB] border border-slate-200/80 p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-amber-300 flex items-center justify-center mb-4">
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
