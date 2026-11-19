"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useSigiStore, UserRole } from "@/lib/store";
import { containsMaliciousPayload } from "@/lib/validations";

export type SocialProvider = "Google" | "Apple" | "LinkedIn";

export interface SocialAuthModalProps {
  isOpen: boolean;
  provider: SocialProvider | null;
  source: "registro" | "login" | "login-academia";
  selectedRole?: UserRole;
  onClose: () => void;
}

interface QuickAccountOption {
  id: string;
  fullName: string;
  email: string;
  roleLabel: string;
  role: UserRole;
  initials: string;
}

const PROVIDER_ACCOUNTS: Record<SocialProvider, QuickAccountOption[]> = {
  Google: [
    {
      id: "g-comprador",
      fullName: "Lic. Regina Luján",
      email: "regina@patrimonio.mx",
      roleLabel: "Comprador / Inversionista",
      role: "comprador",
      initials: "RL",
    },
    {
      id: "g-propietario",
      fullName: "Lic. Roberto Garza Sada",
      email: "roberto.garza@patrimonio.mx",
      roleLabel: "Propietario Patrimonial",
      role: "propietario",
      initials: "RG",
    },
    {
      id: "g-asesor",
      fullName: "Asesor Premier CB",
      email: "asesor.premier@coldwellbanker.com.mx",
      roleLabel: "Asesor Certificado CB",
      role: "asesor",
      initials: "CB",
    },
  ],
  Apple: [
    {
      id: "a-comprador",
      fullName: "Lic. Regina Luján",
      email: "regina@patrimonio.mx",
      roleLabel: "Comprador / Inversionista",
      role: "comprador",
      initials: "RL",
    },
    {
      id: "a-propietario",
      fullName: "Lic. Roberto Garza Sada",
      email: "roberto.garza@patrimonio.mx",
      roleLabel: "Propietario Patrimonial",
      role: "propietario",
      initials: "RG",
    },
    {
      id: "a-asesor",
      fullName: "Asesor Premier CB",
      email: "asesor.premier@coldwellbanker.com.mx",
      roleLabel: "Asesor Certificado CB",
      role: "asesor",
      initials: "CB",
    },
  ],
  LinkedIn: [
    {
      id: "in-comprador",
      fullName: "Lic. Regina Luján",
      email: "regina@patrimonio.mx",
      roleLabel: "Comprador / Inversionista",
      role: "comprador",
      initials: "RL",
    },
    {
      id: "in-propietario",
      fullName: "Lic. Roberto Garza Sada",
      email: "roberto.garza@patrimonio.mx",
      roleLabel: "Propietario Patrimonial",
      role: "propietario",
      initials: "RG",
    },
    {
      id: "in-asesor",
      fullName: "Asesor Premier CB",
      email: "asesor.premier@coldwellbanker.com.mx",
      roleLabel: "Asesor Certificado CB",
      role: "asesor",
      initials: "CB",
    },
  ],
};

