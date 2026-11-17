"use client";

import { useSyncExternalStore } from "react";
import { normalizeMexicanPhone, sanitizeInput } from "./validations";

export type UserRole = "comprador" | "propietario" | "asesor";

export interface SigiUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  privacyAccepted: boolean;
  privacy_accepted_at: string;
  createdAt: string;
  avatarInitials?: string;
}

export interface PropertyItem {
  id: string;
  folio: string;
  title: string;
  location: string;
  salePrice: number;
  salePriceDisplay: string;
  rentPrice?: number;
  rentPriceDisplay?: string;
  landArea: number;
  landAreaDisplay: string;
  constructionArea: number;
  constructionAreaDisplay: string;
  bedrooms: number;
  bedroomsDisplay: string;
  bathrooms: number;
  bathroomsDisplay: string;
  parkingSpaces?: number;
  parkingDisplay?: string;
  aiMatch: number;
  aiMatchDisplay: string;
  plusvalia?: string;
  capRate?: string;
  image: string;
  featured?: boolean;
  ownerUnit?: boolean;
  status?: "Activa" | "En Cierre" | "Dictaminación" | "Exclusiva MLS";
  createdAt: string;
}

export interface OmnichannelLead {
  id: string;
  initials: string;
  fullName: string;
  profileType: string;
  phone: string;
  email: string;
  interestProperty: string;
  budgetDisplay: string;
  status: string;
  role: UserRole;
  aiBadge?: string;
  privacyAccepted: boolean;
  privacy_accepted_at: string;
  createdAt: string;
}

export interface SigiState {
  currentUser: SigiUser | null;
  users: SigiUser[];
  properties: PropertyItem[];
  leads: OmnichannelLead[];
  searchQuery: string;
}

const STORAGE_KEY = "sigi_coldwell_banker_store_v1";

