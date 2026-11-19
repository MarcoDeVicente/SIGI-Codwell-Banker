"use client";

import { useSyncExternalStore } from "react";
import { normalizeMexicanPhone, sanitizeInput } from "./validations";
import { supabase, isSupabaseConfigured } from "./supabase";
import {
  SEED_PROPERTIES,
  SEED_ADVISORS,
  SeedPropertyRecord,
  SeedAdvisorRecord,
} from "./seedCatalog";

export type UserRole = "comprador" | "propietario" | "asesor";

export interface AssignedAdvisor {
  id: string;
  fullName: string;
  roleTitle: string;
  zone: string;
  commissionRate: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  initials: string;
  badge?: string;
  responseTime?: string;
  source?: "academia" | "registrado";
}

export interface SigiUser {
  id: string;
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  bio?: string;
  avatarUrl?: string;
  officialIdUrl?: string;
  idVerified?: boolean;
  monthlyGoal?: number;
  privacyAccepted: boolean;
  privacy_accepted_at: string;
  createdAt: string;
  avatarInitials?: string;
  assignedAdvisor?: AssignedAdvisor | null;
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
  ownerEmail?: string;
  advisorName?: string;
  advisorEmail?: string;
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
  advisorEmail?: string;
  city?: string;
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
  ownerEmail?: string;
  advisorEmail?: string;
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
  ownerEmail?: string;
  createdAt: string;
}

export interface LegalDocumentItem {
  id: string;
  propertyFolio: string;
  documentTitle: string;
  documentDetail: string;
  verificationStatus: string;
  fileUrl: string | null;
  ownerEmail?: string;
  updatedAt: string;
}

export interface SigiNotification {
  id: string;
  userEmail: string;
  title: string;
  message: string;
  category:
    | "visita"
    | "oferta"
    | "asesor"
    | "documento"
    | "propiedad"
    | "perfil";
  href: string;
  read: boolean;
  createdAt: string;
}

export interface SigiState {
  currentUser: SigiUser | null;
  users: SigiUser[];
  properties: PropertyItem[];
  leads: OmnichannelLead[];
  visits: PropertyVisit[];
  offers: PropertyOffer[];
  legalDocuments: LegalDocumentItem[];
  notifications: SigiNotification[];
  searchQuery: string;
  favoritePropertyIds: string[];
  selectedBuyerPropertyId: string | null;
  guestAssignedAdvisor: AssignedAdvisor | null;
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

function mapSeedPropertyToItem(p: SeedPropertyRecord): PropertyItem {
  return {
    id: p.id,
    folio: p.folio,
    title: p.title,
    location: p.location,
    zone: p.zone,
    typology: p.typology,
    salePrice: p.sale_price,
    salePriceDisplay: formatPropertySaleDisplay(p.sale_price),
    rentPrice: p.rent_price,
    rentPriceDisplay: p.rent_price
      ? formatCurrencyMXN(p.rent_price)
      : undefined,
    suggestedSaleMin: Math.round(p.sale_price * 0.97),
    suggestedSaleMax: Math.round(p.sale_price * 1.03),
    landArea: p.land_area_m2,
    landAreaDisplay: `${p.land_area_m2} m²`,
    constructionArea: p.construction_area_m2,
    constructionAreaDisplay: `${p.construction_area_m2} m²`,
    bedrooms: p.bedrooms,
    bedroomsDisplay: `${p.bedrooms} Recámaras`,
    bathrooms: p.bathrooms,
    bathroomsDisplay: `${p.bathrooms} Baños`,
    parkingSpaces: p.parking,
    parkingDisplay: `${p.parking} Autos`,
    aiMatch: p.ai_match_score,
    aiMatchDisplay: `${p.ai_match_score}%`,
    plusvalia: `+${p.plusvalia_anual}%`,
    capRate: `${p.cap_rate}% Anual`,
    marketDemand: "Alta / En Tendencia Regional",
    image: p.image_url,
    featured: p.folio === "MX-QRO-2025-101" || p.folio === "MX-QRO-2025-089",
    ownerUnit: p.folio === "MX-NL-2025-104",
    advisorName: p.advisorName,
    advisorEmail: p.advisorEmail.toLowerCase(),
    status: p.is_exclusive ? "Exclusiva MLS" : "Activa",
    createdAt: p.created_at,
  };
}

export const INITIAL_PROPERTIES: PropertyItem[] =
  SEED_PROPERTIES.map(mapSeedPropertyToItem);

export const INITIAL_LEADS: OmnichannelLead[] = [];

const LEGACY_SEED_LEAD_EMAILS = new Set([
  "e.valenzuela@fondopatrimonial.mx",
  "sofia.landeros@residencial.mx",
  "m.rivas@corporativopedregal.mx",
  "a.lozano@reforma-corp.com.mx",
]);

const LEGACY_SEED_LEAD_IDS = new Set([
  "lead-ev-01",
  "lead-sl-02",
  "lead-mr-03",
  "lead-al-04",
]);

export function isLegacySeedLead(lead: {
  id?: string;
  email?: string;
  fullName?: string;
}): boolean {
  const id = (lead.id || "").trim().toLowerCase();
  const email = (lead.email || "").trim().toLowerCase();
  const name = (lead.fullName || "").trim().toLowerCase();
  if (LEGACY_SEED_LEAD_IDS.has(id) || LEGACY_SEED_LEAD_EMAILS.has(email)) {
    return true;
  }
  if (
    name === "eduardo valenzuela" ||
    name === "sofía landeros" ||
    name === "sofia landeros" ||
    name === "mauricio rivas" ||
    name === "alejandra lozano" ||
    name === "carlos garcía" ||
    name === "carlos garcia"
  ) {
    return true;
  }
  return false;
}

export function normalizeTextNoAccents(value: string): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function resolveCanonicalCityKey(text: string): string {
  const s = normalizeTextNoAccents(text);
  if (!s) return "";

  if (
    s.includes("queretaro") ||
    s.includes("qro") ||
    s.includes("juriquilla") ||
    s.includes("campanario") ||
    s.includes("cumbres del lago") ||
    s.includes("corregidora") ||
    s.includes("el marques") ||
    s.includes("zibata")
  ) {
    return "queretaro";
  }

  if (
    s.includes("ciudad de mexico") ||
    s.includes("cdmx") ||
    s.includes("mexico city") ||
    s.includes("polanco") ||
    s.includes("lomas") ||
    s.includes("chapultepec") ||
    s.includes("santa fe") ||
    s.includes("bosques") ||
    s.includes("pedregal") ||
    s.includes("san angel") ||
    s.includes("reforma") ||
    s.includes("campos eliseos") ||
    s.includes("ruben dario") ||
    s.includes("miguel hidalgo") ||
    s.includes("alvaro obregon") ||
    s.includes("cuajimalpa") ||
    s.includes("coyoacan") ||
    s.includes("cuauhtemoc")
  ) {
    return "cdmx";
  }

  if (
    s.includes("monterrey") ||
    s.includes("san pedro garza garcia") ||
    s.includes("san pedro") ||
    s.includes("spgg") ||
    s.includes("garza garcia") ||
    s.includes("nuevo leon") ||
    s.includes("n.l") ||
    s.includes("valle oriente") ||
    s.includes("cumbres del valle")
  ) {
    return "monterrey";
  }

  if (
    s.includes("cancun") ||
    s.includes("tulum") ||
    s.includes("riviera maya") ||
    s.includes("playa del carmen") ||
    s.includes("quintana roo") ||
    s.includes("q. roo") ||
    s.includes("solidaridad")
  ) {
    return "riviera_maya";
  }

  if (
    s.includes("san miguel de allende") ||
    s.includes("guanajuato") ||
    s.includes("gto") ||
    s.includes("leon")
  ) {
    return "guanajuato";
  }

  if (
    s.includes("guadalajara") ||
    s.includes("zapopan") ||
    s.includes("jalisco") ||
    s.includes("puerta de hierro")
  ) {
    return "guadalajara";
  }

  if (
    s.includes("puebla") ||
    s.includes("cholula") ||
    s.includes("angelopolis")
  ) {
    return "puebla";
  }

  if (s.includes("merida") || s.includes("yucatan")) {
    return "merida";
  }

  return s;
}

export function doesLocationMatchCity(
  targetLocationOrZone: string,
  advisorCity: string
): boolean {
  const cleanAdvisor = normalizeTextNoAccents(advisorCity);
  const cleanTarget = normalizeTextNoAccents(targetLocationOrZone);
  if (!cleanAdvisor || !cleanTarget) return false;

  const advisorKey = resolveCanonicalCityKey(cleanAdvisor);
  const targetKey = resolveCanonicalCityKey(cleanTarget);

  if (advisorKey && targetKey && advisorKey === targetKey) {
    return true;
  }

  const knownKeys = new Set([
    "queretaro",
    "cdmx",
    "monterrey",
    "riviera_maya",
    "guanajuato",
    "guadalajara",
    "puebla",
    "merida",
  ]);

  if (knownKeys.has(advisorKey) || knownKeys.has(targetKey)) {
    return advisorKey === targetKey;
  }

  return (
    cleanTarget.includes(cleanAdvisor) || cleanAdvisor.includes(cleanTarget)
  );
}

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

function mapSeedAdvisorToUser(adv: SeedAdvisorRecord): SigiUser {
  return {
    id: adv.id,
    role: "asesor",
    fullName: adv.fullName,
    email: adv.email.toLowerCase(),
    phone: formatMexicanPhoneDisplay(adv.phone),
    city: adv.city,
    bio: `${adv.specialty} • ${adv.zone}`,
    avatarUrl: adv.avatarUrl,
    idVerified: adv.academyCertified,
    monthlyGoal: 220000,
    privacyAccepted: true,
    privacy_accepted_at: adv.createdAt,
    createdAt: adv.createdAt,
    avatarInitials: getInitials(adv.fullName),
  };
}

export function mapSeedAdvisorToAssignedAdvisor(
  adv: SeedAdvisorRecord
): AssignedAdvisor {
  return {
    id: adv.id,
    fullName: adv.fullName,
    roleTitle: `${adv.specialty} • ${adv.closedDeals} cierres verificados`,
    zone: adv.zone,
    commissionRate: `${adv.commissionRate} Comisión de Intermediación`,
    phone: formatMexicanPhoneDisplay(adv.phone),
    email: adv.email.toLowerCase(),
    avatarUrl: adv.avatarUrl,
    initials: getInitials(adv.fullName),
    badge: adv.academyCertified
      ? "Academia Coldwell Banker"
      : "Asesor Registrado SIGI",
    responseTime: adv.responseTime,
    source: adv.academyCertified ? "academia" : "registrado",
  };
}

const INITIAL_USERS: SigiUser[] = [
  ...SEED_ADVISORS.map(mapSeedAdvisorToUser),
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

export const SEED_DIRECTORY_ADVISORS: AssignedAdvisor[] = SEED_ADVISORS.map(
  mapSeedAdvisorToAssignedAdvisor
);

export const ACADEMY_CERTIFIED_ADVISORS: AssignedAdvisor[] =
  SEED_DIRECTORY_ADVISORS.filter((a) => a.source === "academia");

/**
 * Valida en el cliente que un archivo de foto de perfil pese máx. 5 MB (.jpg, .png, .webp)
 * y que aparezca una persona real en la imagen (usando FaceDetector si está disponible y
 * análisis universal en HTML5 <canvas> de tonos de piel humana en YCbCr/RGB y contraste de retrato).
 */
export async function validatePersonInImage(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  const MAX_BYTES = 5 * 1024 * 1024;
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: "Selecciona un archivo de imagen válido.",
    };
  }

