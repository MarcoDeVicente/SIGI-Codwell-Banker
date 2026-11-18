"use client";

import { useSyncExternalStore } from "react";
import { normalizeMexicanPhone, sanitizeInput } from "./validations";
import { supabase, isSupabaseConfigured } from "./supabase";

export type UserRole = "comprador" | "propietario" | "asesor";

export interface SigiUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  monthlyGoal?: number;
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
  zone?: string;
  typology?: string;
  salePrice: number;
  salePriceDisplay: string;
  rentPrice?: number;
  rentPriceDisplay?: string;
  suggestedSaleMin?: number;
  suggestedSaleMax?: number;
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
  marketDemand?: string;
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

export interface PropertyVisit {
  id: string;
  propertyFolio: string;
  visitorName: string;
  visitorPhone: string;
  scheduleLabel: string;
  buyerScoreBadge: string;
  visitPurpose: string;
  status: string;
  createdAt: string;
}

export interface PropertyOffer {
  id: string;
  offerFolio: string;
  propertyFolio: string;
  offerAmount: number;
  offerAmountDisplay: string;
  offerStatusBadge: string;
  paymentScheme: string;
  pricePercentageNote: string;
  createdAt: string;
}

export interface LegalDocumentItem {
  id: string;
  propertyFolio: string;
  documentTitle: string;
  documentDetail: string;
  verificationStatus: string;
  fileUrl: string | null;
  updatedAt: string;
}

export interface SigiState {
  currentUser: SigiUser | null;
  users: SigiUser[];
  properties: PropertyItem[];
  leads: OmnichannelLead[];
  visits: PropertyVisit[];
  offers: PropertyOffer[];
  legalDocuments: LegalDocumentItem[];
  searchQuery: string;
}

const STORAGE_KEY = "sigi_coldwell_banker_store_v1";

export function formatMexicanPhoneDisplay(phone: string): string {
  const clean = normalizeMexicanPhone(phone);
  if (clean.length === 10) {
    return `+52 ${clean.slice(0, 2)} ${clean.slice(2, 6)} ${clean.slice(
      6,
      10
    )}`;
  }
  return phone.trim();
}

