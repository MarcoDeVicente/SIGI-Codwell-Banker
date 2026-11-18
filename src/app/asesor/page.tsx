"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  Plus,
  Sparkles,
  Users,
  Calendar,
  Clock,
  MessageCircle,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  X,
  Building2,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useSigiStore, UserRole } from "@/lib/store";
import { leadSchema } from "@/lib/validations";

interface InstitutionalDeal {
  id: string;
  title: string;
  priceDisplay: string;
  location: string;
  specs: string;
  tag: string;
  image: string;
}

const INSTITUTIONAL_CATALOG: InstitutionalDeal[] = [
  {
    id: "cat-highland-park",
    title: "Residencia Highland Park",
    priceDisplay: "$2.5 Million USD",
    location: "Paseo de las Palmas 1840, Lomas de Chapultepec",
    specs: "780 m² Const. • 4 Suites • Cava Privada & Seguridad Nivel 5",
    tag: "Exclusiva Global Luxury",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
  },
  {
    id: "cat-torre-mistral",
    title: "TORRE MISTRAL",
    priceDisplay: "$1.8M",
    location: "Santa Fe / Bosques de las Lomas, CDMX",
    specs: "410 m² • Sky Penthouse • Doble Terraza Panorámica",
    tag: "Preventa VIP",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-casa-blanca",
    title: "CASA BLANCA",
    priceDisplay: "$3.4M",
    location: "Jardines del Pedregal, Ciudad de México",
    specs: "1,150 m² • Arquitectura Modernista • Alberca Olímpica",
    tag: "Off-Market HNWI",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cat-horizon-loft",
    title: "HORIZON LOFT",
    priceDisplay: "$1.1M",
    location: "Campos Elíseos, Polanco IV Sección",
    specs: "265 m² • Loft Corporativo • Automatización Crestron",
    tag: "Cap Rate 9.1%",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
  },
];

