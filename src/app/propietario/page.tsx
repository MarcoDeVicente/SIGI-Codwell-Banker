"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  ShieldCheck,
  TrendingUp,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Upload,
  DollarSign,
  PhoneCall,
  MessageCircle,
  AlertCircle,
  X,
  Image as ImageIcon,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Sparkles,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useSigiStore } from "@/lib/store";
import {
  propertySchema,
  validateAndResizeImage,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validations";

export default function PropietarioPage() {
  const { properties, addProperty } = useSigiStore();

  // Propiedad principal en gestión (Villa Cumbres del Valle • Residencia A-104 por defecto)
  const defaultOwnerProp =
    properties.find((p) => p.id === "prop-villa-cumbres-a104") ||
    properties[properties.length - 1];

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    defaultOwnerProp?.id || "prop-villa-cumbres-a104"
  );

  const activeOwnerProp =
    properties.find((p) => p.id === selectedPropertyId) || defaultOwnerProp;

  // Valuación y ajuste de precio de salida interactivo
  const [valuationPrice, setValuationPrice] = useState<number>(4350000);
  const [adjustingPrice, setAdjustingPrice] = useState(false);
  const [newExitPriceInput, setNewExitPriceInput] = useState("4350000");

  // Modal "+ Agregar / Registrar Propiedad"
  const [propModalOpen, setPropModalOpen] = useState(false);
  const [propTitle, setPropTitle] = useState("");
  const [propLocation, setPropLocation] = useState("");
  const [propSalePrice, setPropSalePrice] = useState("");
  const [propRentPrice, setPropRentPrice] = useState("");
  const [propLandArea, setPropLandArea] = useState("");
  const [propConstArea, setPropConstArea] = useState("");
  const [propPrivacyAccepted, setPropPrivacyAccepted] = useState(false);
  const [propImagePreview, setPropImagePreview] = useState<string | null>(null);
  const [propImageMeta, setPropImageMeta] = useState<string | null>(null);
  const [propErrors, setPropErrors] = useState<Record<string, string>>({});
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Expediente Jurídico: Actualizar Archivos (<= 5MB)
  const legalFileInputRef = useRef<HTMLInputElement>(null);
  const [legalUploadStatus, setLegalUploadStatus] = useState<string | null>(
    null
  );
  const [legalUploadError, setLegalUploadError] = useState<string | null>(null);

  // Toasts interactivos
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  // Manejo de imagen en el modal de Propiedad (validateAndResizeImage -> WebP max 1200px)
  const handlePropertyImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingImage(true);
    setPropErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });

    const result = await validateAndResizeImage(file);
    setIsProcessingImage(false);

    if (!result.valid) {
      setPropImagePreview(null);
      setPropImageMeta(null);
      setPropErrors((prev) => ({
        ...prev,
        image: result.error || "Archivo de imagen inválido.",
      }));
      return;
    }

    setPropImagePreview(result.dataUrl || null);
    const kb = result.optimizedSize
      ? (result.optimizedSize / 1024).toFixed(1)
      : "0";
    setPropImageMeta(
      `Convertida a .webp (${result.width}x${result.height}px • ${kb} KB)`
    );
  };

  // Manejo de validación de archivo <= 5MB en "Actualizar Archivos" del Expediente Jurídico
  const handleLegalDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLegalUploadError(null);
    setLegalUploadStatus(null);

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      setLegalUploadError(
        `Archivo rechazado: "${file.name}" pesa ${mb} MB y excede el límite máximo permitido de 5 MB.`
      );
      return;
    }

    setLegalUploadStatus(
      `Documento "${file.name}" (${(file.size / 1024).toFixed(
        1
      )} KB) auditado y anexado al Expediente Jurídico.`
    );
  };

  // Envío del formulario "+ Agregar / Registrar Propiedad"
  const handleRegisterProperty = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = propertySchema.safeParse({
      title: propTitle,
      location: propLocation,
      salePrice: propSalePrice === "" ? 0 : Number(propSalePrice),
      rentPrice: propRentPrice === "" ? undefined : Number(propRentPrice),
      landArea: propLandArea === "" ? 0 : Number(propLandArea),
      constructionArea: propConstArea === "" ? 0 : Number(propConstArea),
    });

    const nextErrors: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "");
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
    }

    if (!propPrivacyAccepted) {
      nextErrors.privacyAccepted =
        "Debes aceptar el Aviso de Privacidad conforme a la LFPDPPP";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPropErrors(nextErrors);
      return;
    }

    if (!parsed.success) return;

    const created = addProperty({
      title: parsed.data.title,
      location: parsed.data.location,
      salePrice: parsed.data.salePrice,
      rentPrice: parsed.data.rentPrice,
      landArea: parsed.data.landArea,
      constructionArea: parsed.data.constructionArea,
      image: propImagePreview || undefined,
    });

    setSelectedPropertyId(created.id);
    setValuationPrice(created.salePrice);

    // Reset modal
    setPropTitle("");
    setPropLocation("");
    setPropSalePrice("");
    setPropRentPrice("");
    setPropLandArea("");
    setPropConstArea("");
    setPropPrivacyAccepted(false);
    setPropImagePreview(null);
    setPropImageMeta(null);
    setPropErrors({});
    setPropModalOpen(false);
    setStatusBanner(
      `Propiedad "${created.title}" registrada y validada en la Red MLS Global Coldwell Banker.`
    );
  };

  const handleSaveExitPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(newExitPriceInput);
    if (numeric <= 0 || Number.isNaN(numeric)) {
      return;
    }
    setValuationPrice(numeric);
    setAdjustingPrice(false);
    setStatusBanner(
      `Precio de salida actualizado a $${numeric.toLocaleString(
        "es-MX"
      )} MXN con sincronización inmediata en el MLS.`
    );
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex">
      {/* Sidebar fijo a la izquierda */}
      <div className="hidden lg:block w-68 shrink-0">
        <Sidebar activeSection="Valuación" />
      </div>

      {/* Contenedor Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Patrimonio Auditado NOM-247
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={"/comprador" as never}
              className="text-xs font-bold text-slate-600 hover:text-[#0B1F3A]"
            >
              Catálogo Comprador
            </Link>
            <Link
              href={"/asesor" as never}
              className="text-xs font-bold text-slate-600 hover:text-[#0B1F3A]"
            >
              Consola Asesor
            </Link>
            <Link
              href={"/sobre-nosotros" as never}
              className="text-xs font-bold text-slate-600 hover:text-[#0B1F3A]"
            >
              Sobre Nosotros
            </Link>

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#0B1F3A] text-white text-xs font-extrabold flex items-center justify-center">
                RG
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-extrabold text-[#0B1F3A] leading-tight">
                  Lic. Roberto Garza Sada
                </p>
                <p className="text-[10px] font-semibold text-sky-700">
                  Inversionista Patrimonial HNWI
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl w-full mx-auto">
          {/* Header Principal */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
                PORTAL PROPIETARIOS HNWI • Cuenta Patrimonial Verificada
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight mt-1">
                Bienvenido, Lic. Roberto Garza Sada
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                Gestión integral de activos residenciales, valuación algorítmica
                en tiempo real y flujo de comercialización exclusiva.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPropModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Agregar / Registrar Propiedad</span>
            </button>
          </section>

          {statusBanner && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {statusBanner}
              </span>
              <button
                type="button"
                onClick={() => setStatusBanner(null)}
                className="text-emerald-700 hover:underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Tarjeta Principal: Mis Propiedades en Gestión (1 de 3 Activos Principales) */}
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
                Mis Propiedades en Gestión (1 de 3 Activos Principales)
              </h2>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Activo seleccionado:</span>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="text-xs font-bold text-[#0B1F3A] bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Izquierda: Fotografía de Villa Cumbres del Valle • Residencia A-104 */}
              <div className="lg:col-span-6 relative min-h-[360px] bg-[#0B1F3A] flex flex-col justify-between p-6 text-white">
                <img
                  src={
                    activeOwnerProp?.image ||
                    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
                  }
                  alt={
                    activeOwnerProp?.title ||
                    "Villa Cumbres del Valle • Residencia A-104"
                  }
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-[#0B1F3A]/45 to-black/25" />

                {/* Badges superiores */}
                <div className="relative z-10 flex flex-wrap items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white text-xs font-extrabold">
                    • EN COMERCIALIZACIÓN ACTIVA
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/85 backdrop-blur-md border border-white/20 text-white text-xs font-bold">
                    Exclusiva Coldwell Banker
                  </span>
                </div>

                {/* Datos inferiores de la unidad */}
                <div className="relative z-10 space-y-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold">
                      Villa Cumbres del Valle • Residencia A-104
                    </h3>
                    <p className="text-xs sm:text-sm text-sky-200 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-sky-300" />
                      Residencial San Pedro Garza García, N.L.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-100">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-sky-300" />
                      620 m² Terreno
                    </span>
                    <span>|</span>
                    <span>485 m² Construcción</span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-sky-300" />4
                      Recámaras
                    </span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-sky-300" />
                      5.5 Baños
                    </span>
                  </div>
                </div>
              </div>

              {/* Derecha: Valuación Algorítmica y Demanda del Mercado */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      Demanda del Mercado
                    </span>
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      Alta / En Tendencia Regional
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold">
                    +14.2% Interés vs mes anterior
                  </span>
                </div>

                {/* VALUACIÓN ALGORÍTMICA SIGI ESTIMADA */}
                <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-700">
                      VALUACIÓN ALGORÍTMICA SIGI ESTIMADA
                    </span>
                    <span className="text-xs font-bold text-emerald-700">
                      (Confianza 98.4%)
                    </span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] mt-1">
                    ${valuationPrice.toLocaleString("es-MX")} MXN
                  </p>
                </div>

                {/* Recuadros de Venta Sugerida y Renta Mensual Estimada */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      VENTA SUGERIDA (Recomendado)
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] mt-1">
                      $4,250,000 – $4,480,000 MXN
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800">
                      RENTA MENSUAL ESTIMADA (Cap Rate 8.6%)
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] mt-1">
                      $32,000 – $36,500 MXN/mes
                    </p>
                  </div>
                </div>

                {/* Botón interactivo Ajustar Precio de Salida */}
                {adjustingPrice ? (
                  <form
                    onSubmit={handleSaveExitPrice}
                    className="flex items-center gap-2 pt-1"
                  >
                    <input
                      type="number"
                      min={100000}
                      step={50000}
                      value={newExitPriceInput}
                      onChange={(e) => setNewExitPriceInput(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-[#0B1F3A]"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustingPrice(false)}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setNewExitPriceInput(String(valuationPrice));
                      setAdjustingPrice(true);
                    }}
                    className="w-full py-3 px-4 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-4 h-4 text-sky-300" />
                    <span>Ajustar Precio de Salida</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 4 Columnas Operativas */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
            {/* Columna 1: Agenda de Visitas (3 Próximas) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                    Agenda de Visitas (3 Próximas)
                  </h3>
                  <Calendar className="w-4 h-4 text-sky-700" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-[#0B1F3A]">
                      Mañana, 11:30 AM - Dr. Fernando Morales V.
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Score 920 pts - Intento de Compra Directa
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-[#0B1F3A]">
                      Jueves 17, 04:00 PM - Lic. Sofía Alatorre
                    </p>
                    <p className="text-[11px] text-sky-700 font-semibold mt-0.5">
                      Score 795 pts - Arrendamiento Corporativo
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="font-extrabold text-[#0B1F3A]">
                      Sábado 19, 10:00 AM - Ing. Carlos Baillères
                    </p>
                    <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      Cash Buyer - Inversión Patrimonial
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setStatusBanner(
                    "Agenda sincronizada bidireccionalmente con Google Calendar (Roberto Garza Sada)."
                  )
                }
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A] transition-colors cursor-pointer"
              >
                Sincronizar Google Calendar
              </button>
            </div>

            {/* Columna 2: Expediente Jurídico (Expediente 100%) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                    Expediente Jurídico (Expediente 100%)
                  </h3>
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#0B1F3A]">
                        Escritura Pública en RPP
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Folio Real 4492-SP • Notaría 19
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#0B1F3A]">
                        Boleta Predial 2025
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Pagado Anualidad Completa
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[#0B1F3A]">
                        Libertad de Gravamen
                      </p>
                      <p className="text-[11px] text-slate-600">
                        Vigencia Mayo 2025 Sin Hipoteca
                      </p>
                    </div>
                  </div>
                </div>

                {legalUploadError && (
                  <p className="text-[11px] text-red-600 font-semibold">
                    {legalUploadError}
                  </p>
                )}
                {legalUploadStatus && (
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {legalUploadStatus}
                  </p>
                )}
              </div>

              <div>
                <input
                  ref={legalFileInputRef}
                  type="file"
                  onChange={handleLegalDocumentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => legalFileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Actualizar Archivos</span>
                </button>
              </div>
            </div>

            {/* Columna 3: Ofertas Recibidas (2 Activas) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                    Ofertas Recibidas (2 Activas)
                  </h3>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0B1F3A]">
                        Folio #OF-882
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        Nueva
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      $4,200,000 MXN
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Transferencia Contado 96.5% de precio lista
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#0B1F3A]">
                        Folio #OF-841
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        Contraoferta
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-[#0B1F3A]">
                      $4,100,000 MXN
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Crédito Cofinavit BBVA
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOfferModalOpen(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold transition-colors cursor-pointer"
              >
                Revisar y Responder Oferta
              </button>
            </div>

            {/* Columna 4: Gestión & Asesor VIP (• En Línea) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                    Gestión &amp; Asesor VIP
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    • En Línea
                  </span>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="w-11 h-11 rounded-2xl bg-[#0B1F3A] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                    ML
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-extrabold text-[#0B1F3A]">
                      Lic. Mauricio Lozano
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      Director Senior de Asesoría Patrimonial - Top Producer CB
                      México
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/70 text-xs text-[#0B1F3A] font-semibold">
                  Tiempo de respuesta promedio: <strong>8 min</strong>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    setStatusBanner(
                      "Canal prioritario abierto con Lic. Mauricio Lozano (Director Senior CB)."
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contactar a un Asesor Coldwell Banker</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setStatusBanner(
                      "Solicitud de Llamada Notarial agendada con la Mesa Jurídica Coldwell Banker."
                    )
                  }
                  className="w-full py-1.5 text-center text-xs font-extrabold text-sky-700 hover:text-[#0B1F3A] hover:underline flex items-center justify-center gap-1 cursor-pointer"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Agendar Llamada Notarial</span>
                </button>
              </div>
            </div>
          </section>

          {/* Bloque Inferior: Rendimiento de Mercado & Difusión Global (Últimos 30 días) */}
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                  Rendimiento de Mercado &amp; Difusión Global (Últimos 30 días)
                </h2>
                <p className="text-xs text-slate-500">
                  Métricas auditadas de exposición en portales internacionales
                  Coldwell Banker Global Luxury
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>

            {/* 4 Tarjetas con mini-gráficas SVG */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Métrica 1 */}
              <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    VISTAS EXCLUSIVAS
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +24%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F3A]">3,842</p>
                <svg className="w-full h-10" viewBox="0 0 120 32" fill="none">
                  <path
                    d="M2 28L24 22L46 24L68 14L92 10L118 4"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Métrica 2 */}
              <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    PROSPECTOS VALIDADOS
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +18%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F3A]">48</p>
                <svg className="w-full h-10" viewBox="0 0 120 32" fill="none">
                  <path
                    d="M2 26L26 24L50 18L74 19L96 11L118 5"
                    stroke="#0284c7"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Métrica 3 */}
              <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    DESCARGAS BROCHURE
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    +9%
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#0B1F3A]">115</p>
                <svg className="w-full h-10" viewBox="0 0 120 32" fill="none">
                  <path
                    d="M2 25L25 21L48 22L72 15L95 13L118 7"
                    stroke="#0B1F3A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Métrica 4 */}
              <div className="p-4 rounded-2xl bg-[#F7F9FB] border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    DÍAS PROMEDIO EN MERCADO
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-emerald-700">
                  28 Días
                </p>
                <p className="text-[11px] text-slate-600 font-medium">
                  vs Promedio del sector residencial: <strong>65 días</strong>
                </p>
                <svg className="w-full h-6" viewBox="0 0 120 20" fill="none">
                  <rect
                    x="2"
                    y="4"
                    width="52"
                    height="6"
                    rx="3"
                    fill="#10b981"
                  />
                  <rect
                    x="2"
                    y="12"
                    width="110"
                    height="6"
                    rx="3"
                    fill="#cbd5e1"
                  />
                </svg>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Modal "+ Agregar / Registrar Propiedad" validado con propertySchema + validateAndResizeImage */}
      {propModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  CONSIGNACIÓN EXCLUSIVA MLS
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                  Registrar Nueva Propiedad Patrimonial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPropModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleRegisterProperty}
              className="space-y-4"
              noValidate
            >
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título de la Residencia / Activo
                </label>
                <input
                  type="text"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  placeholder="Ej. Residencia Sierra Madre A-201"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                {propErrors.title && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {propErrors.title}
                  </p>
                )}
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubicación Exacta
                </label>
                <input
                  type="text"
                  value={propLocation}
                  onChange={(e) => setPropLocation(e.target.value)}
                  placeholder="Ej. San Pedro Garza García, N.L."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                {propErrors.location && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {propErrors.location}
                  </p>
                )}
              </div>

              {/* Precios (Venta > 0 obligatorio y Renta > 0 opcional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Precio de Venta (MXN &gt; $0)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={propSalePrice}
                    onChange={(e) => setPropSalePrice(e.target.value)}
                    placeholder="4350000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {propErrors.salePrice && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {propErrors.salePrice}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Renta Mensual Opcional (MXN)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={propRentPrice}
                    onChange={(e) => setPropRentPrice(e.target.value)}
                    placeholder="32000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {propErrors.rentPrice && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {propErrors.rentPrice}
                    </p>
                  )}
                </div>
              </div>

              {/* Superficies (Terreno > 0 y Construcción > 0) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Superficie de Terreno (m²)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={propLandArea}
                    onChange={(e) => setPropLandArea(e.target.value)}
                    placeholder="620"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {propErrors.landArea && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {propErrors.landArea}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Superficie de Construcción (m²)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={propConstArea}
                    onChange={(e) => setPropConstArea(e.target.value)}
                    placeholder="485"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {propErrors.constructionArea && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {propErrors.constructionArea}
                    </p>
                  )}
                </div>
              </div>

              {/* Fotografía validada con validateAndResizeImage (máx 5MB, .jpg/.webp/.png -> .webp 1200px) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fotografía Principal (Máx. 5 MB • .jpg, .jpeg, .png, .webp →
                  Auto WebP 1200px)
                </label>
                <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-[#0B1F3A] bg-slate-50 cursor-pointer transition-colors">
                  <ImageIcon className="w-6 h-6 text-slate-400 mb-1" />
                  <span className="text-xs font-bold text-[#0B1F3A]">
                    {isProcessingImage
                      ? "Procesando y redimensionando a .webp..."
                      : "Seleccionar fotografía de alta resolución"}
                  </span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handlePropertyImageChange}
                    className="hidden"
                  />
                </label>

                {propErrors.image && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {propErrors.image}
                  </p>
                )}

                {propImagePreview && (
                  <div className="mt-2.5 flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <img
                      src={propImagePreview}
                      alt="Vista previa optimizada WebP"
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                    <div className="text-xs">
                      <p className="font-extrabold text-emerald-900">
                        Imagen Validada y Optimizada
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        {propImageMeta}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Casilla obligatoria LFPDPPP */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={propPrivacyAccepted}
                    onChange={(e) => setPropPrivacyAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0B1F3A]"
                  />
                  <span className="text-xs text-slate-600">
                    Manifiesto ser legítimo propietario/apoderado y acepto el{" "}
                    <strong className="text-[#0B1F3A]">
                      Aviso de Privacidad conforme a la LFPDPPP
                    </strong>{" "}
                    y cumplimiento NOM-247-SE-2021.
                  </span>
                </label>
                {propErrors.privacyAccepted && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {propErrors.privacyAccepted}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPropModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer"
                >
                  Publicar en SIGI Coldwell Banker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Revisar y Responder Oferta (#OF-882 y #OF-841) */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-[#0B1F3A]">
                Dictamen de Ofertas Activas
              </h3>
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Selecciona la acción formal para el{" "}
              <strong>Folio #OF-882 ($4,200,000 MXN • Contado)</strong>:
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setOfferModalOpen(false);
                  setStatusBanner(
                    "Oferta Folio #OF-882 pre-aceptada. Se ha notificado a Notaría 19 y al Lic. Mauricio Lozano."
                  );
                }}
                className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold cursor-pointer"
              >
                Aceptar Oferta
              </button>
              <button
                type="button"
                onClick={() => {
                  setOfferModalOpen(false);
                  setStatusBanner(
                    "Contraoferta por $4,350,000 MXN enviada formalmente para el Folio #OF-882."
                  );
                }}
                className="py-2.5 rounded-xl bg-[#0B1F3A] text-white text-xs font-extrabold cursor-pointer"
              >
                Enviar Contraoferta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