export const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: "prop-juriquilla-089",
    folio: "MX-QRO-2025-089",
    title: "Residencia Cumbres de Juriquilla",
    location:
      "Paseo de la Alborada #104, Fracc. Cumbres del Lago, Juriquilla, QRO.",
    salePrice: 4350000,
    salePriceDisplay: "$4,350,000",
    rentPrice: 32000,
    rentPriceDisplay: "$32,000",
    landArea: 315,
    landAreaDisplay: "315 m²",
    constructionArea: 280,
    constructionAreaDisplay: "280 m²",
    bedrooms: 3,
    bedroomsDisplay: "3 Recámaras",
    bathrooms: 3.5,
    bathroomsDisplay: "3.5 Baños",
    parkingSpaces: 2,
    parkingDisplay: "2 Autos",
    aiMatch: 96,
    aiMatchDisplay: "96%",
    plusvalia: "+11.8%",
    capRate: "8.8% Anual",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    featured: true,
    status: "Exclusiva MLS",
    createdAt: "2025-01-15T10:00:00.000Z",
  },
  {
    id: "prop-villa-campanario",
    folio: "MX-QRO-2025-102",
    title: "Villa Campanario",
    location: "Hacienda El Campanario Residencial & Golf, Querétaro, QRO.",
    salePrice: 16900000,
    salePriceDisplay: "$16.9M MXN",
    rentPrice: 95000,
    rentPriceDisplay: "$95,000",
    landArea: 540,
    landAreaDisplay: "540 m²",
    constructionArea: 460,
    constructionAreaDisplay: "460 m²",
    bedrooms: 4,
    bedroomsDisplay: "4 Recámaras",
    bathrooms: 4.5,
    bathroomsDisplay: "4.5 Baños",
    parkingSpaces: 3,
    parkingDisplay: "3 Autos",
    aiMatch: 92,
    aiMatchDisplay: "92%",
    plusvalia: "+12.4%",
    capRate: "8.2% Anual",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
    status: "Activa",
    createdAt: "2025-01-18T12:30:00.000Z",
  },
  {
    id: "prop-torre-sofia-spgg",
    folio: "MX-NL-2025-114",
    title: "Torre Sofía SPGG",
    location: "Av. Ricardo Margáin Zozaya, San Pedro Garza García, N.L.",
    salePrice: 23500000,
    salePriceDisplay: "$23.5M MXN",
    rentPrice: 128000,
    rentPriceDisplay: "$128,000",
    landArea: 380,
    landAreaDisplay: "380 m²",
    constructionArea: 380,
    constructionAreaDisplay: "380 m²",
    bedrooms: 3,
    bedroomsDisplay: "3 Recámaras",
    bathrooms: 3.5,
    bathroomsDisplay: "3.5 Baños",
    parkingSpaces: 3,
    parkingDisplay: "3 Autos",
    aiMatch: 89,
    aiMatchDisplay: "89%",
    plusvalia: "+13.1%",
    capRate: "7.9% Anual",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=80",
    status: "Activa",
    createdAt: "2025-01-20T09:15:00.000Z",
  },
  {
    id: "prop-campos-eliseos",
    folio: "MX-CDMX-2025-128",
    title: "Campos Elíseos",
    location: "Campos Elíseos #240, Polanco IV Sección, Miguel Hidalgo, CDMX.",
    salePrice: 31000000,
    salePriceDisplay: "$31.0M MXN",
    rentPrice: 165000,
    rentPriceDisplay: "$165,000",
    landArea: 420,
    landAreaDisplay: "420 m²",
    constructionArea: 420,
    constructionAreaDisplay: "420 m²",
    bedrooms: 4,
    bedroomsDisplay: "4 Recámaras",
    bathrooms: 4.5,
    bathroomsDisplay: "4.5 Baños",
    parkingSpaces: 4,
    parkingDisplay: "4 Autos",
    aiMatch: 87,
    aiMatchDisplay: "87%",
    plusvalia: "+10.9%",
    capRate: "7.5% Anual",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=900&q=80",
    status: "Activa",
    createdAt: "2025-01-22T16:40:00.000Z",
  },
  {
    id: "prop-villa-cumbres-a104",
    folio: "MX-NL-2025-104",
    title: "Villa Cumbres del Valle • Residencia A-104",
    location: "Residencial San Pedro Garza García, N.L.",
    salePrice: 4350000,
    salePriceDisplay: "$4,350,000 MXN",
    rentPrice: 34500,
    rentPriceDisplay: "$34,500",
    landArea: 620,
    landAreaDisplay: "620 m²",
    constructionArea: 485,
    constructionAreaDisplay: "485 m²",
    bedrooms: 4,
    bedroomsDisplay: "4 Recámaras",
    bathrooms: 5.5,
    bathroomsDisplay: "5.5 Baños",
    parkingSpaces: 3,
    parkingDisplay: "3 Autos",
    aiMatch: 95,
    aiMatchDisplay: "95%",
    plusvalia: "+11.8%",
    capRate: "8.8% Anual",
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
    ownerUnit: true,
    status: "Exclusiva MLS",
    createdAt: "2025-01-25T11:00:00.000Z",
  },
];

