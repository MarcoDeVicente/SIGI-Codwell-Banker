"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Search,
  Bell,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  Briefcase,
  Home,
  KeyRound,
  Info,
  Sparkles,
} from "lucide-react";
import { useSigiStore, UserRole } from "@/lib/store";

interface QuickViewItem {
  label: string;
  subtitle: string;
  href: string;
  role?: UserRole;
  icon: React.ReactNode;
}

const QUICK_VIEWS: QuickViewItem[] = [
  {
    label: "1-3. Registro & Perfiles",
    subtitle: "Comprador, Propietario y Asesor",
    href: "/registro",
    icon: <UserCheck className="w-4 h-4 text-[#0B1F3A]" />,
  },
  {
    label: "4. Login Academia CB",
    subtitle: "Acceso Institucional Agentes",
    href: "/login-academia",
    role: "asesor",
    icon: <KeyRound className="w-4 h-4 text-[#0B1F3A]" />,
  },
  {
    label: "5. Sobre Nosotros",
    subtitle: "Trayectoria, Sedes y Misión 2030",
    href: "/sobre-nosotros",
    icon: <Info className="w-4 h-4 text-[#0B1F3A]" />,
  },
  {
    label: "6. Vista Comprador / Inversionista",
    subtitle: "Marketplace, Match IA y Preventa",
    href: "/comprador",
    role: "comprador",
    icon: <Home className="w-4 h-4 text-emerald-600" />,
  },
  {
    label: "7. Vista Asesor Inmobiliario",
    subtitle: "CRM Omnicanal y Gestión MLS",
    href: "/asesor",
    role: "asesor",
    icon: <Briefcase className="w-4 h-4 text-blue-600" />,
  },
  {
    label: "8. Vista Propietario / Consignatario",
    subtitle: "Valuación Patrimonial y Rendimiento",
    href: "/propietario",
    role: "propietario",
    icon: <ShieldCheck className="w-4 h-4 text-amber-600" />,
  },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, searchQuery, setSearchQuery, loginOrSetRole } =
    useSigiStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleQuickJump = (item: QuickViewItem) => {
    if (item.role) {
      loginOrSetRole({
        role: item.role,
        fullName: currentUser?.fullName,
        email: currentUser?.email,
      });
    }
    setMenuOpen(false);
    router.push(item.href as never);
  };

  const activeRoleLabel =
    currentUser?.role === "asesor"
      ? "Asesor Certificado"
      : currentUser?.role === "propietario"
      ? "Propietario Patrimonial"
      : "Comprador / Inversionista";

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo institucional */}
        <Link
          href={"/sobre-nosotros" as never}
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-[#0B1F3A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#132d54] transition-colors">
            <Building2 className="w-5 h-5 text-sky-300" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold tracking-[0.14em] text-[#0B1F3A] uppercase leading-tight">
              COLDWELL BANKER MÉXICO SIGI
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
              Institutional Real Estate Intelligence
            </span>
          </div>
        </Link>

        {/* Enlaces principales */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <Link
            href={"/comprador" as never}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/comprador"
                ? "bg-[#0B1F3A]/8 text-[#0B1F3A]"
                : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
            }`}
          >
            Propiedades
          </Link>
          <Link
            href={"/asesor" as never}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/asesor"
                ? "bg-[#0B1F3A]/8 text-[#0B1F3A]"
                : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
            }`}
          >
            Asesores
          </Link>
          <Link
            href={"/sobre-nosotros" as never}
            className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/sobre-nosotros"
                ? "bg-[#0B1F3A]/8 text-[#0B1F3A]"
                : "text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-100/70"
            }`}
          >
            Sobre Nosotros
          </Link>
        </nav>

        {/* Buscador redondeado */}
        <div className="hidden lg:flex items-center flex-1 max-w-sm xl:max-w-md mx-2">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar residencia, folio o asesor..."
              aria-label="Buscar residencia, folio o asesor"
              className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100/90 border border-slate-200/90 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0B1F3A] focus:ring-2 focus:ring-[#0B1F3A]/10 transition-all"
            />
          </div>
        </div>

        {/* Acciones derechas: Notificaciones + Selector rápido en el Avatar */}
        <div className="flex items-center gap-3">
          {/* Campana de notificaciones con punto verde activo */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((prev) => !prev)}
              aria-label="Notificaciones del sistema SIGI"
              className="relative w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200/70 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5" />
              <span
                title="Enlace Red MLS Activo"
                className="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"
              />
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-200/90 p-4 z-50">
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                    Alertas SIGI & MLS Global
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    En vivo
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800">
                      Folio MX-QRO-2025-089 • 96% Match IA
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Residencia Cumbres de Juriquilla validada con +11.8% de plusvalía anual.
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="font-semibold text-slate-800">
                      Bandeja Omnicanal • Alejandra Lozano
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      Nuevo prospecto calificado (96% IA) para Piso Corporativo Reforma.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selector rápido de vista en el Avatar */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200/80 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-[#0B1F3A] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                {currentUser?.avatarInitials || "RL"}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-slate-800 leading-tight max-w-[140px] truncate">
                  {currentUser?.fullName || "Lic. Regina Luján"}
                </span>
                <span className="text-[10px] font-medium text-sky-700 leading-tight">
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
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white shadow-2xl border border-slate-200/90 py-3 px-2 z-50">
                <div className="px-3 py-2 mb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    Selector Rápido de Pantallas SIGI
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Salta en vivo entre todos los módulos del ecosistema Coldwell Banker:
                  </p>
                </div>

                <div className="space-y-1">
                  {QUICK_VIEWS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => handleQuickJump(item)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#0B1F3A] text-white"
                            : "hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isActive ? "bg-white/15 text-white" : "bg-slate-100"
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-bold truncate ${
                              isActive ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {item.label}
                          </p>
                          <p
                            className={`text-[11px] truncate ${
                              isActive ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {item.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
