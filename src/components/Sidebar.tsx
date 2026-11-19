"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Gem,
  TrendingUp,
  Users,
  FileCheck2,
  Info,
  LogOut,
  ArrowUpRight,
} from "lucide-react";
import { useSigiStore, UserRole } from "@/lib/store";

export interface SidebarProps {
  activeSection?: string;
  onSelectSection?: (section: string) => void;
}

interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  role: UserRole;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAV_ITEMS: SidebarNavItem[] = [
  {
    id: "panel-principal",
    label: "Panel Principal",
    href: "/asesor",
    role: "asesor",
    icon: LayoutDashboard,
  },
  {
    id: "red-asesores",
    label: "Red de Asesores",
    href: "/asesor",
    role: "asesor",
    icon: Users,
  },
  {
    id: "inventario-lujo",
    label: "Inventario de Lujo",
    href: "/comprador",
    role: "comprador",
    icon: Gem,
  },
  {
    id: "valuacion",
    label: "Valuación",
    href: "/propietario",
    role: "propietario",
    icon: TrendingUp,
  },
  {
    id: "expedientes-legales",
    label: "Expedientes Legales",
    href: "/propietario",
    role: "propietario",
    icon: FileCheck2,
  },
];

export default function Sidebar({
  activeSection,
  onSelectSection,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useSigiStore();

  const activeRole: UserRole =
    currentUser?.role ||
    (pathname === "/propietario"
      ? "propietario"
      : pathname === "/comprador"
      ? "comprador"
      : "asesor");

  const permittedItems = ROLE_NAV_ITEMS.filter(
    (item) => item.role === activeRole
  );

  const handleLogout = () => {
    logout();
    router.push("/login" as never);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-68 bg-[#0B1F3A] text-white flex flex-col justify-between border-r border-white/10 shadow-xl select-none">
      {/* Parte superior: Logo e Identidad Institucional */}
      <div>
        <div className="px-6 pt-6 pb-5 border-b border-white/10">
          <Link
            href={`/${activeRole}` as never}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300 shadow-inner">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-extrabold tracking-[0.14em] text-white uppercase leading-tight">
                COLDWELL BANKER SIGI
              </span>
              <span className="text-[10px] font-semibold tracking-[0.12em] text-sky-300/90 uppercase mt-0.5">
                MÉXICO INSTITUTIONAL HUB
              </span>
            </div>
          </Link>
        </div>

        {/* Menú de Navegación estrictamente filtrado por el rol activo */}
        <div className="px-3.5 py-5">
          <p className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Módulos Autorizados
          </p>
          <nav className="space-y-1.5">
            {permittedItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection
                ? activeSection === item.id || activeSection === item.label
                : (item.id === "panel-principal" && pathname === "/asesor") ||
                  (item.id === "valuacion" && pathname === "/propietario") ||
                  (item.id === "inventario-lujo" && pathname === "/comprador");

              if (onSelectSection) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectSection(item.label)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#0B1F3A] shadow-sm font-bold"
                        : "text-slate-300 hover:text-white hover:bg-white/8"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isSelected ? "text-[#0B1F3A]" : "text-sky-300/80"
                        }`}
                      />
                      {item.label}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href as never}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-white text-[#0B1F3A] shadow-sm font-bold"
                      : "text-slate-300 hover:text-white hover:bg-white/8"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? "text-[#0B1F3A]" : "text-sky-300/80"
                      }`}
                    />
                    {item.label}
                  </span>
                  <ArrowUpRight
                    className={`w-3.5 h-3.5 ${
                      isSelected ? "text-[#0B1F3A]" : "text-slate-500"
                    }`}
                  />
                </Link>
              );
            })}

            {/* Enlace Sobre Nosotros */}
            <Link
              href={"/sobre-nosotros" as never}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                pathname === "/sobre-nosotros"
                  ? "bg-white text-[#0B1F3A] shadow-sm font-bold"
                  : "text-slate-300 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className="flex items-center gap-3">
                <Info
                  className={`w-4 h-4 ${
                    pathname === "/sobre-nosotros"
                      ? "text-[#0B1F3A]"
                      : "text-sky-300/80"
                  }`}
                />
                Sobre Nosotros
              </span>
              <ArrowUpRight
                className={`w-3.5 h-3.5 ${
                  pathname === "/sobre-nosotros"
                    ? "text-[#0B1F3A]"
                    : "text-slate-500"
                }`}
              />
            </Link>
          </nav>
        </div>
      </div>

      {/* Parte inferior: Badge Verde MLS + Cerrar Sesión */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="rounded-xl bg-emerald-500/12 border border-emerald-400/25 p-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[10px] font-extrabold tracking-wider text-emerald-300 uppercase">
              • ENLACE RED MLS ACTIVO
            </span>
          </div>
          <p className="text-[11px] text-emerald-100/90 font-medium mt-1 pl-4">
            Sincronización Coldwell Global 100%
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-500/15 hover:bg-red-500/25 border border-red-400/30 text-red-200 hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            <LogOut className="w-4 h-4 text-red-300" />
            <span>Cerrar Sesión</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-red-300/80" />
        </button>
      </div>
    </aside>
  );
}