export const INITIAL_LEADS: OmnichannelLead[] = [
  {
    id: "lead-ev-01",
    initials: "EV",
    fullName: "Eduardo Valenzuela",
    profileType: "Inversionista Privado",
    phone: "+52 55 4190 8234",
    email: "e.valenzuela@fondopatrimonial.mx",
    interestProperty: "Penthouse Rubén Darío",
    budgetDisplay: "$38,500,000 MXN",
    status: "Cierre notarial",
    role: "comprador",
    privacyAccepted: true,
    privacy_accepted_at: "2025-02-01T14:22:00.000Z",
    createdAt: "2025-02-01T14:22:00.000Z",
  },
  {
    id: "lead-sl-02",
    initials: "SL",
    fullName: "Sofía Landeros",
    profileType: "Comprador Directo",
    phone: "+52 55 8832 9910",
    email: "sofia.landeros@residencial.mx",
    interestProperty: "Residencia San Ángel",
    budgetDisplay: "$24,900,000 MXN",
    status: "En oferta (LOI)",
    role: "comprador",
    privacyAccepted: true,
    privacy_accepted_at: "2025-02-02T09:15:00.000Z",
    createdAt: "2025-02-02T09:15:00.000Z",
  },
  {
    id: "lead-mr-03",
    initials: "MR",
    fullName: "Mauricio Rivas",
    profileType: "Propietario / Consignatario",
    phone: "+52 55 1209 3847",
    email: "m.rivas@corporativopedregal.mx",
    interestProperty: "Villa Magna Pedregal",
    budgetDisplay: "Exclusiva Captación",
    status: "Visita Hoy 17:30",
    role: "propietario",
    privacyAccepted: true,
    privacy_accepted_at: "2025-02-03T11:45:00.000Z",
    createdAt: "2025-02-03T11:45:00.000Z",
  },
  {
    id: "lead-al-04",
    initials: "AL",
    fullName: "Alejandra Lozano",
    profileType: "Renta Corporativa",
    phone: "+52 55 9045 1283",
    email: "a.lozano@reforma-corp.com.mx",
    interestProperty: "Piso Corporativo Reforma",
    budgetDisplay: "$145,000 MXN / mes",
    status: "Nuevo contacto",
    role: "comprador",
    aiBadge: "96% IA",
    privacyAccepted: true,
    privacy_accepted_at: "2025-02-04T16:10:00.000Z",
    createdAt: "2025-02-04T16:10:00.000Z",
  },
];

const INITIAL_USERS: SigiUser[] = [
  {
    id: "usr-default-asesor",
    role: "asesor",
    fullName: "Asesor Premier CB",
    email: "asesor.premier@coldwellbanker.com.mx",
    phone: "5541908200",
    privacyAccepted: true,
    privacy_accepted_at: "2025-01-10T08:00:00.000Z",
    createdAt: "2025-01-10T08:00:00.000Z",
    avatarInitials: "CB",
  },
];

const DEFAULT_STATE: SigiState = {
  currentUser: null,
  users: INITIAL_USERS,
  properties: INITIAL_PROPERTIES,
  leads: INITIAL_LEADS,
  searchQuery: "",
};

let memoryState: SigiState = DEFAULT_STATE;
let isHydrated = false;
const listeners = new Set<() => void>();

function getInitials(name: string): string {
  const parts = name
    .replace(/^Lic\.\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "CB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function hydrateFromStorage(): void {
  if (isHydrated || typeof window === "undefined") return;
  isHydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SigiState>;
      memoryState = {
        currentUser: parsed.currentUser ?? DEFAULT_STATE.currentUser,
        users:
          Array.isArray(parsed.users) && parsed.users.length > 0
            ? parsed.users
            : DEFAULT_STATE.users,
        properties:
          Array.isArray(parsed.properties) && parsed.properties.length > 0
            ? parsed.properties
            : DEFAULT_STATE.properties,
        leads:
          Array.isArray(parsed.leads) && parsed.leads.length > 0
            ? parsed.leads
            : DEFAULT_STATE.leads,
        searchQuery: parsed.searchQuery ?? "",
      };
    }
  } catch {
    memoryState = DEFAULT_STATE;
  }
}

function persistState(nextState: SigiState): void {
  memoryState = nextState;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      // Ignore quota errors in private browsing
    }
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  if (typeof window !== "undefined" && !isHydrated) {
    hydrateFromStorage();
  }
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      try {
        memoryState = JSON.parse(event.newValue) as SigiState;
        listeners.forEach((l) => l());
      } catch {
        // Ignore malformed JSON
      }
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", handleStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", handleStorage);
    }
  };
}

function getSnapshot(): SigiState {
  if (typeof window !== "undefined" && !isHydrated) {
    hydrateFromStorage();
  }
  return memoryState;
}

function getServerSnapshot(): SigiState {
  return DEFAULT_STATE;
}