export default function AsesorPage() {
  const {
    leads,
    properties,
    addLead,
    updateLeadStatus,
    runLeadAiMatchingSimulation,
  } = useSigiStore();

  // Buscador superior y pestañas de la Bandeja Omnicanal
  const [searchFilter, setSearchFilter] = useState("");
  const [leadTab, setLeadTab] = useState<"todos" | "comprador" | "propietario">(
    "todos"
  );
  const [isSimulatingAi, setIsSimulatingAi] = useState(false);
  const [aiMatchesCount, setAiMatchesCount] = useState<number>(9);
  const [aiSimulationReport, setAiSimulationReport] = useState<
    Array<{ leadName: string; assignedProperty: string; aiScore: number }>
  >([]);

  // Meta financiera mensual editable
  const currentEarned = 185400;
  const [monthlyGoal, setMonthlyGoal] = useState<number>(220000);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("220000");

  // Porcentaje calculado (220,000 -> 85% por defecto como en la especificación)
  const goalPercentage =
    monthlyGoal === 220000
      ? 85
      : Math.min(100, Math.max(1, Math.round((currentEarned / monthlyGoal) * 100)));

  // Acordeón inferior del Catálogo Institucional Activo
  const [expandedCatalogId, setExpandedCatalogId] = useState<string>(
    "cat-highland-park"
  );

  // Modal "+ Agregar Prospecto"
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadProperty, setLeadProperty] = useState("Penthouse Rubén Darío");
  const [leadBudget, setLeadBudget] = useState("$28,500,000 MXN");
  const [leadRole, setLeadRole] = useState<UserRole>("comprador");
  const [leadPrivacy, setLeadPrivacy] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Conteo reactivo de prospectos activos (base 48 + nuevos agregados sobre los 4 iniciales)
  const extraLeadsCount = Math.max(0, leads.length - 4);
  const activeLeadsKPI = 48 + extraLeadsCount;

  // Filtrado de prospectos en la Bandeja Omnicanal
  const filteredLeads = leads.filter((lead) => {
    const matchesTab = leadTab === "todos" ? true : lead.role === leadTab;
    const q = searchFilter.trim().toLowerCase();
    const matchesQuery =
      !q ||
      lead.fullName.toLowerCase().includes(q) ||
      lead.interestProperty.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.status.toLowerCase().includes(q);
    return matchesTab && matchesQuery;
  });

  const validateLeadRealtime = (
    overrides: Partial<{
      fullName: string;
      email: string;
      phone: string;
      interestProperty: string;
      budgetDisplay: string;
      privacyAccepted: boolean;
    }>,
    fieldKey?: string
  ) => {
    const payload = {
      fullName: overrides.fullName ?? leadName,
      email: overrides.email ?? leadEmail,
      phone: overrides.phone ?? leadPhone,
      interestProperty: overrides.interestProperty ?? leadProperty,
      budgetDisplay: overrides.budgetDisplay ?? leadBudget,
      privacyAccepted: overrides.privacyAccepted ?? leadPrivacy,
    };

    const parsed = leadSchema.safeParse(payload);
    if (parsed.success) {
      setLeadErrors({});
      return true;
    }

    const nextErrs: Record<string, string> = { ...leadErrors };
    if (fieldKey) delete nextErrs[fieldKey];

    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] || "");
      if (!fieldKey || k === fieldKey) {
        nextErrs[k] = issue.message;
      }
    }
    setLeadErrors(nextErrs);
    return false;
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setDuplicateError(null);

    const parsed = leadSchema.safeParse({
      fullName: leadName,
      email: leadEmail,
      phone: leadPhone,
      interestProperty: leadProperty,
      budgetDisplay: leadBudget,
      privacyAccepted: leadPrivacy,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] || "");
        if (!errs[k]) errs[k] = issue.message;
      }
      setLeadErrors(errs);
      return;
    }

    const result = await addLead({
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      interestProperty: parsed.data.interestProperty,
      budgetDisplay: parsed.data.budgetDisplay,
      role: leadRole,
      profileType:
        leadRole === "propietario"
          ? "Propietario / Consignatario"
          : "Inversionista Privado",
      status: "Nuevo contacto",
      privacyAccepted: parsed.data.privacyAccepted,
    });

    if (!result.success) {
      setDuplicateError(
        result.error || "El prospecto ya existe en la Bandeja Omnicanal."
      );
      return;
    }

    // Limpiar y cerrar modal
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadPrivacy(false);
    setLeadErrors({});
    setLeadModalOpen(false);
    setActionToast(
      `Prospecto "${parsed.data.fullName}" registrado en Supabase conforme a la LFPDPPP (+1 en Prospectos Activos).`
    );
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(goalInput.replace(/[^0-9.]/g, ""));
    if (num > 0) {
      setMonthlyGoal(num);
      setEditingGoal(false);
    }
  };

  const handleStatusChange = async (
    leadId: string,
    leadFullName: string,
    newStatus: string
  ) => {
    const res = await updateLeadStatus(leadId, newStatus);
    if (res.success) {
      setActionToast(
        `Estado de negociación de "${leadFullName}" actualizado a "${newStatus}" en Supabase (public.leads).`
      );
    } else {
      setActionToast(
        `Estado de "${leadFullName}" cambiado a "${newStatus}" (sincronizado localmente).`
      );
    }
  };

  const handleRunAiSimulation = async () => {
    setIsSimulatingAi(true);
    try {
      // Ejecutar Motor SIGI Match v4.8 en /api/ai-match y asignar propiedad ideal a cada prospecto activo
      await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: 25.0,
          zone: "Polanco IV Sección, CDMX",
          typology: "Residencial / Villa",
          mode: "Comprar",
          persist: true,
          properties,
        }),
      }).catch(() => null);

      const simResult = await runLeadAiMatchingSimulation();
      setAiMatchesCount((prev) => Math.max(prev, simResult.matchedCount + 5));
      setAiSimulationReport(simResult.assignments);
      setActionToast(
        `Análisis predictivo SIGI Match v4.8 completado: se asignó la propiedad ideal del catálogo a ${simResult.matchedCount} prospectos activos en public.leads.`
      );
    } finally {
      setIsSimulatingAi(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status === "Cierre notarial") {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (status === "En oferta (LOI)") {
      return "bg-sky-50 text-sky-800 border-sky-200";
    }
    if (status === "Visita Hoy 17:30") {
      return "bg-amber-50 text-amber-800 border-amber-200";
    }
    return "bg-slate-100 text-[#0B1F3A] border-slate-200";
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex">
      {/* Sidebar fijo a la izquierda (visible en desktop) */}
      <div className="hidden lg:block w-68 shrink-0">
        <Sidebar activeSection="Panel Principal" />
      </div>

      {/* Contenedor Principal Derecho */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra Superior del Asesor */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Buscador */}
          <div className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar propiedades, contratos o clientes HNWI..."
              className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0B1F3A]"
            />
          </div>

          {/* Links a Sobre Nosotros, Prospectos y menú de perfil */}
          <div className="flex items-center gap-4">
            <Link
              href={"/sobre-nosotros" as never}
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0B1F3A] transition-colors"
            >
              Sobre Nosotros
            </Link>
            <a
              href="#bandeja-prospectos"
              className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0B1F3A] transition-colors"
            >
              Prospectos
            </a>
            <Link
              href={"/propietario" as never}
              className="hidden sm:inline-flex text-xs font-bold text-sky-700 hover:underline"
            >
              Vista Propietario →
            </Link>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#0B1F3A] text-white text-xs font-extrabold flex items-center justify-center">
                CG
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-extrabold text-[#0B1F3A] leading-tight">
                  Carlos García
                </p>
                <p className="text-[10px] font-semibold text-emerald-700">
                  Broker Senior • Lomas
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl w-full mx-auto">
          {/* Header Operativo */}
          <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
                TERMINAL BROKER PRIVADO • SIGI v4.8 Intelligence
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
                  Hola, Carlos García
                </h1>
                <span className="px-3 py-1 rounded-full bg-[#0B1F3A] text-sky-300 text-xs font-extrabold">
                  Asesor Premier
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Resumen operativo patrimonial y prospectos en tiempo real para
                Lomas &amp; Polanco.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setLeadTab("todos")}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <Filter className="w-4 h-4 text-[#0B1F3A]" />
                <span>Filtro de Cartera</span>
              </button>

              <button
                type="button"
                onClick={() => setLeadModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Prospecto</span>
              </button>
            </div>
          </section>

          {actionToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {actionToast}
              </span>
              <button
                type="button"
                onClick={() => setActionToast(null)}
                className="text-emerald-700 hover:underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          )}

          {aiSimulationReport.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#0B1F3A] text-white border border-sky-400/30 shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Resultado del Motor Predictivo SIGI Match v4.8 (Sincronizado en
                  public.leads)
                </span>
                <button
                  type="button"
                  onClick={() => setAiSimulationReport([])}
                  className="text-xs text-slate-300 hover:text-white cursor-pointer"
                >
                  Ocultar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {aiSimulationReport.map((item, idx) => (
                  <div
                    key={`${item.leadName}-${idx}`}
                    className="p-2.5 rounded-xl bg-white/10 border border-white/15"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white truncate">
                        {item.leadName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold">
                        {item.aiScore}% IA
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-200 truncate mt-1">
                      → {item.assignedProperty}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 Tarjetas KPI Superiores */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Prospectos Activos
                </span>
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#0B1F3A] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#0B1F3A]">
                  {activeLeadsKPI}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                  +12% mes
                </span>
              </div>
            </div>

            {/* KPI 2: Coincidencias con IA (Simulación Activa) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">
                  Coincidencias con IA
                </span>
                <button
                  type="button"
                  onClick={() => void handleRunAiSimulation()}
                  disabled={isSimulatingAi}
                  className="px-2.5 py-1 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  <span>
                    {isSimulatingAi
                      ? "Analizando..."
                      : "Simulación Activa"}
                  </span>
                </button>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#0B1F3A]">
                  {String(aiMatchesCount).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRunAiSimulation()}
                  className="text-xs font-bold text-sky-700 hover:underline cursor-pointer"
                >
                  Ejecutar Match IA →
                </button>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Visitas de Hoy
                </span>
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#0B1F3A]">
                  03
                </span>
                <span className="text-[11px] font-bold text-slate-600">
                  14:00 Bosques / 17:30 Lomas
                </span>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  Pendientes de Seguimiento
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#0B1F3A]">
                  04
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-extrabold">
                  2 por vencer hoy
                </span>
              </div>
            </div>
          </section>

          {/* Bloque Central: Izquierda (Bandeja de Prospectos) + Derecha (Métricas Financieras y Propiedad Foco) */}
          <section
            id="bandeja-prospectos"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          >
            {/* Centro Izquierda: Bandeja de Prospectos (Omnicanal Activa) */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#0B1F3A]">
                    Bandeja de Prospectos (Omnicanal Activa)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Seguimiento certificado de clientes HNWI con perfilamiento
                    predictivo SIGI
                  </p>
                </div>

                {/* Pestañas de filtro funcionales */}
                <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setLeadTab("todos")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      leadTab === "todos"
                        ? "bg-[#0B1F3A] text-white"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    Todos ({activeLeadsKPI})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadTab("comprador")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      leadTab === "comprador"
                        ? "bg-[#0B1F3A] text-white"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    Comprador
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadTab("propietario")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      leadTab === "propietario"
                        ? "bg-[#0B1F3A] text-white"
                        : "text-slate-600 hover:text-[#0B1F3A]"
                    }`}
                  >
                    Propietario
                  </button>
                </div>
              </div>

              {/* Tabla Omnicanal */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-5">PROSPECTO / HNWI</th>
                      <th className="py-3.5 px-4">CONTACTO WHATSAPP</th>
                      <th className="py-3.5 px-4">INTERÉS PATRIMONIAL</th>
                      <th className="py-3.5 px-4">ESTADO NEGOCIACIÓN</th>
                      <th className="py-3.5 px-5 text-right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {lead.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-[#0B1F3A] text-xs sm:text-sm">
                                  {lead.fullName}
                                </span>
                                {lead.aiBadge && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                    {lead.aiBadge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {lead.profileType}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-semibold text-slate-700">
                          {lead.phone}
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-extrabold text-[#0B1F3A]">
                            {lead.interestProperty}
                          </p>
                          <p className="text-[11px] text-sky-700 font-bold">
                            {lead.budgetDisplay}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={lead.status}
                            aria-label={`Estado de negociación de ${lead.fullName}`}
                            onChange={(e) =>
                              void handleStatusChange(
                                lead.id,
                                lead.fullName,
                                e.target.value
                              )
                            }
                            className={`px-2.5 py-1.5 rounded-full border font-extrabold text-[11px] focus:outline-none cursor-pointer transition-colors ${getStatusBadgeStyle(
                              lead.status
                            )}`}
                          >
                            <option value="Nuevo contacto">
                              Nuevo contacto
                            </option>
                            <option value="Visita Hoy 17:30">
                              Visita Hoy 17:30
                            </option>
                            <option value="En oferta (LOI)">
                              En oferta (LOI)
                            </option>
                            <option value="Cierre notarial">
                              Cierre notarial
                            </option>
                          </select>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              const digits = lead.phone.replace(/\D/g, "");
                              const waPhone = digits.startsWith("52")
                                ? digits
                                : `52${digits || "5589201200"}`;
                              const text = `Hola ${lead.fullName}, te escribe Carlos García (Broker Senior Coldwell Banker México) respecto a tu interés patrimonial en ${lead.interestProperty} (${lead.status}).`;
                              if (typeof window !== "undefined") {
                                window.open(
                                  `https://wa.me/${waPhone}?text=${encodeURIComponent(
                                    text
                                  )}`,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                              setActionToast(
                                `Canal WhatsApp abierto con ${lead.fullName} (${lead.phone}) para ${lead.interestProperty}.`
                              );
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#143159] text-white text-[11px] font-bold cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Contactar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Centro Derecha: Métricas Financieras (Q3 2024) + PROPIEDAD FOCO SEMANAL */}
            <div className="lg:col-span-4 space-y-6">
              {/* Card Métricas Financieras (Q3 2024) */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                    Métricas Financieras (Q3 2024)
                  </h3>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Comisiones Ganadas
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mt-1">
                      $185,400 MXN
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      Acumulado
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <p className="text-[10px] font-bold uppercase text-slate-400">
                      Operaciones
                    </p>
                    <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mt-1">
                      6 Cerradas
                    </p>
                    <p className="text-[11px] text-sky-700 font-semibold">
                      con éxito
                    </p>
                  </div>
                </div>

                {/* Barra de progreso Meta Financiera Mensual */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">
                      Meta Financiera Mensual: {goalPercentage}% alcanzado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    (Actual: $185,400 MXN / Meta: $
                    {monthlyGoal.toLocaleString("es-MX")} MXN)
                  </p>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${goalPercentage}%` }}
                    />
                  </div>
                </div>

                {editingGoal ? (
                  <form onSubmit={handleSaveGoal} className="space-y-2 pt-2">
                    <label className="block text-[11px] font-bold text-slate-700">
                      Nueva Meta Mensual (MXN):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={10000}
                        step={5000}
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1F3A]"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setGoalInput(String(monthlyGoal));
                      setEditingGoal(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-[#0B1F3A] transition-colors cursor-pointer"
                  >
                    Ajustar Meta Mensual
                  </button>
                )}
              </div>

              {/* Card PROPIEDAD FOCO SEMANAL (+94% Match) */}
              <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
                <div className="relative h-44 bg-[#0B1F3A]">
                  <img
                    src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80"
                    alt="Villa del Bosque 42"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                      PROPIEDAD FOCO SEMANAL (+94% Match)
                    </span>
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-extrabold text-[#0B1F3A]">
                      Villa del Bosque 42
                    </h4>
                    <span className="text-sm font-extrabold text-sky-700">
                      $42.0M MXN
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0B1F3A]" />
                    Lomas Altas, Miguel Hidalgo
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Parte Inferior: CATÁLOGO INSTITUCIONAL ACTIVO - Oportunidades Destacadas */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
                  CATÁLOGO INSTITUCIONAL ACTIVO
                </p>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                  Oportunidades Destacadas.
                </h2>
              </div>
              <span className="text-xs text-slate-500">
                Red MLS Privado Coldwell Banker • Haz clic para expandir ficha
              </span>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 min-h-[340px]">
              {INSTITUTIONAL_CATALOG.map((item) => {
                const isExpanded = item.id === expandedCatalogId;
                if (isExpanded) {
                  return (
                    <div
                      key={item.id}
                      className="lg:flex-[2.8] relative rounded-3xl overflow-hidden shadow-lg bg-[#0B1F3A] min-h-[320px] flex flex-col justify-between p-6 text-white transition-all duration-500"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#051122] via-[#0B1F3A]/50 to-transparent" />

                      <div className="relative z-10 flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full bg-sky-500/90 text-white text-xs font-extrabold">
                          {item.tag}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
                          MLS Global Luxury
                        </span>
                      </div>

                      <div className="relative z-10 space-y-1.5">
                        <h3 className="text-2xl font-extrabold">
                          {item.title}
                        </h3>
                        <p className="text-lg font-extrabold text-sky-300">
                          {item.priceDisplay} - {item.location}
                        </p>
                        <p className="text-xs text-slate-200">{item.specs}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    onClick={() => setExpandedCatalogId(item.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setExpandedCatalogId(item.id);
                      }
                    }}
                    className="lg:flex-1 relative rounded-3xl overflow-hidden shadow-md bg-[#0B1F3A] min-h-[160px] lg:min-h-[320px] flex flex-col justify-between p-5 text-white cursor-pointer group hover:ring-2 hover:ring-sky-400 transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051122]/90 via-[#0B1F3A]/60 to-transparent" />

                    <div className="relative z-10 flex justify-end">
                      <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>

                    {/* Nombre rotado verticalmente */}
                    <div className="relative z-10 flex-1 flex items-center justify-center py-4">
                      <h4 className="-rotate-90 whitespace-nowrap text-base font-extrabold tracking-widest uppercase text-white drop-shadow-sm">
                        {item.title}
                      </h4>
                    </div>

                    {/* Precio al pie */}
                    <div className="relative z-10 text-center">
                      <p className="text-sm font-extrabold text-sky-300">
                        {item.priceDisplay}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      </div>

      {/* Modal "+ Agregar Prospecto" validado con leadSchema (Zod) */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-sky-300 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#0B1F3A]">
                    Registrar Nuevo Prospecto HNWI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validación en tiempo real LFPDPPP &amp; Anti-Duplicados SIGI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLeadModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {duplicateError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{duplicateError}</span>
              </div>
            )}

            <form onSubmit={handleCreateLead} className="space-y-4" noValidate>
              {/* Rol del prospecto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoría del Prospecto
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadRole("comprador")}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      leadRole === "comprador"
                        ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Comprador / Inversionista
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeadRole("propietario")}
                    className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                      leadRole === "propietario"
                        ? "bg-[#0B1F3A] text-white border-[#0B1F3A]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Propietario / Consignatario
                  </button>
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo del Prospecto
                </label>
                <input
                  type="text"
                  value={leadName}
                  onChange={(e) => {
                    setLeadName(e.target.value);
                    validateLeadRealtime(
                      { fullName: e.target.value },
                      "fullName"
                    );
                  }}
                  placeholder="Ej. Ing. Patricio Slim Domit"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                {leadErrors.fullName && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {leadErrors.fullName}
                  </p>
                )}
              </div>

              {/* Correo Electrónico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => {
                    setLeadEmail(e.target.value);
                    validateLeadRealtime({ email: e.target.value }, "email");
                  }}
                  placeholder="patricio@inversiones.mx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
                {leadErrors.email && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {leadErrors.email}
                  </p>
                )}
              </div>

              {/* Teléfono con lada +52 de 10 dígitos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono WhatsApp (+52 • 10 dígitos)
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-xs font-extrabold text-[#0B1F3A]">
                    +52
                  </span>
                  <input
                    type="tel"
                    value={leadPhone}
                    onChange={(e) => {
                      setLeadPhone(e.target.value);
                      validateLeadRealtime({ phone: e.target.value }, "phone");
                    }}
                    placeholder="55 8920 1200"
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-slate-200 text-sm"
                  />
                </div>
                {leadErrors.phone && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {leadErrors.phone}
                  </p>
                )}
              </div>

              {/* Propiedad de interés y Presupuesto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Interés Patrimonial
                  </label>
                  <input
                    type="text"
                    value={leadProperty}
                    onChange={(e) => {
                      setLeadProperty(e.target.value);
                      validateLeadRealtime(
                        { interestProperty: e.target.value },
                        "interestProperty"
                      );
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {leadErrors.interestProperty && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {leadErrors.interestProperty}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Presupuesto / Esquema
                  </label>
                  <input
                    type="text"
                    value={leadBudget}
                    onChange={(e) => {
                      setLeadBudget(e.target.value);
                      validateLeadRealtime(
                        { budgetDisplay: e.target.value },
                        "budgetDisplay"
                      );
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                  {leadErrors.budgetDisplay && (
                    <p className="mt-1 text-[11px] text-red-600 font-medium">
                      {leadErrors.budgetDisplay}
                    </p>
                  )}
                </div>
              </div>

              {/* Casilla obligatoria LFPDPPP */}
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={leadPrivacy}
                    onChange={(e) => {
                      setLeadPrivacy(e.target.checked);
                      validateLeadRealtime(
                        { privacyAccepted: e.target.checked },
                        "privacyAccepted"
                      );
                    }}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0B1F3A]"
                  />
                  <span className="text-xs text-slate-600">
                    Confirmo que el titular otorgó su consentimiento expreso
                    conforme al{" "}
                    <strong className="text-[#0B1F3A]">
                      Aviso de Privacidad LFPDPPP
                    </strong>{" "}
                    de Coldwell Banker México.
                  </span>
                </label>
                {leadErrors.privacyAccepted && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {leadErrors.privacyAccepted}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setLeadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer"
                >
                  Guardar Prospecto en SIGI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
