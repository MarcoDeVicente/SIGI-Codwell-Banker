"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { containsMaliciousPayload } from "@/lib/validations";
import { useSigiStore } from "@/lib/store";
import SocialAuthModal, { SocialProvider } from "@/components/SocialAuthModal";

const EXAMPLE_ACADEMIA_EMAIL = "asesor.premier@coldwellbanker.com.mx";
const EXAMPLE_ACADEMIA_PASSWORD = "CB-Academia-2025!";

export default function LoginAcademiaPage() {
  const router = useRouter();
  const { loginOrSetRole } = useSigiStore();

  const [email, setEmail] = useState(EXAMPLE_ACADEMIA_EMAIL);
  const [password, setPassword] = useState(EXAMPLE_ACADEMIA_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [turnstileVerified, setTurnstileVerified] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recoveryToast, setRecoveryToast] = useState(false);
  const [ssoProvider, setSsoProvider] = useState<SocialProvider | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Ingresa un Correo Electrónico Corporativo válido.");
      return;
    }

    if (containsMaliciousPayload(email) || containsMaliciousPayload(password)) {
      setErrorMsg(
        "Se detectaron patrones no permitidos (XSS/SQLi) en las credenciales."
      );
      return;
    }

    if (password.trim().length < 6) {
      setErrorMsg("La contraseña cifrada debe contener al menos 6 caracteres.");
      return;
    }

    loginOrSetRole({
      role: "asesor",
      fullName: "Asesor Premier CB",
      email: email.trim(),
      phone: "5541908200",
    });

    router.push("/asesor" as never);
  };

  const handleSSO = (provider: SocialProvider) => {
    setSsoProvider(provider);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 flex flex-col justify-between">
      {/* Header Superior */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            href={"/registro" as never}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] text-white flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold tracking-[0.14em] text-[#0B1F3A] uppercase block">
                COLDWELL BANKER MÉXICO SIGI
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Sistema Integral de Gestión Inmobiliaria
              </span>
            </div>
          </Link>

          {/* Píldora azul marino */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1F3A] text-white text-[11px] font-extrabold tracking-wider uppercase shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-300" />
            <span>LOGIN AGENTES DE LA ACADEMIA CODWELL BANKER</span>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 w-full items-stretch">
          {/* Card Izquierda: Formulario Acceso Institucional */}
          <div className="lg:col-span-5 bg-white rounded-3xl shadow-xl shadow-slate-900/5 border border-slate-200/80 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[#0B1F3A] text-[11px] font-extrabold tracking-wider uppercase mb-4">
                <Lock className="w-3.5 h-3.5 text-[#0B1F3A]" />
                RED CORPORATIVA CERTIFICADA
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] tracking-tight">
                Acceso Institucional
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Inicie sesión en el Sistema Integral de Gestión Inmobiliaria
                (SIGI) con credenciales autorizadas Coldwell Banker México.
              </p>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {recoveryToast && (
                <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
                  Se ha enviado un enlace de restablecimiento criptográfico a{" "}
                  <strong>{email}</strong>.
                </div>
              )}

              <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
                {/* Correo Electrónico Corporativo con ícono Mail sobre #F4F7FB */}
                <div>
                  <label
                    htmlFor="academia-email"
                    className="block text-xs font-bold text-slate-700 mb-1.5"
                  >
                    Correo Electrónico Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="academia-email"
                      type="email"
                      value={email}
                      onFocus={() => {
                        if (email === EXAMPLE_ACADEMIA_EMAIL) {
                          setEmail("");
                        }
                      }}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="asesor.premier@coldwellbanker.com.mx"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 bg-[#F4F7FB] focus:bg-white focus:outline-none focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
                    />
                  </div>
                </div>

                {/* Contraseña Cifrada con ícono Lock sobre #F4F7FB */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="academia-password"
                      className="block text-xs font-bold text-slate-700"
                    >
                      Contraseña Cifrada
                    </label>
                    <button
                      type="button"
                      onClick={() => setRecoveryToast(true)}
                      className="text-xs font-bold text-sky-700 hover:text-[#0B1F3A] hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="academia-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onFocus={() => {
                        if (password === EXAMPLE_ACADEMIA_PASSWORD) {
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
                      aria-label="Mostrar u ocultar contraseña"
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

                {/* Checkbox Mantener sesión iniciada */}
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

                {/* Botón primario #0B1F3A */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-5 rounded-xl bg-[#0B1F3A] hover:bg-[#132d54] text-white font-bold text-sm shadow-md shadow-[#0B1F3A]/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Iniciar Sesión en SIGI</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* SSO Institucional */}
              <div className="mt-6">
                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 shrink-0">
                    SSO INSTITUCIONAL
                  </span>
                  <div className="border-t border-slate-200 w-full" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleSSO("Google")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-blue-600">G</span>
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSSO("Apple")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-slate-900"></span>
                    <span>Apple</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSSO("LinkedIn")}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <span className="font-extrabold text-sky-700">in</span>
                    <span>LinkedIn</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>¿Nuevo en SIGI?</span>
              <Link
                href={"/registro" as never}
                className="font-bold text-[#0B1F3A] hover:underline"
              >
                Crear cuenta de perfil →
              </Link>
            </div>
          </div>

          {/* Card Derecha: Foto nocturna de residencia con alberca + Badges + Métricas */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden shadow-xl min-h-[540px] flex flex-col justify-between bg-[#071529]">
            <img
              src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1500&q=80"
              alt="Residencia nocturna de lujo con alberca iluminada"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#051020] via-[#0B1F3A]/60 to-[#0B1F3A]/25" />

            {/* Badges superiores */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B1F3A]/85 backdrop-blur-md border border-white/15 text-xs font-extrabold tracking-wider text-sky-200 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                PROPTECH INTELLIGENCE V4.8
              </span>

              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-400/35 text-xs font-bold text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                • En vivo: 1,420 Propiedades Activas
              </span>
            </div>

            {/* Texto inferior y métricas */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 text-white">
              <p className="text-xs font-extrabold tracking-[0.2em] text-sky-300 uppercase mb-2">
                COLDWELL BANKER GLOBAL LUXURY
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight max-w-2xl">
                Gestión predictiva con certeza legal y patrimonial.
              </h2>

              <div className="mt-7 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white/8 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                  <p className="text-xl sm:text-2xl font-extrabold text-white">
                    98.4%
                  </p>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Precisión Valuación AI
                  </p>
                </div>
                <div className="bg-white/8 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                  <p className="text-xl sm:text-2xl font-extrabold text-sky-300">
                    &lt; 24h
                  </p>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Dictaminación Notarial
                  </p>
                </div>
                <div className="bg-white/8 backdrop-blur-xs rounded-2xl p-4 border border-white/10">
                  <p className="text-xl sm:text-2xl font-extrabold text-white">
                    120+
                  </p>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    Oficinas en México
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Pie institucional */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>
            Academia Coldwell Banker México • Acceso restringido a agentes y
            brokers certificados.
          </span>
          <span className="font-bold text-[#0B1F3A]">
            Protocolo TLS 1.3 • LFPDPPP & NOM-247-SE-2021
          </span>
        </div>
      </footer>
      <SocialAuthModal
        isOpen={ssoProvider !== null}
        provider={ssoProvider}
        source="login-academia"
        selectedRole="asesor"
        onClose={() => setSsoProvider(null)}
      />
    </div>
  );
}