/**
 * Acciones del Store Reactivo SIGI Coldwell Banker
 */
export const sigiStoreActions = {
  /**
   * Registra un nuevo usuario verificando duplicidad de correo y teléfono,
   * y guarda el timestamp exacto de aceptación LFPDPPP (`privacy_accepted_at`).
   */
  registerUser(input: {
    role: UserRole;
    fullName: string;
    email: string;
    phone: string;
    privacyAccepted: boolean;
  }): { success: boolean; error?: string; user?: SigiUser } {
    hydrateFromStorage();

    const cleanEmail = sanitizeInput(input.email).toLowerCase();
    const cleanPhone = normalizeMexicanPhone(input.phone);
    const cleanName = sanitizeInput(input.fullName);

    const emailExists = memoryState.users.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    if (emailExists) {
      return {
        success: false,
        error:
          "Este correo electrónico ya se encuentra registrado en el padrón SIGI Coldwell Banker.",
      };
    }

    const phoneExists = memoryState.users.some(
      (u) => normalizeMexicanPhone(u.phone) === cleanPhone
    );
    if (phoneExists) {
      return {
        success: false,
        error:
          "Este número telefónico celular ya está vinculado a otra cuenta activa en SIGI.",
      };
    }

    const nowIso = new Date().toISOString();
    const newUser: SigiUser = {
      id: `usr-${Date.now()}`,
      role: input.role,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      privacyAccepted: input.privacyAccepted,
      privacy_accepted_at: nowIso,
      createdAt: nowIso,
      avatarInitials: getInitials(cleanName),
    };

    persistState({
      ...memoryState,
      currentUser: newUser,
      users: [newUser, ...memoryState.users],
    });

    return { success: true, user: newUser };
  },

  /**
   * Inicia sesión con SSO o Academia guardando el rol elegido y timestamp LFPDPPP
   */
  loginOrSetRole(params: {
    role: UserRole;
    fullName?: string;
    email?: string;
    phone?: string;
  }): SigiUser {
    hydrateFromStorage();
    const nowIso = new Date().toISOString();
    const email = (
      params.email ||
      memoryState.currentUser?.email ||
      `${params.role}@coldwellbanker.com.mx`
    )
      .trim()
      .toLowerCase();

    const existing = memoryState.users.find(
      (u) => u.email.toLowerCase() === email
    );

    const activeUser: SigiUser = existing
      ? {
          ...existing,
          role: params.role,
          fullName: params.fullName || existing.fullName,
        }
      : {
          id: `usr-${Date.now()}`,
          role: params.role,
          fullName:
            params.fullName ||
            (params.role === "asesor"
              ? "Asesor Premier CB"
              : params.role === "propietario"
              ? "Lic. Regina Luján (Propietario)"
              : "Lic. Regina Luján"),
          email,
          phone: params.phone || "5589201200",
          privacyAccepted: true,
          privacy_accepted_at: nowIso,
          createdAt: nowIso,
          avatarInitials: getInitials(
            params.fullName || "Lic. Regina Luján"
          ),
        };

    const updatedUsers = existing
      ? memoryState.users.map((u) =>
          u.id === existing.id ? activeUser : u
        )
      : [activeUser, ...memoryState.users];

    persistState({
      ...memoryState,
      currentUser: activeUser,
      users: updatedUsers,
    });

    return activeUser;
  },

  /**
   * Agrega una nueva propiedad validada al inventario global
   */
  addProperty(input: {
    title: string;
    location: string;
    salePrice: number;
    rentPrice?: number;
    landArea: number;
    constructionArea: number;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    image?: string;
    folio?: string;
  }): PropertyItem {
    hydrateFromStorage();

    const formattedSale = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    }).format(input.salePrice);

    const formattedRent = input.rentPrice
      ? new Intl.NumberFormat("es-MX", {
          style: "currency",
          currency: "MXN",
          maximumFractionDigits: 0,
        }).format(input.rentPrice)
      : undefined;

    const randomSeq = Math.floor(100 + Math.random() * 900);
    const newProperty: PropertyItem = {
      id: `prop-${Date.now()}`,
      folio: input.folio || `MX-CB-2025-${randomSeq}`,
      title: sanitizeInput(input.title),
      location: sanitizeInput(input.location),
      salePrice: input.salePrice,
      salePriceDisplay: formattedSale,
      rentPrice: input.rentPrice,
      rentPriceDisplay: formattedRent,
      landArea: input.landArea,
      landAreaDisplay: `${input.landArea} m²`,
      constructionArea: input.constructionArea,
      constructionAreaDisplay: `${input.constructionArea} m²`,
      bedrooms: input.bedrooms ?? 3,
      bedroomsDisplay: `${input.bedrooms ?? 3} Recámaras`,
      bathrooms: input.bathrooms ?? 3.5,
      bathroomsDisplay: `${input.bathrooms ?? 3.5} Baños`,
      parkingSpaces: input.parkingSpaces ?? 2,
      parkingDisplay: `${input.parkingSpaces ?? 2} Autos`,
      aiMatch: 94,
      aiMatchDisplay: "94%",
      plusvalia: "+11.8%",
      capRate: "8.8% Anual",
      image:
        input.image ||
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80",
      status: "Activa",
      createdAt: new Date().toISOString(),
    };

    persistState({
      ...memoryState,
      properties: [newProperty, ...memoryState.properties],
    });

    return newProperty;
  },

  /**
   * Agrega un nuevo prospecto a la Bandeja Omnicanal verificando no duplicados
   */
  addLead(input: {
    fullName: string;
    email: string;
    phone: string;
    interestProperty: string;
    budgetDisplay: string;
    role?: UserRole;
    profileType?: string;
    status?: string;
    privacyAccepted: boolean;
  }): { success: boolean; error?: string; lead?: OmnichannelLead } {
    hydrateFromStorage();

    const cleanEmail = sanitizeInput(input.email).toLowerCase();
    const cleanPhone = normalizeMexicanPhone(input.phone);

    const duplicate = memoryState.leads.some(
      (l) =>
        l.email.toLowerCase() === cleanEmail ||
        normalizeMexicanPhone(l.phone) === cleanPhone
    );

    if (duplicate) {
      return {
        success: false,
        error:
          "Ya existe un expediente activo con el mismo correo o teléfono en la Bandeja Omnicanal.",
      };
    }

    const nowIso = new Date().toISOString();
    const formattedPhone = `+52 ${cleanPhone.slice(0, 2)} ${cleanPhone.slice(
      2,
      6
    )} ${cleanPhone.slice(6, 10)}`;

    const newLead: OmnichannelLead = {
      id: `lead-${Date.now()}`,
      initials: getInitials(input.fullName),
      fullName: sanitizeInput(input.fullName),
      profileType: input.profileType || "Comprador Directo",
      phone: formattedPhone,
      email: cleanEmail,
      interestProperty: sanitizeInput(input.interestProperty),
      budgetDisplay: sanitizeInput(input.budgetDisplay),
      status: input.status || "Nuevo contacto",
      role: input.role || "comprador",
      aiBadge: "94% IA",
      privacyAccepted: input.privacyAccepted,
      privacy_accepted_at: nowIso,
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      leads: [newLead, ...memoryState.leads],
    });

    return { success: true, lead: newLead };
  },

  setSearchQuery(query: string): void {
    hydrateFromStorage();
    persistState({
      ...memoryState,
      searchQuery: sanitizeInput(query),
    });
  },

  logout(): void {
    hydrateFromStorage();
    persistState({
      ...memoryState,
      currentUser: null,
    });
  },
};

/**
 * Hook Reactivo para consumir y actualizar el estado global SIGI Coldwell Banker
 */
export function useSigiStore() {
  const state = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  return {
    ...state,
    ...sigiStoreActions,
  };
}