export default function SocialAuthModal({
  isOpen,
  provider,
  source,
  selectedRole = "comprador",
  onClose,
}: SocialAuthModalProps) {
  const router = useRouter();
  const { authenticateWithSSO } = useSigiStore();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [presetName, setPresetName] = useState("");
  const [presetEmail, setPresetEmail] = useState("");
  const [selectedQuickId, setSelectedQuickId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !provider) return;
    setErrorMsg(null);
    const list = PROVIDER_ACCOUNTS[provider];
    const targetRole: UserRole =
      source === "login-academia" ? "asesor" : selectedRole;
    const defaultAcc =
      list.find((item) => item.role === targetRole) || list[0];

    setSelectedQuickId(defaultAcc.id);
    setFullName(defaultAcc.fullName);
    setEmail(defaultAcc.email);
    setPresetName(defaultAcc.fullName);
    setPresetEmail(defaultAcc.email);
  }, [isOpen, provider, source, selectedRole]);

  if (!isOpen || !provider) return null;

  const accounts = PROVIDER_ACCOUNTS[provider];

  const providerMeta = {
    Google: {
      badgeText: "G",
      badgeClass: "bg-blue-600 text-white",
      accentBorder: "border-blue-200 bg-blue-50/60 text-blue-900",
      subtitle: "OAuth 2.0 • Google Workspace & Identidad Verificada",
    },
    Apple: {
      badgeText: "",
      badgeClass: "bg-slate-900 text-white",
      accentBorder: "border-slate-200 bg-slate-100 text-slate-900",
      subtitle: "Apple ID • Privacidad Patrimonial Cifrada",
    },
    LinkedIn: {
      badgeText: "in",
      badgeClass: "bg-sky-700 text-white",
      accentBorder: "border-sky-200 bg-sky-50/70 text-sky-900",
      subtitle: "LinkedIn Executive SSO • Red Profesional Certificada",
    },
  }[provider];

  const handleSelectQuickAccount = (acc: QuickAccountOption) => {
    setErrorMsg(null);
    setSelectedQuickId(acc.id);
    setFullName(acc.fullName);
    setEmail(acc.email);
    setPresetName(acc.fullName);
    setPresetEmail(acc.email);
  };

  const handleConfirmSSO = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 3) {
      setErrorMsg("Ingresa o selecciona tu Nombre Completo (mín. 3 caracteres).");
      return;
    }

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Ingresa o selecciona un Correo Electrónico válido.");
      return;
    }

    if (
      containsMaliciousPayload(cleanName) ||
      containsMaliciousPayload(cleanEmail)
    ) {
      setErrorMsg(
        "Se detectaron caracteres no permitidos (XSS/SQLi) en los datos."
      );
      return;
    }

    setIsLoading(true);
    const result = await authenticateWithSSO({
      provider,
      source,
      role: source === "login-academia" ? "asesor" : selectedRole,
      fullName: cleanName,
      email: cleanEmail,
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMsg(
        result.error || "No fue posible autenticar con el proveedor SSO."
      );
      return;
    }

    onClose();
    const targetDashboard =
      source === "login-academia"
        ? "/asesor"
        : source === "registro"
        ? `/${selectedRole}`
        : `/${result.user.role}`;

    router.push(targetDashboard as never);
  };

  const activeRoleBadge =
    source === "login-academia"
      ? "Rol asignado: Asesor Certificado (/asesor)"
      : source === "registro"
      ? `Rol seleccionado en registro: ${
          selectedRole === "comprador"
            ? "Comprador / Arrendatario (/comprador)"
            : selectedRole === "propietario"
            ? "Propietario / Inversionista (/propietario)"
            : "Asesor Inmobiliario (/asesor)"
        }`
      : "Detección automática de rol desde public.profiles (o Comprador si es primera vez)";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sso-modal-title"
    >
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Encabezado del proveedor */}
        <div className="px-6 py-5 bg-[#0B1F3A] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold shadow-sm ${providerMeta.badgeClass}`}
            >
              {providerMeta.badgeText}
            </div>
            <div>
              <h2
                id="sso-modal-title"
                className="text-sm sm:text-base font-extrabold tracking-tight text-white"
              >
                Continuar con {provider} — SIGI Coldwell Banker México
              </h2>
              <p className="text-[11px] text-sky-200/90 font-medium">
                {providerMeta.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana SSO"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmSSO} className="p-6 space-y-4" noValidate>
          {/* Indicador del contexto de rol */}
          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${providerMeta.accentBorder}`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{activeRoleBadge}</span>
          </div>

          {/* Selector rápido de cuenta en 1 clic */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Selecciona una cuenta rápida de {provider}
            </p>
            <div className="space-y-2">
              {accounts.map((acc) => {
                const isSelected =
                  selectedQuickId === acc.id &&
                  email.toLowerCase() === acc.email.toLowerCase();
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSelectQuickAccount(acc)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#0B1F3A] bg-[#F4F7FB] ring-2 ring-[#0B1F3A]/10"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#0B1F3A] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                        {acc.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-[#0B1F3A] truncate">
                          {acc.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                        {acc.roleLabel}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campos editables con auto-clear en onFocus */}
          <div className="pt-1 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              O confirma / personaliza tus datos de {provider}
            </p>

            <div>
              <label
                htmlFor="sso-fullname"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="sso-fullname"
                  type="text"
                  value={fullName}
                  onFocus={() => {
                    if (fullName === presetName) {
                      setFullName("");
                    }
                  }}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ingresa tu nombre completo"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="sso-email"
                className="block text-xs font-bold text-slate-700 mb-1"
              >
                Correo Electrónico ({provider})
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="sso-email"
                  type="email"
                  value={email}
                  onFocus={() => {
                    if (email === presetEmail) {
                      setEmail("");
                    }
                  }}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@dominio.mx"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d54] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-md shadow-[#0B1F3A]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>
                {isLoading
                  ? `Sincronizando con ${provider}...`
                  : `Continuar como ${fullName.trim() || provider}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