function formatCurrencyMXN(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPropertySaleDisplay(amount: number): string {
  if (amount >= 10_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M MXN`;
  }
  return formatCurrencyMXN(amount);
}

export const INITIAL_PROPERTIES: PropertyItem[] = [
  {
    id: "prop-juriquilla-089",
    folio: "MX-QRO-2025-089",
    title: "Residencia Cumbres de Juriquilla",
    location:
      "Paseo de la Alborada #104, Fracc. Cumbres del Lago, Juriquilla, QRO.",
    zone: "Juriquilla, Querétaro",
    typology: "Residencial / Villa",
    salePrice: 4350000,
    salePriceDisplay: "$4,350,000",
    rentPrice: 32000,
    rentPriceDisplay: "$32,000",
    suggestedSaleMin: 4250000,
    suggestedSaleMax: 4480000,
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
    marketDemand: "Alta / En Tendencia Regional",
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
    zone: "Juriquilla, Querétaro",
    typology: "Residencial / Villa",
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
    zone: "San Pedro Garza García, N.L.",
    typology: "Penthouse & Sky Residence",
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
    zone: "Polanco IV Sección, CDMX",
    typology: "Penthouse & Sky Residence",
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
    zone: "San Pedro Garza García, N.L.",
    typology: "Residencial / Villa",
    salePrice: 4350000,
    salePriceDisplay: "$4,350,000",
    rentPrice: 34500,
    rentPriceDisplay: "$34,500",
    suggestedSaleMin: 4250000,
    suggestedSaleMax: 4480000,
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
    marketDemand: "Alta / En Tendencia Regional",
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

export const INITIAL_VISITS: PropertyVisit[] = [
  {
    id: "visit-1",
    propertyFolio: "MX-NL-2025-104",
    visitorName: "Dr. Fernando Morales V.",
    visitorPhone: "+52 81 1122 3344",
    scheduleLabel: "Mañana, 11:30 AM",
    buyerScoreBadge: "Score 920 pts",
    visitPurpose: "Intento de Compra Directa",
    status: "Confirmada",
    createdAt: "2025-02-01T10:00:00.000Z",
  },
  {
    id: "visit-2",
    propertyFolio: "MX-NL-2025-104",
    visitorName: "Lic. Sofía Alatorre",
    visitorPhone: "+52 81 2233 4455",
    scheduleLabel: "Jueves 17, 04:00 PM",
    buyerScoreBadge: "Score 795 pts",
    visitPurpose: "Arrendamiento Corporativo",
    status: "Confirmada",
    createdAt: "2025-02-01T11:00:00.000Z",
  },
  {
    id: "visit-3",
    propertyFolio: "MX-NL-2025-104",
    visitorName: "Ing. Carlos Baillères",
    visitorPhone: "+52 55 3344 5566",
    scheduleLabel: "Sábado 19, 10:00 AM",
    buyerScoreBadge: "Cash Buyer",
    visitPurpose: "Inversión Patrimonial",
    status: "Confirmada",
    createdAt: "2025-02-01T12:00:00.000Z",
  },
];

export const INITIAL_OFFERS: PropertyOffer[] = [
  {
    id: "offer-882",
    offerFolio: "Folio #OF-882",
    propertyFolio: "MX-NL-2025-104",
    offerAmount: 4200000,
    offerAmountDisplay: "$4,200,000 MXN",
    offerStatusBadge: "Nueva",
    paymentScheme: "Transferencia Contado",
    pricePercentageNote: "96.5% de precio lista",
    createdAt: "2025-02-02T10:00:00.000Z",
  },
  {
    id: "offer-841",
    offerFolio: "Folio #OF-841",
    propertyFolio: "MX-NL-2025-104",
    offerAmount: 4100000,
    offerAmountDisplay: "$4,100,000 MXN",
    offerStatusBadge: "Contraoferta",
    paymentScheme: "Crédito Cofinavit BBVA",
    pricePercentageNote: "94.2% de precio lista",
    createdAt: "2025-02-01T15:00:00.000Z",
  },
];

export const INITIAL_LEGAL_DOCUMENTS: LegalDocumentItem[] = [
  {
    id: "doc-1",
    propertyFolio: "MX-NL-2025-104",
    documentTitle: "Escritura Pública en RPP",
    documentDetail: "Folio Real 4492-SP • Notaría 19",
    verificationStatus: "Verificado",
    fileUrl: null,
    updatedAt: "2025-02-01T10:00:00.000Z",
  },
  {
    id: "doc-2",
    propertyFolio: "MX-NL-2025-104",
    documentTitle: "Boleta Predial 2025",
    documentDetail: "Pagado Anualidad Completa",
    verificationStatus: "Verificado",
    fileUrl: null,
    updatedAt: "2025-02-01T10:00:00.000Z",
  },
  {
    id: "doc-3",
    propertyFolio: "MX-NL-2025-104",
    documentTitle: "Libertad de Gravamen",
    documentDetail: "Vigencia Mayo 2025 Sin Hipoteca",
    verificationStatus: "Verificado",
    fileUrl: null,
    updatedAt: "2025-02-01T10:00:00.000Z",
  },
];

const INITIAL_USERS: SigiUser[] = [
  {
    id: "usr-default-asesor",
    role: "asesor",
    fullName: "Asesor Premier CB",
    email: "asesor.premier@coldwellbanker.com.mx",
    phone: "+52 55 4190 8200",
    monthlyGoal: 220000,
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
  visits: INITIAL_VISITS,
  offers: INITIAL_OFFERS,
  legalDocuments: INITIAL_LEGAL_DOCUMENTS,
  searchQuery: "",
};

let memoryState: SigiState = DEFAULT_STATE;
let isHydrated = false;
let isSupabaseFetched = false;
let isRealtimeSubscribed = false;
const listeners = new Set<() => void>();

function getInitials(name: string): string {
  const parts = name
    .replace(/^(?:Lic\.|Ing\.|Dr\.|Arq\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "CB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function mapProfileRowToUser(row: Record<string, unknown>): SigiUser {
  const fullName = String(row.full_name || "Usuario SIGI");
  const privacyTs = String(row.privacy_accepted_at || new Date().toISOString());
  return {
    id: String(row.id || `usr-${Date.now()}`),
    role: (row.role as UserRole) || "comprador",
    fullName,
    email: String(row.email || "").toLowerCase(),
    phone: String(row.phone || ""),
    monthlyGoal:
      typeof row.monthly_goal === "number" ? row.monthly_goal : 220000,
    privacyAccepted: Boolean(row.privacy_accepted_at),
    privacy_accepted_at: privacyTs,
    createdAt: String(row.created_at || privacyTs),
    avatarInitials: getInitials(fullName),
  };
}

function mapPropertyRowToItem(row: Record<string, unknown>): PropertyItem {
  const salePrice = Number(row.sale_price) || 4350000;
  const rentPrice =
    row.rent_price != null && Number(row.rent_price) > 0
      ? Number(row.rent_price)
      : undefined;
  const landArea = Number(row.land_area_m2) || 300;
  const constructionArea = Number(row.construction_area_m2) || 250;
  const bedrooms = Number(row.bedrooms) || 3;
  const bathrooms = Number(row.bathrooms) || 3.5;
  const parkingSpaces = Number(row.parking) || 2;
  const aiMatch = Number(row.ai_match_score) || 94;
  const plusvaliaNum =
    row.plusvalia_anual != null ? Number(row.plusvalia_anual) : 11.8;
  const capRateNum = row.cap_rate != null ? Number(row.cap_rate) : 8.8;
  const folio = String(row.folio || "MX-CB-2025-100");

  return {
    id: String(row.id || folio),
    folio,
    title: String(row.title || "Residencia Coldwell Banker"),
    location: String(row.location || "México"),
    zone: row.zone ? String(row.zone) : undefined,
    typology: row.typology ? String(row.typology) : undefined,
    salePrice,
    salePriceDisplay: formatPropertySaleDisplay(salePrice),
    rentPrice,
    rentPriceDisplay: rentPrice ? formatCurrencyMXN(rentPrice) : undefined,
    suggestedSaleMin:
      row.suggested_sale_min != null
        ? Number(row.suggested_sale_min)
        : Math.round(salePrice * 0.97),
    suggestedSaleMax:
      row.suggested_sale_max != null
        ? Number(row.suggested_sale_max)
        : Math.round(salePrice * 1.03),
    landArea,
    landAreaDisplay: `${landArea} m²`,
    constructionArea,
    constructionAreaDisplay: `${constructionArea} m²`,
    bedrooms,
    bedroomsDisplay: `${bedrooms} Recámaras`,
    bathrooms,
    bathroomsDisplay: `${bathrooms} Baños`,
    parkingSpaces,
    parkingDisplay: `${parkingSpaces} Autos`,
    aiMatch,
    aiMatchDisplay: `${aiMatch}%`,
    plusvalia: `+${plusvaliaNum}%`,
    capRate: `${capRateNum}% Anual`,
    marketDemand: row.market_demand
      ? String(row.market_demand)
      : "Alta / En Tendencia Regional",
    image: String(
      row.image_url ||
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80"
    ),
    featured: folio === "MX-QRO-2025-089",
    ownerUnit: folio === "MX-NL-2025-104",
    status: row.is_exclusive ? "Exclusiva MLS" : "Activa",
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapLeadRowToItem(row: Record<string, unknown>): OmnichannelLead {
  const fullName = String(row.full_name || "Prospecto SIGI");
  const aiMatchNum =
    row.ai_match != null && Number(row.ai_match) > 0
      ? Number(row.ai_match)
      : undefined;
  const privacyTs = String(row.privacy_accepted_at || new Date().toISOString());

  return {
    id: String(row.id || `lead-${Date.now()}`),
    initials: String(row.initials || getInitials(fullName)),
    fullName,
    profileType: String(row.profile_type || "Inversionista Privado"),
    phone: String(row.phone || ""),
    email: String(row.email || "").toLowerCase(),
    interestProperty: String(row.interest_property || ""),
    budgetDisplay: String(row.budget_display || ""),
    status: String(row.status || "Nuevo contacto"),
    role: (row.lead_category as UserRole) || "comprador",
    aiBadge: aiMatchNum ? `${aiMatchNum}% IA` : undefined,
    privacyAccepted: Boolean(row.privacy_accepted_at),
    privacy_accepted_at: privacyTs,
    createdAt: String(row.created_at || privacyTs),
  };
}

function mapVisitRowToItem(row: Record<string, unknown>): PropertyVisit {
  return {
    id: String(row.id || `visit-${Date.now()}`),
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    visitorName: String(row.visitor_name || "Visitante Registrado"),
    visitorPhone: String(row.visitor_phone || "+52 55 8920 1200"),
    scheduleLabel: String(row.schedule_label || "Mañana, 11:30 AM"),
    buyerScoreBadge: String(row.buyer_score_badge || "Score 920 pts"),
    visitPurpose: String(row.visit_purpose || "Intento de Compra Directa"),
    status: String(row.status || "Confirmada"),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapOfferRowToItem(row: Record<string, unknown>): PropertyOffer {
  const amount = Number(row.offer_amount) || 4200000;
  return {
    id: String(row.id || `offer-${Date.now()}`),
    offerFolio: String(row.offer_folio || "Folio #OF-882"),
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    offerAmount: amount,
    offerAmountDisplay: `${formatCurrencyMXN(amount)} MXN`,
    offerStatusBadge: String(row.offer_status_badge || "Nueva"),
    paymentScheme: String(row.payment_scheme || "Transferencia Contado"),
    pricePercentageNote: String(
      row.price_percentage_note || "96.5% de precio lista"
    ),
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapLegalDocRowToItem(row: Record<string, unknown>): LegalDocumentItem {
  return {
    id: String(row.id || `doc-${Date.now()}`),
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    documentTitle: String(row.document_title || "Documento Jurídico"),
    documentDetail: String(row.document_detail || "Auditado por Mesa Legal"),
    verificationStatus: String(row.verification_status || "Verificado"),
    fileUrl: row.file_url ? String(row.file_url) : null,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function persistState(nextState: SigiState): void {
  memoryState = nextState;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryState));
    } catch {
      // Ignore storage quota errors
    }
  }
  listeners.forEach((listener) => listener());
}

/**
 * Consulta las 6 tablas reales de Supabase PostgreSQL (profiles, properties,
 * leads, visits, property_offers, legal_documents) e hidrata el estado reactivo.
 */
export async function syncWithSupabase(): Promise<void> {
  if (typeof window === "undefined" || !isSupabaseConfigured) return;

  try {
    const [
      profilesRes,
      propertiesRes,
      leadsRes,
      visitsRes,
      offersRes,
      legalDocsRes,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: true }),
      supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("visits")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("property_offers")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("legal_documents")
        .select("*")
        .order("updated_at", { ascending: false }),
    ]);

    const nextUsers =
      !profilesRes.error &&
      Array.isArray(profilesRes.data) &&
      profilesRes.data.length > 0
        ? profilesRes.data.map((r) =>
            mapProfileRowToUser(r as Record<string, unknown>)
          )
        : memoryState.users;

    const nextProperties =
      !propertiesRes.error &&
      Array.isArray(propertiesRes.data) &&
      propertiesRes.data.length > 0
        ? propertiesRes.data.map((r) =>
            mapPropertyRowToItem(r as Record<string, unknown>)
          )
        : memoryState.properties;

    const nextLeads =
      !leadsRes.error &&
      Array.isArray(leadsRes.data) &&
      leadsRes.data.length > 0
        ? leadsRes.data.map((r) =>
            mapLeadRowToItem(r as Record<string, unknown>)
          )
        : memoryState.leads;

    const nextVisits =
      !visitsRes.error &&
      Array.isArray(visitsRes.data) &&
      visitsRes.data.length > 0
        ? visitsRes.data.map((r) =>
            mapVisitRowToItem(r as Record<string, unknown>)
          )
        : memoryState.visits;

    const nextOffers =
      !offersRes.error &&
      Array.isArray(offersRes.data) &&
      offersRes.data.length > 0
        ? offersRes.data.map((r) =>
            mapOfferRowToItem(r as Record<string, unknown>)
          )
        : memoryState.offers;

    const nextLegalDocs =
      !legalDocsRes.error &&
      Array.isArray(legalDocsRes.data) &&
      legalDocsRes.data.length > 0
        ? legalDocsRes.data.map((r) =>
            mapLegalDocRowToItem(r as Record<string, unknown>)
          )
        : memoryState.legalDocuments;

    persistState({
      ...memoryState,
      users: nextUsers,
      properties: nextProperties,
      leads: nextLeads,
      visits: nextVisits,
      offers: nextOffers,
      legalDocuments: nextLegalDocs,
    });
  } catch {
    // Keep local state if offline
  }
}

function setupRealtimeSubscription(): void {
  if (
    typeof window === "undefined" ||
    !isSupabaseConfigured ||
    isRealtimeSubscribed
  ) {
    return;
  }
  isRealtimeSubscribed = true;

  try {
    supabase
      .channel("sigi-realtime-postgres")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void syncWithSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => {
          void syncWithSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          void syncWithSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "visits" },
        () => {
          void syncWithSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "property_offers" },
        () => {
          void syncWithSupabase();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "legal_documents" },
        () => {
          void syncWithSupabase();
        }
      )
      .subscribe();
  } catch {
    // Ignore websocket errors in restricted environments
  }
}

function hydrateFromStorage(): void {
  if (typeof window === "undefined") return;

  if (!isHydrated) {
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
          visits:
            Array.isArray(parsed.visits) && parsed.visits.length > 0
              ? parsed.visits
              : DEFAULT_STATE.visits,
          offers:
            Array.isArray(parsed.offers) && parsed.offers.length > 0
              ? parsed.offers
              : DEFAULT_STATE.offers,
          legalDocuments:
            Array.isArray(parsed.legalDocuments) &&
            parsed.legalDocuments.length > 0
              ? parsed.legalDocuments
              : DEFAULT_STATE.legalDocuments,
          searchQuery: parsed.searchQuery ?? "",
        };
      }
    } catch {
      memoryState = DEFAULT_STATE;
    }
  }

  if (!isSupabaseFetched && isSupabaseConfigured) {
    isSupabaseFetched = true;
    void syncWithSupabase();
    setupRealtimeSubscription();
  }
}

function subscribe(listener: () => void): () => void {
  if (typeof window !== "undefined") {
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
 * Acciones del Store Reactivo SIGI Coldwell Banker sincronizadas con Supabase PostgreSQL
 */
export const sigiStoreActions = {
  /**
   * Registra un usuario en `public.profiles` formateando el teléfono como `+52 XX XXXX XXXX`
   * y guardando `privacy_accepted_at: new Date().toISOString()`.
   * Si Supabase devuelve error de duplicado (código `23505`), retorna un mensaje claro.
   */
  async registerUser(input: {
    role: UserRole;
    fullName: string;
    email: string;
    phone: string;
    privacyAccepted: boolean;
  }): Promise<{ success: boolean; error?: string; user?: SigiUser }> {
    hydrateFromStorage();

    const cleanEmail = sanitizeInput(input.email).toLowerCase();
    const formattedPhone = formatMexicanPhoneDisplay(input.phone);
    const cleanName = sanitizeInput(input.fullName);
    const nowIso = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          full_name: cleanName,
          email: cleanEmail,
          phone: formattedPhone,
          role: input.role,
          monthly_goal: input.role === "asesor" ? 220000 : 0,
          privacy_accepted_at: nowIso,
        })
        .select("*")
        .single();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate")
        ) {
          const detailLower = `${error.message} ${error.details || ""}`.toLowerCase();
          if (detailLower.includes("email")) {
            return {
              success: false,
              error:
                "Este correo electrónico ya está registrado en el padrón SIGI Coldwell Banker (Código 23505).",
            };
          }
          if (detailLower.includes("phone")) {
            return {
              success: false,
              error:
                "Este número telefónico (+52) ya está registrado en el padrón SIGI Coldwell Banker (Código 23505).",
            };
          }
          return {
            success: false,
            error:
              "El correo electrónico o teléfono ya está registrado en SIGI Coldwell Banker (Código 23505).",
          };
        }

        return {
          success: false,
          error: `No fue posible registrar el perfil en Supabase: ${error.message}`,
        };
      }

      if (data) {
        const createdUser = mapProfileRowToUser(
          data as Record<string, unknown>
        );
        persistState({
          ...memoryState,
          currentUser: createdUser,
          users: [
            createdUser,
            ...memoryState.users.filter((u) => u.id !== createdUser.id),
          ],
        });
        return { success: true, user: createdUser };
      }
    }

    // Fallback local si Supabase no está configurado
    const emailExists = memoryState.users.some(
      (u) => u.email.toLowerCase() === cleanEmail
    );
    const phoneExists = memoryState.users.some(
      (u) =>
        normalizeMexicanPhone(u.phone) === normalizeMexicanPhone(formattedPhone)
    );

    if (emailExists || phoneExists) {
      return {
        success: false,
        error:
          "El correo electrónico o teléfono ya está registrado en SIGI Coldwell Banker.",
      };
    }

    const newUser: SigiUser = {
      id: `usr-${Date.now()}`,
      role: input.role,
      fullName: cleanName,
      email: cleanEmail,
      phone: formattedPhone,
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
   * Inicia sesión con SSO o Academia guardando el rol elegido
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
              ? "Lic. Roberto Garza Sada"
              : "Lic. Regina Luján"),
          email,
          phone: formatMexicanPhoneDisplay(params.phone || "5589201200"),
          privacyAccepted: true,
          privacy_accepted_at: nowIso,
          createdAt: nowIso,
          avatarInitials: getInitials(
            params.fullName || "Lic. Regina Luján"
          ),
        };

    const updatedUsers = existing
      ? memoryState.users.map((u) => (u.id === existing.id ? activeUser : u))
      : [activeUser, ...memoryState.users];

    persistState({
      ...memoryState,
      currentUser: activeUser,
      users: updatedUsers,
    });

    return activeUser;
  },

  /**
   * Registra una nueva propiedad validada e inserta en `public.properties`
   */
  async addProperty(input: {
    title: string;
    location: string;
    zone?: string;
    typology?: string;
    salePrice: number;
    rentPrice?: number;
    landArea: number;
    constructionArea: number;
    bedrooms?: number;
    bathrooms?: number;
    parkingSpaces?: number;
    image?: string;
    folio?: string;
  }): Promise<PropertyItem> {
    hydrateFromStorage();

    const randomSeq = Math.floor(100 + Math.random() * 900);
    const folio = input.folio || `MX-CB-2025-${randomSeq}`;
    const cleanTitle = sanitizeInput(input.title);
    const cleanLocation = sanitizeInput(input.location);
    const nowIso = new Date().toISOString();
    const imageUrl =
      input.image ||
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1400&q=80";

    const optimisticProperty: PropertyItem = {
      id: `prop-${Date.now()}`,
      folio,
      title: cleanTitle,
      location: cleanLocation,
      zone: input.zone || cleanLocation,
      typology: input.typology || "Residencial / Villa",
      salePrice: input.salePrice,
      salePriceDisplay: formatCurrencyMXN(input.salePrice),
      rentPrice: input.rentPrice,
      rentPriceDisplay: input.rentPrice
        ? formatCurrencyMXN(input.rentPrice)
        : undefined,
      suggestedSaleMin: Math.round(input.salePrice * 0.97),
      suggestedSaleMax: Math.round(input.salePrice * 1.03),
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
      marketDemand: "Alta / En Tendencia Regional",
      image: imageUrl,
      status: "Exclusiva MLS",
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      properties: [optimisticProperty, ...memoryState.properties],
    });

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("properties")
        .insert({
          folio,
          title: cleanTitle,
          location: cleanLocation,
          zone: input.zone || cleanLocation,
          typology: input.typology || "Residencial / Villa",
          sale_price: input.salePrice,
          rent_price: input.rentPrice ?? null,
          suggested_sale_min: Math.round(input.salePrice * 0.97),
          suggested_sale_max: Math.round(input.salePrice * 1.03),
          land_area_m2: input.landArea,
          construction_area_m2: input.constructionArea,
          bedrooms: input.bedrooms ?? 3,
          bathrooms: input.bathrooms ?? 3.5,
          parking: input.parkingSpaces ?? 2,
          ai_match_score: 94,
          plusvalia_anual: 11.8,
          cap_rate: 8.8,
          market_demand: "Alta / En Tendencia Regional",
          image_url: imageUrl,
          is_exclusive: true,
          owner_email:
            memoryState.currentUser?.email || "roberto.garza@hnwi.mx",
          privacy_accepted_at: nowIso,
        })
        .select("*")
        .single();

      if (!error && data) {
        const savedProperty = mapPropertyRowToItem(
          data as Record<string, unknown>
        );
        persistState({
          ...memoryState,
          properties: memoryState.properties.map((p) =>
            p.folio === folio ? savedProperty : p
          ),
        });
        return savedProperty;
      }
    }

    return optimisticProperty;
  },

  /**
   * Ajusta el precio de salida de una propiedad haciendo `UPDATE` directo en `public.properties`
   */
  async updatePropertyPrice(
    propertyIdOrFolio: string,
    newSalePrice: number
  ): Promise<{ success: boolean; error?: string }> {
    hydrateFromStorage();

    const target = memoryState.properties.find(
      (p) => p.id === propertyIdOrFolio || p.folio === propertyIdOrFolio
    );
    const minSuggested = Math.round(newSalePrice * 0.97);
    const maxSuggested = Math.round(newSalePrice * 1.03);

    persistState({
      ...memoryState,
      properties: memoryState.properties.map((p) =>
        p.id === propertyIdOrFolio || p.folio === propertyIdOrFolio
          ? {
              ...p,
              salePrice: newSalePrice,
              salePriceDisplay: formatCurrencyMXN(newSalePrice),
              suggestedSaleMin: minSuggested,
              suggestedSaleMax: maxSuggested,
            }
          : p
      ),
    });

    if (isSupabaseConfigured) {
      const folioToMatch = target?.folio || propertyIdOrFolio;
      const { error } = await supabase
        .from("properties")
        .update({
          sale_price: newSalePrice,
          suggested_sale_min: minSuggested,
          suggested_sale_max: maxSuggested,
        })
        .eq("folio", folioToMatch);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  },

  /**
   * Agrega un nuevo prospecto a la Bandeja Omnicanal haciendo `INSERT` en `public.leads`
   */
  async addLead(input: {
    fullName: string;
    email: string;
    phone: string;
    interestProperty: string;
    budgetDisplay: string;
    role?: UserRole;
    profileType?: string;
    status?: string;
    privacyAccepted: boolean;
  }): Promise<{ success: boolean; error?: string; lead?: OmnichannelLead }> {
    hydrateFromStorage();

    const cleanEmail = sanitizeInput(input.email).toLowerCase();
    const formattedPhone = formatMexicanPhoneDisplay(input.phone);
    const cleanName = sanitizeInput(input.fullName);
    const nowIso = new Date().toISOString();
    const roleCategory: UserRole = input.role || "comprador";
    const profileTypeLabel =
      input.profileType ||
      (roleCategory === "propietario"
        ? "Propietario / Consignatario"
        : "Inversionista Privado");

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("leads")
        .insert({
          initials: getInitials(cleanName),
          full_name: cleanName,
          profile_type: profileTypeLabel,
          lead_category: roleCategory,
          phone: formattedPhone,
          email: cleanEmail,
          interest_property: sanitizeInput(input.interestProperty),
          budget_display: sanitizeInput(input.budgetDisplay),
          status: input.status || "Nuevo contacto",
          ai_match: 94,
          privacy_accepted_at: nowIso,
        })
        .select("*")
        .single();

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.toLowerCase().includes("duplicate")
        ) {
          return {
            success: false,
            error:
              "Ya existe un expediente activo con el mismo correo o teléfono en la Bandeja Omnicanal (Código 23505).",
          };
        }
        return {
          success: false,
          error: `Error al guardar el prospecto en Supabase: ${error.message}`,
        };
      }

      if (data) {
        const createdLead = mapLeadRowToItem(data as Record<string, unknown>);
        persistState({
          ...memoryState,
          leads: [
            createdLead,
            ...memoryState.leads.filter((l) => l.id !== createdLead.id),
          ],
        });
        return { success: true, lead: createdLead };
      }
    }

    // Fallback local
    const duplicate = memoryState.leads.some(
      (l) =>
        l.email.toLowerCase() === cleanEmail ||
        normalizeMexicanPhone(l.phone) === normalizeMexicanPhone(formattedPhone)
    );

    if (duplicate) {
      return {
        success: false,
        error:
          "Ya existe un expediente activo con el mismo correo o teléfono en la Bandeja Omnicanal.",
      };
    }

    const newLead: OmnichannelLead = {
      id: `lead-${Date.now()}`,
      initials: getInitials(cleanName),
      fullName: cleanName,
      profileType: profileTypeLabel,
      phone: formattedPhone,
      email: cleanEmail,
      interestProperty: sanitizeInput(input.interestProperty),
      budgetDisplay: sanitizeInput(input.budgetDisplay),
      status: input.status || "Nuevo contacto",
      role: roleCategory,
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

  /**
   * Agenda una visita privada haciendo `INSERT` directo en `public.visits`
   */
  async scheduleVisit(input: {
    propertyFolio?: string;
    propertyTitle?: string;
    visitorName?: string;
    visitorPhone?: string;
    scheduleLabel: string;
    buyerScoreBadge?: string;
    visitPurpose?: string;
  }): Promise<{ success: boolean; error?: string; visit?: PropertyVisit }> {
    hydrateFromStorage();

    const matchedProp = input.propertyTitle
      ? memoryState.properties.find(
          (p) =>
            p.title.toLowerCase() === input.propertyTitle?.toLowerCase() ||
            p.folio === input.propertyFolio
        )
      : undefined;

    const propertyFolio =
      input.propertyFolio || matchedProp?.folio || "MX-QRO-2025-089";
    const visitorName = sanitizeInput(
      input.visitorName ||
        memoryState.currentUser?.fullName ||
        "Lic. Regina Luján"
    );
    const visitorPhone = formatMexicanPhoneDisplay(
      input.visitorPhone || memoryState.currentUser?.phone || "55 8920 1200"
    );
    const scheduleLabel = sanitizeInput(input.scheduleLabel);
    const buyerScoreBadge = input.buyerScoreBadge || "Score 920 pts";
    const visitPurpose = input.visitPurpose || "Intento de Compra Directa";
    const nowIso = new Date().toISOString();

    const optimisticVisit: PropertyVisit = {
      id: `visit-${Date.now()}`,
      propertyFolio,
      visitorName,
      visitorPhone,
      scheduleLabel,
      buyerScoreBadge,
      visitPurpose,
      status: "Confirmada",
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      visits: [optimisticVisit, ...memoryState.visits],
    });

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from("visits")
        .insert({
          property_folio: propertyFolio,
          visitor_name: visitorName,
          visitor_phone: visitorPhone,
          schedule_label: scheduleLabel,
          buyer_score_badge: buyerScoreBadge,
          visit_purpose: visitPurpose,
          status: "Confirmada",
        })
        .select("*")
        .single();

      if (error) {
        return { success: false, error: error.message, visit: optimisticVisit };
      }

      if (data) {
        const savedVisit = mapVisitRowToItem(data as Record<string, unknown>);
        persistState({
          ...memoryState,
          visits: memoryState.visits.map((v) =>
            v.id === optimisticVisit.id ? savedVisit : v
          ),
        });
        return { success: true, visit: savedVisit };
      }
    }

    return { success: true, visit: optimisticVisit };
  },

  /**
   * Responde a una oferta (aceptar o contraofertar) haciendo `UPDATE` directo en `public.property_offers`
   */
  async respondToOffer(input: {
    offerFolio: string;
    statusBadge: string;
    offerAmount?: number;
    pricePercentageNote?: string;
  }): Promise<{ success: boolean; error?: string }> {
    hydrateFromStorage();

    persistState({
      ...memoryState,
      offers: memoryState.offers.map((offer) =>
        offer.offerFolio === input.offerFolio
          ? {
              ...offer,
              offerStatusBadge: input.statusBadge,
              offerAmount: input.offerAmount ?? offer.offerAmount,
              offerAmountDisplay:
                input.offerAmount != null
                  ? `${formatCurrencyMXN(input.offerAmount)} MXN`
                  : offer.offerAmountDisplay,
              pricePercentageNote:
                input.pricePercentageNote ?? offer.pricePercentageNote,
            }
          : offer
      ),
    });

    if (isSupabaseConfigured) {
      const updatePayload: Record<string, unknown> = {
        offer_status_badge: input.statusBadge,
      };
      if (typeof input.offerAmount === "number" && input.offerAmount > 0) {
        updatePayload.offer_amount = input.offerAmount;
      }
      if (input.pricePercentageNote) {
        updatePayload.price_percentage_note = input.pricePercentageNote;
      }

      const { error } = await supabase
        .from("property_offers")
        .update(updatePayload)
        .eq("offer_folio", input.offerFolio);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  },

  /**
   * Actualiza o registra un documento en el Expediente Jurídico (`public.legal_documents`)
   */
  async updateLegalDocument(input: {
    id?: string;
    propertyFolio?: string;
    documentTitle: string;
    documentDetail: string;
    verificationStatus?: string;
    fileUrl?: string | null;
  }): Promise<{
    success: boolean;
    error?: string;
    document?: LegalDocumentItem;
  }> {
    hydrateFromStorage();

    const propertyFolio = input.propertyFolio || "MX-NL-2025-104";
    const documentTitle = sanitizeInput(input.documentTitle);
    const documentDetail = sanitizeInput(input.documentDetail);
    const verificationStatus = input.verificationStatus || "Verificado";
    const fileUrl = input.fileUrl ?? null;
    const nowIso = new Date().toISOString();

    const existingDoc = memoryState.legalDocuments.find(
      (d) =>
        (input.id && d.id === input.id) ||
        d.documentTitle.toLowerCase() === documentTitle.toLowerCase()
    );

    if (isSupabaseConfigured) {
      if (existingDoc && !existingDoc.id.startsWith("doc-")) {
        const { data, error } = await supabase
          .from("legal_documents")
          .update({
            document_title: documentTitle,
            document_detail: documentDetail,
            verification_status: verificationStatus,
            file_url: fileUrl,
            updated_at: nowIso,
          })
          .eq("id", existingDoc.id)
          .select("*")
          .single();

        if (!error && data) {
          const updated = mapLegalDocRowToItem(data as Record<string, unknown>);
          persistState({
            ...memoryState,
            legalDocuments: memoryState.legalDocuments.map((d) =>
              d.id === existingDoc.id ? updated : d
            ),
          });
          return { success: true, document: updated };
        }
      }

      const { data, error } = await supabase
        .from("legal_documents")
        .insert({
          property_folio: propertyFolio,
          document_title: documentTitle,
          document_detail: documentDetail,
          verification_status: verificationStatus,
          file_url: fileUrl,
          updated_at: nowIso,
        })
        .select("*")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      if (data) {
        const inserted = mapLegalDocRowToItem(data as Record<string, unknown>);
        persistState({
          ...memoryState,
          legalDocuments: [
            inserted,
            ...memoryState.legalDocuments.filter((d) => d.id !== inserted.id),
          ],
        });
        return { success: true, document: inserted };
      }
    }

    const fallbackDoc: LegalDocumentItem = {
      id: existingDoc?.id || `doc-${Date.now()}`,
      propertyFolio,
      documentTitle,
      documentDetail,
      verificationStatus,
      fileUrl,
      updatedAt: nowIso,
    };

    persistState({
      ...memoryState,
      legalDocuments: existingDoc
        ? memoryState.legalDocuments.map((d) =>
            d.id === existingDoc.id ? fallbackDoc : d
          )
        : [fallbackDoc, ...memoryState.legalDocuments],
    });

    return { success: true, document: fallbackDoc };
  },

  /**
   * Actualiza el Estado de Negociación de un prospecto haciendo UPDATE en `public.leads`
   */
  async updateLeadStatus(
    leadId: string,
    newStatus: string
  ): Promise<{ success: boolean; error?: string }> {
    hydrateFromStorage();

    const targetLead = memoryState.leads.find((l) => l.id === leadId);
    const cleanStatus = sanitizeInput(newStatus);

    persistState({
      ...memoryState,
      leads: memoryState.leads.map((l) =>
        l.id === leadId ? { ...l, status: cleanStatus } : l
      ),
    });

    if (isSupabaseConfigured && targetLead) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          targetLead.id
        );

      const query = isUuid
        ? supabase
            .from("leads")
            .update({ status: cleanStatus })
            .eq("id", targetLead.id)
        : supabase
            .from("leads")
            .update({ status: cleanStatus })
            .eq("email", targetLead.email);

      const { error } = await query;
      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  },

  /**
   * Ejecuta el análisis predictivo SIGI Match v4.8 para asignar la propiedad ideal
   * del catálogo a cada prospecto activo y persistir en `public.leads`.
   */
  async runLeadAiMatchingSimulation(): Promise<{
    success: boolean;
    matchedCount: number;
    assignments: Array<{
      leadName: string;
      assignedProperty: string;
      aiScore: number;
    }>;
  }> {
    hydrateFromStorage();

    const catalog =
      memoryState.properties.length > 0
        ? memoryState.properties
        : INITIAL_PROPERTIES;

    const assignments: Array<{
      leadName: string;
      assignedProperty: string;
      aiScore: number;
    }> = [];

    const updatedLeads: OmnichannelLead[] = memoryState.leads.map(
      (lead, index) => {
        const budgetRaw = lead.budgetDisplay.replace(/[^0-9.]/g, "");
        const numericVal = parseFloat(budgetRaw) || 0;
        const isRentLead =
          lead.budgetDisplay.toLowerCase().includes("mes") ||
          lead.profileType.toLowerCase().includes("renta");

        let parsedBudgetMXN = numericVal;
        if (
          lead.budgetDisplay.toLowerCase().includes("m") &&
          !lead.budgetDisplay.toLowerCase().includes("mes") &&
          numericVal < 200
        ) {
          parsedBudgetMXN = numericVal * 1_000_000;
        } else if (parsedBudgetMXN === 0) {
          parsedBudgetMXN = 18_500_000;
        }

        // Seleccionar la propiedad del catálogo con mayor afinidad real
        let bestProp = catalog[index % catalog.length] || catalog[0];
        let bestScore = 94;

        if (lead.role === "propietario") {
          const ownerMatch =
            catalog.find((p) => p.ownerUnit || p.folio === "MX-NL-2025-104") ||
            catalog[0];
          bestProp = ownerMatch;
          bestScore = 97;
        } else if (isRentLead) {
          const sortedByRent = [...catalog].sort((a, b) => {
            const rentA = a.rentPrice || a.salePrice * 0.0065;
            const rentB = b.rentPrice || b.salePrice * 0.0065;
            return (
              Math.abs(rentA - parsedBudgetMXN) -
              Math.abs(rentB - parsedBudgetMXN)
            );
          });
          bestProp = sortedByRent[0] || catalog[0];
          bestScore = 96;
        } else {
          const sortedBySale = [...catalog].sort(
            (a, b) =>
              Math.abs(a.salePrice - parsedBudgetMXN) -
              Math.abs(b.salePrice - parsedBudgetMXN)
          );
          bestProp = sortedBySale[0] || catalog[0];
          const diffRatio =
            Math.abs(bestProp.salePrice - parsedBudgetMXN) /
            Math.max(parsedBudgetMXN, 1);
          bestScore = Math.min(
            99,
            Math.max(91, Math.round(98 - diffRatio * 8))
          );
        }

        const assignedLabel = `${bestProp.title} (${bestProp.folio})`;
        assignments.push({
          leadName: lead.fullName,
          assignedProperty: assignedLabel,
          aiScore: bestScore,
        });

        return {
          ...lead,
          interestProperty: assignedLabel,
          aiBadge: `${bestScore}% IA`,
        };
      }
    );

    persistState({
      ...memoryState,
      leads: updatedLeads,
    });

    if (isSupabaseConfigured) {
      await Promise.allSettled(
        updatedLeads.map((lead) => {
          const scoreNum =
            parseInt((lead.aiBadge || "95").replace(/[^0-9]/g, ""), 10) || 95;
          const isUuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              lead.id
            );

          return isUuid
            ? supabase
                .from("leads")
                .update({
                  interest_property: lead.interestProperty,
                  ai_match: scoreNum,
                })
                .eq("id", lead.id)
            : supabase
                .from("leads")
                .update({
                  interest_property: lead.interestProperty,
                  ai_match: scoreNum,
                })
                .eq("email", lead.email);
        })
      );
    }

    return {
      success: true,
      matchedCount: updatedLeads.length,
      assignments,
    };
  },

  /**
   * Sincroniza en el store las propiedades reordenadas y calificadas por `/api/ai-match`
   */
  applyAiMatchedProperties(matched: PropertyItem[]): void {
    hydrateFromStorage();
    if (!Array.isArray(matched) || matched.length === 0) return;

    const matchedByFolio = new Map(matched.map((p) => [p.folio, p]));
    const updated = matched.map((m) => ({
      ...m,
      aiMatch: m.aiMatch,
      aiMatchDisplay: m.aiMatchDisplay,
    }));

    // Conservar cualquier propiedad adicional que no estuviera en el lote
    const extras = memoryState.properties.filter(
      (p) => !matchedByFolio.has(p.folio)
    );

    persistState({
      ...memoryState,
      properties: [...updated, ...extras],
    });
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
