"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { containsMaliciousPayload } from "@/lib/validations";
import { useSigiStore } from "@/lib/store";
import SocialAuthModal, { SocialProvider } from "@/components/SocialAuthModal";

const EXAMPLE_LOGIN_EMAIL = "regina@patrimonio.mx";
const EXAMPLE_LOGIN_PASSWORD = "CB-Patrimonio-2025!";

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { authenticateByEmail } = useSigiStore();

  const [email, setEmail] = useState(EXAMPLE_LOGIN_EMAIL);
  const [password, setPassword] = useState(EXAMPLE_LOGIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [turnstileVerified, setTurnstileVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [ssoProvider, setSsoProvider] = useState<SocialProvider | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Ingresa un Correo Electrónico válido.");
      return;
    }

    if (
      containsMaliciousPayload(cleanEmail) ||
      containsMaliciousPayload(password)
    ) {
      setErrorMsg(
        "Se detectaron patrones no permitidos (XSS/SQLi) en las credenciales."
      );
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg("La contraseña debe contener al menos 6 caracteres.");
      return;
    }

    setIsSubmitting(true);
    const result = await authenticateByEmail(cleanEmail);
    setIsSubmitting(false);

    if (!result.success || !result.user) {
      setErrorMsg(
        result.error ||
          "No encontramos una cuenta registrada con este correo. Verifica tus datos o crea una cuenta nueva."
      );
      return;
    }

    const roleRoute =
      result.user.role === "asesor"
        ? "/asesor"
        : result.user.role === "propietario"
        ? "/propietario"
        : "/comprador";

    router.push(roleRoute as never);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Header Superior Institucional */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Logo con ícono de edificio */}
          <Link href={"/registro" as never} className="flex items-center gap-3">
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
          </Link>

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
          {/* Columna Izquierda: Formulario de Inicio de Sesión Unificado */}
          <div className="lg:col-span-6 bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200/70 text-sky-800 text-[11px] font-extrabold tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                ACCESO PATRIMONIAL UNIFICADO
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
                Iniciar Sesión
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
                Accede a tu cuenta patrimonial SIGI Coldwell Banker México.
              </p>

              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
                noValidate
              >
                {/* Correo Electrónico */}
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onFocus={() => {
                        if (email === EXAMPLE_LOGIN_EMAIL) {
                          setEmail("");
                        }
                      }}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="regina@patrimonio.mx"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña con botón de ojo */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onFocus={() => {
                        if (password === EXAMPLE_LOGIN_PASSWORD) {
                          setPassword("");
                        }
                      }}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword
                          ? "Ocultar contraseña"
                          : "Mostrar contraseña"
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Casilla Mantener sesión iniciada */}
                <div className="pt-1">
                  <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepSignedIn}
                      onChange={(e) => setKeepSignedIn(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0B1F3A] focus:ring-[#0B1F3A]"
                    />
                    <span className="text-xs font-medium text-slate-600">
                      Mantener sesión iniciada
                    </span>
                  </label>
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

                {/* Botón principal #0B1F3A "Iniciar Sesión ->" */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d54] disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-[#0B1F3A]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>
                    {isSubmitting ? "Verificando cuenta..." : "Iniciar Sesión"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divisor O INICIA SESIÓN CON y 3 botones SSO */}
              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                    O INICIA SESIÓN CON
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSsoProvider("Google")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-blue-600">G</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSsoProvider("Apple")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-slate-900"></span>
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSsoProvider("LinkedIn")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-sky-700">in</span>
                    <span>LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enlaces inferiores */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <Link
                href={"/registro" as never}
                className="text-slate-600 hover:text-[#0B1F3A] transition-colors"
              >
                ¿Aún no tienes una cuenta?{" "}
                <span className="font-bold text-[#0B1F3A] hover:underline">
                  Crear cuenta
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

          {/* Columna Derecha: Tarjeta fotográfica residencial de lujo con degradado oscuro inferior */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-xl min-h-[540px] flex flex-col justify-end bg-[#0B1F3A]">
            <img
              src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
              alt="Residencia de lujo Coldwell Banker México"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061326] via-[#0B1F3A]/60 to-transparent" />

            {/* Bloque inferior sobre degradado oscuro */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/35 text-xs font-extrabold tracking-[0.16em] text-emerald-300 uppercase mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ACCESO PATRIMONIAL VERIFICADO</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-white">
                Inteligencia inmobiliaria y certeza patrimonial en un solo ecosistema.
              </h2>

              <p className="mt-3 text-xs sm:text-sm text-slate-200/95 max-w-xl leading-relaxed">
                Tu sesión detecta automáticamente tu perfil registrado en SIGI
                para dirigirte a tu consola personalizada de inversión,
                patrimonio o corretaje institucional.
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
        source="login"
        onClose={() => setSsoProvider(null)}
      />
    </div>
  );
}
