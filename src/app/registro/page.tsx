"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import { registerSchema } from "@/lib/validations";
import { useSigiStore, UserRole } from "@/lib/store";

interface ProfileTabConfig {
  role: UserRole;
  tabLabel: string;
  infoTitle: string;
  infoDescription: string;
  heroImage: string;
  heroCaption: string;
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
  },
};

export default function RegistroPage() {
  const router = useRouter();
  const { registerUser, loginOrSetRole } = useSigiStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>("comprador");
  const [fullName, setFullName] = useState("Lic. Regina Luján");
  const [email, setEmail] = useState("regina@patrimonio.mx");
  const [phone, setPhone] = useState("55 8920 1200");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formBannerError, setFormBannerError] = useState<string | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
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

    const response = registerUser({
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      privacyAccepted: parsed.data.privacyAccepted,
    });

    if (!response.success) {
      // Si el correo/teléfono de demostración ya estaba registrado, actualizamos el rol activo y redirigimos a /sobre-nosotros
      loginOrSetRole({
        role: selectedRole,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
      });
      router.push("/sobre-nosotros" as never);
      return;
    }

    router.push("/sobre-nosotros" as never);
  };

  const handleSSOLogin = (provider: "Google" | "Apple" | "LinkedIn") => {
    loginOrSetRole({
      role: selectedRole,
      fullName: fullName.trim() || `Usuario ${provider} CB`,
      email:
        email.trim() ||
        `${provider.toLowerCase()}.${selectedRole}@patrimonio.mx`,
      phone: phone.trim() || "5589201200",
    });
    router.push("/sobre-nosotros" as never);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Header Superior Institucional */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
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

          {/* Enlace Conocer la Red CB */}
          <Link
            href={"/sobre-nosotros" as never}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0B1F3A] hover:text-sky-700 transition-colors"
          >
            <span>Conocer la Red CB</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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

              {/* Selector de perfil con 3 pestañas interactivas */}
              <div className="mt-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Selecciona tu perfil en SIGI
                </label>
                <div
                  role="tablist"
                  aria-label="Selecciona tu perfil en SIGI"
                  className="grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200/80"
                >
                  {(["comprador", "propietario", "asesor"] as UserRole[]).map(
                    (roleKey) => {
                      const tab = PROFILE_CONFIGS[roleKey];
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
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#0B1F3A] text-white shadow-sm"
                              : "text-slate-600 hover:text-[#0B1F3A] hover:bg-white/60"
                          }`}
                        >
                          {tab.tabLabel}
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

                {/* Nombre Completo */}
                <div>
                  <label
                    htmlFor="reg-fullname"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Nombre Completo
                  </label>
                  <input
                    id="reg-fullname"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFullName(val);
                      validateRealtime({ fullName: val }, "fullName");
                    }}
                    placeholder="Lic. Regina Luján"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.fullName
                        ? "border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.fullName}
                    </p>
                  )}
                </div>

                {/* Correo Electrónico Personal */}
                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-bold text-slate-700 mb-1"
                  >
                    Correo Electrónico Personal
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEmail(val);
                      validateRealtime({ email: val }, "email");
                    }}
                    placeholder="regina@patrimonio.mx"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.email
                        ? "border-red-400 focus:ring-red-200"
                        : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Teléfono Celular (WhatsApp Verificado): Prefijo fijo +52 */}
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
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPhone(val);
                        validateRealtime({ phone: val }, "phone");
                      }}
                      placeholder="55 8920 1200"
                      className={`w-full px-3.5 py-2.5 rounded-r-xl border text-sm text-slate-900 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.phone
                          ? "border-red-400 focus:ring-red-200"
                          : "border-slate-200 focus:border-[#0B1F3A] focus:ring-[#0B1F3A]/10"
                      }`}
                    />
                  </div>
                  {fieldErrors.phone && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                {/* Contraseña Segura */}
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
                    <input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPassword(val);
                        validateRealtime({ password: val }, "password");
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-3.5 pr-10 py-2.5 rounded-xl border text-sm text-slate-900 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
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

                {/* Botón primario #0B1F3A */}
                <button
                  type="submit"
                  className="w-full py-3 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d54] text-white font-bold text-sm shadow-md shadow-[#0B1F3A]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Crear Cuenta Coldwell Banker</span>
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
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <p className="text-slate-600">
                ¿Ya tienes una cuenta?{" "}
                <Link
                  href={"/login-academia" as never}
                  className="font-bold text-[#0B1F3A] hover:underline"
                >
                  Iniciar Sesión
                </Link>
              </p>
              <Link
                href={"/sobre-nosotros" as never}
                className="font-bold text-sky-700 hover:text-[#0B1F3A] transition-colors"
              >
                Sobre Nosotros
              </Link>
            </div>
          </div>

          {/* Columna Derecha: Imagen Hero redondeada con degradado oscuro inferior */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-xl min-h-[540px] flex flex-col justify-between bg-[#0B1F3A]">
            <img
              src={activeConfig.heroImage}
              alt={activeConfig.heroCaption}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-[#0B1F3A]/55 to-transparent" />

            {/* Badge superior en la foto */}
            <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B1F3A]/80 backdrop-blur-md border border-white/15 text-[11px] font-bold text-white tracking-wider uppercase">
                <ShieldCheck className="w-4 h-4 text-sky-300" />
                {activeConfig.tabLabel} • SIGI Verified
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-semibold text-white">
                {activeConfig.heroCaption}
              </span>
            </div>

            {/* Bloque inferior sobre degradado oscuro */}
            <div className="relative z-10 p-6 sm:p-8 text-white">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-300/30 text-sky-200 text-[11px] font-extrabold tracking-widest uppercase mb-3">
                GARANTÍA PATRIMONIAL CERTIFICADA
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight">
                Asegura tu participación en el mercado de alta gama.
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-slate-200/95 max-w-xl leading-relaxed">
                Inteligencia territorial, análisis de retorno cap rate y más de
                3,400 residencias validadas legalmente.
              </p>

              {/* 3 Métricas al pie */}
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
                  <p className="text-lg sm:text-2xl font-extrabold text-sky-300">
                    98.4%
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Afinidad Algorítmica
                  </p>
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-extrabold text-white">
                    120+
                  </p>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                    Oficinas Red Nacional CB
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Inferior Legal y NOM-247-SE-2021 */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p className="flex items-center gap-1.5 text-center sm:text-left">
            <Lock className="w-3.5 h-3.5 text-[#0B1F3A] shrink-0" />
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
    </div>
  );
}
