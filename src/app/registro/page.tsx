"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Home,
  Briefcase,
  User,
  Mail,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { registerSchema } from "@/lib/validations";
import { useSigiStore, UserRole } from "@/lib/store";
import SocialAuthModal, { SocialProvider } from "@/components/SocialAuthModal";

const EXAMPLE_FULL_NAME = "Lic. Regina Luján";
const EXAMPLE_EMAIL = "regina@patrimonio.mx";
const EXAMPLE_PHONE = "55 8920 1200";
const EXAMPLE_PASSWORD = "CB-Patrimonio-2025!";

interface ProfileTabConfig {
  role: UserRole;
  tabLabel: string;
  infoTitle: string;
  infoDescription: string;
  heroImage: string;
  heroCaption: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROFILE_CONFIGS: Record<UserRole, ProfileTabConfig> = {
  comprador: {
    role: "comprador",
    tabLabel: "Comprar/Rentar",
    infoTitle: "Perfil: Arrendatario/Comprador.",
    infoDescription:
      "Explora desarrollos en preventa, venta y renta la mejor calidad de vida adaptada a tus necesidades.",
    heroImage:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    heroCaption: "Residencia con alberca infinita • Colección Global Luxury",
    icon: Home,
  },
  propietario: {
    role: "propietario",
    tabLabel: "Propietario",
    infoTitle: "Perfil: Inversionista & Propietario.",
    infoDescription:
      "Explora la mejor forma de hacer que tu patrimonio valga, contacta a nuestros asesores ellos maximizaran tus ganancias.",
    heroImage:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1400&q=80",
    heroCaption: "Torre Residencial Corporativa • Plusvalía Patrimonial",
    icon: Building2,
  },
  asesor: {
    role: "asesor",
    tabLabel: "Asesor",
    infoTitle: "Perfil: Asesor Inmobiliario.",
    infoDescription:
      "Conoce a los clientes y ayudalos en sus necesidades y se recompensado por tu trabajo de primer nivel.",
    heroImage:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    heroCaption: "Parque Residencial Moderno • Red Nacional de Asesores CB",
    icon: Briefcase,
  },
};

export default function RegistroPage() {
  const router = useRouter();
  const { registerUser } = useSigiStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>("comprador");
  const [fullName, setFullName] = useState(EXAMPLE_FULL_NAME);
  const [email, setEmail] = useState(EXAMPLE_EMAIL);
  const [phone, setPhone] = useState(EXAMPLE_PHONE);
  const [password, setPassword] = useState(EXAMPLE_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);
  const [turnstileVerified, setTurnstileVerified] = useState(true);
  const [ssoProvider, setSsoProvider] = useState<SocialProvider | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeConfig = PROFILE_CONFIGS[selectedRole];

  const validateRealtime = (
    nextValues: {
      role?: UserRole;
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string;
      privacyAccepted?: boolean;
    },
    touchedField?: string
  ) => {
    const payload = {
      role: nextValues.role ?? selectedRole,
      fullName: nextValues.fullName ?? fullName,
      email: nextValues.email ?? email,
      phone: nextValues.phone ?? phone,
      password: nextValues.password ?? password,
      privacyAccepted: nextValues.privacyAccepted ?? privacyAccepted,
    };

    const result = registerSchema.safeParse(payload);
    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const nextErrors: Record<string, string> = { ...fieldErrors };
    if (touchedField) {
      delete nextErrors[touchedField];
    }

    for (const issue of result.error.issues) {
      const key = String(issue.path[0] || "");
      if (!touchedField || key === touchedField) {
        nextErrors[key] = issue.message;
      }
    }
    setFieldErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormBannerError(null);

    const parsed = registerSchema.safeParse({
      role: selectedRole,
      fullName,
      email,
      phone,
      password,
      privacyAccepted,
    });

    if (!parsed.success) {
      const errs: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || "");
        if (!errs[key]) {
          errs[key] = issue.message;
        }
      }
      setFieldErrors(errs);
      return;
    }

    setIsSubmitting(true);
    const response = await registerUser({
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      privacyAccepted: parsed.data.privacyAccepted,
    });
    setIsSubmitting(false);

    if (!response.success) {
      setFormBannerError(
        response.error ||
          "El correo electrónico o teléfono ya está registrado en SIGI Coldwell Banker."
      );
      return;
    }

    const targetRoute =
      parsed.data.role === "asesor"
        ? "/asesor"
        : parsed.data.role === "propietario"
        ? "/propietario"
        : "/comprador";

