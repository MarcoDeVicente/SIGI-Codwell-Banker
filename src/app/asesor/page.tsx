"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
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
  Navigation,
  Inbox,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  useSigiStore,
  UserRole,
  OmnichannelLead,
  doesLocationMatchCity,
  isLegacySeedLead,
  getInitials,
  formatMexicanPhoneDisplay,
} from "@/lib/store";
import { leadSchema } from "@/lib/validations";

const MEXICAN_ADVISOR_CITIES = [
  "Querétaro",
  "Ciudad de México",
  "Monterrey",
  "San Pedro Garza García",
  "Cancún / Riviera Maya",
  "San Miguel de Allende",
  "Guadalajara",
  "Puebla",
  "Mérida",
];

const LEGACY_SEED_VISIT_IDS = new Set(["visit-1", "visit-2", "visit-3"]);

function parseLeadCommissionMXN(budgetDisplay: string): number {
  const clean = (budgetDisplay || "").toLowerCase();
  const numStr = clean.replace(/[^0-9.]/g, "");
  const val = parseFloat(numStr);
  if (!Number.isFinite(val) || val <= 0) {
    return 45000;
  }
  let baseAmount = val;
  if ((clean.includes("m") || clean.includes("mill")) && val < 500) {
    baseAmount = val * 1_000_000;
  }
  if (clean.includes("mes") || clean.includes("renta")) {
    return Math.round(baseAmount);
  }
  // 4.5% comisión institucional Coldwell Banker (o monto directo si es menor)
  return baseAmount >= 1_000_000
    ? Math.round(baseAmount * 0.045)
    : Math.round(baseAmount);
}

