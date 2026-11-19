"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShieldCheck,
  MapPin,
  Percent,
  MessageCircle,
  Phone,
  Copy,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Award,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  useSigiStore,
  SEED_DIRECTORY_ADVISORS,
  AssignedAdvisor,
  getInitials,
  formatMexicanPhoneDisplay,
} from "@/lib/store";
import { normalizeMexicanPhone } from "@/lib/validations";

const REGISTERED_ADVISOR_PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
];

export default function PropietarioAsesoresPage() {
  const router = useRouter();
  const {
    currentUser,
    guestAssignedAdvisor,
    users,
    properties,
    assignAdvisorToUser,
  } = useSigiStore();

  const [fallbackDashboardRole] = useState<"comprador" | "propietario">(() => {
    if (typeof window !== "undefined") {
      const saved = window.sessionStorage.getItem("sigi_active_dashboard_role");
      if (saved === "comprador" || saved === "propietario") {
        return saved;
      }
    }
    return "propietario";
  });

  useEffect(() => {
    if (
      currentUser &&
      currentUser.role !== "propietario" &&
      currentUser.role !== "comprador"
    ) {
      router.replace(`/${currentUser.role}` as never);
    }
  }, [currentUser, router]);

  const effectiveRole: "comprador" | "propietario" =
    currentUser?.role === "comprador" || currentUser?.role === "propietario"
      ? currentUser.role
      : fallbackDashboardRole;
  const isCompradorRole = effectiveRole === "comprador";
  const dashboardReturnHref = isCompradorRole ? "/comprador" : "/propietario";

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "todos" | "academia" | "registrados"
  >("todos");
  const [revealedPhones, setRevealedPhones] = useState<Record<string, boolean>>(
    {}
  );
  const [contactedAdvisorIds, setContactedAdvisorIds] = useState<
    Record<string, boolean>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Propiedades reales del propietario activo para prellenar mensaje de WhatsApp
  const ownerProperties = useMemo(() => {
    const email = (currentUser?.email || "").trim().toLowerCase();
    if (!email) return [];
    return properties.filter((p) => (p.ownerEmail || "").toLowerCase() === email);
  }, [properties, currentUser?.email]);

  // Combinar los 50 Asesores del Catálogo SIGI + Asesores adicionales registrados en public.profiles (role = 'asesor')
  const allAdvisors = useMemo<AssignedAdvisor[]>(() => {
    const usersByEmail = new Map(
      users
        .filter((u) => u.role === "asesor" && u.email)
        .map((u) => [u.email.toLowerCase(), u])
    );

    const seedEmails = new Set(
      SEED_DIRECTORY_ADVISORS.map((a) => a.email.toLowerCase())
    );

    const seedAdvisors: AssignedAdvisor[] = SEED_DIRECTORY_ADVISORS.map(
      (adv) => {
        const liveUser = usersByEmail.get(adv.email.toLowerCase());
        if (!liveUser) return adv;
        return {
          ...adv,
          fullName: liveUser.fullName || adv.fullName,
          phone: liveUser.phone
            ? formatMexicanPhoneDisplay(liveUser.phone)
            : adv.phone,
          avatarUrl: liveUser.avatarUrl || adv.avatarUrl,
          initials: liveUser.avatarInitials || adv.initials,
        };
      }
    );

    const extraRegisteredAdvisors: AssignedAdvisor[] = users
      .filter((u) => {
        const email = (u.email || "").toLowerCase();
        if (u.role !== "asesor" || !email || seedEmails.has(email)) {
          return false;
        }
        if (
          email === "asesor.premier@coldwellbanker.com.mx" &&
          currentUser?.email.toLowerCase() !== email
        ) {
          return false;
        }
        return true;
      })
      .map((u, idx) => ({
        id: `reg-${u.id}`,
        fullName: u.fullName,
        roleTitle:
          u.bio ||
          "Asesor Inmobiliario Registrado • Red Patrimonial SIGI Coldwell Banker",
        zone:
          u.city ||
          "Cobertura Nacional • CDMX / Monterrey / Querétaro / Riviera Maya",
        commissionRate: "4.5% Comisión de Intermediación",
        phone: formatMexicanPhoneDisplay(u.phone || "5541908200"),
        email: u.email,
        avatarUrl:
          u.avatarUrl ||
          REGISTERED_ADVISOR_PORTRAITS[
            idx % REGISTERED_ADVISOR_PORTRAITS.length
          ],
        initials: u.avatarInitials || getInitials(u.fullName),
        badge: "Asesor Registrado SIGI",
        responseTime: "7 min",
        source: "registrado",
      }));

    return [...extraRegisteredAdvisors, ...seedAdvisors];
  }, [users, currentUser?.email]);

  const filteredAdvisors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allAdvisors.filter((adv) => {
      if (categoryFilter === "academia" && adv.source !== "academia") {
        return false;
      }
      if (categoryFilter === "registrados" && adv.source !== "registrado") {
        return false;
      }
      if (!q) return true;
      return (
        adv.fullName.toLowerCase().includes(q) ||
        adv.zone.toLowerCase().includes(q) ||
        adv.roleTitle.toLowerCase().includes(q)
      );
    });
  }, [allAdvisors, searchTerm, categoryFilter]);

  const handleOpenWhatsApp = (advisor: AssignedAdvisor) => {
    void assignAdvisorToUser(advisor);
    setContactedAdvisorIds((prev) => ({ ...prev, [advisor.id]: true }));
    const digits = normalizeMexicanPhone(advisor.phone) || "5589201200";
    const userName =
      currentUser?.fullName ||
      (isCompradorRole ? "Comprador SIGI" : "Propietario SIGI");
    const primaryAsset = ownerProperties[0];
    const assetContext = primaryAsset
      ? `mi propiedad "${primaryAsset.title}" (Folio: ${primaryAsset.folio})`
      : "mi portafolio patrimonial";

    const msg = isCompradorRole
      ? `Hola ${advisor.fullName}, soy ${userName} desde SIGI Coldwell Banker México. Solicito asesoría patrimonial personalizada para adquisición o inversión residencial en la zona ${advisor.zone}.`
      : `Hola ${advisor.fullName}, soy ${userName} desde SIGI Coldwell Banker México. Me interesa conversar contigo para gestionar la venta/renta exclusiva de ${assetContext} en la zona ${advisor.zone}.`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/52${digits}?text=${encodeURIComponent(msg)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleToggleRevealPhone = (advisorId: string) => {
    setRevealedPhones((prev) => ({
      ...prev,
      [advisorId]: !prev[advisorId],
    }));
  };

  const handleCopyPhone = async (advisorId: string, phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(advisorId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  const handleAssignVipAdvisor = async (advisor: AssignedAdvisor) => {
    await assignAdvisorToUser(advisor);
    setContactedAdvisorIds((prev) => ({ ...prev, [advisor.id]: true }));
    if (isCompradorRole) {
      setStatusToast(
        `Solicitud de asesoría enviada con éxito a ${advisor.fullName} (${advisor.zone}). Se registró una notificación real en public.notifications para el asesor y se confirmó en tu cuenta.`
      );
    } else {
      setStatusToast(
        `${advisor.fullName} ha sido vinculado como tu Asesor VIP en tu Dashboard de Propietario y se generó una notificación en tu campana.`
      );
    }
  };

  const activeAssignedAdvisor =
    currentUser?.assignedAdvisor || guestAssignedAdvisor || null;
  const currentAssignedId = activeAssignedAdvisor?.id;

  if (
    currentUser &&
    currentUser.role !== "propietario" &&
    currentUser.role !== "comprador"
  ) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 text-center max-w-sm">
          <p className="text-sm font-extrabold text-[#0B1F3A]">
            Redirigiendo a tu panel autorizado...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900 flex flex-col">
      {/* Barra Superior Institucional con logo, botón regresar, campana y perfil */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-7 space-y-6">
        {/* Encabezado del Directorio */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-extrabold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              DIRECTORIO DE CORRETAJE PATRIMONIAL • COLDWELL BANKER MÉXICO
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
              Contactar a un Asesor Certificado
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Selecciona y vincula a tu Asesor VIP entre los especialistas de la{" "}
              <strong className="text-[#0B1F3A]">
                Academia Coldwell Banker México
              </strong>{" "}
              y los asesores registrados en tiempo real en la plataforma.
            </p>
          </div>

          <Link
            href={dashboardReturnHref as never}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs sm:text-sm font-extrabold shadow-md shrink-0 transition-colors"
          >
            <span>← Regresar a mi Dashboard</span>
          </Link>
        </section>

        {statusToast && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {statusToast}
            </span>
            <div className="flex items-center gap-3">
              <Link
                href={dashboardReturnHref as never}
                className="px-3 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-xs font-extrabold hover:bg-[#143159]"
              >
                Ver en mi Dashboard →
              </Link>
              <button
                type="button"
                onClick={() => setStatusToast(null)}
                className="text-emerald-700 hover:underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Buscador y Filtros por Categoría */}
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar asesor por nombre, especialidad o zona (ej. Polanco, Monterrey, Querétaro)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F4F7FB] border border-slate-200 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-[#0B1F3A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "todos", label: `Todos (${allAdvisors.length})` },
                {
                  id: "academia",
                  label: "Academia Coldwell Banker",
                },
                {
                  id: "registrados",
                  label: "Asesores Registrados",
                },
              ] as const
            ).map((tab) => {
              const active = categoryFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategoryFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
                    active
                      ? "bg-[#0B1F3A] text-white shadow-xs"
                      : "bg-[#F4F7FB] text-slate-600 hover:text-[#0B1F3A] border border-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Grid de Tarjetas de Asesores */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvisors.map((advisor) => {
            const isPhoneRevealed = Boolean(revealedPhones[advisor.id]);
            const isAssigned =
              Boolean(contactedAdvisorIds[advisor.id]) ||
              currentAssignedId === advisor.id ||
              activeAssignedAdvisor?.email.toLowerCase() ===
                advisor.email.toLowerCase();

            return (
              <div
                key={advisor.id}
                className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between space-y-5 transition-all ${
                  isAssigned
                    ? "border-emerald-500 ring-2 ring-emerald-500/15"
                    : "border-slate-200/80 hover:border-[#0B1F3A]/40"
                }`}
              >
                <div className="space-y-4">
                  {/* Cabecera con Foto de Perfil + Insignia Oficial */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      {advisor.avatarUrl ? (
                        <img
                          src={advisor.avatarUrl}
                          alt={advisor.fullName}
                          className="w-15 h-15 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded-2xl bg-[#0B1F3A] text-white text-base font-extrabold flex items-center justify-center shrink-0">
                          {advisor.initials}
                        </div>
                      )}

                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            advisor.source === "academia"
                              ? "bg-[#0B1F3A] text-sky-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          <Award className="w-3 h-3" />
                          {advisor.badge || "Academia Coldwell Banker"}
                        </span>

                        <h2 className="text-base font-extrabold text-[#0B1F3A] mt-1">
                          {advisor.fullName}
                        </h2>
                        <p className="text-xs text-slate-600 leading-snug mt-0.5">
                          {advisor.roleTitle}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Zona de Cobertura y Porcentaje de Comisión */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-[#0B1F3A]">Cobertura:</strong>{" "}
                        {advisor.zone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Percent className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong className="text-[#0B1F3A]">Esquema:</strong>{" "}
                        {advisor.commissionRate}
                      </span>
                    </div>
                  </div>

                  {/* Revelador de número telefónico al hacer clic en el ícono de Teléfono */}
                  {isPhoneRevealed && (
                    <div className="p-3 rounded-2xl bg-sky-50/90 border border-sky-200 flex items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-sky-800 block">
                          Línea Directa Verificada
                        </span>
                        <a
                          href={`tel:${advisor.phone.replace(/\s+/g, "")}`}
                          className="text-sm font-extrabold text-[#0B1F3A] hover:underline"
                        >
                          {advisor.phone}
                        </a>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            void handleCopyPhone(advisor.id, advisor.phone)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-sky-200 text-[11px] font-bold text-[#0B1F3A] hover:bg-sky-100 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>
                            {copiedId === advisor.id ? "Copiado" : "Copiar"}
                          </span>
                        </button>
                        <a
                          href={`tel:${advisor.phone.replace(/\s+/g, "")}`}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0B1F3A] text-white text-[11px] font-bold hover:bg-[#143159]"
                        >
                          Llamar
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de Acción: WhatsApp, Teléfono y Vincular como Asesor VIP */}
                <div className="space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Botón WhatsApp verde clicable */}
                    <button
                      type="button"
                      onClick={() => handleOpenWhatsApp(advisor)}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    {/* Botón Ícono de Teléfono clicable que revela el número */}
                    <button
                      type="button"
                      onClick={() => handleToggleRevealPhone(advisor.id)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isPhoneRevealed
                          ? "bg-sky-50 border-sky-300 text-sky-900"
                          : "bg-[#F4F7FB] border-slate-200 hover:border-[#0B1F3A] text-[#0B1F3A]"
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>
                        {isPhoneRevealed ? "Ocultar Teléfono" : "Ver Teléfono"}
                      </span>
                    </button>
                  </div>

                  {/* Botón Solicitar Asesoría / Contactar (Comprador) o Vincular como mi Asesor VIP (Propietario) */}
                  <button
                    type="button"
                    onClick={() => void handleAssignVipAdvisor(advisor)}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isAssigned
                        ? "bg-emerald-50 border border-emerald-300 text-emerald-800"
                        : "bg-[#0B1F3A] hover:bg-[#143159] text-white shadow-sm"
                    }`}
                  >
                    {isAssigned ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          {isCompradorRole
                            ? "Asesoría Solicitada • Asesor Notificado"
                            : "Asesor VIP Vinculado en tu Dashboard"}
                        </span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-4 h-4 text-sky-300" />
                        <span>
                          {isCompradorRole
                            ? "Solicitar Asesoría / Contactar"
                            : "Vincular como mi Asesor VIP"}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}
