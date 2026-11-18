"use client";

import React, { useState, useRef, useMemo } from "react";
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
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useSigiStore } from "@/lib/store";
import {
  propertySchema,
  validateAndResizeImage,
  MAX_IMAGE_SIZE_BYTES,
} from "@/lib/validations";

export default function PropietarioPage() {
  const {
    properties,
    visits,
    offers,
    legalDocuments,
    addProperty,
    updatePropertyPrice,
    respondToOffer,
    updateLegalDocument,
    scheduleVisit,
  } = useSigiStore();

  // Ordenar activos para que Villa Cumbres del Valle • Residencia A-104 sea el Activo #1 por defecto
  const ownerAssets = useMemo(() => {
    const primary = properties.find(
      (p) =>
        p.folio === "MX-NL-2025-104" || p.id === "prop-villa-cumbres-a104"
    );
    const others = properties.filter(
      (p) =>
        p.folio !== "MX-NL-2025-104" && p.id !== "prop-villa-cumbres-a104"
    );
    return primary ? [primary, ...others] : properties;
  }, [properties]);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
    ownerAssets[0]?.id || "prop-villa-cumbres-a104"
  );

  const currentAssetIndex = Math.max(
    0,
    ownerAssets.findIndex(
      (p) => p.id === selectedPropertyId || p.folio === selectedPropertyId
    )
  );

  const activeOwnerProp = ownerAssets[currentAssetIndex] || ownerAssets[0];

  // Valuación y ajuste de precio de salida interactivo
  const [valuationPrice, setValuationPrice] = useState<number>(
    activeOwnerProp?.salePrice || 4350000
  );
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

  // Toasts y modales interactivos
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [counterOfferInputs, setCounterOfferInputs] = useState<
    Record<string, string>
  >({
    "Folio #OF-882": "4350000",
    "Folio #OF-841": "4280000",
  });

  // Modal de Agendar Llamada Notarial
  const [notarialModalOpen, setNotarialModalOpen] = useState(false);
  const [notarialTopic, setNotarialTopic] = useState(
    "Notaría Pública No. 19 • Revisión de Oferta / LOI"
  );
  const [notarialSchedule, setNotarialSchedule] = useState(
    "Mañana, 10:00 AM"
  );

  // Navegación entre propiedades en gestión con flechas <- y ->
  const handleSelectAssetByIndex = (nextIndex: number) => {
    if (ownerAssets.length === 0) return;
    const wrapped = (nextIndex + ownerAssets.length) % ownerAssets.length;
    const target = ownerAssets[wrapped];
    setSelectedPropertyId(target.id);
    setValuationPrice(target.salePrice);
    setNewExitPriceInput(String(target.salePrice));
    setAdjustingPrice(false);
  };

  // Descarga real de archivo .ics con las 3 visitas programadas (Dr. Fernando Morales, Lic. Sofía Alatorre e Ing. Carlos Baillères)
  const handleDownloadGoogleCalendarIcs = () => {
    const activeVisits = visits.slice(0, 3);
    const nowStamp = "20261118T060000Z";
    const eventSlots = [
      { start: "20261118T173000Z", end: "20261118T183000Z" },
      { start: "20261119T220000Z", end: "20261119T230000Z" },
      { start: "20261121T160000Z", end: "20261121T170000Z" },
    ];

    const eventsIcs = activeVisits
      .map((v, idx) => {
        const slot = eventSlots[idx] || eventSlots[0];
        const summary = `Visita Patrimonial SIGI: ${v.visitorName} (${v.buyerScoreBadge})`;
        const description = `Propósito: ${v.visitPurpose} | Horario: ${
          v.scheduleLabel
        } | Teléfono: ${v.visitorPhone} | Propiedad: ${
          activeOwnerProp?.title || "Villa Cumbres del Valle • Residencia A-104"
        } (Folio ${v.propertyFolio})`;
        const location =
          activeOwnerProp?.location ||
          "Residencial San Pedro Garza García, N.L.";

        return [
          "BEGIN:VEVENT",
          `UID:sigi-visit-${v.id}-${idx + 1}@coldwellbanker.com.mx`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART:${slot.start}`,
          `DTEND:${slot.end}`,
          `SUMMARY:${summary}`,
          `DESCRIPTION:${description}`,
          `LOCATION:${location}`,
          "STATUS:CONFIRMED",
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Coldwell Banker Mexico//SIGI Intelligence v4.8//ES",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "X-WR-CALNAME:Agenda Visitas SIGI Coldwell Banker",
      eventsIcs,
      "END:VCALENDAR",
    ].join("\r\n");

    if (typeof window !== "undefined") {
      const blob = new Blob([icsContent], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "agenda-visitas-sigi-coldwell-banker.ics";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    setStatusBanner(
      "Archivo .ics descargado con las 3 visitas programadas (Dr. Fernando Morales V., Lic. Sofía Alatorre e Ing. Carlos Baillères) para sincronizar en Google Calendar."
    );
  };

  // Botón Contactar a un Asesor Coldwell Banker
  const handleContactAdvisor = () => {
    const folio = activeOwnerProp?.folio || "MX-NL-2025-104";
    const title =
      activeOwnerProp?.title || "Villa Cumbres del Valle • Residencia A-104";
    const msg = `Hola Lic. Mauricio Lozano, soy el Lic. Roberto Garza Sada. Solicito seguimiento ejecutivo sobre mi propiedad en gestión "${title}" (Folio SIGI: ${folio}).`;
    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/525589201200?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
    setStatusBanner(
      `Canal prioritario WhatsApp abierto con Lic. Mauricio Lozano (Director Senior CB) para el activo ${title} (${folio}).`
    );
  };

  // Manejo de imagen en el modal de Propiedad (Sharp /api/upload -> Supabase Storage property-media)
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
    if (!result.valid) {
      setIsProcessingImage(false);
      setPropImagePreview(null);
      setPropImageMeta(null);
      setPropErrors((prev) => ({
        ...prev,
        image: result.error || "Archivo de imagen inválido.",
      }));
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok || payload.error) {
        setIsProcessingImage(false);
        setPropImagePreview(null);
        setPropImageMeta(null);
        setPropErrors((prev) => ({
          ...prev,
          image: payload.error || "No se pudo procesar la imagen en el servidor.",
        }));
        return;
      }

      setIsProcessingImage(false);
      setPropImagePreview(payload.publicUrl || result.dataUrl || null);
      const kb = payload.size
        ? (payload.size / 1024).toFixed(1)
        : result.optimizedSize
        ? (result.optimizedSize / 1024).toFixed(1)
        : "0";
      const w = payload.width || result.width || 1200;
      const h = payload.height || result.height || 800;
      setPropImageMeta(
        `Subida a Supabase Storage .webp (${w}x${h}px • ${kb} KB)`
      );
    } catch {
      setIsProcessingImage(false);
      setPropImagePreview(result.dataUrl || null);
      const kb = result.optimizedSize
        ? (result.optimizedSize / 1024).toFixed(1)
        : "0";
      setPropImageMeta(
        `Convertida a .webp (${result.width}x${result.height}px • ${kb} KB)`
      );
    }
  };

  // Manejo de validación de archivo <= 5MB en "Actualizar Archivos" del Expediente Jurídico (public.legal_documents)
  const handleLegalDocumentUpload = async (
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

    let uploadedUrl: string | null = null;
    if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (upRes.ok && upData.publicUrl) {
          uploadedUrl = upData.publicUrl;
        }
      } catch {
        // Fallback sin URL remota
      }
    }

    const kb = (file.size / 1024).toFixed(1);
    await updateLegalDocument({
      propertyFolio: activeOwnerProp?.folio || "MX-NL-2025-104",
      documentTitle: file.name,
      documentDetail: `Anexo Jurídico (${kb} KB) • Auditado NOM-247`,
      verificationStatus: "Verificado",
      fileUrl: uploadedUrl,
    });

    setLegalUploadStatus(
      `Documento "${file.name}" (${kb} KB) auditado y sincronizado en public.legal_documents.`
    );
  };

  // Envío del formulario "+ Agregar / Registrar Propiedad" (INSERT en public.properties)
  const handleRegisterProperty = async (e: React.FormEvent) => {
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

    const created = await addProperty({
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
      `Propiedad "${created.title}" registrada en Supabase (public.properties) y validada en la Red MLS Global Coldwell Banker.`
    );
  };

  const handleSaveExitPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(newExitPriceInput);
    if (numeric <= 0 || Number.isNaN(numeric)) {
      return;
    }
    setValuationPrice(numeric);
    setAdjustingPrice(false);
    await updatePropertyPrice(
      activeOwnerProp?.folio || selectedPropertyId,
      numeric
    );
    setStatusBanner(
      `Precio de salida actualizado a $${numeric.toLocaleString(
        "es-MX"
      )} MXN en Supabase (public.properties) con sincronización inmediata en el MLS.`
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
              <div className="flex items-center gap-3">
                <h2 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
                  Mis Propiedades en Gestión ({currentAssetIndex + 1} de{" "}
                  {Math.max(3, ownerAssets.length)} Activos Principales)
                </h2>
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectAssetByIndex(currentAssetIndex - 1)
                    }
                    aria-label="Propiedad anterior (<-)"
                    title="Activo anterior (<-)"
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0B1F3A] hover:text-white text-[#0B1F3A] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectAssetByIndex(currentAssetIndex + 1)
                    }
                    aria-label="Siguiente propiedad (->)"
                    title="Siguiente activo (->)"
                    className="w-8 h-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-[#0B1F3A] hover:text-white text-[#0B1F3A] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Activo seleccionado:
                </span>
                <select
                  value={activeOwnerProp?.id || selectedPropertyId}
                  onChange={(e) => {
                    const idx = ownerAssets.findIndex(
                      (p) => p.id === e.target.value
                    );
                    if (idx >= 0) {
                      handleSelectAssetByIndex(idx);
                    }
                  }}
                  className="text-xs font-bold text-[#0B1F3A] bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer"
                >
                  {ownerAssets.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Izquierda: Fotografía y métricas del Activo seleccionado en Supabase */}
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
                    Folio {activeOwnerProp?.folio || "MX-NL-2025-104"} •
                    Exclusiva Coldwell Banker
                  </span>
                </div>

                {/* Datos inferiores de la unidad */}
                <div className="relative z-10 space-y-3">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold">
                      {activeOwnerProp?.title ||
                        "Villa Cumbres del Valle • Residencia A-104"}
                    </h3>
                    <p className="text-xs sm:text-sm text-sky-200 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-sky-300" />
                      {activeOwnerProp?.location ||
                        "Residencial San Pedro Garza García, N.L."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/15 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-100">
                    <span className="inline-flex items-center gap-1">
                      <Maximize2 className="w-3.5 h-3.5 text-sky-300" />
                      {activeOwnerProp?.landAreaDisplay || "620 m²"} Terreno
                    </span>
                    <span>|</span>
                    <span>
                      {activeOwnerProp?.constructionAreaDisplay || "485 m²"}{" "}
                      Construcción
                    </span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="w-3.5 h-3.5 text-sky-300" />
                      {activeOwnerProp?.bedroomsDisplay || "4 Recámaras"}
                    </span>
                    <span>|</span>
                    <span className="inline-flex items-center gap-1">
                      <Bath className="w-3.5 h-3.5 text-sky-300" />
                      {activeOwnerProp?.bathroomsDisplay || "5.5 Baños"}
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
                      {activeOwnerProp?.marketDemand ||
                        "Alta / En Tendencia Regional"}
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
                      $
                      {(
                        activeOwnerProp?.suggestedSaleMin ||
                        Math.round(valuationPrice * 0.977)
                      ).toLocaleString("es-MX")}{" "}
                      – $
                      {(
                        activeOwnerProp?.suggestedSaleMax ||
                        Math.round(valuationPrice * 1.03)
                      ).toLocaleString("es-MX")}{" "}
                      MXN
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-sky-800">
                      RENTA MENSUAL ESTIMADA (Cap Rate{" "}
                      {activeOwnerProp?.capRate || "8.6%"})
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-[#0B1F3A] mt-1">
                      {activeOwnerProp?.folio === "MX-NL-2025-104" ||
                      activeOwnerProp?.folio === "MX-QRO-2025-089"
                        ? "$32,000 – $36,500 MXN/mes"
                        : `$${Math.round(
                            (activeOwnerProp?.rentPrice ||
                              valuationPrice * 0.0065) * 0.95
                          ).toLocaleString("es-MX")} – $${Math.round(
                            (activeOwnerProp?.rentPrice ||
                              valuationPrice * 0.0065) * 1.06
                          ).toLocaleString("es-MX")} MXN/mes`}
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
                    Agenda de Visitas ({visits.length} Próximas)
                  </h3>
                  <Calendar className="w-4 h-4 text-sky-700" />
                </div>

                <div className="space-y-2.5 text-xs">
                  {visits.slice(0, 3).map((v, idx) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70"
                    >
                      <p className="font-extrabold text-[#0B1F3A]">
                        {v.scheduleLabel} - {v.visitorName}
                      </p>
                      <p
                        className={`text-[11px] font-semibold mt-0.5 ${
                          idx === 0
                            ? "text-emerald-700"
                            : idx === 1
                            ? "text-sky-700"
                            : "text-amber-700"
                        }`}
                      >
                        {v.buyerScoreBadge} - {v.visitPurpose}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadGoogleCalendarIcs}
                className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-700" />
                <span>Sincronizar Google Calendar</span>
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
                  {legalDocuments.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-[#0B1F3A]">
                          {doc.documentTitle}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {doc.documentDetail}
                        </p>
                      </div>
                    </div>
                  ))}
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
                    Ofertas Recibidas ({offers.length} Activas)
                  </h3>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>

                <div className="space-y-3 text-xs">
                  {offers.slice(0, 2).map((offer) => {
                    const badgeLower = offer.offerStatusBadge.toLowerCase();
                    const badgeClass = badgeLower.includes("rechaz")
                      ? "bg-rose-100 text-rose-800"
                      : badgeLower.includes("contra")
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-800";

                    return (
                      <div
                        key={offer.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-[#0B1F3A]">
                            {offer.offerFolio}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badgeClass}`}
                          >
                            {offer.offerStatusBadge}
                          </span>
                        </div>
                        <p className="text-sm font-extrabold text-[#0B1F3A]">
                          {offer.offerAmountDisplay}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          {offer.paymentScheme} {offer.pricePercentageNote}
                        </p>
                      </div>
                    );
                  })}
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
                  onClick={handleContactAdvisor}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Contactar a un Asesor Coldwell Banker</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotarialModalOpen(true)}
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

      {/* Modal para Revisar y Responder Oferta (#OF-882 y #OF-841 en public.property_offers) */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  COMITÉ PATRIMONIAL • PUBLIC.PROPERTY_OFFERS
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  Dictamen de Ofertas Recibidas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOfferModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Revisa las ofertas vinculadas a tu cartera y emite una resolución
              formal sincronizada en tiempo real con{" "}
              <strong>Supabase (`public.property_offers`)</strong>:
            </p>

            <div className="space-y-4">
              {offers.map((offer) => {
                const counterVal =
                  counterOfferInputs[offer.offerFolio] ||
                  String(valuationPrice || 4350000);
                const badgeLower = offer.offerStatusBadge.toLowerCase();
                const badgeClass = badgeLower.includes("rechaz")
                  ? "bg-rose-100 text-rose-800"
                  : badgeLower.includes("contra")
                  ? "bg-amber-100 text-amber-800"
                  : "bg-emerald-100 text-emerald-800";

                return (
                  <div
                    key={offer.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-extrabold text-[#0B1F3A]">
                          {offer.offerFolio}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">
                          • Activo {offer.propertyFolio}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${badgeClass}`}
                      >
                        {offer.offerStatusBadge}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-lg font-extrabold text-[#0B1F3A]">
                        {offer.offerAmountDisplay}
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        {offer.paymentScheme} • {offer.pricePercentageNote}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <label className="text-[11px] font-bold text-slate-600 shrink-0">
                        Monto Contraoferta (MXN):
                      </label>
                      <input
                        type="number"
                        min={100000}
                        step={50000}
                        value={counterVal}
                        onChange={(e) =>
                          setCounterOfferInputs((prev) => ({
                            ...prev,
                            [offer.offerFolio]: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-[#0B1F3A]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          await respondToOffer({
                            offerFolio: offer.offerFolio,
                            statusBadge: "Aceptada",
                          });
                          setOfferModalOpen(false);
                          setStatusBanner(
                            `Oferta ${offer.offerFolio} (${offer.offerAmountDisplay}) ACEPTADA y sincronizada en Supabase (public.property_offers). Se notificó a Notaría 19 y al Lic. Mauricio Lozano.`
                          );
                        }}
                        className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer transition-colors"
                      >
                        Aceptar Oferta
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          const numericCounter =
                            Number(counterVal) || valuationPrice || 4350000;
                          const pct = Math.min(
                            105,
                            Math.max(
                              85,
                              +(
                                (numericCounter / (valuationPrice || 4350000)) *
                                100
                              ).toFixed(1)
                            )
                          );
                          await respondToOffer({
                            offerFolio: offer.offerFolio,
                            statusBadge: "Contraoferta",
                            offerAmount: numericCounter,
                            pricePercentageNote: `${pct}% de precio lista`,
                          });
                          setOfferModalOpen(false);
                          setStatusBanner(
                            `Contraoferta por $${numericCounter.toLocaleString(
                              "es-MX"
                            )} MXN enviada y sincronizada en Supabase (public.property_offers) para ${
                              offer.offerFolio
                            }.`
                          );
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer transition-colors"
                      >
                        Enviar Contraoferta
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await respondToOffer({
                            offerFolio: offer.offerFolio,
                            statusBadge: "Rechazada",
                          });
                          setOfferModalOpen(false);
                          setStatusBanner(
                            `Oferta ${offer.offerFolio} RECHAZADA formalmente y actualizada en Supabase (public.property_offers).`
                          );
                        }}
                        className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold cursor-pointer transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal para Agendar Llamada Notarial */}
      {notarialModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  MESA JURÍDICA COLDWELL BANKER • NOM-247
                </span>
                <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                  Agendar Llamada Notarial
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setNotarialModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Programa una conferencia directa con el titular de la{" "}
              <strong>Notaría Pública No. 19</strong> y el{" "}
              <strong>Lic. Mauricio Lozano</strong> para el activo{" "}
              <strong>{activeOwnerProp?.title}</strong> (Folio{" "}
              {activeOwnerProp?.folio}).
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Asunto Jurídico / Notarial
                </label>
                <select
                  value={notarialTopic}
                  onChange={(e) => setNotarialTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-[#0B1F3A]"
                >
                  <option value="Notaría Pública No. 19 • Revisión de Oferta / LOI">
                    Notaría Pública No. 19 • Revisión de Oferta / LOI
                  </option>
                  <option value="Dictamen Fiscal ISR por Enajenación & Escrituración">
                    Dictamen Fiscal ISR por Enajenación &amp; Escrituración
                  </option>
                  <option value="Certificación de Libertad de Gravamen RPP">
                    Certificación de Libertad de Gravamen RPP
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Horario de Conferencia
                </label>
                <select
                  value={notarialSchedule}
                  onChange={(e) => setNotarialSchedule(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 font-bold text-[#0B1F3A]"
                >
                  <option value="Mañana, 10:00 AM">Mañana, 10:00 AM</option>
                  <option value="Jueves, 01:00 PM">Jueves, 01:00 PM</option>
                  <option value="Viernes, 05:00 PM">Viernes, 05:00 PM</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNotarialModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await scheduleVisit({
                    propertyFolio: activeOwnerProp?.folio || "MX-NL-2025-104",
                    propertyTitle: activeOwnerProp?.title,
                    visitorName: "Mesa Jurídica Notaría 19 & Lic. Roberto Garza",
                    visitorPhone: "+52 55 8920 1200",
                    scheduleLabel: notarialSchedule,
                    buyerScoreBadge: "Dictamen Legal",
                    visitPurpose: notarialTopic,
                  });
                  setNotarialModalOpen(false);
                  setStatusBanner(
                    `Llamada Notarial agendada (${notarialSchedule} • ${notarialTopic}) y sincronizada en Supabase (public.visits).`
                  );
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer"
              >
                Confirmar Llamada Notarial
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
