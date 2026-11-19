"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Bell,
  ChevronDown,
  ShieldCheck,
  LogOut,
  UserPen,
  CheckCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Upload,
  User,
  Mail,
  Smartphone,
  FileText,
  Users,
  MessageCircle,
  Phone,
  UserPlus,
  IdCard,
  Heart,
  MapPin,
  Trash2,
  ExternalLink,
} from "lucide-react";
import {
  useSigiStore,
  UserRole,
  validatePersonInImage,
  getInitials,
  formatMexicanPhoneDisplay,
  isLegacySeedLead,
  syncWithSupabase,
  normalizeTextNoAccents,
} from "@/lib/store";
import {
  MEXICAN_PHONE_REGEX,
  normalizeMexicanPhone,
  containsMaliciousPayload,
  MAX_IMAGE_SIZE_BYTES,
  ALLOWED_IMAGE_EXTENSIONS,
  ALLOWED_IMAGE_MIME_TYPES,
} from "@/lib/validations";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface AdvisorDirectoryResult {
  key: string;
  fullName: string;
  role: "comprador" | "propietario";
  email: string;
  phone: string;
  interestProperty: string;
  budgetDisplay: string;
  city?: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    currentUser,
    users,
    leads,
    properties,
    favoritePropertyIds,
    removeFavoriteProperty,
    setSelectedBuyerPropertyId,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    updateUserProfile,
    addLead,
    addNotification,
    logout,
  } = useSigiStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);

  // Buscador en tiempo real exclusivo para el rol Asesor
  const [advisorSearchOpen, setAdvisorSearchOpen] = useState(false);
  const [remoteSearchResults, setRemoteSearchResults] = useState<
    AdvisorDirectoryResult[]
  >([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);
  const [addedToTrayKeys, setAddedToTrayKeys] = useState<
    Record<string, boolean>
  >({});
  const [searchFeedbackToast, setSearchFeedbackToast] = useState<string | null>(
    null
  );

  // Estados del modal "Editar Perfil"
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | undefined>(
    undefined
  );
  const [profileAvatarMeta, setProfileAvatarMeta] = useState<string | null>(
    null
  );
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  // Validación de Identidad Obligatoria (ID Oficial: INE o Pasaporte) para el Asesor
  const [officialIdUrl, setOfficialIdUrl] = useState<string | undefined>(
    undefined
  );
  const [officialIdMeta, setOfficialIdMeta] = useState<string | null>(null);
  const [isUploadingOfficialId, setIsUploadingOfficialId] = useState(false);
  const [officialIdError, setOfficialIdError] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (
        searchDropdownRef.current &&
        !searchDropdownRef.current.contains(e.target as Node)
      ) {
        setAdvisorSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/comprador") {
      window.sessionStorage.setItem("sigi_active_dashboard_role", "comprador");
    } else if (pathname === "/propietario") {
      window.sessionStorage.setItem(
        "sigi_active_dashboard_role",
        "propietario"
      );
    } else if (pathname === "/asesor") {
      window.sessionStorage.setItem("sigi_active_dashboard_role", "asesor");
    }
  }, [pathname]);

  const isAsesoresDirectoryView = pathname === "/propietario/asesores";

  const savedSessionRole: UserRole | null =
    typeof window !== "undefined"
      ? (window.sessionStorage.getItem(
          "sigi_active_dashboard_role"
        ) as UserRole | null)
      : null;

  const activeRole: UserRole =
    pathname === "/asesor" || pathname?.startsWith("/asesor/")
      ? "asesor"
      : pathname === "/propietario"
      ? "propietario"
      : pathname === "/comprador" || pathname?.startsWith("/comprador/")
      ? "comprador"
      : savedSessionRole ||
        currentUser?.role ||
        (isAsesoresDirectoryView ? "propietario" : "comprador");

  const isPropietarioView = activeRole === "propietario";
  const isAsesorView = activeRole === "asesor";

  const favoriteProperties = useMemo(() => {
    const favIds = Array.isArray(favoritePropertyIds)
      ? favoritePropertyIds
      : [];
    return properties.filter((p) => favIds.includes(p.id));
  }, [properties, favoritePropertyIds]);

  const activeRoleLabel =
    activeRole === "asesor"
      ? "Asesor Certificado"
      : activeRole === "propietario"
      ? "Propietario / Inversionista"
      : "Comprador / Inversionista";

  const displayFullName = currentUser?.fullName || "Usuario SIGI";
  const displayInitials =
    currentUser?.avatarInitials || getInitials(displayFullName);

  // Sincronización periódica en tiempo real de public.notifications (filtrado por recipient_email = currentUser.email)
  useEffect(() => {
    const email = (currentUser?.email || "").trim().toLowerCase();
    if (!email || !isSupabaseConfigured) return;

    const pollNotifications = async () => {
      try {
        await supabase
          .from("notifications")
          .select("*")
          .ilike("recipient_email", email)
          .order("created_at", { ascending: false });
      } catch {
        // Fallback silencioso
      }
      await syncWithSupabase();
    };

    void pollNotifications();
    const intervalId = window.setInterval(() => {
      void pollNotifications();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [currentUser?.email]);

  // Filtrar notificaciones 100% reales del usuario autenticado (recipient_email = currentUser.email)
  const userNotifications = useMemo(() => {
    const email = (currentUser?.email || "").trim().toLowerCase();
    if (!email) return [];
    return notifications.filter((n) => n.userEmail.toLowerCase() === email);
  }, [notifications, currentUser?.email]);

  const unreadCount = useMemo(
    () => userNotifications.filter((n) => !n.read).length,
    [userNotifications]
  );

  // Búsqueda en tiempo real en Supabase (public.profiles con role IN ('comprador', 'propietario') y public.leads)
  useEffect(() => {
    if (!isAsesorView || !isSupabaseConfigured) return;
    const q = searchQuery.trim();
    if (!q) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setIsSearchingRemote(true);
      try {
        const [profilesRes, leadsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("*")
            .in("role", ["comprador", "propietario"])
            .ilike("full_name", `%${q}%`)
            .limit(15),
          supabase
            .from("leads")
            .select("*")
            .ilike("full_name", `%${q}%`)
            .limit(15),
        ]);

        if (cancelled) return;

        const fetched: AdvisorDirectoryResult[] = [];
        const seenKeys = new Set<string>();

        if (!profilesRes.error && Array.isArray(profilesRes.data)) {
          for (const row of profilesRes.data as Array<Record<string, unknown>>) {
            const roleRaw = String(row.role || "comprador").toLowerCase();
            if (roleRaw !== "comprador" && roleRaw !== "propietario") continue;
            const email = String(row.email || "").trim().toLowerCase();
            const fullName = String(row.full_name || "").trim();
            if (!fullName) continue;
            const key = email || fullName.toLowerCase();
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            fetched.push({
              key,
              fullName,
              role: roleRaw as "comprador" | "propietario",
              email: email || "sin-correo@sigi.mx",
              phone: formatMexicanPhoneDisplay(String(row.phone || "")),
              interestProperty:
                roleRaw === "propietario"
                  ? "Consignación Patrimonial Exclusiva"
                  : "Adquisición Residencial SIGI",
              budgetDisplay:
                roleRaw === "propietario"
                  ? "Captación Directa"
                  : "Por perfilar con IA",
              city: row.city ? String(row.city) : undefined,
            });
          }
        }

        if (!leadsRes.error && Array.isArray(leadsRes.data)) {
          for (const row of leadsRes.data as Array<Record<string, unknown>>) {
            const id = String(row.id || "");
            const email = String(row.email || "").trim().toLowerCase();
            const fullName = String(row.full_name || "").trim();
            if (!fullName || isLegacySeedLead({ id, email, fullName })) {
              continue;
            }
            const key = email || fullName.toLowerCase();
            if (seenKeys.has(key)) continue;
            seenKeys.add(key);

            const roleRaw = String(
              row.lead_category || "comprador"
            ).toLowerCase();
            const role: "comprador" | "propietario" =
              roleRaw === "propietario" ? "propietario" : "comprador";

            fetched.push({
              key,
              fullName,
              role,
              email: email || "sin-correo@sigi.mx",
              phone: formatMexicanPhoneDisplay(String(row.phone || "")),
              interestProperty: String(
                row.interest_property || "Interés Patrimonial SIGI"
              ),
              budgetDisplay: String(
                row.budget_display || "Presupuesto por confirmar"
              ),
              city: row.city ? String(row.city) : undefined,
            });
          }
        }

        setRemoteSearchResults(fetched);
      } catch {
        // Fallback a los datos sincronizados en el store
      } finally {
        if (!cancelled) {
          setIsSearchingRemote(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchQuery, isAsesorView]);

  // Combinar resultados en memoria (public.profiles + public.leads) con resultados remotos
  const advisorDirectoryMatches = useMemo<AdvisorDirectoryResult[]>(() => {
    if (!isAsesorView) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const combined: AdvisorDirectoryResult[] = [];
    const seen = new Set<string>();

    for (const item of remoteSearchResults) {
      if (!seen.has(item.key)) {
        seen.add(item.key);
        combined.push(item);
      }
    }

    for (const u of users) {
      if (u.role !== "comprador" && u.role !== "propietario") continue;
      const matches =
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q);
      if (!matches) continue;

      const key = u.email.toLowerCase() || u.fullName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      combined.push({
        key,
        fullName: u.fullName,
        role: u.role,
        email: u.email,
        phone: formatMexicanPhoneDisplay(u.phone || ""),
        interestProperty:
          u.role === "propietario"
            ? "Consignación Patrimonial Exclusiva"
            : "Adquisición Residencial SIGI",
        budgetDisplay:
          u.role === "propietario"
            ? "Captación Directa"
            : "Por perfilar con IA",
        city: u.city,
      });
    }

    for (const l of leads) {
      if (isLegacySeedLead(l)) continue;
      const matches =
        l.fullName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.interestProperty.toLowerCase().includes(q);
      if (!matches) continue;

      const key = l.email.toLowerCase() || l.fullName.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const role: "comprador" | "propietario" =
        l.role === "propietario" ? "propietario" : "comprador";

      combined.push({
        key,
        fullName: l.fullName,
        role,
        email: l.email,
        phone: formatMexicanPhoneDisplay(l.phone || ""),
        interestProperty: l.interestProperty || "Interés Patrimonial SIGI",
        budgetDisplay: l.budgetDisplay || "Presupuesto por confirmar",
        city: l.city,
      });
    }

    return combined;
  }, [isAsesorView, searchQuery, remoteSearchResults, users, leads]);

  // Determinar qué prospectos ya están en la Bandeja del asesor activo
  const advisorTrayEmails = useMemo(() => {
    const activeEmail = (currentUser?.email || "").trim().toLowerCase();
    if (!activeEmail) return new Set<string>();
    return new Set(
      leads
        .filter(
          (l) =>
            !isLegacySeedLead(l) &&
            (l.advisorEmail || "").toLowerCase() === activeEmail
        )
        .map((l) => l.email.toLowerCase())
    );
  }, [leads, currentUser?.email]);

  const handleContactDirectoryWhatsApp = (item: AdvisorDirectoryResult) => {
    const digits = normalizeMexicanPhone(item.phone) || "5589201200";
    const advisorName = currentUser?.fullName || "Asesor Certificado";
    const text = `Hola ${item.fullName}, te saluda ${advisorName}, Asesor Patrimonial de Coldwell Banker México (SIGI). Me pongo en contacto contigo para brindarte atención personalizada como ${
      item.role === "propietario" ? "Propietario" : "Comprador"
    }.`;

    if (typeof window !== "undefined") {
      window.open(
        `https://wa.me/52${digits}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleCallDirectoryClient = (item: AdvisorDirectoryResult) => {
    const digits = normalizeMexicanPhone(item.phone) || "5589201200";
    if (typeof window !== "undefined") {
      window.location.href = `tel:+52${digits}`;
    }
  };

  const handleAddDirectoryToProspects = async (
    item: AdvisorDirectoryResult
  ) => {
    const cleanPhone = normalizeMexicanPhone(item.phone) || "5589201200";
    const res = await addLead({
      fullName: item.fullName,
      email: item.email,
      phone: cleanPhone,
      interestProperty:
        item.interestProperty ||
        (item.role === "propietario"
          ? "Consignación Patrimonial Exclusiva"
          : "Adquisición Residencial SIGI"),
      budgetDisplay:
        item.budgetDisplay ||
        (item.role === "propietario"
          ? "Exclusiva Captación"
          : "$18,500,000 MXN"),
      role: item.role,
      profileType:
        item.role === "propietario"
          ? "Propietario / Consignatario"
          : "Comprador / Inversionista",
      status: "Nuevo contacto",
      city: item.city || currentUser?.city || "Querétaro",
      advisorEmail: currentUser?.email,
      privacyAccepted: true,
    });

    if (res.success) {
      setAddedToTrayKeys((prev) => ({ ...prev, [item.key]: true }));
      setSearchFeedbackToast(
        `${item.fullName} (${
          item.role === "propietario" ? "Propietario" : "Comprador"
        }) fue agregado a tu Bandeja de Prospectos.`
      );
      if (currentUser?.email) {
        await addNotification({
          userEmail: currentUser.email,
          recipientEmail: currentUser.email,
          title: `Nuevo Prospecto Vinculado • ${item.fullName}`,
          message: `Agregaste a ${item.fullName} (${
            item.role === "propietario" ? "Propietario" : "Comprador"
          } • ${item.email}) desde el buscador global a tu Bandeja de Prospectos.`,
          category: "asesor",
          href: "/asesor",
        });
      }
      setTimeout(() => setSearchFeedbackToast(null), 4500);
    } else {
      setSearchFeedbackToast(
        res.error || "El cliente ya se encuentra en tu Bandeja de Prospectos."
      );
      setTimeout(() => setSearchFeedbackToast(null), 4500);
    }
  };

  const handleOpenEditModal = () => {
    setMenuOpen(false);
    setFormError(null);
    setPhotoError(null);
    setOfficialIdError(null);
    setSaveSuccessMsg(null);
    setProfileAvatarMeta(null);
    setOfficialIdMeta(null);

    setProfileName(currentUser?.fullName || "");
    const rawDigits = normalizeMexicanPhone(currentUser?.phone || "");
    setProfilePhone(rawDigits || currentUser?.phone || "");
    setProfileEmail(currentUser?.email || "");
    setProfileBio(currentUser?.bio || "");
    setProfileAvatarUrl(currentUser?.avatarUrl);
    // Exigir fotografía vigente de ID Oficial (INE o Pasaporte) al editar datos personales del asesor
    setOfficialIdUrl(undefined);
    setEditModalOpen(true);
  };

  const handleProfilePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);
    setProfileAvatarMeta(null);
    setIsValidatingPhoto(true);

    // Doble validación obligatoria: 1) <= 5MB y .jpg/.png/.webp, 2) Detección de persona real
    const personCheck = await validatePersonInImage(file);
    if (!personCheck.valid) {
      setIsValidatingPhoto(false);
      setPhotoError(
        personCheck.error ||
          "No se detectó una persona en la imagen. Sube una selfie o foto casual donde aparezcas tú (máx. 5 MB)."
      );
      e.target.value = "";
      return;
    }

    // Subir imagen optimizada al bucket 'property-media' vía /api/upload
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setIsValidatingPhoto(false);
        setPhotoError(
          data.error || "No fue posible procesar la fotografía de perfil."
        );
        return;
      }

      setProfileAvatarUrl(data.publicUrl);
      const kb = data.size
        ? (data.size / 1024).toFixed(1)
        : (file.size / 1024).toFixed(1);
      setProfileAvatarMeta(
        `Persona verificada • Optimizada a WebP (${kb} KB)`
      );
      setIsValidatingPhoto(false);
    } catch {
      setIsValidatingPhoto(false);
      setPhotoError("Error de conexión al subir la fotografía de perfil.");
    }
  };

  const handleOfficialIdChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOfficialIdError(null);
    setOfficialIdMeta(null);

    if (file.size === 0) {
      setOfficialIdError("Selecciona un archivo de imagen válido para tu ID Oficial.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setOfficialIdError(
        `El archivo de Identificación Oficial pesa ${sizeMB} MB y excede el límite máximo de 5 MB.`
      );
      e.target.value = "";
      return;
    }

    const lowerName = file.name.toLowerCase();
    const validExt = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );
    const validMime = ALLOWED_IMAGE_MIME_TYPES.includes(
      file.type.toLowerCase() as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
    );

    if (!validExt || !validMime) {
      setOfficialIdError(
        "Formato no permitido. Sube tu Identificación Oficial (INE o Pasaporte) en formato .jpg, .png o .webp (máx. 5 MB)."
      );
      e.target.value = "";
      return;
    }

    setIsUploadingOfficialId(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setIsUploadingOfficialId(false);
        setOfficialIdError(
          data.error ||
            "No fue posible subir la fotografía de tu Identificación Oficial."
        );
        return;
      }

      setOfficialIdUrl(data.publicUrl);
      const kb = data.size
        ? (data.size / 1024).toFixed(1)
        : (file.size / 1024).toFixed(1);
      setOfficialIdMeta(
        `ID Oficial (INE / Pasaporte) verificado y cifrado (${kb} KB)`
      );
      setIsUploadingOfficialId(false);
    } catch {
      setIsUploadingOfficialId(false);
      setOfficialIdError(
        "Error de conexión al subir tu Identificación Oficial (INE o Pasaporte)."
      );
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaveSuccessMsg(null);

    const cleanName = profileName.trim();
    const cleanEmail = profileEmail.trim().toLowerCase();
    const cleanPhone = profilePhone.trim();

    if (cleanName.length < 3) {
      setFormError("El Nombre completo debe contener al menos 3 caracteres.");
      return;
    }

    const normalizedDigits = normalizeMexicanPhone(cleanPhone);
    if (
      !MEXICAN_PHONE_REGEX.test(cleanPhone) ||
      !/^\d{10}$/.test(normalizedDigits)
    ) {
      setFormError(
        "Ingresa un número de teléfono mexicano válido de 10 dígitos (+52)."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setFormError("Ingresa un formato de Correo electrónico válido.");
      return;
    }

    if (
      containsMaliciousPayload(cleanName) ||
      containsMaliciousPayload(cleanEmail) ||
      containsMaliciousPayload(profileBio)
    ) {
      setFormError(
        "Se detectaron caracteres no permitidos (XSS/SQLi) en los campos."
      );
      return;
    }

    // Validación de Identidad Obligatoria (ID Oficial: INE o Pasaporte) para el Asesor
    if (activeRole === "asesor" && !officialIdUrl) {
      setFormError(
        "Validación de Identidad Obligatoria: Para guardar cualquier cambio en tus datos personales, debes subir una fotografía vigente de tu ID o Identificación Oficial (INE o Pasaporte) (.jpg, .png o .webp, máx. 5 MB)."
      );
      return;
    }

    setIsSavingProfile(true);
    const result = await updateUserProfile({
      fullName: cleanName,
      phone: normalizedDigits,
      email: cleanEmail,
      bio: profileBio.trim(),
      avatarUrl: profileAvatarUrl,
      officialIdUrl: officialIdUrl || currentUser?.officialIdUrl,
      idVerified:
        activeRole === "asesor" ? true : currentUser?.idVerified ?? false,
    });
    setIsSavingProfile(false);

    if (!result.success) {
      setFormError(
        result.error || "No fue posible actualizar tu perfil en Supabase."
      );
      return;
    }

    setSaveSuccessMsg(
      activeRole === "asesor"
        ? "Perfil e Identificación Oficial (id_verified = true) guardados exitosamente en public.profiles (Supabase)."
        : "Perfil actualizado exitosamente en public.profiles (Supabase) y sincronizado en SIGI."
    );
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    router.push("/login" as never);
  };

  const homeHref =
    activeRole === "asesor"
      ? "/asesor"
      : activeRole === "propietario"
      ? "/propietario"
      : "/comprador";

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Izquierda: Logotipo Oficial Coldwell Banker SIGI MÉXICO INSTITUTIONAL HUB */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={homeHref as never}
              className="flex items-center gap-3 group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#132d54] transition-colors">
                <Building2 className="w-5 h-5 text-sky-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-extrabold tracking-[0.14em] text-[#0B1F3A] uppercase leading-tight">
                  COLDWELL BANKER SIGI
                </span>
                <span className="text-[10px] font-bold tracking-[0.12em] text-sky-700 uppercase mt-0.5">
                  MÉXICO INSTITUTIONAL HUB
                </span>
              </div>
            </Link>

            {isPropietarioView && !isAsesoresDirectoryView && (
              <span className="hidden xl:inline-flex items-center gap-1.5 ml-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Patrimonio Auditado NOM-247
              </span>
            )}
          </div>

          {/* Buscador central: Funcional en tiempo real para Asesor (con dropdown de Compradores y Propietarios) y para Comprador */}
          {!isPropietarioView && (
            <div
              ref={searchDropdownRef}
              className="flex items-center flex-1 min-w-0 max-w-xs sm:max-w-sm lg:max-w-md mx-2 relative"
            >
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => {
                    if (isAsesorView) setAdvisorSearchOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.stopPropagation();
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (isAsesorView) {
                        setAdvisorSearchOpen(true);
                        return;
                      }

                      const q = normalizeTextNoAccents(searchQuery.trim());
                      if (q.length > 0) {
                        const firstMatch = properties.find((prop) => {
                          const searchable = normalizeTextNoAccents(
                            `${prop.title} ${prop.location} ${prop.zone || ""} ${
                              prop.folio
                            } ${prop.typology || ""} ${prop.advisorName || ""}`
                          );
                          return searchable.includes(q);
                        });
                        if (firstMatch) {
                          setSelectedBuyerPropertyId(firstMatch.id);
                        }
                      }

                      setMenuOpen(false);
                      setNotifOpen(false);
                      setAdvisorSearchOpen(false);

                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                          "sigi_scroll_to_carousel",
                          "1"
                        );
                        window.dispatchEvent(
                          new CustomEvent("sigi-scroll-to-carousel")
                        );
                      }

                      if (pathname !== "/comprador") {
                        router.push("/comprador" as never);
                      }
                    }
                  }}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (isAsesorView) setAdvisorSearchOpen(true);
                  }}
                  placeholder={
                    isAsesorView
                      ? "Filtrar propiedades, contratos o clientes HNWI..."
                      : "Buscar residencia, folio o asesor..."
                  }
                  aria-label={
                    isAsesorView
                      ? "Filtrar propiedades, contratos o clientes HNWI..."
                      : "Buscar residencia, folio o asesor"
                  }
                  className="w-full pl-10 pr-8 py-2 rounded-full bg-slate-100/90 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setAdvisorSearchOpen(false);
                    }}
                    aria-label="Limpiar búsqueda"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0B1F3A] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown de Resultados en Tiempo Real para el Asesor (Clientes Compradores y Propietarios en Supabase) */}
              {isAsesorView &&
                advisorSearchOpen &&
                searchQuery.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-3.5 z-50 max-h-96 overflow-y-auto space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B1F3A]">
                        Padrón en Tiempo Real • Compradores &amp; Propietarios
                      </span>
                      <span className="text-[11px] font-bold text-sky-700">
                        {isSearchingRemote
                          ? "Buscando en Supabase..."
                          : `${advisorDirectoryMatches.length} resultados`}
                      </span>
                    </div>

                    {searchFeedbackToast && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{searchFeedbackToast}</span>
                      </div>
                    )}

                    {advisorDirectoryMatches.length === 0 ? (
                      <div className="py-5 px-4 rounded-xl bg-[#F4F7FB] border border-slate-200/70 text-center">
                        <p className="text-xs font-bold text-[#0B1F3A]">
                          No se encontraron Clientes ni Propietarios con &ldquo;
                          {searchQuery.trim()}&rdquo;
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Búsqueda conectada a public.profiles (comprador /
                          propietario) y public.leads en Supabase.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {advisorDirectoryMatches.map((item) => {
                          const isAlreadyInTray =
                            Boolean(addedToTrayKeys[item.key]) ||
                            advisorTrayEmails.has(item.email.toLowerCase());

                          return (
                            <div
                              key={item.key}
                              className="p-3 rounded-xl bg-[#F4F7FB] hover:bg-slate-100/80 border border-slate-200/80 transition-colors space-y-2.5"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-xl bg-[#0B1F3A] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                                    {getInitials(item.fullName)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-xs font-extrabold text-[#0B1F3A] truncate">
                                        {item.fullName}
                                      </p>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                          item.role === "propietario"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-sky-100 text-sky-800"
                                        }`}
                                      >
                                        {item.role === "propietario"
                                          ? "Propietario"
                                          : "Comprador"}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-600 truncate">
                                      {item.email} •{" "}
                                      {item.phone || "Sin teléfono"}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleContactDirectoryWhatsApp(item)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#10B981] hover:bg-emerald-600 text-white text-[11px] font-extrabold cursor-pointer transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Contactar por WhatsApp</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCallDirectoryClient(item)
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-[#0B1F3A] border border-slate-200 text-[11px] font-extrabold cursor-pointer transition-colors"
                                >
                                  <Phone className="w-3.5 h-3.5 text-[#0B1F3A]" />
                                  <span>Llamar</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={isAlreadyInTray}
                                  onClick={() =>
                                    void handleAddDirectoryToProspects(item)
                                  }
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-colors ${
                                    isAlreadyInTray
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default"
                                      : "bg-[#0B1F3A] hover:bg-[#143159] text-white cursor-pointer"
                                  }`}
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>
                                    {isAlreadyInTray
                                      ? "En mi Bandeja ✓"
                                      : "Agregar a mi Bandeja de Prospectos"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* Derecha: Enlaces de navegación + Campana de Notificaciones + Perfil con Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isPropietarioView ? (
                <>
                  <Link
                    href={"/propietario" as never}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                          "sigi_active_dashboard_role",
                          "propietario"
                        );
                      }
                    }}
                    className={`whitespace-nowrap shrink-0 inline-flex items-center text-xs sm:text-sm transition-colors ${
                      pathname === "/propietario"
                        ? "bg-[#0B1F3A] text-white px-4 py-2 rounded-xl font-medium shadow-xs"
                        : "px-3.5 py-2 rounded-xl font-medium text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                    }`}
                  >
                    Mi Patrimonio
                  </Link>

                  <Link
                    href={"/propietario/asesores" as never}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                          "sigi_active_dashboard_role",
                          "propietario"
                        );
                      }
                    }}
                    className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 text-xs sm:text-sm transition-colors ${
                      pathname === "/propietario/asesores"
                        ? "bg-[#0B1F3A] text-white px-4 py-2 rounded-xl font-medium shadow-xs"
                        : "px-3.5 py-2 rounded-xl font-medium text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>Contactar a un Asesor</span>
                  </Link>
                </>
              ) : isAsesorView ? (
                <Link
                  href={"/asesor" as never}
                  onClick={(e) => {
                    if (typeof window !== "undefined") {
                      window.sessionStorage.setItem(
                        "sigi_active_dashboard_role",
                        "asesor"
                      );
                    }
                    if (pathname === "/asesor") {
                      e.preventDefault();
                      const trayEl =
                        document.getElementById("bandeja-prospectos");
                      if (trayEl) {
                        trayEl.scrollIntoView({ behavior: "smooth" });
                      }
                    }
                  }}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                    pathname === "/asesor"
                      ? "bg-[#0B1F3A] text-white shadow-xs"
                      : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                  }`}
                >
                  Prospectos
                </Link>
              ) : (
                <>
                  <Link
                    href={homeHref as never}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                          "sigi_active_dashboard_role",
                          "comprador"
                        );
                      }
                    }}
                    className={`whitespace-nowrap shrink-0 inline-flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                      pathname === homeHref
                        ? "bg-[#0B1F3A]/8 text-[#0B1F3A]"
                        : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                    }`}
                  >
                    Propiedades
                  </Link>
                  <Link
                    href={"/propietario/asesores" as never}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        window.sessionStorage.setItem(
                          "sigi_active_dashboard_role",
                          "comprador"
                        );
                      }
                    }}
                    className={`whitespace-nowrap shrink-0 inline-flex items-center px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
                      pathname === "/propietario/asesores"
                        ? "bg-[#0B1F3A]/8 text-[#0B1F3A]"
                        : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                    }`}
                  >
                    Contacte un Asesor
                  </Link>
                </>
              )}

              <Link
                href={"/sobre-nosotros" as never}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.sessionStorage.setItem(
                      "sigi_active_dashboard_role",
                      activeRole
                    );
                  }
                }}
                className={`whitespace-nowrap shrink-0 inline-flex items-center text-xs sm:text-sm transition-colors ${
                  isPropietarioView
                    ? pathname === "/sobre-nosotros"
                      ? "bg-[#0B1F3A] text-white px-4 py-2 rounded-xl font-medium shadow-xs"
                      : "px-3.5 py-2 rounded-xl font-medium text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                    : pathname === "/sobre-nosotros"
                    ? "px-3.5 py-2 rounded-lg font-bold bg-[#0B1F3A]/8 text-[#0B1F3A]"
                    : "px-3.5 py-2 rounded-lg font-bold text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
                }`}
              >
                Sobre Nosotros
              </Link>
            </nav>

            {/* Campana de Notificaciones en tiempo real conectada a public.notifications */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotifOpen((prev) => !prev)}
                aria-label="Notificaciones del usuario"
                className="relative w-10 h-10 rounded-full bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200/80 flex items-center justify-center text-[#0B1F3A] transition-colors cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-88 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 p-4 z-50">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B1F3A] block">
                        Centro de Notificaciones SIGI
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {unreadCount > 0
                          ? `${unreadCount} sin leer`
                          : "Al día • Tiempo real"}
                      </span>
                    </div>

                    {userNotifications.length > 0 && unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          void markAllNotificationsAsRead(currentUser?.email)
                        }
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-sky-700 hover:text-[#0B1F3A] cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Marcar todas como leídas</span>
                      </button>
                    )}
                  </div>

                  {userNotifications.length === 0 ? (
                    <div className="py-6 px-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/70 text-center">
                      <Bell className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-[#0B1F3A]">
                        Sin notificaciones pendientes
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Aquí aparecerán alertas reales sincronizadas con
                        public.notifications para tu cuenta.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {userNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            void markNotificationAsRead(notif.id);
                            setNotifOpen(false);
                            if (notif.href) {
                              router.push(notif.href as never);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            notif.read
                              ? "bg-slate-50/70 border-slate-100 text-slate-600"
                              : "bg-sky-50/70 border-sky-200/90 text-slate-900 shadow-2xs"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-extrabold text-[#0B1F3A]">
                              {notif.title}
                            </p>
                            {!notif.read && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void markNotificationAsRead(notif.id);
                                }}
                                className="text-[10px] font-bold text-sky-700 hover:underline shrink-0 cursor-pointer"
                              >
                                Marcar leída
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bloque del Perfil (100% datos reales del usuario autenticado) + Menú desplegable de 2 secciones */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-[#F4F7FB] hover:bg-slate-200/70 border border-slate-200/90 transition-all cursor-pointer"
              >
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={displayFullName}
                    className="w-8 h-8 rounded-full object-cover border border-[#0B1F3A]/20 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white text-xs font-extrabold flex items-center justify-center shadow-xs shrink-0">
                    {displayInitials}
                  </div>
                )}

                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-xs font-extrabold text-[#0B1F3A] leading-tight max-w-[150px] truncate">
                    {displayFullName}
                  </span>
                  <span className="text-[10px] font-semibold text-sky-700 leading-tight">
                    {activeRoleLabel}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-2 px-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-extrabold text-[#0B1F3A] truncate">
                      {displayFullName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {currentUser?.email || "Sesión Activa SIGI"}
                    </p>
                  </div>

                  {/* Sección 1: Editar Perfil */}
                  <button
                    type="button"
                    onClick={handleOpenEditModal}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-extrabold text-[#0B1F3A] hover:bg-[#F4F7FB] transition-colors cursor-pointer"
                  >
                    <UserPen className="w-4 h-4 text-sky-700" />
                    <span>Editar Perfil</span>
                  </button>

                  {/* Sección Favoritos (Comprador) */}
                  {activeRole === "comprador" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setFavoritesModalOpen(true);
                      }}
                      className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-extrabold text-[#0B1F3A] hover:bg-[#F4F7FB] transition-colors cursor-pointer mt-0.5"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>Favoritos</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-extrabold">
                        {favoriteProperties.length}
                      </span>
                    </button>
                  )}

                  {/* Divisor sutil */}
                  <div className="my-1.5 border-t border-slate-100" />

                  {/* Sección 2: Cerrar Sesión */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-extrabold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modal Institucional "Editar Perfil" con validación obligatoria de Persona en la foto + ID Oficial (INE o Pasaporte) */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                  IDENTIDAD PATRIMONIAL VERIFICADA • PUBLIC.PROFILES
                </span>
                <h2
                  id="edit-profile-title"
                  className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]"
                >
                  Editar Perfil
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveProfile}
              className="space-y-4"
              noValidate
            >
              {/* Subir Foto de Perfil con vista previa y detección obligatoria de persona */}
              <div className="p-4 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-4">
                  {profileAvatarUrl ? (
                    <img
                      src={profileAvatarUrl}
                      alt="Vista previa de perfil"
                      className="w-16 h-16 rounded-full object-cover border-2 border-[#0B1F3A] shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#0B1F3A] text-white text-lg font-extrabold flex items-center justify-center shrink-0">
                      {getInitials(profileName || displayFullName)}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-xs font-extrabold text-[#0B1F3A]">
                      Foto de Perfil (Selfie o Pose Casual)
                    </p>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Máx. 5 MB (.jpg, .png, .webp). Detección obligatoria de
                      persona en la imagen.
                    </p>
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isValidatingPhoto
                          ? "Analizando persona en foto..."
                          : "Subir Foto de Perfil"}
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleProfilePhotoChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {photoError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                    <span>{photoError}</span>
                  </div>
                )}

                {profileAvatarMeta && !photoError && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{profileAvatarMeta}</span>
                  </div>
                )}
              </div>

              {/* Nombre completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FB] focus:bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>
              </div>

              {/* Número de teléfono (+52) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono (+52 • 10 dígitos)
                </label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-xs font-extrabold text-[#0B1F3A]">
                    +52
                  </span>
                  <div className="relative flex-1">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="55 8920 1200"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-r-xl border border-slate-200 bg-[#F4F7FB] focus:bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
                    />
                  </div>
                </div>
              </div>

              {/* Correo electrónico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="correo@dominio.mx"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FB] focus:bg-white text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>
              </div>

              {/* Validación de Identidad Obligatoria (ID Oficial: INE o Pasaporte) para el Asesor */}
              {activeRole === "asesor" && (
                <div className="p-4 rounded-2xl bg-[#F4F7FB] border-2 border-[#0B1F3A]/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-sky-300 flex items-center justify-center shrink-0">
                      <IdCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-extrabold text-[#0B1F3A]">
                          Validación de Identidad Obligatoria (ID Oficial)
                        </p>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                          Obligatorio para guardar
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        Sube una fotografía vigente de tu{" "}
                        <strong className="text-[#0B1F3A]">
                          ID o Identificación Oficial (INE o Pasaporte)
                        </strong>{" "}
                        (.jpg, .png, .webp, máx. 5 MB) para certificar y guardar
                        los cambios en tus datos personales.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isUploadingOfficialId
                          ? "Verificando ID Oficial..."
                          : officialIdUrl
                          ? "Actualizar ID Oficial (INE / Pasaporte)"
                          : "Subir INE o Pasaporte Vigente"}
                      </span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                        onChange={handleOfficialIdChange}
                        className="hidden"
                      />
                    </label>

                    {officialIdUrl && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700">
                        <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                        ID Oficial Adjunto
                      </span>
                    )}
                  </div>

                  {officialIdError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                      <span>{officialIdError}</span>
                    </div>
                  )}

                  {officialIdMeta && !officialIdError && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{officialIdMeta}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Descripción / Biografía */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descripción / Biografía Patrimonial
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    rows={2}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    placeholder="Agrega una breve descripción personal o especialidad inmobiliaria..."
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F4F7FB] focus:bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#0B1F3A]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={
                    isSavingProfile ||
                    isValidatingPhoto ||
                    isUploadingOfficialId
                  }
                  className="px-5 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] disabled:opacity-60 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  {isSavingProfile
                    ? "Guardando en Supabase..."
                    : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Propiedades Favoritas del Comprador */}
      {favoritesModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="favorites-modal-title"
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 fill-rose-500" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                    COLECCIÓN PERSONAL • SIGI COLDWELL BANKER
                  </span>
                  <h2
                    id="favorites-modal-title"
                    className="text-lg sm:text-xl font-extrabold text-[#0B1F3A]"
                  >
                    Mis Propiedades Favoritas ({favoriteProperties.length})
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {favoriteProperties.length === 0 ? (
              <div className="py-10 px-6 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 text-center space-y-2.5">
                <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-extrabold text-[#0B1F3A]">
                  Aún no tienes propiedades guardadas en Favoritos
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Haz clic en el ícono de corazón en cualquier residencia del
                  catálogo para guardarla en tu lista personal.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-3.5 rounded-2xl bg-[#F4F7FB] border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#0B1F3A]/30 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-20 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            {prop.aiMatchDisplay} Match
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {prop.folio}
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-[#0B1F3A] truncate">
                          {prop.title}
                        </h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-sky-700 shrink-0" />
                          <span className="truncate">
                            {prop.zone || prop.location}
                          </span>
                        </p>
                        <p className="text-xs font-extrabold text-sky-700">
                          {prop.salePriceDisplay.includes("MXN")
                            ? prop.salePriceDisplay
                            : `${prop.salePriceDisplay} MXN`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBuyerPropertyId(prop.id);
                          setFavoritesModalOpen(false);
                          if (pathname !== "/comprador") {
                            router.push("/comprador" as never);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
                        <span>Abrir en visor principal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFavoriteProperty(prop.id)}
                        aria-label={`Quitar ${prop.title} de favoritos`}
                        title="Quitar de favoritos"
                        className="px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-extrabold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setFavoritesModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#0B1F3A] hover:bg-[#143159] text-white text-xs font-extrabold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