  if (file.size > MAX_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `La imagen pesa ${sizeMB} MB y excede el límite máximo permitido de 5 MB.`,
    };
  }

  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const lowerName = file.name.toLowerCase();
  const hasAllowedExt =
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png") ||
    lowerName.endsWith(".webp");

  if (!allowedTypes.includes(file.type.toLowerCase()) || !hasAllowedExt) {
    return {
      valid: false,
      error:
        "Formato no permitido. Únicamente se aceptan imágenes .jpg, .png o .webp (máx. 5 MB).",
    };
  }

  if (typeof window === "undefined" || typeof document === "undefined") {
    return { valid: true };
  }

  const PERSON_ERROR_MSG =
    "No se detectó una persona en la imagen. Sube una selfie o foto casual donde aparezcas tú (máx. 5 MB).";

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = async () => {
      try {
        // 1. Intentar con la API nativa FaceDetector del navegador si está disponible
        const FaceDetectorCtor = (
          window as unknown as {
            FaceDetector?: new (opts?: {
              fastMode?: boolean;
              maxDetectedFaces?: number;
            }) => {
              detect: (
                source: HTMLImageElement
              ) => Promise<Array<{ boundingBox?: DOMRectReadOnly }>>;
            };
          }
        ).FaceDetector;

        if (typeof FaceDetectorCtor === "function") {
          try {
            const detector = new FaceDetectorCtor({
              fastMode: true,
              maxDetectedFaces: 5,
            });
            const faces = await detector.detect(img);
            if (Array.isArray(faces) && faces.length > 0) {
              URL.revokeObjectURL(objectUrl);
              resolve({ valid: true });
              return;
            }
          } catch {
            // Si FaceDetector no está habilitado a nivel SO, continuar con el análisis en <canvas>
          }
        }

        // 2. Respaldo universal en <canvas>: analizar regiones centrales/superiores buscando tonos de piel humana y contraste facial
        const sampleSize = 180;
        const canvas = document.createElement("canvas");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          resolve({ valid: true });
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

        // Región central/superior donde se ubica el rostro y torso en una selfie o retrato
        const minX = Math.floor(sampleSize * 0.16);
        const maxX = Math.floor(sampleSize * 0.84);
        const minY = Math.floor(sampleSize * 0.08);
        const maxY = Math.floor(sampleSize * 0.84);

        let centralPixels = 0;
        let skinPixels = 0;
        let darkFeaturePixels = 0; // ojos, cejas, cabello, sombras faciales
        let nearWhiteOrGrayPixels = 0;
        let skyOrFoliagePixels = 0;
        let sumLum = 0;
        let sumLumSq = 0;
        const colorBuckets = new Set<number>();

        for (let y = minY; y < maxY; y++) {
          for (let x = minX; x < maxX; x++) {
            const idx = (y * sampleSize + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];

            if (a < 40) continue;
            centralPixels++;

            // Cuantización de color para medir variedad cromática (descarta logos planos o fondos sólidos)
            const bucket =
              ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
            colorBuckets.add(bucket);

            // Conversión a espacio YCbCr para detección de piel humana (diversos tonos de tez)
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

            sumLum += lum;
            sumLumSq += lum * lum;

            const isYCbCrSkin =
              cr >= 132 &&
              cr <= 179 &&
              cb >= 74 &&
              cb <= 131 &&
              lum >= 35 &&
              lum <= 242;

            const isRgbSkin =
              r > 55 &&
              g > 30 &&
              b > 15 &&
              r > g &&
              r > b &&
              r - b >= 12 &&
              r - g >= 4;

            if (isYCbCrSkin && isRgbSkin) {
              skinPixels++;
            }

            if (lum < 78) {
              darkFeaturePixels++;
            }

            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const satDiff = maxC - minC;

            // Píxeles blancos o grises neutros (típicos de documentos, capturas de texto o fondos vacíos)
            if (satDiff < 12 && (lum > 205 || lum < 30)) {
              nearWhiteOrGrayPixels++;
            }

            // Píxeles de cielo azul intenso o vegetación verde dominante (paisajes sin persona)
            if (
              (b > r + 22 && b > g + 10) ||
              (g > r + 15 && g > b + 15)
            ) {
              skyOrFoliagePixels++;
            }
          }
        }

        URL.revokeObjectURL(objectUrl);

        if (centralPixels === 0) {
          resolve({ valid: false, error: PERSON_ERROR_MSG });
          return;
        }

        const skinRatio = skinPixels / centralPixels;
        const darkFeatureRatio = darkFeaturePixels / centralPixels;
        const whiteGrayRatio = nearWhiteOrGrayPixels / centralPixels;
        const landscapeRatio = skyOrFoliagePixels / centralPixels;
        const meanLum = sumLum / centralPixels;
        const lumVariance = Math.max(
          0,
          sumLumSq / centralPixels - meanLum * meanLum
        );
        const lumStdDev = Math.sqrt(lumVariance);

        // Reglas de validación de retrato / persona:
        // 1. Debe existir proporción natural de tonos de piel en la zona central/superior (entre 3.2% y 78%)
        // 2. Debe existir contraste facial y rasgos oscuros (ojos/cabello/sombras) + variedad cromática
        // 3. No debe ser un documento plano, logotipo ni paisaje puro sin rostro
        const hasNaturalSkinPresence = skinRatio >= 0.032 && skinRatio <= 0.78;
        const hasFacialContrast =
          lumStdDev >= 14 &&
          darkFeatureRatio >= 0.012 &&
          colorBuckets.size >= 14;
        const isDocumentOrFlatGraphic =
          (whiteGrayRatio > 0.82 && skinRatio < 0.06) ||
          colorBuckets.size < 12;
        const isPureLandscape = landscapeRatio > 0.65 && skinRatio < 0.06;

        if (
          hasNaturalSkinPresence &&
          hasFacialContrast &&
          !isDocumentOrFlatGraphic &&
          !isPureLandscape
        ) {
          resolve({ valid: true });
        } else {
          resolve({ valid: false, error: PERSON_ERROR_MSG });
        }
      } catch {
        URL.revokeObjectURL(objectUrl);
        resolve({ valid: false, error: PERSON_ERROR_MSG });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: "No fue posible analizar el archivo de imagen seleccionado.",
      });
    };

    img.src = objectUrl;
  });
}

const DEFAULT_STATE: SigiState = {
  currentUser: null,
  users: INITIAL_USERS,
  properties: INITIAL_PROPERTIES,
  leads: INITIAL_LEADS,
  visits: INITIAL_VISITS,
  offers: INITIAL_OFFERS,
  legalDocuments: INITIAL_LEGAL_DOCUMENTS,
  notifications: [],
  searchQuery: "",
  favoritePropertyIds: ["prop-qro-101"],
  selectedBuyerPropertyId: null,
  guestAssignedAdvisor: null,
};

let memoryState: SigiState = DEFAULT_STATE;
let isHydrated = false;
let isSupabaseFetched = false;
let isSeedCatalogUpserted = false;
let isRealtimeSubscribed = false;
const listeners = new Set<() => void>();