export default function AsesorPage() {
  const router = useRouter();
  const {
    currentUser,
    users,
    leads,
    properties,
    visits,
    searchQuery,
    addLead,
    deleteLead,
    updateLeadStatus,
    updateUserCity,
    updateMonthlyGoal,
    runLeadAiMatchingSimulation,
  } = useSigiStore();

  useEffect(() => {
    if (currentUser && currentUser.role !== "asesor") {
      router.replace(`/${currentUser.role}` as never);
    }
  }, [currentUser, router]);

  const activeAdvisorEmail = (currentUser?.email || "").trim().toLowerCase();
  const advisorDisplayName = currentUser?.fullName || "Asesor Certificado";

  // Ubicación real del asesor detectada por geolocalización + geocodificación inversa
  const [detectedGeoCity, setDetectedGeoCity] = useState<string | null>(null);
  const [geoBlockedOrManual, setGeoBlockedOrManual] = useState<boolean>(false);
  const [isDetectingGeo, setIsDetectingGeo] = useState<boolean>(false);

  const ubicacionReal =
    detectedGeoCity ||
    currentUser?.city ||
    (geoBlockedOrManual ? "Querétaro" : "Detectando ubicación...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timerInit = window.setTimeout(() => {
      if (!("geolocation" in navigator)) {
        setGeoBlockedOrManual(true);
        const fallbackCity = currentUser?.city || "Querétaro";
        setDetectedGeoCity(fallbackCity);
        if (!currentUser?.city) {
          void updateUserCity(fallbackCity);
        }
        return;
      }

      setIsDetectingGeo(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`
            );
            if (!response.ok) {
              throw new Error("Reverse geocode error");
            }
            const data = (await response.json()) as {
              city?: string;
              locality?: string;
              principalSubdivision?: string;
            };
            const detectedCity = (
              data.city ||
              data.locality ||
              data.principalSubdivision ||
              currentUser?.city ||
              "Querétaro"
            ).trim();

            setDetectedGeoCity(detectedCity);
            setIsDetectingGeo(false);
            await updateUserCity(detectedCity);
          } catch {
            setIsDetectingGeo(false);
            setGeoBlockedOrManual(true);
            const fallbackCity = currentUser?.city || "Querétaro";
            setDetectedGeoCity(fallbackCity);
            if (!currentUser?.city) {
              void updateUserCity(fallbackCity);
            }
          }
        },
        () => {
          // El navegador bloqueó permisos de ubicación -> habilitar selector discreto de ciudad
          setIsDetectingGeo(false);
          setGeoBlockedOrManual(true);
          const fallbackCity = currentUser?.city || "Querétaro";
          setDetectedGeoCity(fallbackCity);
          if (!currentUser?.city) {
            void updateUserCity(fallbackCity);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 7000,
          maximumAge: 60000,
        }
      );
    }, 0);

    return () => window.clearTimeout(timerInit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAdvisorEmail]);

  const handleManualCityChange = async (newCity: string) => {
    setDetectedGeoCity(newCity);
    await updateUserCity(newCity);
    setActionToast(
      `Ubicación operativa actualizada a "${newCity}" y sincronizada en public.profiles.city.`
    );
  };

  // Pestañas de la Bandeja de Prospectos
  const [leadTab, setLeadTab] = useState<"todos" | "comprador" | "propietario">(
    "todos"
  );
  const [isSimulatingAi, setIsSimulatingAi] = useState(false);
  const [aiSimulationReport, setAiSimulationReport] = useState<
    Array<{
      leadName: string;
      assignedProperty: string;
      city: string;
      aiScore: number;
    }>
  >([]);

  // Meta financiera mensual editable (inicia en 0 para cuentas nuevas sin actividad previa)
  const monthlyGoal = currentUser?.monthlyGoal ?? 0;
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(monthlyGoal || ""));

  // Modal "+ Agregar Prospecto"
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadProperty, setLeadProperty] = useState("");
  const [leadBudget, setLeadBudget] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadRole, setLeadRole] = useState<UserRole>("comprador");
  const [leadPrivacy, setLeadPrivacy] = useState(false);
  const [leadErrors, setLeadErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [pendingDeleteLead, setPendingDeleteLead] =
    useState<OmnichannelLead | null>(null);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  const handleConfirmDeleteLead = async () => {
    if (!pendingDeleteLead) return;
    setIsDeletingLead(true);
    const targetName = pendingDeleteLead.fullName;
    await deleteLead(pendingDeleteLead.id, pendingDeleteLead.email);
    setIsDeletingLead(false);
    setPendingDeleteLead(null);
    setActionToast(
      `Prospecto "${targetName}" eliminado de Supabase (public.leads) y de tu Bandeja de Prospectos.`
    );
  };

  // Clientes y Propietarios en public.profiles que vincularon a este asesor
  const linkedProfiles = useMemo(() => {
    if (!activeAdvisorEmail) return [];
    return users.filter(
      (u) =>
        (u.role === "comprador" || u.role === "propietario") &&
        (u.assignedAdvisor?.email || "").toLowerCase() === activeAdvisorEmail
    );
  }, [users, activeAdvisorEmail]);

  const linkedProfileEmails = useMemo(
    () => new Set(linkedProfiles.map((u) => u.email.toLowerCase())),
    [linkedProfiles]
  );

  // Prospectos 100% reales pertenecientes al asesor autenticado (cero datos semilla de Carlos García)
  const advisorLeads = useMemo<OmnichannelLead[]>(() => {
    if (!activeAdvisorEmail) return [];

    const directLeads = leads.filter((lead) => {
      if (isLegacySeedLead(lead)) return false;
      const belongsToAdvisor =
        (lead.advisorEmail || "").toLowerCase() === activeAdvisorEmail ||
        linkedProfileEmails.has(lead.email.toLowerCase());
      return belongsToAdvisor;
    });

    const existingEmails = new Set(
      directLeads.map((l) => l.email.toLowerCase())
    );

    // Incluir clientes/propietarios que vincularon al asesor desde /propietario/asesores si aún no están en public.leads
    const synthesizedFromProfiles: OmnichannelLead[] = linkedProfiles
      .filter((u) => !existingEmails.has(u.email.toLowerCase()))
      .map((u) => ({
        id: `linked-${u.id}`,
        initials: u.avatarInitials || getInitials(u.fullName),
        fullName: u.fullName,
        profileType:
          u.role === "propietario"
            ? "Propietario / Consignatario"
            : "Comprador / Inversionista",
        phone: formatMexicanPhoneDisplay(u.phone || ""),
        email: u.email,
        interestProperty:
          u.role === "propietario"
            ? "Cartera en Consignación VIP"
            : "Adquisición Residencial",
        budgetDisplay:
          u.role === "propietario" ? "Exclusiva Captación" : "Por perfilar",
        status: "Nuevo contacto",
        role: u.role,
        advisorEmail: activeAdvisorEmail,
        city: u.city || currentUser?.city,
        privacyAccepted: true,
        privacy_accepted_at: u.privacy_accepted_at,
        createdAt: u.createdAt,
      }));

    return [...directLeads, ...synthesizedFromProfiles];
  }, [leads, activeAdvisorEmail, linkedProfileEmails, linkedProfiles, currentUser?.city]);

  // Propiedades reales en public.properties cuya ciudad/zona coincide estrictamente con la ciudad real del asesor
  const effectiveCity =
    ubicacionReal === "Detectando ubicación..."
      ? currentUser?.city || "Querétaro"
      : ubicacionReal;

  const cityMatchedProperties = useMemo(() => {
    if (!effectiveCity) return [];
    return properties.filter((prop) =>
      doesLocationMatchCity(
        `${prop.zone || ""} ${prop.location || ""} ${prop.title || ""}`,
        effectiveCity
      )
    );
  }, [properties, effectiveCity]);

  // Prospectos del asesor ubicados en la misma ciudad real del asesor
  const cityMatchedAdvisorLeads = useMemo(() => {
    if (!effectiveCity) return [];
    return advisorLeads.filter((lead) => {
      const leadLocationText = `${lead.city || ""} ${
        lead.interestProperty || ""
      }`.trim();
      return lead.city
        ? doesLocationMatchCity(lead.city, effectiveCity)
        : doesLocationMatchCity(leadLocationText || effectiveCity, effectiveCity);
    });
  }, [advisorLeads, effectiveCity]);

  // Coincidencias con IA estrictamente por ciudad (Prospectos del asesor en su ciudad <-> Propiedades en su ciudad)
  const strictCityAiPairs = useMemo(() => {
    if (
      cityMatchedAdvisorLeads.length === 0 ||
      cityMatchedProperties.length === 0
    ) {
      return [];
    }
    return cityMatchedAdvisorLeads.map((lead, idx) => {
      const matchedProp =
        cityMatchedProperties.find((p) =>
          lead.interestProperty
            .toLowerCase()
            .includes(p.title.toLowerCase())
        ) ||
        cityMatchedProperties[idx % cityMatchedProperties.length] ||
        cityMatchedProperties[0];

      const scoreNum =
        parseInt((lead.aiBadge || "").replace(/[^0-9]/g, ""), 10) ||
        matchedProp?.aiMatch ||
        95;

      return {
        leadId: lead.id,
        leadName: lead.fullName,
        leadRole: lead.role,
        assignedProperty: `${matchedProp.title} (${matchedProp.folio})`,
        propertyTitle: matchedProp.title,
        propertyFolio: matchedProp.folio,
        propertyPrice: matchedProp.salePriceDisplay,
        propertyImage: matchedProp.image,
        city: matchedProp.zone || matchedProp.location || effectiveCity,
        aiScore: scoreNum,
      };
    });
  }, [cityMatchedAdvisorLeads, cityMatchedProperties, effectiveCity]);

  // KPI 1: Prospectos Activos (100% real, inicia en 0)
  const activeLeadsKPI = advisorLeads.length;

  // KPI 2: Coincidencias con IA (estrictamente en la ciudad real del asesor, inicia en 0)
  const aiMatchesKPI =
    aiSimulationReport.length > 0
      ? aiSimulationReport.length
      : strictCityAiPairs.length;

  // KPI 3: Visitas de Hoy (100% reales de public.visits vinculadas al asesor o prospectos con visita hoy, inicia en 0)
  const advisorRealVisits = useMemo(() => {
    if (!activeAdvisorEmail) return [];
    const ownerPropsFolios = new Set(
      properties
        .filter(
          (p) =>
            p.ownerEmail && linkedProfileEmails.has(p.ownerEmail.toLowerCase())
        )
        .map((p) => p.folio)
    );
    const advisorLeadNames = new Set(
      advisorLeads.map((l) => l.fullName.toLowerCase())
    );

    return visits.filter((v) => {
      if (LEGACY_SEED_VISIT_IDS.has(v.id)) return false;
      return (
        (v.advisorEmail || "").toLowerCase() === activeAdvisorEmail ||
        (v.ownerEmail &&
          linkedProfileEmails.has(v.ownerEmail.toLowerCase())) ||
        ownerPropsFolios.has(v.propertyFolio) ||
        advisorLeadNames.has(v.visitorName.toLowerCase())
      );
    });
  }, [
    visits,
    activeAdvisorEmail,
    properties,
    linkedProfileEmails,
    advisorLeads,
  ]);

  const leadsWithVisitToday = useMemo(
    () =>
      advisorLeads.filter((l) =>
        l.status.toLowerCase().includes("visita")
      ),
    [advisorLeads]
  );

  const todayVisitsKPI = advisorRealVisits.length + leadsWithVisitToday.length;

  // KPI 4: Pendientes de Seguimiento (prospectos reales activos aún no cerrados, inicia en 0)
  const pendingFollowUpLeads = useMemo(
    () => advisorLeads.filter((l) => l.status !== "Cierre notarial"),
    [advisorLeads]
  );
  const pendingFollowUpsKPI = pendingFollowUpLeads.length;

  // Métricas Financieras 100% reales (inician en $0 MXN, 0 Cerradas, 0% alcanzado)
  const closedLeads = useMemo(
    () => advisorLeads.filter((l) => l.status === "Cierre notarial"),
    [advisorLeads]
  );
  const closedOperationsCount = closedLeads.length;
  const currentEarned = useMemo(
    () =>
      closedLeads.reduce(
        (sum, lead) => sum + parseLeadCommissionMXN(lead.budgetDisplay),
        0
      ),
    [closedLeads]
  );

  const goalPercentage =
    monthlyGoal > 0 && currentEarned > 0
      ? Math.min(100, Math.round((currentEarned / monthlyGoal) * 100))
      : 0;

  // Acordeón inferior del Catálogo Institucional en la ciudad del asesor
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");
  const expandedCatalogId = cityMatchedProperties.some(
    (p) => p.id === selectedCatalogId
  )
    ? selectedCatalogId
    : cityMatchedProperties[0]?.id || "";
  const setExpandedCatalogId = setSelectedCatalogId;

  // Filtrado de prospectos en la Bandeja de Prospectos
  const filteredLeads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return advisorLeads.filter((lead) => {
      const matchesTab = leadTab === "todos" ? true : lead.role === leadTab;
      const matchesQuery =
        !q ||
        lead.fullName.toLowerCase().includes(q) ||
        lead.interestProperty.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.status.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [advisorLeads, leadTab, searchQuery]);

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

  const handleOpenLeadModal = () => {
    setDuplicateError(null);
    setLeadErrors({});
    setLeadCity(effectiveCity);
    setLeadModalOpen(true);
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

    const targetLeadCity = (leadCity || effectiveCity).trim();

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
      city: targetLeadCity,
      advisorEmail: activeAdvisorEmail,
      privacyAccepted: parsed.data.privacyAccepted,
    });

    if (!result.success) {
      setDuplicateError(
        result.error || "El prospecto ya existe en tu Bandeja de Prospectos."
      );
      return;
    }

    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
    setLeadProperty("");
    setLeadBudget("");
    setLeadPrivacy(false);
    setLeadErrors({});
    setLeadModalOpen(false);
    setActionToast(
      `Prospecto "${parsed.data.fullName}" (${targetLeadCity}) registrado en Supabase (public.leads) conforme a la LFPDPPP.`
    );
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(goalInput.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(num) && num >= 0) {
      await updateMonthlyGoal(num);
      setEditingGoal(false);
      setActionToast(
        `Meta financiera mensual actualizada a $${num.toLocaleString(
          "es-MX"
        )} MXN en public.profiles.`
      );
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
        `Estado de "${leadFullName}" cambiado a "${newStatus}".`
      );
    }
  };

  const handleRunAiSimulation = async () => {
    setIsSimulatingAi(true);
    try {
      // Ejecutar Motor SIGI Match v4.8 en /api/ai-match con emparejamiento estricto por la ciudad real del asesor
      const apiRes = await fetch("/api/ai-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: 25.0,
          zone: effectiveCity,
          city: effectiveCity,
          advisorCity: effectiveCity,
          advisorEmail: activeAdvisorEmail,
          strictCityMatch: true,
          typology: "Residencial / Villa",
          mode: "Comprar",
          persist: true,
          properties,
          leads: advisorLeads,
        }),
      }).catch(() => null);

      const apiData = apiRes ? await apiRes.json().catch(() => null) : null;

      const simResult = await runLeadAiMatchingSimulation({
        advisorCity: effectiveCity,
        advisorEmail: activeAdvisorEmail,
      });

      const pairsFromSim =
        simResult.assignments.length > 0
          ? simResult.assignments
          : Array.isArray(apiData?.matchedLeadPairs)
          ? apiData.matchedLeadPairs
          : [];

      setAiSimulationReport(pairsFromSim);

      if (pairsFromSim.length === 0) {
        setActionToast(
          `Emparejamiento IA por ciudad (${effectiveCity}): 0 coincidencias encontradas. Registra prospectos y propiedades en ${effectiveCity} para generar cruces patrimoniales.`
        );
      } else {
        setActionToast(
          `Motor SIGI Match v4.8 (${effectiveCity}): se emparejaron ${pairsFromSim.length} prospectos con propiedades ubicadas exclusivamente en ${effectiveCity}.`
        );
      }
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

  if (currentUser && currentUser.role !== "asesor") {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center max-w-sm">
          <p className="text-sm font-extrabold text-[#0B1F3A]">
            Redirigiendo a tu panel autorizado...
          </p>
        </div>
      </div>
    );
  }

  const topCityMatch = strictCityAiPairs[0] || null;

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col">
      {/* Barra Superior Institucional (sin Sidebar izquierda) con logo Coldwell Banker SIGI MÉXICO INSTITUTIONAL HUB */}
      <Navbar />

      {/* Contenido Principal a ancho completo equilibrado */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-7 max-w-7xl w-full mx-auto">
        {/* Header Operativo con nombre real del asesor y ubicación real */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
              TERMINAL BROKER PRIVADO • SIGI v4.8 Intelligence
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
                Hola, {advisorDisplayName}
              </h1>
              <span className="px-3 py-1 rounded-full bg-[#0B1F3A] text-sky-300 text-xs font-extrabold">
                Asesor Certificado
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
              <p className="text-xs sm:text-sm text-slate-600">
                {`Resumen operativo patrimonial y prospectos en tiempo real para ${ubicacionReal}.`}
              </p>

              {/* Selector discreto de ciudad (respaldo cuando el navegador bloquea geolocalización o para ajuste manual) */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200/90 shadow-2xs">
                <Navigation className="w-3 h-3 text-[#10B981]" />
                <select
                  aria-label="Ubicación operativa del asesor"
                  value={
                    MEXICAN_ADVISOR_CITIES.includes(ubicacionReal)
                      ? ubicacionReal
                      : effectiveCity
                  }
                  onChange={(e) => void handleManualCityChange(e.target.value)}
                  className="text-[11px] font-extrabold text-[#0B1F3A] bg-transparent focus:outline-none cursor-pointer"
                >
                  {!MEXICAN_ADVISOR_CITIES.includes(ubicacionReal) &&
                    ubicacionReal !== "Detectando ubicación..." && (
                      <option value={ubicacionReal}>{ubicacionReal}</option>
                    )}
                  {MEXICAN_ADVISOR_CITIES.map((cityOption) => (
                    <option key={cityOption} value={cityOption}>
                      {cityOption}
                    </option>
                  ))}
                </select>
                {isDetectingGeo && (
                  <span className="text-[10px] text-slate-400">GPS...</span>
                )}
                {geoBlockedOrManual && !isDetectingGeo && (
                  <span className="text-[10px] font-semibold text-slate-400">
                    (Ciudad activa)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Botón "+ Agregar Prospecto" (un único símbolo +) */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenLeadModal}
              className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs sm:text-sm font-extrabold flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <span>+ Agregar Prospecto</span>
            </button>
          </div>
        </section>

        {actionToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {actionToast}
            </span>
            <button
              type="button"
              onClick={() => setActionToast(null)}
              className="text-emerald-700 hover:underline cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        {aiSimulationReport.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#0B1F3A] text-white border border-sky-400/30 shadow-md space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#10B981]" />
                Emparejamiento Estricto por Ciudad ({effectiveCity}) • SIGI Match
                v4.8
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
                    <span className="px-2 py-0.5 rounded-full bg-[#10B981] text-white text-[10px] font-extrabold">
                      {item.aiScore}% IA
                    </span>
                  </div>
                  <p className="text-[11px] text-sky-200 truncate mt-1">
                    → {item.assignedProperty}
                  </p>
                  <p className="text-[10px] text-slate-300 truncate mt-0.5">
                    Ciudad: {item.city || effectiveCity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4 Tarjetas KPI Superiores (100% datos reales desde 0) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* KPI 1: Prospectos Activos */}
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
                {activeLeadsKPI === 0
                  ? "Sin actividad previa"
                  : `${activeLeadsKPI} en cartera`}
              </span>
            </div>
          </div>

          {/* KPI 2: Coincidencias con IA (Emparejamiento estricto por ciudad) */}
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
                  {isSimulatingAi ? "Analizando..." : `Ciudad: ${effectiveCity}`}
                </span>
              </button>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-[#0B1F3A]">
                {aiMatchesKPI}
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

          {/* KPI 3: Visitas de Hoy */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">
                Visitas de Hoy
              </span>
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between gap-2">
              <span className="text-3xl font-extrabold text-[#0B1F3A]">
                {todayVisitsKPI}
              </span>
              <span className="text-[11px] font-bold text-slate-500 truncate">
                {todayVisitsKPI === 0
                  ? "Sin visitas agendadas"
                  : advisorRealVisits[0]?.scheduleLabel || "Visitas activas hoy"}
              </span>
            </div>
          </div>

          {/* KPI 4: Pendientes de Seguimiento */}
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
                {pendingFollowUpsKPI}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-extrabold">
                {pendingFollowUpsKPI === 0
                  ? "0 pendientes"
                  : `${pendingFollowUpsKPI} por atender`}
              </span>
            </div>
          </div>
        </section>

        {/* Bloque Central: Izquierda (Bandeja de Prospectos) + Derecha (Métricas Financieras y Coincidencias con IA por Ciudad) */}
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
                  Seguimiento en tiempo real conectado a public.leads y
                  public.profiles para {advisorDisplayName}
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

            {/* Tabla Omnicanal o Estado Vacío Limpio */}
            {filteredLeads.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 text-[#0B1F3A] flex items-center justify-center mx-auto">
                  <Inbox className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                    Tu Bandeja de Prospectos está vacía (0 registros)
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Aún no tienes prospectos registrados ni clientes vinculados a
                    tu cuenta. Usa el buscador superior para encontrar
                    Compradores o Propietarios registrados en Supabase, o
                    presiona{" "}
                    <strong className="text-[#0B1F3A]">
                      + Agregar Prospecto
                    </strong>
                    .
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenLeadModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer transition-colors"
                >
                  <span>+ Agregar Primer Prospecto</span>
                </button>
              </div>
            ) : (
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                {lead.city ? ` • ${lead.city}` : ""}
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
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const digits = lead.phone.replace(/\D/g, "");
                                const waPhone = digits.startsWith("52")
                                  ? digits
                                  : `52${digits || "5589201200"}`;
                                const text = `Hola ${lead.fullName}, te escribe ${advisorDisplayName} (Asesor Patrimonial Coldwell Banker México) respecto a tu interés en ${lead.interestProperty} (${lead.status}).`;
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
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0B1F3A] hover:bg-[#143159] text-white text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Contactar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPendingDeleteLead(lead)}
                              aria-label={`Eliminar prospecto ${lead.fullName}`}
                              title="Eliminar Prospecto"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Eliminar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Centro Derecha: Métricas Financieras (100% reales) + Módulo Coincidencias con IA por Ciudad */}
          <div className="lg:col-span-4 space-y-6">
            {/* Card Métricas Financieras */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                  Métricas Financieras (Tiempo Real)
                </h3>
                <TrendingUp className="w-4 h-4 text-[#10B981]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Comisiones Ganadas
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mt-1">
                    ${currentEarned.toLocaleString("es-MX")} MXN
                  </p>
                  <p className="text-[11px] text-emerald-700 font-semibold">
                    {currentEarned === 0 ? "Sin cierres aún" : "Acumulado real"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <p className="text-[10px] font-bold uppercase text-slate-400">
                    Operaciones
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mt-1">
                    {closedOperationsCount} Cerradas
                  </p>
                  <p className="text-[11px] text-sky-700 font-semibold">
                    {closedOperationsCount === 0
                      ? "En seguimiento"
                      : "Cierre notarial"}
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
                  (Actual: ${currentEarned.toLocaleString("es-MX")} MXN / Meta: $
                  {monthlyGoal.toLocaleString("es-MX")} MXN)
                </p>
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${goalPercentage}%` }}
                  />
                </div>
              </div>

              {editingGoal ? (
                <form
                  onSubmit={(e) => void handleSaveGoal(e)}
                  className="space-y-2 pt-2"
                >
                  <label className="block text-[11px] font-bold text-slate-700">
                    Nueva Meta Mensual (MXN):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="Ej. 220000"
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0B1F3A]"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-[#10B981] text-white text-xs font-bold cursor-pointer"
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

            {/* Card Módulo Coincidencias con IA (Emparejamiento Estricto por Ciudad) */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 block">
                    EMPAREJAMIENTO ESTRICTO POR CIUDAD
                  </span>
                  <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                    Coincidencias con IA ({effectiveCity})
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold">
                  {strictCityAiPairs.length} Match
                </span>
              </div>

              {strictCityAiPairs.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 text-center space-y-2">
                  <Sparkles className="w-5 h-5 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-[#0B1F3A]">
                    Sin coincidencias activas en {effectiveCity}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    El motor SIGI Match v4.8 cruza únicamente prospectos de tu
                    cartera y propiedades cuya ciudad coincida con{" "}
                    <strong className="text-[#0B1F3A]">{effectiveCity}</strong>.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topCityMatch && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200/80">
                      <div className="relative h-36 bg-[#0B1F3A]">
                        <img
                          src={topCityMatch.propertyImage}
                          alt={topCityMatch.propertyTitle}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-transparent to-black/30" />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-1 rounded-full bg-[#10B981] text-white text-[10px] font-extrabold uppercase tracking-wider">
                            MATCH EN {effectiveCity} ({topCityMatch.aiScore}% IA)
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 bg-[#F4F7FB] space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-extrabold text-[#0B1F3A] truncate">
                            {topCityMatch.propertyTitle}
                          </h4>
                          <span className="text-xs font-extrabold text-sky-700 shrink-0">
                            {topCityMatch.propertyPrice}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#0B1F3A] shrink-0" />
                          <span className="truncate">{topCityMatch.city}</span>
                        </p>
                        <p className="text-[11px] font-bold text-emerald-800 pt-1">
                          Prospecto compatible: {topCityMatch.leadName}
                        </p>
                      </div>
                    </div>
                  )}

                  {strictCityAiPairs.slice(1, 4).map((pair) => (
                    <div
                      key={pair.leadId}
                      className="p-3 rounded-xl bg-[#F4F7FB] border border-slate-200/80 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-extrabold text-[#0B1F3A] truncate">
                          {pair.leadName}
                        </p>
                        <p className="text-[11px] text-slate-600 truncate">
                          → {pair.assignedProperty}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0">
                        {pair.aiScore}% IA
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Parte Inferior: CATÁLOGO INSTITUCIONAL EN LA CIUDAD DEL ASESOR */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-sky-700 uppercase">
                CATÁLOGO INSTITUCIONAL • {effectiveCity.toUpperCase()}
              </p>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]">
                Propiedades Disponibles en {effectiveCity}
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Sincronizado con public.properties • Filtrado estricto por ciudad
            </span>
          </div>

          {cityMatchedProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
              <Building2 className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-sm font-extrabold text-[#0B1F3A]">
                Sin propiedades registradas en {effectiveCity}
              </p>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Cuando un Propietario dé de alta propiedades en{" "}
                <strong className="text-[#0B1F3A]">{effectiveCity}</strong>{" "}
                dentro de Supabase (public.properties), aparecerán
                automáticamente aquí para su emparejamiento con tu cartera.
              </p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4 min-h-[320px]">
              {cityMatchedProperties.map((item) => {
                const isExpanded = item.id === expandedCatalogId;
                if (isExpanded) {
                  return (
                    <div
                      key={item.id}
                      className="lg:flex-[2.8] relative rounded-3xl overflow-hidden shadow-lg bg-[#0B1F3A] min-h-[300px] flex flex-col justify-between p-5 sm:p-6 text-white transition-all duration-500"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#051122]/95 via-[#0B1F3A]/55 to-transparent" />

                      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-full bg-sky-500/90 text-white text-xs font-extrabold">
                          {item.status || "Activa"} • {item.folio}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold">
                          {item.aiMatchDisplay} Compatibilidad
                        </span>
                      </div>

                      <div className="relative z-10 w-full max-w-full overflow-hidden px-3.5 py-3 sm:px-4 sm:py-3.5 rounded-2xl bg-slate-950/45 backdrop-blur-xs border border-white/10 space-y-1.5">
                        <h3 className="text-base sm:text-lg lg:text-xl font-extrabold leading-snug max-w-full break-words line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base font-extrabold text-sky-300 leading-snug max-w-full break-words line-clamp-2">
                          {item.salePriceDisplay} - {item.location}
                        </p>
                        <p className="text-xs text-slate-200 max-w-full break-words line-clamp-2">
                          {item.constructionAreaDisplay} Const. •{" "}
                          {item.bedroomsDisplay} • {item.bathroomsDisplay}
                        </p>
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
                    className="lg:flex-1 relative rounded-3xl overflow-hidden shadow-md bg-[#0B1F3A] min-h-[200px] lg:min-h-[300px] flex flex-col justify-between p-4 sm:p-5 text-white cursor-pointer group hover:ring-2 hover:ring-sky-400 transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#051122]/95 via-[#0B1F3A]/60 to-transparent" />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold text-white">
                        {item.aiMatchDisplay} IA
                      </span>
                      <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="relative z-10 w-full max-w-full overflow-hidden px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-2xl bg-slate-950/50 backdrop-blur-xs border border-white/10 space-y-1">
                      <h4 className="text-base sm:text-lg lg:text-xl font-extrabold leading-snug max-w-full break-words line-clamp-2 text-white drop-shadow-sm">
                        {item.title}
                      </h4>
                      <p className="text-xs sm:text-sm font-extrabold text-sky-300 max-w-full break-words truncate">
                        {item.salePriceDisplay}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

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
                    Validación en tiempo real LFPDPPP &amp; Emparejamiento por
                    Ciudad ({effectiveCity})
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
                  placeholder="Ingresa el nombre completo del cliente"
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
                  placeholder="cliente@dominio.mx"
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

              {/* Ciudad del Prospecto */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ciudad / Zona de Operación
                </label>
                <input
                  type="text"
                  value={leadCity}
                  onChange={(e) => setLeadCity(e.target.value)}
                  placeholder={`Ej. ${effectiveCity}`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
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
                    placeholder={`Ej. Residencia en ${effectiveCity}`}
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
                    placeholder="Ej. $16,500,000 MXN"
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

      {/* Modal de Confirmación para Eliminar Prospecto */}
      {pendingDeleteLead && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-lead-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                    CONFIRMACIÓN DE ELIMINACIÓN
                  </span>
                  <h3
                    id="delete-lead-modal-title"
                    className="text-base sm:text-lg font-extrabold text-[#0B1F3A]"
                  >
                    ¿Eliminar este prospecto?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteLead(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/90 space-y-1">
              <p className="text-sm font-extrabold text-[#0B1F3A]">
                {pendingDeleteLead.fullName}
              </p>
              <p className="text-xs text-slate-600">
                {pendingDeleteLead.email} • {pendingDeleteLead.phone}
              </p>
              <p className="text-xs font-bold text-sky-700">
                {pendingDeleteLead.interestProperty} (
                {pendingDeleteLead.budgetDisplay})
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Esta acción eliminará el expediente del prospecto tanto de{" "}
              <strong className="text-[#0B1F3A]">
                Supabase (public.leads)
              </strong>{" "}
              como de tu Bandeja de Prospectos en tiempo real.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setPendingDeleteLead(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeletingLead}
                onClick={() => void handleConfirmDeleteLead()}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-extrabold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isDeletingLead ? "Eliminando..." : "Eliminar Prospecto"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