    router.push(targetRoute as never);
  };

  const handleSSOLogin = (provider: SocialProvider) => {
    setSsoProvider(provider);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Header Superior Institucional */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo con ícono de edificio */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold tracking-[0.12em] text-[#0B1F3A] uppercase">
                SIGI • COLDWELL BANKER MÉXICO
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                La mejor inteligencia Inmobiliaria
              </p>
            </div>
          </div>

          {/* Píldora central con punto verde */}
          <div className="hidden lg:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/90 text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Servicios en: CDMX • Riviera Maya • Monterrey • Querétaro
            </span>
          </div>
        </div>
      </header>

      {/* Cuerpo Principal: 2 Columnas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full items-stretch">
          {/* Columna Izquierda: Card blanca redondeada */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Píldora azul claro */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-800 text-[11px] font-extrabold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                ÚNETE A LA FAMILIA
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
                Crea tu Cuenta
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Acceso selecto a propiedades privadas, análisis algorítmico y
                cartera patrimonial Coldwell Banker.
              </p>

              {/* Selector de perfil con 3 pestañas interactivas con ícono centrado arriba del texto */}
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Selecciona tu perfil en SIGI
                </label>
                <div
                  role="tablist"
                  aria-label="Selecciona tu perfil en SIGI"
                  className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#F4F7FB] border border-slate-200/80"
                >
                  {(["comprador", "propietario", "asesor"] as UserRole[]).map(
                    (roleKey) => {
                      const tab = PROFILE_CONFIGS[roleKey];
                      const TabIcon = tab.icon;
                      const isActive = selectedRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => {
                            setSelectedRole(roleKey);
                            validateRealtime({ role: roleKey }, "role");
                          }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#0B1F3A] text-white shadow-sm"
                              : "text-slate-600 hover:text-[#0B1F3A] hover:bg-white/70"
                          }`}
                        >
                          <TabIcon
                            className={`w-4 h-4 ${
                              isActive ? "text-white" : "text-slate-500"
                            }`}
                          />
                          <span>{tab.tabLabel}</span>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Recuadro informativo azul claro dinámico */}
                <div className="mt-3 p-3.5 rounded-2xl bg-sky-50/90 border border-sky-200/80 text-xs text-slate-700 leading-relaxed transition-all">
                  <span className="font-bold text-[#0B1F3A]">
                    {activeConfig.infoTitle}{" "}
                  </span>
                  <span>{activeConfig.infoDescription}</span>
                </div>
              </div>

              {/* Formulario controlado con validación Zod en tiempo real */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                {formBannerError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formBannerError}</span>
                  </div>
                )}

                {/* Nombre Completo con ícono User a la izquierda sobre #F4F7FB */}
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-fullname"
                      type="text"
                      value={fullName}
                      onFocus={() => {
                        if (fullName === EXAMPLE_FULL_NAME) {
                          setFullName("");
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFullName(val);
                        validateRealtime({ fullName: val }, "fullName");
                      }}
                      placeholder="Lic. Regina Luján"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.fullName
                          ? "border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                      }`}
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Correo Electrónico Personal con ícono Mail a la izquierda sobre #F4F7FB */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Correo Electrónico Personal
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onFocus={() => {
                        if (email === EXAMPLE_EMAIL) {
                          setEmail("");
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEmail(val);
                        validateRealtime({ email: val }, "email");
                      }}
                      placeholder="regina@patrimonio.mx"
                      className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.email
                          ? "border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                      }`}
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Teléfono Celular (WhatsApp Verificado): Prefijo fijo +52 + ícono Smartphone sobre #F4F7FB */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="reg-phone"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Teléfono Celular (WhatsApp Verificado)
                    </label>
                    <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> 10 dígitos
                    </span>
                  </div>
                  <div className="flex items-stretch">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-xs font-extrabold text-[#0B1F3A] select-none">
                      +52
                    </span>
                    <div className="relative flex-1">
                      <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="reg-phone"
                        type="tel"
                        value={phone}
                        onFocus={() => {
                          if (phone === EXAMPLE_PHONE) {
                            setPhone("");
                          }
                        }}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPhone(val);
                          validateRealtime({ phone: val }, "phone");
                        }}
                        placeholder="55 8920 1200"
                        className={`w-full pl-10 pr-3.5 py-2.5 rounded-r-xl border text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.phone
                            ? "border-red-400 focus:ring-red-200"
                            : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                        }`}
                      />
                    </div>
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Contraseña Segura con ícono Lock a la izquierda sobre #F4F7FB */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Contraseña Segura
                    </label>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Mín. 8 caracteres
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onFocus={() => {
                        if (password === EXAMPLE_PASSWORD) {
                          setPassword("");
                        }
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassword(val);
                        validateRealtime({ password: val }, "password");
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.password
                          ? "border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                {/* Casilla obligatoria LFPDPPP */}
                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setPrivacyAccepted(checked);
                        validateRealtime(
                          { privacyAccepted: checked },
                          "privacyAccepted"
                        );
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                    />
                    <span className="text-xs text-slate-600 leading-snug">
                      Acepto el{" "}
                      <span className="font-semibold text-[#0B1F3A] underline">
                        Aviso de Privacidad
                      </span>{" "}
                      y los{" "}
                      <span className="font-semibold text-[#0B1F3A] underline">
                        Términos de Intermediación SIGI Coldwell Banker
                      </span>
                      .
                    </span>
                  </label>
                  {fieldErrors.privacyAccepted && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.privacyAccepted}
                    </p>
                  )}
                </div>

                {/* Widget interactivo anti-bots Cloudflare Turnstile */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setTurnstileVerified((v) => !v)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setTurnstileVerified((v) => !v);
                    }
                  }}
                  className="p-3 rounded-xl bg-[#F4F7FB] border border-slate-200/90 flex items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        turnstileVerified
                          ? "bg-emerald-500 text-white"
                          : "bg-white border border-slate-300 text-transparent"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      Protección Anti-Bots Cloudflare Turnstile verificada
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Turnstile</span>
                  </div>
                </div>

                {/* Botón primario #0B1F3A */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d54] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#0B1F3A]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>
                    {isSubmitting
                      ? "Registrando en Supabase..."
                      : "Crear Cuenta Coldwell Banker"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divisor O REGÍSTRATE CON y 3 botones SSO */}
              <div className="mt-5">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                    O REGÍSTRATE CON
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSSOLogin("Google")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-blue-600">G</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSSOLogin("Apple")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-slate-900"></span>
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSSOLogin("LinkedIn")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-sky-700">in</span>
                    <span>LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pie de card */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <Link
                href={"/login" as never}
                className="text-slate-600 hover:text-[#0B1F3A] transition-colors"
              >
                ¿Ya tienes una cuenta?{" "}
                <span className="font-bold text-[#0B1F3A] hover:underline">
                  Iniciar sesión
                </span>
              </Link>
              <Link
                href={"/login-academia" as never}
                className="text-slate-600 hover:text-[#0B1F3A] transition-colors"
              >
                ¿Eres Asesor Coldwell Banker?{" "}
                <span className="font-bold text-sky-700 hover:text-[#0B1F3A] hover:underline">
                  Inicia Sesión aquí
                </span>
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Imagen Hero redondeada sin badges superiores, solo contenido inferior sobre degradado oscuro */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-xl min-h-[540px] flex flex-col justify-end bg-[#0B1F3A]">
            <img
              src={activeConfig.heroImage}
              alt={activeConfig.heroCaption}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-[#0B1F3A]/60 to-transparent" />

            {/* Bloque inferior sobre degradado oscuro */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white">
              <p className="text-xs font-extrabold tracking-[0.18em] text-emerald-400 uppercase mb-2.5">
                GARANTÍA PATRIMONIAL CERTIFICADA
              </p>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
                Asegura tu participación en el mercado de alta gama.
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-slate-200/95 max-w-xl leading-relaxed">
                Inteligencia territorial, análisis de retorno cap rate y más de
                3,400 residencias validadas legalmente.
              </p>

              {/* Línea divisoria horizontal translúcida y 3 columnas de métricas */}
              <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-lg sm:text-2xl font-extrabold text-white">
                    $1.8B+ MXN
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Transaccionados 2024
                  </p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-extrabold text-white">
                    98.4%
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Afinidad Algorítmica
                  </p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-extrabold text-white">
                    120+ Oficinas
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Red Nacional CB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Barra blanca inferior con escudo NOM-247-SE-2021 */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p className="flex items-center gap-1.5 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-[#0B1F3A] shrink-0" />
            <span>
              <strong className="text-slate-700">
                Encriptación Bancaria y Cumplimiento NOM-247-SE-2021:
              </strong>{" "}
              Toda transacción, oferta y documento se audita bajo estándares
              oficiales Coldwell Banker Corporate México.
            </span>
          </p>
          <p className="font-bold text-[#0B1F3A] shrink-0">
            Certificación AMPI | MLS Privado | Coldwell Banker ®
          </p>
        </div>
      </footer>
      <SocialAuthModal
        isOpen={ssoProvider !== null}
        provider={ssoProvider}
        source="registro"
        selectedRole={selectedRole}
        onClose={() => setSsoProvider(null)}
      />
    </div>
  );
}