export function getInitials(name: string): string {
  const parts = name
    .replace(/^(?:Lic\.|Ing\.|Dr\.|Arq\.|Mtro\.)\s*/i, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "CB";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function mapProfileRowToUser(row: Record<string, unknown>): SigiUser {
  const fullName = String(row.full_name || "Usuario SIGI");
  const email = String(row.email || "").toLowerCase();
  const privacyTs = String(row.privacy_accepted_at || new Date().toISOString());

  const existingLocal =
    memoryState.users.find((u) => u.email.toLowerCase() === email) ||
    (memoryState.currentUser?.email.toLowerCase() === email
      ? memoryState.currentUser
      : undefined);

  const remoteAdvisorName = row.assigned_advisor_name
    ? String(row.assigned_advisor_name)
    : undefined;

  const assignedAdvisor: AssignedAdvisor | null | undefined = remoteAdvisorName
    ? {
        id: String(row.assigned_advisor_id || `adv-${email}`),
        fullName: remoteAdvisorName,
        roleTitle: String(
          row.assigned_advisor_role ||
            "Asesor Patrimonial Certificado Coldwell Banker"
        ),
        zone: String(row.assigned_advisor_zone || "México"),
        commissionRate: String(
          row.assigned_advisor_commission || "4.5% Comisión de Intermediación"
        ),
        phone: String(row.assigned_advisor_phone || "+52 55 4190 8200"),
        email: String(
          row.assigned_advisor_email || "asesor.premier@coldwellbanker.com.mx"
        ),
        avatarUrl: row.assigned_advisor_avatar
          ? String(row.assigned_advisor_avatar)
          : undefined,
        initials: getInitials(remoteAdvisorName),
        badge: "Academia Coldwell Banker",
        responseTime: "8 min",
      }
    : existingLocal?.assignedAdvisor ?? null;

  return {
    id: String(row.id || existingLocal?.id || `usr-${Date.now()}`),
    role: (row.role as UserRole) || existingLocal?.role || "comprador",
    fullName,
    email,
    phone: String(row.phone || existingLocal?.phone || ""),
    city: row.city ? String(row.city) : existingLocal?.city,
    bio: row.bio ? String(row.bio) : existingLocal?.bio,
    avatarUrl: row.avatar_url
      ? String(row.avatar_url)
      : existingLocal?.avatarUrl,
    officialIdUrl: row.official_id_url
      ? String(row.official_id_url)
      : existingLocal?.officialIdUrl,
    idVerified:
      typeof row.id_verified === "boolean"
        ? row.id_verified
        : existingLocal?.idVerified ?? false,
    monthlyGoal:
      typeof row.monthly_goal === "number"
        ? row.monthly_goal
        : existingLocal?.monthlyGoal ?? 0,
    privacyAccepted: Boolean(row.privacy_accepted_at),
    privacy_accepted_at: privacyTs,
    createdAt: String(row.created_at || privacyTs),
    avatarInitials: getInitials(fullName),
    assignedAdvisor,
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
  const existingProp = memoryState.properties.find((p) => p.folio === folio);

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
    featured: folio === "MX-QRO-2025-101" || folio === "MX-QRO-2025-089",
    ownerUnit: folio === "MX-NL-2025-104",
    ownerEmail: row.owner_email
      ? String(row.owner_email).toLowerCase()
      : existingProp?.ownerEmail,
    advisorName: row.advisor_name
      ? String(row.advisor_name)
      : existingProp?.advisorName,
    advisorEmail: row.advisor_email
      ? String(row.advisor_email).toLowerCase()
      : existingProp?.advisorEmail,
    status: row.is_exclusive ? "Exclusiva MLS" : "Activa",
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapLeadRowToItem(row: Record<string, unknown>): OmnichannelLead {
  const fullName = String(row.full_name || "Prospecto SIGI");
  const email = String(row.email || "").toLowerCase();
  const id = String(row.id || `lead-${Date.now()}`);
  const existingLocal = memoryState.leads.find(
    (l) => l.id === id || (email && l.email.toLowerCase() === email)
  );
  const aiMatchNum =
    row.ai_match != null && Number(row.ai_match) > 0
      ? Number(row.ai_match)
      : undefined;
  const privacyTs = String(row.privacy_accepted_at || new Date().toISOString());

  return {
    id,
    initials: String(row.initials || getInitials(fullName)),
    fullName,
    profileType: String(row.profile_type || "Inversionista Privado"),
    phone: String(row.phone || ""),
    email,
    interestProperty: String(row.interest_property || ""),
    budgetDisplay: String(row.budget_display || ""),
    status: String(row.status || "Nuevo contacto"),
    role: (row.lead_category as UserRole) || "comprador",
    aiBadge: aiMatchNum ? `${aiMatchNum}% IA` : existingLocal?.aiBadge,
    advisorEmail: row.advisor_email
      ? String(row.advisor_email).toLowerCase()
      : existingLocal?.advisorEmail,
    city: row.city ? String(row.city) : existingLocal?.city,
    privacyAccepted: Boolean(row.privacy_accepted_at),
    privacy_accepted_at: privacyTs,
    createdAt: String(row.created_at || privacyTs),
  };
}

function mapVisitRowToItem(row: Record<string, unknown>): PropertyVisit {
  const id = String(row.id || `visit-${Date.now()}`);
  const existing = memoryState.visits.find((v) => v.id === id);
  return {
    id,
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    visitorName: String(row.visitor_name || "Visitante Registrado"),
    visitorPhone: String(row.visitor_phone || "+52 55 8920 1200"),
    scheduleLabel: String(row.schedule_label || "Mañana, 11:30 AM"),
    buyerScoreBadge: String(row.buyer_score_badge || "Score 920 pts"),
    visitPurpose: String(row.visit_purpose || "Intento de Compra Directa"),
    status: String(row.status || "Confirmada"),
    ownerEmail: row.owner_email
      ? String(row.owner_email).toLowerCase()
      : existing?.ownerEmail,
    advisorEmail: row.advisor_email
      ? String(row.advisor_email).toLowerCase()
      : existing?.advisorEmail,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapOfferRowToItem(row: Record<string, unknown>): PropertyOffer {
  const amount = Number(row.offer_amount) || 4200000;
  const id = String(row.id || `offer-${Date.now()}`);
  const offerFolio = String(row.offer_folio || "Folio #OF-882");
  const existing = memoryState.offers.find(
    (o) => o.id === id || o.offerFolio === offerFolio
  );
  return {
    id,
    offerFolio,
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    offerAmount: amount,
    offerAmountDisplay: `${formatCurrencyMXN(amount)} MXN`,
    offerStatusBadge: String(row.offer_status_badge || "Nueva"),
    paymentScheme: String(row.payment_scheme || "Transferencia Contado"),
    pricePercentageNote: String(
      row.price_percentage_note || "96.5% de precio lista"
    ),
    ownerEmail: row.owner_email
      ? String(row.owner_email).toLowerCase()
      : existing?.ownerEmail,
    createdAt: String(row.created_at || new Date().toISOString()),
  };
}

function mapLegalDocRowToItem(row: Record<string, unknown>): LegalDocumentItem {
  const id = String(row.id || `doc-${Date.now()}`);
  const existing = memoryState.legalDocuments.find((d) => d.id === id);
  return {
    id,
    propertyFolio: String(row.property_folio || "MX-NL-2025-104"),
    documentTitle: String(row.document_title || "Documento Jurídico"),
    documentDetail: String(row.document_detail || "Auditado por Mesa Legal"),
    verificationStatus: String(row.verification_status || "Verificado"),
    fileUrl: row.file_url ? String(row.file_url) : null,
    ownerEmail: row.owner_email
      ? String(row.owner_email).toLowerCase()
      : existing?.ownerEmail,
    updatedAt: String(row.updated_at || new Date().toISOString()),
  };
}

function mapNotificationRowToItem(
  row: Record<string, unknown>
): SigiNotification {
  return {
    id: String(row.id || `notif-${Date.now()}`),
    userEmail: String(
      row.recipient_email || row.user_email || row.email || ""
    ).toLowerCase(),
    title: String(row.title || "Notificación SIGI"),
    message: String(row.message || ""),
    category:
      (row.category as SigiNotification["category"]) || "propiedad",
    href: String(row.href || "/propietario"),
    read: Boolean(row.is_read ?? row.read ?? false),
    createdAt: String(row.created_at || new Date().toISOString()),
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
 * Consulta las tablas reales de Supabase PostgreSQL (profiles, properties,
 * leads, visits, property_offers, legal_documents, notifications) e hidrata el estado reactivo.
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
      notificationsRes,
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
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    const remoteUsers =
      !profilesRes.error &&
      Array.isArray(profilesRes.data) &&
      profilesRes.data.length > 0
        ? profilesRes.data.map((r) =>
            mapProfileRowToUser(r as Record<string, unknown>)
          )
        : [];

    const remoteEmails = new Set(remoteUsers.map((u) => u.email.toLowerCase()));
    const localExtras = memoryState.users.filter(
      (u) => !remoteEmails.has(u.email.toLowerCase())
    );
    const nextUsers =
      remoteUsers.length > 0
        ? mergeWithSeedUsers([...remoteUsers, ...localExtras])
        : mergeWithSeedUsers(memoryState.users);

    const remoteProperties =
      !propertiesRes.error &&
      Array.isArray(propertiesRes.data) &&
      propertiesRes.data.length > 0
        ? propertiesRes.data.map((r) =>
            mapPropertyRowToItem(r as Record<string, unknown>)
          )
        : [];
    const remoteFolios = new Set(remoteProperties.map((p) => p.folio));
    const localExtraProps = memoryState.properties.filter(
      (p) => !remoteFolios.has(p.folio)
    );
    const nextProperties =
      remoteProperties.length > 0
        ? mergeWithSeedProperties([...localExtraProps, ...remoteProperties])
        : mergeWithSeedProperties(memoryState.properties);

    const remoteLeads =
      !leadsRes.error &&
      Array.isArray(leadsRes.data) &&
      leadsRes.data.length > 0
        ? leadsRes.data
            .map((r) => mapLeadRowToItem(r as Record<string, unknown>))
            .filter((l) => !isLegacySeedLead(l))
        : [];
    const remoteLeadEmails = new Set(
      remoteLeads.map((l) => l.email.toLowerCase())
    );
    const localExtraLeads = memoryState.leads.filter(
      (l) =>
        !isLegacySeedLead(l) &&
        !remoteLeadEmails.has(l.email.toLowerCase())
    );
    const nextLeads =
      remoteLeads.length > 0
        ? [...localExtraLeads, ...remoteLeads]
        : localExtraLeads;

    const remoteVisits =
      !visitsRes.error &&
      Array.isArray(visitsRes.data) &&
      visitsRes.data.length > 0
        ? visitsRes.data.map((r) =>
            mapVisitRowToItem(r as Record<string, unknown>)
          )
        : [];
    const remoteVisitIds = new Set(remoteVisits.map((v) => v.id));
    const localExtraVisits = memoryState.visits.filter(
      (v) => Boolean(v.ownerEmail) && !remoteVisitIds.has(v.id)
    );
    const nextVisits =
      remoteVisits.length > 0
        ? [...localExtraVisits, ...remoteVisits]
        : memoryState.visits;

    const remoteOffers =
      !offersRes.error &&
      Array.isArray(offersRes.data) &&
      offersRes.data.length > 0
        ? offersRes.data.map((r) =>
            mapOfferRowToItem(r as Record<string, unknown>)
          )
        : [];
    const remoteOfferFolios = new Set(remoteOffers.map((o) => o.offerFolio));
    const localExtraOffers = memoryState.offers.filter(
      (o) => Boolean(o.ownerEmail) && !remoteOfferFolios.has(o.offerFolio)
    );
    const nextOffers =
      remoteOffers.length > 0
        ? [...localExtraOffers, ...remoteOffers]
        : memoryState.offers;

    const remoteLegalDocs =
      !legalDocsRes.error &&
      Array.isArray(legalDocsRes.data) &&
      legalDocsRes.data.length > 0
        ? legalDocsRes.data.map((r) =>
            mapLegalDocRowToItem(r as Record<string, unknown>)
          )
        : [];
    const remoteDocIds = new Set(remoteLegalDocs.map((d) => d.id));
    const localExtraDocs = memoryState.legalDocuments.filter(
      (d) => Boolean(d.ownerEmail) && !remoteDocIds.has(d.id)
    );
    const nextLegalDocs =
      remoteLegalDocs.length > 0
        ? [...localExtraDocs, ...remoteLegalDocs]
        : memoryState.legalDocuments;

    const remoteNotifs =
      !notificationsRes.error &&
      Array.isArray(notificationsRes.data) &&
      notificationsRes.data.length > 0
        ? notificationsRes.data.map((r) =>
            mapNotificationRowToItem(r as Record<string, unknown>)
          )
        : [];
    const remoteNotifIds = new Set(remoteNotifs.map((n) => n.id));
    const localExtraNotifs = memoryState.notifications.filter(
      (n) => !remoteNotifIds.has(n.id)
    );
    const nextNotifications =
      remoteNotifs.length > 0
        ? [...localExtraNotifs, ...remoteNotifs]
        : memoryState.notifications;

    const syncedCurrentUser = memoryState.currentUser
      ? nextUsers.find(
          (u) =>
            u.email.toLowerCase() ===
            memoryState.currentUser!.email.toLowerCase()
        ) || memoryState.currentUser
      : null;

    persistState({
      ...memoryState,
      currentUser: syncedCurrentUser,
      users: nextUsers,
      properties: nextProperties,
      leads: nextLeads,
      visits: nextVisits,
      offers: nextOffers,
      legalDocuments: nextLegalDocs,
      notifications: nextNotifications,
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void syncWithSupabase();
        }
      )
      .subscribe();
  } catch {
    // Ignore websocket errors in restricted environments
  }
}

function mergeWithSeedUsers(existing: SigiUser[]): SigiUser[] {
  const existingEmails = new Set(existing.map((u) => u.email.toLowerCase()));
  const missingSeeds = INITIAL_USERS.filter(
    (u) => !existingEmails.has(u.email.toLowerCase())
  );
  return missingSeeds.length > 0 ? [...existing, ...missingSeeds] : existing;
}

function mergeWithSeedProperties(existing: PropertyItem[]): PropertyItem[] {
  const existingFolios = new Set(existing.map((p) => p.folio));
  const missingSeeds = INITIAL_PROPERTIES.filter(
    (p) => !existingFolios.has(p.folio)
  );
  return missingSeeds.length > 0 ? [...existing, ...missingSeeds] : existing;
}

async function seedCatalogToSupabase(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !isSupabaseConfigured ||
    isSeedCatalogUpserted
  ) {
    return;
  }
  isSeedCatalogUpserted = true;

  try {
    const propertyRows = SEED_PROPERTIES.map((p) => ({
      folio: p.folio,
      title: p.title,
      location: p.location,
      zone: p.zone,
      typology: p.typology,
      sale_price: p.sale_price,
      rent_price: p.rent_price,
      suggested_sale_min: Math.round(p.sale_price * 0.97),
      suggested_sale_max: Math.round(p.sale_price * 1.03),
      land_area_m2: p.land_area_m2,
      construction_area_m2: p.construction_area_m2,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      parking: p.parking,
      ai_match_score: p.ai_match_score,
      plusvalia_anual: p.plusvalia_anual,
      cap_rate: p.cap_rate,
      market_demand: "Alta / En Tendencia Regional",
      image_url: p.image_url,
      is_exclusive: p.is_exclusive,
      privacy_accepted_at: p.created_at,
    }));

    const advisorRows = SEED_ADVISORS.map((adv) => ({
      full_name: adv.fullName,
      email: adv.email.toLowerCase(),
      phone: adv.phone,
      role: "asesor",
      city: adv.city,
      bio: `${adv.specialty} • ${adv.zone}`,
      avatar_url: adv.avatarUrl,
      monthly_goal: 220000,
      privacy_accepted_at: adv.createdAt,
    }));

    const [propRes, profRes] = await Promise.all([
      supabase
        .from("properties")
        .upsert(propertyRows, { onConflict: "folio", ignoreDuplicates: true }),
      supabase
        .from("profiles")
        .upsert(advisorRows, { onConflict: "email", ignoreDuplicates: true }),
    ]);

    if (profRes.error) {
      const baseAdvisorRows = SEED_ADVISORS.map((adv) => ({
        full_name: adv.fullName,
        email: adv.email.toLowerCase(),
        phone: adv.phone,
        role: "asesor",
        monthly_goal: 220000,
        privacy_accepted_at: adv.createdAt,
      }));
      await supabase
        .from("profiles")
        .upsert(baseAdvisorRows, { onConflict: "email", ignoreDuplicates: true });
    }

    if (!propRes.error || !profRes.error) {
      void syncWithSupabase();
    }
  } catch {
    // Mantener catálogo local en memoria si no hay conexión
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
              ? mergeWithSeedUsers(parsed.users)
              : DEFAULT_STATE.users,
          properties:
            Array.isArray(parsed.properties) && parsed.properties.length > 0
              ? mergeWithSeedProperties(parsed.properties)
              : DEFAULT_STATE.properties,
          leads:
            Array.isArray(parsed.leads) && parsed.leads.length > 0
              ? parsed.leads.filter((l) => !isLegacySeedLead(l))
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
          notifications: Array.isArray(parsed.notifications)
            ? parsed.notifications
            : DEFAULT_STATE.notifications,
          searchQuery: parsed.searchQuery ?? "",
          favoritePropertyIds: Array.isArray(parsed.favoritePropertyIds)
            ? parsed.favoritePropertyIds
            : DEFAULT_STATE.favoritePropertyIds,
          selectedBuyerPropertyId: parsed.selectedBuyerPropertyId ?? null,
          guestAssignedAdvisor: parsed.guestAssignedAdvisor ?? null,
        };
      }
    } catch {
      memoryState = DEFAULT_STATE;
    }
  }

  if (!isSupabaseFetched && isSupabaseConfigured) {
    isSupabaseFetched = true;
    void seedCatalogToSupabase();
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
   * Autentica un correo en `/login` buscando primero en `public.profiles` de Supabase
   * y luego en el estado local (`memoryState.users`), detectando automáticamente su `role`.
   */
  async authenticateByEmail(
    emailInput: string
  ): Promise<{ success: boolean; error?: string; user?: SigiUser }> {
    hydrateFromStorage();
    const cleanEmail = sanitizeInput(emailInput).trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      return {
        success: false,
        error: "Ingresa un correo electrónico válido para iniciar sesión.",
      };
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", cleanEmail)
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const foundUser = mapProfileRowToUser(
            data as Record<string, unknown>
          );
          const nextUsers = [
            foundUser,
            ...memoryState.users.filter(
              (u) => u.email.toLowerCase() !== foundUser.email.toLowerCase()
            ),
          ];
          persistState({
            ...memoryState,
            currentUser: foundUser,
            users: nextUsers,
          });
          return { success: true, user: foundUser };
        }
      } catch {
        // Fallback to local state if network fails
      }
    }

    const localMatch = memoryState.users.find(
      (u) => u.email.toLowerCase() === cleanEmail
    );

    if (localMatch) {
      persistState({
        ...memoryState,
        currentUser: localMatch,
      });
      return { success: true, user: localMatch };
    }

    return {
      success: false,
      error:
        "No encontramos una cuenta registrada con este correo. Verifica tus datos o crea una cuenta nueva.",
    };
  },

  /**
   * Flujo de autenticación SSO (Google, Apple, LinkedIn) para `/registro`, `/login` y `/login-academia`
   */
  async authenticateWithSSO(params: {
    provider: "Google" | "Apple" | "LinkedIn";
    source: "registro" | "login" | "login-academia";
    role?: UserRole;
    fullName: string;
    email: string;
    phone?: string;
  }): Promise<{ success: boolean; user: SigiUser; error?: string }> {
    hydrateFromStorage();
    const nowIso = new Date().toISOString();
    const cleanEmail = sanitizeInput(params.email).trim().toLowerCase();
    const cleanName =
      sanitizeInput(params.fullName).trim() || `Usuario ${params.provider} CB`;

    // Generar teléfono único determinístico si no se provee uno específico para evitar colisión 23505 en public.profiles
    const uniqueSuffix = String(
      Math.abs(
        cleanEmail
          .split("")
          .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) | 0, 7)
      )
    )
      .padStart(8, "4")
      .slice(0, 8);
    const defaultSsoPhone = formatMexicanPhoneDisplay(
      params.phone || `55${uniqueSuffix}`
    );

    let existingProfile: SigiUser | null = null;

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", cleanEmail)
          .limit(1)
          .maybeSingle();

        if (data) {
          existingProfile = mapProfileRowToUser(
            data as Record<string, unknown>
          );
        }
      } catch {
        // Ignore offline errors
      }
    }

    if (!existingProfile) {
      existingProfile =
        memoryState.users.find((u) => u.email.toLowerCase() === cleanEmail) ||
        null;
    }

    let resolvedRole: UserRole = "comprador";
    if (params.source === "login-academia") {
      resolvedRole = "asesor";
    } else if (params.source === "registro") {
      resolvedRole = params.role || "comprador";
    } else {
      // source === "login": respetar rol existente en public.profiles o usar "comprador" si es primera vez
      resolvedRole = existingProfile?.role || "comprador";
    }

    let finalUser: SigiUser | null = null;

    if (isSupabaseConfigured) {
      try {
        if (existingProfile) {
          if (
            params.source === "registro" ||
            params.source === "login-academia"
          ) {
            const { data: updatedData } = await supabase
              .from("profiles")
              .update({
                full_name: cleanName || existingProfile.fullName,
                role: resolvedRole,
                privacy_accepted_at: nowIso,
              })
              .ilike("email", cleanEmail)
              .select("*")
              .maybeSingle();

            if (updatedData) {
              finalUser = mapProfileRowToUser(
                updatedData as Record<string, unknown>
              );
            }
          } else {
            finalUser = existingProfile;
          }
        } else {
          const { data: insertedData, error: insertError } = await supabase
            .from("profiles")
            .insert({
              full_name: cleanName,
              email: cleanEmail,
              phone: defaultSsoPhone,
              role: resolvedRole,
              monthly_goal: resolvedRole === "asesor" ? 220000 : 0,
              privacy_accepted_at: nowIso,
            })
            .select("*")
            .maybeSingle();

          if (!insertError && insertedData) {
            finalUser = mapProfileRowToUser(
              insertedData as Record<string, unknown>
            );
          } else if (insertError) {
            // Reintentar con teléfono aleatorio si hubo colisión de teléfono o recuperar por email
            const fallbackPhone = formatMexicanPhoneDisplay(
              `55${String(Date.now()).slice(-8)}`
            );
            const { data: retryData } = await supabase
              .from("profiles")
              .insert({
                full_name: cleanName,
                email: cleanEmail,
                phone: fallbackPhone,
                role: resolvedRole,
                monthly_goal: resolvedRole === "asesor" ? 220000 : 0,
                privacy_accepted_at: nowIso,
              })
              .select("*")
              .maybeSingle();

            if (retryData) {
              finalUser = mapProfileRowToUser(
                retryData as Record<string, unknown>
              );
            }
          }
        }
      } catch {
        // Fallback local below
      }
    }

    if (!finalUser) {
      finalUser = existingProfile
        ? {
            ...existingProfile,
            role: resolvedRole,
            fullName: cleanName || existingProfile.fullName,
            privacyAccepted: true,
            privacy_accepted_at: existingProfile.privacy_accepted_at || nowIso,
            avatarInitials: getInitials(cleanName || existingProfile.fullName),
          }
        : {
            id: `usr-${Date.now()}`,
            role: resolvedRole,
            fullName: cleanName,
            email: cleanEmail,
            phone: defaultSsoPhone,
            monthlyGoal: resolvedRole === "asesor" ? 220000 : 0,
            privacyAccepted: true,
            privacy_accepted_at: nowIso,
            createdAt: nowIso,
            avatarInitials: getInitials(cleanName),
          };
    }

    const nextUsers = [
      finalUser,
      ...memoryState.users.filter(
        (u) => u.email.toLowerCase() !== finalUser!.email.toLowerCase()
      ),
    ];

    persistState({
      ...memoryState,
      currentUser: finalUser,
      users: nextUsers,
    });

    return { success: true, user: finalUser };
  },

  /**
   * Crea una notificación 100% real para el usuario activo y la sincroniza con `public.notifications`
   */
  async addNotification(input: {
    userEmail?: string;
    recipientEmail?: string;
    title: string;
    message: string;
    category?: SigiNotification["category"];
    href?: string;
  }): Promise<SigiNotification> {
    hydrateFromStorage();
    const targetEmail = (
      input.recipientEmail ||
      input.userEmail ||
      memoryState.currentUser?.email ||
      ""
    )
      .trim()
      .toLowerCase();
    const nowIso = new Date().toISOString();

    const newNotif: SigiNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userEmail: targetEmail,
      title: sanitizeInput(input.title),
      message: sanitizeInput(input.message),
      category: input.category || "propiedad",
      href: input.href || "/propietario",
      read: false,
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      notifications: [newNotif, ...memoryState.notifications],
    });

    if (isSupabaseConfigured && targetEmail) {
      try {
        // Intentar primero con recipient_email e is_read (esquema de notificaciones en tiempo real)
        let insertedData: Record<string, unknown> | null = null;
        const { data: dataRecipient, error: errRecipient } = await supabase
          .from("notifications")
          .insert({
            recipient_email: targetEmail,
            title: newNotif.title,
            message: newNotif.message,
            category: newNotif.category,
            href: newNotif.href,
            is_read: false,
          })
          .select("*")
          .maybeSingle();

        if (!errRecipient && dataRecipient) {
          insertedData = dataRecipient as Record<string, unknown>;
        } else {
          // Respaldo con user_email y read
          const { data: dataUser, error: errUser } = await supabase
            .from("notifications")
            .insert({
              user_email: targetEmail,
              title: newNotif.title,
              message: newNotif.message,
              category: newNotif.category,
              href: newNotif.href,
              read: false,
            })
            .select("*")
            .maybeSingle();
          if (!errUser && dataUser) {
            insertedData = dataUser as Record<string, unknown>;
          }
        }

        if (insertedData) {
          const saved = mapNotificationRowToItem(insertedData);
          persistState({
            ...memoryState,
            notifications: memoryState.notifications.map((n) =>
              n.id === newNotif.id ? saved : n
            ),
          });
          return saved;
        }
      } catch {
        // Mantiene notificación en estado local si la tabla remota no está disponible
      }
    }

    return newNotif;
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    hydrateFromStorage();
    persistState({
      ...memoryState,
      notifications: memoryState.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
    });

    if (isSupabaseConfigured && !notificationId.startsWith("notif-")) {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .eq("id", notificationId);
        if (error) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);
        }
      } catch {
        // Ignore offline errors
      }
    }
  },

  async markAllNotificationsAsRead(userEmail?: string): Promise<void> {
    hydrateFromStorage();
    const targetEmail = (userEmail || memoryState.currentUser?.email || "")
      .trim()
      .toLowerCase();

    persistState({
      ...memoryState,
      notifications: memoryState.notifications.map((n) =>
        !targetEmail || n.userEmail.toLowerCase() === targetEmail
          ? { ...n, read: true }
          : n
      ),
    });

    if (isSupabaseConfigured && targetEmail) {
      try {
        const { error } = await supabase
          .from("notifications")
          .update({ is_read: true })
          .ilike("recipient_email", targetEmail);
        if (error) {
          await supabase
            .from("notifications")
            .update({ read: true })
            .ilike("user_email", targetEmail);
        }
      } catch {
        // Ignore offline errors
      }
    }
  },

  /**
   * Actualiza la ciudad real detectada o seleccionada del asesor en `public.profiles.city`
   */
  async updateUserCity(
    cityInput: string
  ): Promise<{ success: boolean; city: string }> {
    hydrateFromStorage();
    const cleanCity = sanitizeInput(cityInput).trim() || "Querétaro";
    if (!memoryState.currentUser) {
      return { success: false, city: cleanCity };
    }

    const activeEmail = memoryState.currentUser.email.toLowerCase();
    const updatedUser: SigiUser = {
      ...memoryState.currentUser,
      city: cleanCity,
    };

    persistState({
      ...memoryState,
      currentUser: updatedUser,
      users: memoryState.users.map((u) =>
        u.email.toLowerCase() === activeEmail ? updatedUser : u
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("profiles")
          .update({ city: cleanCity })
          .ilike("email", activeEmail);
      } catch {
        // Conservar en estado local si la columna no está disponible offline
      }
    }

    return { success: true, city: cleanCity };
  },

  /**
   * Actualiza la meta financiera mensual del asesor en `public.profiles.monthly_goal`
   */
  async updateMonthlyGoal(
    goalInput: number
  ): Promise<{ success: boolean; monthlyGoal: number }> {
    hydrateFromStorage();
    const safeGoal = Math.max(0, Math.round(Number(goalInput) || 0));
    if (!memoryState.currentUser) {
      return { success: false, monthlyGoal: safeGoal };
    }

    const activeEmail = memoryState.currentUser.email.toLowerCase();
    const updatedUser: SigiUser = {
      ...memoryState.currentUser,
      monthlyGoal: safeGoal,
    };

    persistState({
      ...memoryState,
      currentUser: updatedUser,
      users: memoryState.users.map((u) =>
        u.email.toLowerCase() === activeEmail ? updatedUser : u
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("profiles")
          .update({ monthly_goal: safeGoal })
          .ilike("email", activeEmail);
      } catch {
        // Conservar en estado local
      }
    }

    return { success: true, monthlyGoal: safeGoal };
  },

  /**
   * Actualiza los datos personales, foto de perfil e identificación oficial (INE/Pasaporte) del usuario activo en `public.profiles` y `store.ts`
   */
  async updateUserProfile(input: {
    fullName: string;
    phone: string;
    email: string;
    bio?: string;
    avatarUrl?: string;
    officialIdUrl?: string;
    idVerified?: boolean;
  }): Promise<{ success: boolean; error?: string; user?: SigiUser }> {
    hydrateFromStorage();
    if (!memoryState.currentUser) {
      return {
        success: false,
        error: "No hay una sesión activa para actualizar.",
      };
    }

    const previousEmail = memoryState.currentUser.email.toLowerCase();
    const cleanName = sanitizeInput(input.fullName).trim();
    const cleanEmail = sanitizeInput(input.email).trim().toLowerCase();
    const formattedPhone = formatMexicanPhoneDisplay(input.phone);
    const cleanBio = input.bio != null ? sanitizeInput(input.bio) : undefined;
    const avatarUrl =
      input.avatarUrl !== undefined
        ? input.avatarUrl
        : memoryState.currentUser.avatarUrl;
    const officialIdUrl =
      input.officialIdUrl !== undefined
        ? input.officialIdUrl
        : memoryState.currentUser.officialIdUrl;
    const idVerified =
      input.idVerified !== undefined
        ? input.idVerified
        : Boolean(officialIdUrl) || memoryState.currentUser.idVerified || false;

    const updatedUser: SigiUser = {
      ...memoryState.currentUser,
      fullName: cleanName,
      email: cleanEmail,
      phone: formattedPhone,
      bio: cleanBio,
      avatarUrl,
      officialIdUrl,
      idVerified,
      avatarInitials: getInitials(cleanName),
    };

    if (isSupabaseConfigured) {
      try {
        const fullUpdatePayload: Record<string, unknown> = {
          full_name: cleanName,
          phone: formattedPhone,
          email: cleanEmail,
          bio: cleanBio ?? null,
          avatar_url: avatarUrl ?? null,
          official_id_url: officialIdUrl ?? null,
          id_verified: idVerified,
        };

        const { error: fullErr } = await supabase
          .from("profiles")
          .update(fullUpdatePayload)
          .ilike("email", previousEmail);

        if (fullErr) {
          // Respaldo con avatar_url y columnas base si official_id_url o id_verified no existen aún en el esquema remoto
          const { error: avatarErr } = await supabase
            .from("profiles")
            .update({
              full_name: cleanName,
              phone: formattedPhone,
              email: cleanEmail,
              bio: cleanBio ?? null,
              avatar_url: avatarUrl ?? null,
            })
            .ilike("email", previousEmail);

          if (avatarErr) {
            await supabase
              .from("profiles")
              .update({
                full_name: cleanName,
                phone: formattedPhone,
                email: cleanEmail,
              })
              .ilike("email", previousEmail);
          }
        }
      } catch {
        // Conservar actualización local si no hay red
      }
    }

    // Si cambió el correo, reasignar sus propiedades, prospectos, visitas, documentos, ofertas y notificaciones
    const nextProperties =
      previousEmail !== cleanEmail
        ? memoryState.properties.map((p) =>
            p.ownerEmail?.toLowerCase() === previousEmail
              ? { ...p, ownerEmail: cleanEmail }
              : p
          )
        : memoryState.properties;

    const nextLeads =
      previousEmail !== cleanEmail
        ? memoryState.leads.map((l) =>
            l.advisorEmail?.toLowerCase() === previousEmail
              ? { ...l, advisorEmail: cleanEmail }
              : l
          )
        : memoryState.leads;

    const nextVisits =
      previousEmail !== cleanEmail
        ? memoryState.visits.map((v) =>
            v.ownerEmail?.toLowerCase() === previousEmail
              ? { ...v, ownerEmail: cleanEmail }
              : v.advisorEmail?.toLowerCase() === previousEmail
              ? { ...v, advisorEmail: cleanEmail }
              : v
          )
        : memoryState.visits;

    const nextOffers =
      previousEmail !== cleanEmail
        ? memoryState.offers.map((o) =>
            o.ownerEmail?.toLowerCase() === previousEmail
              ? { ...o, ownerEmail: cleanEmail }
              : o
          )
        : memoryState.offers;

    const nextLegalDocs =
      previousEmail !== cleanEmail
        ? memoryState.legalDocuments.map((d) =>
            d.ownerEmail?.toLowerCase() === previousEmail
              ? { ...d, ownerEmail: cleanEmail }
              : d
          )
        : memoryState.legalDocuments;

    const nextNotifications =
      previousEmail !== cleanEmail
        ? memoryState.notifications.map((n) =>
            n.userEmail.toLowerCase() === previousEmail
              ? { ...n, userEmail: cleanEmail }
              : n
          )
        : memoryState.notifications;

    persistState({
      ...memoryState,
      currentUser: updatedUser,
      users: memoryState.users.map((u) =>
        u.email.toLowerCase() === previousEmail || u.id === updatedUser.id
          ? updatedUser
          : u
      ),
      properties: nextProperties,
      leads: nextLeads,
      visits: nextVisits,
      offers: nextOffers,
      legalDocuments: nextLegalDocs,
      notifications: nextNotifications,
    });

    const targetHref =
      updatedUser.role === "asesor"
        ? "/asesor"
        : updatedUser.role === "comprador"
        ? "/comprador"
        : "/propietario";

    await sigiStoreActions.addNotification({
      userEmail: cleanEmail,
      recipientEmail: cleanEmail,
      title: "Perfil Patrimonial Actualizado",
      message: `Tus datos personales (${cleanName})${
        idVerified ? " e Identificación Oficial verificada" : ""
      } han sido actualizados y sincronizados en SIGI Coldwell Banker.`,
      category: "perfil",
      href: targetHref,
    });

    return { success: true, user: updatedUser };
  },

  /**
   * Vincula un asesor o solicita asesoría patrimonial (propietario o comprador) y envía notificaciones reales en `public.notifications`
   */
  async assignAdvisorToUser(
    advisor: AssignedAdvisor
  ): Promise<{ success: boolean }> {
    hydrateFromStorage();
    if (!memoryState.currentUser) {
      persistState({
        ...memoryState,
        guestAssignedAdvisor: advisor,
      });
      if (advisor.email) {
        await sigiStoreActions.addNotification({
          userEmail: advisor.email.toLowerCase(),
          recipientEmail: advisor.email.toLowerCase(),
          title: `Nueva Solicitud de Asesoría • Comprador SIGI`,
          message: `Un comprador/inversionista solicitó asesoría inmobiliaria contigo (${advisor.zone}) desde el directorio SIGI Coldwell Banker.`,
          category: "asesor",
          href: "/asesor",
        });
      }
      return { success: true };
    }

    const activeEmail = memoryState.currentUser.email.toLowerCase();
    const isComprador = memoryState.currentUser.role === "comprador";
    const updatedUser: SigiUser = {
      ...memoryState.currentUser,
      assignedAdvisor: advisor,
    };

    persistState({
      ...memoryState,
      currentUser: updatedUser,
      guestAssignedAdvisor: advisor,
      users: memoryState.users.map((u) =>
        u.email.toLowerCase() === activeEmail ? updatedUser : u
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("profiles")
          .update({
            assigned_advisor_name: advisor.fullName,
            assigned_advisor_phone: advisor.phone,
            assigned_advisor_email: advisor.email,
            assigned_advisor_role: advisor.roleTitle,
            assigned_advisor_zone: advisor.zone,
            assigned_advisor_commission: advisor.commissionRate,
            assigned_advisor_avatar: advisor.avatarUrl ?? null,
          })
          .ilike("email", activeEmail);
      } catch {
        // Ignorar si las columnas opcionales no existen en esquema remoto
      }
    }

    await sigiStoreActions.addNotification({
      userEmail: activeEmail,
      recipientEmail: activeEmail,
      title: isComprador
        ? `Asesoría Solicitada • ${advisor.fullName}`
        : `Asesor VIP Vinculado • ${advisor.fullName}`,
      message: isComprador
        ? `Tu solicitud de asesoría patrimonial fue enviada a ${advisor.fullName} (${advisor.zone}). El asesor ha sido notificado en tiempo real.`
        : `${advisor.fullName} (${advisor.zone} • ${advisor.commissionRate}) fue vinculado a tu módulo Gestión & Asesor VIP.`,
      category: "asesor",
      href: isComprador ? "/comprador" : "/propietario",
    });

    if (advisor.email) {
      await sigiStoreActions.addNotification({
        userEmail: advisor.email.toLowerCase(),
        recipientEmail: advisor.email.toLowerCase(),
        title: isComprador
          ? `Solicitud de Asesoría de Comprador • ${updatedUser.fullName}`
          : `Nuevo Propietario Vinculado • ${updatedUser.fullName}`,
        message: isComprador
          ? `${updatedUser.fullName} (${updatedUser.email} • ${
              updatedUser.phone || "Comprador SIGI"
            }) solicitó asesoría patrimonial personalizada contigo en SIGI Coldwell Banker.`
          : `${updatedUser.fullName} (${updatedUser.email}) te vinculó como su Asesor VIP Patrimonial en SIGI Coldwell Banker.`,
        category: "asesor",
        href: "/asesor",
      });
    }

    return { success: true };
  },

  /**
   * Desvincula (elimina) el Asesor VIP asignado al propietario activo
   */
  async unlinkAssignedAdvisor(): Promise<{ success: boolean }> {
    hydrateFromStorage();
    if (!memoryState.currentUser) {
      persistState({
        ...memoryState,
        guestAssignedAdvisor: null,
      });
      return { success: true };
    }

    const activeEmail = memoryState.currentUser.email.toLowerCase();
    const updatedUser: SigiUser = {
      ...memoryState.currentUser,
      assignedAdvisor: null,
    };

    persistState({
      ...memoryState,
      currentUser: updatedUser,
      guestAssignedAdvisor: null,
      users: memoryState.users.map((u) =>
        u.email.toLowerCase() === activeEmail ? updatedUser : u
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("profiles")
          .update({
            assigned_advisor_name: null,
            assigned_advisor_phone: null,
            assigned_advisor_email: null,
            assigned_advisor_role: null,
            assigned_advisor_zone: null,
            assigned_advisor_commission: null,
            assigned_advisor_avatar: null,
          })
          .ilike("email", activeEmail);
      } catch {
        // Ignorar si las columnas opcionales no existen en esquema remoto
      }
    }

    return { success: true };
  },

  /**
   * Elimina una propiedad de Supabase (`DELETE` en `public.properties`) y del estado local
   */
  async deleteProperty(
    propertyIdOrFolio: string
  ): Promise<{ success: boolean }> {
    hydrateFromStorage();
    const target = memoryState.properties.find(
      (p) => p.id === propertyIdOrFolio || p.folio === propertyIdOrFolio
    );
    const folioToDelete = target?.folio || propertyIdOrFolio;

    persistState({
      ...memoryState,
      properties: memoryState.properties.filter(
        (p) => p.id !== propertyIdOrFolio && p.folio !== folioToDelete
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("properties")
          .delete()
          .eq("folio", folioToDelete);
      } catch {
        // Ignore offline errors
      }
    }

    return { success: true };
  },

  /**
   * Elimina un documento jurídico de Supabase (`DELETE` en `public.legal_documents`) y del estado local
   */
  async deleteLegalDocument(docId: string): Promise<{ success: boolean }> {
    hydrateFromStorage();
    const target = memoryState.legalDocuments.find((d) => d.id === docId);

    persistState({
      ...memoryState,
      legalDocuments: memoryState.legalDocuments.filter((d) => d.id !== docId),
    });

    if (isSupabaseConfigured) {
      try {
        if (!docId.startsWith("doc-")) {
          await supabase.from("legal_documents").delete().eq("id", docId);
        } else if (target) {
          await supabase
            .from("legal_documents")
            .delete()
            .eq("property_folio", target.propertyFolio)
            .eq("document_title", target.documentTitle);
        }
      } catch {
        // Ignore offline errors
      }
    }

    return { success: true };
  },

  /**
   * Elimina una oferta recibida de Supabase (`DELETE` en `public.property_offers`) y del estado local
   */
  async deleteOffer(offerIdOrFolio: string): Promise<{ success: boolean }> {
    hydrateFromStorage();
    const target = memoryState.offers.find(
      (o) => o.id === offerIdOrFolio || o.offerFolio === offerIdOrFolio
    );
    const offerFolio = target?.offerFolio || offerIdOrFolio;

    persistState({
      ...memoryState,
      offers: memoryState.offers.filter(
        (o) => o.id !== offerIdOrFolio && o.offerFolio !== offerFolio
      ),
    });

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from("property_offers")
          .delete()
          .eq("offer_folio", offerFolio);
      } catch {
        // Ignore offline errors
      }
    }

    return { success: true };
  },

  /**
   * Elimina una visita agendada de Supabase (`DELETE` en `public.visits`) y del estado local
   */
  async deleteVisit(visitId: string): Promise<{ success: boolean }> {
    hydrateFromStorage();
    const target = memoryState.visits.find((v) => v.id === visitId);

    persistState({
      ...memoryState,
      visits: memoryState.visits.filter((v) => v.id !== visitId),
    });

    if (isSupabaseConfigured) {
      try {
        if (!visitId.startsWith("visit-")) {
          await supabase.from("visits").delete().eq("id", visitId);
        } else if (target) {
          await supabase
            .from("visits")
            .delete()
            .eq("property_folio", target.propertyFolio)
            .eq("schedule_label", target.scheduleLabel);
        }
      } catch {
        // Ignore offline errors
      }
    }

    return { success: true };
  },

  /**
   * Registra una nueva oferta formal sobre una propiedad (`INSERT` en `public.property_offers`)
   */
  async createOffer(input: {
    propertyFolio: string;
    offerAmount: number;
    paymentScheme: string;
    salePriceReference?: number;
  }): Promise<{ success: boolean; offer?: PropertyOffer }> {
    hydrateFromStorage();
    const seq = Math.floor(100 + Math.random() * 900);
    const offerFolio = `Folio #OF-${seq}`;
    const refPrice = input.salePriceReference || input.offerAmount;
    const pct = Math.min(
      110,
      Math.max(70, +((input.offerAmount / Math.max(refPrice, 1)) * 100).toFixed(1))
    );
    const pricePercentageNote = `${pct}% de precio lista`;
    const ownerEmail = memoryState.currentUser?.email?.toLowerCase();
    const nowIso = new Date().toISOString();

    const optimisticOffer: PropertyOffer = {
      id: `offer-${Date.now()}`,
      offerFolio,
      propertyFolio: input.propertyFolio,
      offerAmount: input.offerAmount,
      offerAmountDisplay: `${formatCurrencyMXN(input.offerAmount)} MXN`,
      offerStatusBadge: "Nueva",
      paymentScheme: sanitizeInput(input.paymentScheme),
      pricePercentageNote,
      ownerEmail,
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      offers: [optimisticOffer, ...memoryState.offers],
    });

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from("property_offers")
          .insert({
            offer_folio: offerFolio,
            property_folio: input.propertyFolio,
            offer_amount: input.offerAmount,
            offer_status_badge: "Nueva",
            payment_scheme: optimisticOffer.paymentScheme,
            price_percentage_note: pricePercentageNote,
          })
          .select("*")
          .maybeSingle();

        if (!error && data) {
          const saved = {
            ...mapOfferRowToItem(data as Record<string, unknown>),
            ownerEmail,
          };
          persistState({
            ...memoryState,
            offers: memoryState.offers.map((o) =>
              o.id === optimisticOffer.id ? saved : o
            ),
          });
        }
      } catch {
        // Fallback local
      }
    }

    if (ownerEmail) {
      await sigiStoreActions.addNotification({
        userEmail: ownerEmail,
        title: `Nueva Oferta Recibida • ${offerFolio}`,
        message: `Se registró una oferta por ${optimisticOffer.offerAmountDisplay} (${optimisticOffer.paymentScheme}) sobre el folio ${input.propertyFolio}.`,
        category: "oferta",
        href: "/propietario",
      });
    }

    return { success: true, offer: optimisticOffer };
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
    const ownerEmail = (memoryState.currentUser?.email || "")
      .trim()
      .toLowerCase();
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
      ownerEmail: ownerEmail || undefined,
      status: "Exclusiva MLS",
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      properties: [optimisticProperty, ...memoryState.properties],
    });

    if (ownerEmail) {
      await sigiStoreActions.addNotification({
        userEmail: ownerEmail,
        title: `Propiedad Registrada • ${folio}`,
        message: `Tu propiedad "${cleanTitle}" (${optimisticProperty.salePriceDisplay} MXN) fue dada de alta en tu portafolio patrimonial.`,
        category: "propiedad",
        href: "/propietario",
      });
    }

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
          owner_email: ownerEmail || "propietario@sigi.mx",
          privacy_accepted_at: nowIso,
        })
        .select("*")
        .single();

      if (!error && data) {
        const savedProperty: PropertyItem = {
          ...mapPropertyRowToItem(data as Record<string, unknown>),
          ownerEmail: ownerEmail || undefined,
        };
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
    city?: string;
    advisorEmail?: string;
    privacyAccepted: boolean;
  }): Promise<{ success: boolean; error?: string; lead?: OmnichannelLead }> {
    hydrateFromStorage();

    const cleanEmail = sanitizeInput(input.email).toLowerCase();
    const formattedPhone = formatMexicanPhoneDisplay(input.phone);
    const cleanName = sanitizeInput(input.fullName);
    const nowIso = new Date().toISOString();
    const roleCategory: UserRole = input.role || "comprador";
    const advisorEmail =
      (input.advisorEmail || memoryState.currentUser?.email || "")
        .trim()
        .toLowerCase() || undefined;
    const leadCity =
      sanitizeInput(input.city || memoryState.currentUser?.city || "").trim() ||
      undefined;
    const profileTypeLabel =
      input.profileType ||
      (roleCategory === "propietario"
        ? "Propietario / Consignatario"
        : "Inversionista Privado");

    // Verificar duplicado en la bandeja del asesor activo
    const duplicateInAdvisorTray = memoryState.leads.some(
      (l) =>
        (!advisorEmail ||
          (l.advisorEmail || "").toLowerCase() === advisorEmail) &&
        (l.email.toLowerCase() === cleanEmail ||
          normalizeMexicanPhone(l.phone) ===
            normalizeMexicanPhone(formattedPhone))
    );

    if (duplicateInAdvisorTray) {
      return {
        success: false,
        error:
          "Ya existe un expediente activo con el mismo correo o teléfono en tu Bandeja de Prospectos (Código 23505).",
      };
    }

    if (isSupabaseConfigured) {
      let insertedRow: Record<string, unknown> | null = null;

      const { data: extData, error: extError } = await supabase
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
          ai_match: 0,
          advisor_email: advisorEmail ?? null,
          city: leadCity ?? null,
          privacy_accepted_at: nowIso,
        })
        .select("*")
        .maybeSingle();

      if (!extError && extData) {
        insertedRow = extData as Record<string, unknown>;
      } else if (
        extError &&
        extError.code !== "23505" &&
        !extError.message?.toLowerCase().includes("duplicate")
      ) {
        // Respaldo con columnas base si advisor_email o city no existen en el esquema remoto
        const { data: baseData, error: baseError } = await supabase
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
            ai_match: 0,
            privacy_accepted_at: nowIso,
          })
          .select("*")
          .maybeSingle();

        if (!baseError && baseData) {
          insertedRow = baseData as Record<string, unknown>;
        } else if (
          baseError &&
          (baseError.code === "23505" ||
            baseError.message?.toLowerCase().includes("duplicate"))
        ) {
          // Si ya existía en public.leads pero no estaba vinculado al asesor actual, recuperarlo y vincularlo
          const { data: existingRow } = await supabase
            .from("leads")
            .select("*")
            .ilike("email", cleanEmail)
            .limit(1)
            .maybeSingle();
          if (existingRow) {
            insertedRow = existingRow as Record<string, unknown>;
          } else {
            return {
              success: false,
              error:
                "Ya existe un expediente activo con el mismo correo o teléfono en la Bandeja Omnicanal (Código 23505).",
            };
          }
        }
      } else if (
        extError &&
        (extError.code === "23505" ||
          extError.message?.toLowerCase().includes("duplicate"))
      ) {
        const { data: existingRow } = await supabase
          .from("leads")
          .select("*")
          .ilike("email", cleanEmail)
          .limit(1)
          .maybeSingle();
        if (existingRow) {
          insertedRow = existingRow as Record<string, unknown>;
        } else {
          return {
            success: false,
            error:
              "Ya existe un expediente activo con el mismo correo o teléfono en la Bandeja Omnicanal (Código 23505).",
          };
        }
      }

      if (insertedRow) {
        const createdLead: OmnichannelLead = {
          ...mapLeadRowToItem(insertedRow),
          advisorEmail,
          city: leadCity,
        };
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
      advisorEmail,
      city: leadCity,
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
   * Agenda una visita privada haciendo `INSERT` directo en `public.visits` y notificación real en `public.notifications`
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

    const matchedProp = memoryState.properties.find(
      (p) =>
        (input.propertyTitle &&
          p.title.toLowerCase() === input.propertyTitle.toLowerCase()) ||
        (input.propertyFolio && p.folio === input.propertyFolio)
    );

    const activeUserEmail = (memoryState.currentUser?.email || "")
      .trim()
      .toLowerCase();
    const activeRole = memoryState.currentUser?.role || "comprador";
    const propOwnerEmail = (matchedProp?.ownerEmail || "")
      .trim()
      .toLowerCase();
    const ownerEmail = propOwnerEmail || activeUserEmail || undefined;

    const propertyFolio =
      input.propertyFolio ||
      matchedProp?.folio ||
      (activeUserEmail ? `EXP-${activeUserEmail}` : "MX-QRO-2025-089");
    const propertyTitle =
      input.propertyTitle || matchedProp?.title || propertyFolio;
    const visitorName = sanitizeInput(
      input.visitorName ||
        memoryState.currentUser?.fullName ||
        "Comprador SIGI"
    );
    const visitorPhone = formatMexicanPhoneDisplay(
      input.visitorPhone || memoryState.currentUser?.phone || "55 8920 1200"
    );
    const scheduleLabel = sanitizeInput(input.scheduleLabel);
    const buyerScoreBadge = input.buyerScoreBadge || "Score 920 pts";
    const visitPurpose = input.visitPurpose || "Cita Privada Residencial";
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
      ownerEmail,
      createdAt: nowIso,
    };

    persistState({
      ...memoryState,
      visits: [optimisticVisit, ...memoryState.visits],
    });

    const assignedAdv =
      memoryState.currentUser?.assignedAdvisor ||
      memoryState.guestAssignedAdvisor;
    const primaryRecipientEmail =
      activeUserEmail ||
      propOwnerEmail ||
      assignedAdv?.email?.toLowerCase() ||
      "asesor.premier@coldwellbanker.com.mx";

    await sigiStoreActions.addNotification({
      userEmail: primaryRecipientEmail,
      recipientEmail: primaryRecipientEmail,
      title: `Cita Privada Agendada • ${scheduleLabel}`,
      message: `${visitorName} (${visitorPhone}) confirmó cita privada para "${propertyTitle}" (Folio ${propertyFolio}) el ${scheduleLabel}.`,
      category: "visita",
      href: activeRole === "propietario" ? "/propietario" : "/comprador",
    });

    if (propOwnerEmail && propOwnerEmail !== primaryRecipientEmail) {
      await sigiStoreActions.addNotification({
        userEmail: propOwnerEmail,
        recipientEmail: propOwnerEmail,
        title: `Visita Agendada • ${scheduleLabel}`,
        message: `${visitorName} (${visitPurpose}) agendó cita sobre el folio ${propertyFolio}.`,
        category: "visita",
        href: "/propietario",
      });
    }

    if (
      memoryState.currentUser?.assignedAdvisor?.email &&
      memoryState.currentUser.assignedAdvisor.email.toLowerCase() !==
        primaryRecipientEmail
    ) {
      const advEmail =
        memoryState.currentUser.assignedAdvisor.email.toLowerCase();
      await sigiStoreActions.addNotification({
        userEmail: advEmail,
        recipientEmail: advEmail,
        title: `Nueva Cita Privada • ${propertyFolio}`,
        message: `${visitorName} (${visitorPhone}) agendó visita para "${propertyTitle}" el ${scheduleLabel}.`,
        category: "visita",
        href: "/asesor",
      });
    }

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
        const savedVisit: PropertyVisit = {
          ...mapVisitRowToItem(data as Record<string, unknown>),
          ownerEmail,
        };
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

    if (memoryState.currentUser?.email) {
      await sigiStoreActions.addNotification({
        userEmail: memoryState.currentUser.email,
        title: `Resolución de Oferta • ${input.offerFolio}`,
        message: `El estado de ${input.offerFolio} se actualizó a "${input.statusBadge}".`,
        category: "oferta",
        href: "/propietario",
      });
    }

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

    const ownerEmail = (memoryState.currentUser?.email || "")
      .trim()
      .toLowerCase();
    const propertyFolio =
      input.propertyFolio ||
      (ownerEmail ? `EXP-${ownerEmail}` : "MX-NL-2025-104");
    const documentTitle = sanitizeInput(input.documentTitle);
    const documentDetail = sanitizeInput(input.documentDetail);
    const verificationStatus = input.verificationStatus || "Verificado";
    const fileUrl = input.fileUrl ?? null;
    const nowIso = new Date().toISOString();

    const existingDoc = memoryState.legalDocuments.find(
      (d) =>
        (input.id && d.id === input.id) ||
        (d.documentTitle.toLowerCase() === documentTitle.toLowerCase() &&
          d.ownerEmail === ownerEmail)
    );

    if (ownerEmail) {
      await sigiStoreActions.addNotification({
        userEmail: ownerEmail,
        title: `Documento Jurídico Auditado`,
        message: `El archivo "${documentTitle}" fue anexado y verificado en tu Expediente Jurídico.`,
        category: "documento",
        href: "/propietario",
      });
    }

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
          const updated: LegalDocumentItem = {
            ...mapLegalDocRowToItem(data as Record<string, unknown>),
            ownerEmail: ownerEmail || undefined,
          };
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

      if (!error && data) {
        const inserted: LegalDocumentItem = {
          ...mapLegalDocRowToItem(data as Record<string, unknown>),
          ownerEmail: ownerEmail || undefined,
        };
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
      ownerEmail: ownerEmail || undefined,
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
   * Ejecuta el análisis predictivo SIGI Match v4.8 cruzando y emparejando
   * estrictamente prospectos y propiedades cuya ciudad/zona coincida con la ciudad real del asesor.
   */
  async runLeadAiMatchingSimulation(options?: {
    advisorCity?: string;
    advisorEmail?: string;
  }): Promise<{
    success: boolean;
    matchedCount: number;
    cityUsed: string;
    assignments: Array<{
      leadId: string;
      leadName: string;
      assignedProperty: string;
      propertyFolio: string;
      city: string;
      aiScore: number;
    }>;
  }> {
    hydrateFromStorage();

    const targetCity = (
      options?.advisorCity ||
      memoryState.currentUser?.city ||
      "Querétaro"
    ).trim();
    const targetAdvisorEmail = (
      options?.advisorEmail ||
      memoryState.currentUser?.email ||
      ""
    )
      .trim()
      .toLowerCase();

    // Correos de clientes/propietarios vinculados a este asesor en public.profiles
    const linkedClientEmails = new Set(
      memoryState.users
        .filter(
          (u) =>
            targetAdvisorEmail &&
            (u.assignedAdvisor?.email || "").toLowerCase() ===
              targetAdvisorEmail
        )
        .map((u) => u.email.toLowerCase())
    );

    // 1. Filtrar propiedades estrictamente por la ciudad real del asesor
    const cityProperties = memoryState.properties.filter((p) =>
      doesLocationMatchCity(
        `${p.zone || ""} ${p.location || ""} ${p.title || ""}`,
        targetCity
      )
    );

    const assignments: Array<{
      leadId: string;
      leadName: string;
      assignedProperty: string;
      propertyFolio: string;
      city: string;
      aiScore: number;
    }> = [];

    if (cityProperties.length === 0) {
      return {
        success: true,
        matchedCount: 0,
        cityUsed: targetCity,
        assignments: [],
      };
    }

    const updatedLeads: OmnichannelLead[] = memoryState.leads.map(
      (lead, index) => {
        if (isLegacySeedLead(lead)) return lead;

        const belongsToAdvisor =
          !targetAdvisorEmail ||
          (lead.advisorEmail || "").toLowerCase() === targetAdvisorEmail ||
          linkedClientEmails.has(lead.email.toLowerCase());

        if (!belongsToAdvisor) return lead;

        const leadCityText = `${lead.city || ""} ${lead.interestProperty || ""}`.trim();
        const matchesCity = lead.city
          ? doesLocationMatchCity(lead.city, targetCity)
          : doesLocationMatchCity(leadCityText || targetCity, targetCity);

        if (!matchesCity) {
          return lead;
        }

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

        let bestProp =
          cityProperties[index % cityProperties.length] || cityProperties[0];
        let bestScore = 94;

        if (isRentLead) {
          const sortedByRent = [...cityProperties].sort((a, b) => {
            const rentA = a.rentPrice || a.salePrice * 0.0065;
            const rentB = b.rentPrice || b.salePrice * 0.0065;
            return (
              Math.abs(rentA - parsedBudgetMXN) -
              Math.abs(rentB - parsedBudgetMXN)
            );
          });
          bestProp = sortedByRent[0] || cityProperties[0];
          bestScore = 96;
        } else {
          const sortedBySale = [...cityProperties].sort(
            (a, b) =>
              Math.abs(a.salePrice - parsedBudgetMXN) -
              Math.abs(b.salePrice - parsedBudgetMXN)
          );
          bestProp = sortedBySale[0] || cityProperties[0];
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
          leadId: lead.id,
          leadName: lead.fullName,
          assignedProperty: assignedLabel,
          propertyFolio: bestProp.folio,
          city: bestProp.zone || bestProp.location || targetCity,
          aiScore: bestScore,
        });

        return {
          ...lead,
          city: lead.city || targetCity,
          interestProperty: assignedLabel,
          aiBadge: `${bestScore}% IA`,
        };
      }
    );

    persistState({
      ...memoryState,
      leads: updatedLeads,
    });

    if (isSupabaseConfigured && assignments.length > 0) {
      const matchedIds = new Set(assignments.map((a) => a.leadId));
      await Promise.allSettled(
        updatedLeads
          .filter((lead) => matchedIds.has(lead.id))
          .map((lead) => {
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
      matchedCount: assignments.length,
      cityUsed: targetCity,
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

  /**
   * Elimina un prospecto de la Bandeja de Prospectos (`DELETE` en `public.leads`) y del estado global
   */
  async deleteLead(
    leadId: string,
    leadEmail?: string
  ): Promise<{ success: boolean; error?: string }> {
    hydrateFromStorage();
    const target = memoryState.leads.find(
      (l) =>
        l.id === leadId ||
        (leadEmail && l.email.toLowerCase() === leadEmail.toLowerCase())
    );
    const emailToDelete = (leadEmail || target?.email || "")
      .trim()
      .toLowerCase();

    const nextLeads = memoryState.leads.filter(
      (l) =>
        l.id !== leadId &&
        (!emailToDelete || l.email.toLowerCase() !== emailToDelete)
    );

    const nextUsers = emailToDelete
      ? memoryState.users.map((u) =>
          u.email.toLowerCase() === emailToDelete && u.assignedAdvisor
            ? { ...u, assignedAdvisor: null }
            : u
        )
      : memoryState.users;

    persistState({
      ...memoryState,
      leads: nextLeads,
      users: nextUsers,
    });

    if (isSupabaseConfigured) {
      try {
        const isUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            leadId
          );
        if (isUuid) {
          await supabase.from("leads").delete().eq("id", leadId);
        } else if (emailToDelete) {
          await supabase.from("leads").delete().ilike("email", emailToDelete);
        }
      } catch {
        // Ignore offline errors
      }
    }

    return { success: true };
  },

  setSearchQuery(query: string): void {
    hydrateFromStorage();
    const safeQuery = (query ?? "")
      .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
      .replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, "")
      .replace(/<\/?[a-z][a-z0-9]*[^<>]*>/gi, "")
      .replace(/javascript\s*:/gi, "");
    persistState({
      ...memoryState,
      searchQuery: safeQuery,
    });
  },

  toggleFavoriteProperty(propertyId: string): void {
    hydrateFromStorage();
    const current = Array.isArray(memoryState.favoritePropertyIds)
      ? memoryState.favoritePropertyIds
      : [];
    const exists = current.includes(propertyId);
    const next = exists
      ? current.filter((id) => id !== propertyId)
      : [...current, propertyId];
    persistState({
      ...memoryState,
      favoritePropertyIds: next,
    });
  },

  removeFavoriteProperty(propertyId: string): void {
    hydrateFromStorage();
    const current = Array.isArray(memoryState.favoritePropertyIds)
      ? memoryState.favoritePropertyIds
      : [];
    persistState({
      ...memoryState,
      favoritePropertyIds: current.filter((id) => id !== propertyId),
    });
  },

  setSelectedBuyerPropertyId(propertyId: string | null): void {
    hydrateFromStorage();
    persistState({
      ...memoryState,
      selectedBuyerPropertyId: propertyId,
    });
  },

  logout(): void {
    hydrateFromStorage();
    persistState({
      ...memoryState,
      currentUser: null,
      guestAssignedAdvisor: null,
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
