import { z } from "zod";

/**
 * Patrones de detección de ataques XSS y SQL Injection (SQLi)
 */
const XSS_PATTERNS: RegExp[] = [
  /<\s*script\b[^>]*>[\s\S]*?(?:<\s*\/\s*script\s*>|$)/i,
  /<\s*iframe\b[^>]*>[\s\S]*?(?:<\s*\/\s*iframe\s*>|$)/i,
  /<\s*(?:object|embed|applet|meta|link|style|form|input|button|svg|math)\b[^>]*>/i,
  /\bon[a-z]+\s*=/i, // onload=, onerror=, onclick=, onmouseover=, etc.
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /<\/?[a-z][a-z0-9]*[^<>]*>/i, // Cualquier etiqueta HTML
];

const SQLI_PATTERNS: RegExp[] = [
  /\b(?:SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b[\s\S]+?\b(?:FROM|INTO|TABLE|DATABASE|WHERE|SET|ALL|SELECT)\b/i,
  /(?:--|\/\*|\*\/|;\s*(?:DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)\b)/i,
  /(?:'|")\s*(?:OR|AND)\s*(?:'|"|\d)+\s*=\s*(?:'|"|\d)+/i,
  /\b(?:OR|AND)\s+1\s*=\s*1\b/i,
  /\bSLEEP\s*\(\s*\d+\s*\)/i,
  /\bBENCHMARK\s*\(/i,
];

/**
 * Verifica si una cadena contiene payloads de XSS o SQL Injection
 */
export function containsMaliciousPayload(value: string): boolean {
  if (!value) return false;
  const normalized = value.trim();
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(normalized)) return true;
  }
  return false;
}

/**
 * Sanitiza texto eliminando etiquetas HTML, atributos de eventos y patrones SQLi
 */
export function sanitizeInput(value: string): string {
  if (!value) return "";
  return value
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, "")
    .replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, "")
    .replace(/<\/?[a-z][a-z0-9]*[^<>]*>/gi, "")
    .replace(/\bon[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript\s*:/gi, "")
    .trim();
}

/**
 * Validador base de texto seguro contra XSS y SQLi
 */
const safeText = (fieldLabel: string, minLength = 1) =>
  z
    .string()
    .trim()
    .min(minLength, {
      message:
        minLength === 1
          ? `El campo ${fieldLabel} es obligatorio.`
          : `${fieldLabel} debe contener al menos ${minLength} caracteres.`,
    })
    .refine((val) => !containsMaliciousPayload(val), {
      message: `Se detectaron caracteres o etiquetas no permitidas (XSS/SQLi) en ${fieldLabel}.`,
    });

/**
 * Expresión regular para teléfono mexicano de 10 dígitos (permite espacios o guiones, p. ej. "55 8920 1200" o "5589201200")
 */
export const MEXICAN_PHONE_REGEX =
  /^(?:\+?52\s*)?(?:\d[\s-]*){9}\d$/;

export function normalizeMexicanPhone(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("52")) {
    return digitsOnly.slice(2);
  }
  return digitsOnly;
}

const mexicanPhoneSchema = z
  .string()
  .trim()
  .refine((val) => !containsMaliciousPayload(val), {
    message: "Formato de teléfono inválido.",
  })
  .refine(
    (val) => {
      if (!MEXICAN_PHONE_REGEX.test(val)) return false;
      const normalized = normalizeMexicanPhone(val);
      return /^\d{10}$/.test(normalized);
    },
    {
      message:
        "Ingresa un número celular mexicano válido de 10 dígitos (ej. 55 8920 1200).",
    }
  );

const lfpdpppPrivacySchema = z.boolean().refine((val) => val === true, {
  message: "Debes aceptar el Aviso de Privacidad conforme a la LFPDPPP",
});

/**
 * 1. Esquema de Registro de Usuario (registerSchema)
 */
export const registerSchema = z.object({
  role: z.enum(["comprador", "propietario", "asesor"], {
    message: "Selecciona un perfil válido en SIGI.",
  }),
  fullName: safeText("Nombre Completo", 3),
  email: z
    .string()
    .trim()
    .min(1, { message: "El correo electrónico es obligatorio." })
    .email({ message: "Ingresa un formato de correo electrónico válido." })
    .refine((val) => !containsMaliciousPayload(val), {
      message: "El correo electrónico contiene caracteres no permitidos.",
    }),
  phone: mexicanPhoneSchema,
  password: z
    .string()
    .min(8, {
      message: "La contraseña segura debe tener al menos 8 caracteres.",
    })
    .refine((val) => !containsMaliciousPayload(val), {
      message: "La contraseña contiene secuencias o etiquetas bloqueadas.",
    }),
  privacyAccepted: lfpdpppPrivacySchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * 2. Esquema de Propiedad Inmobiliaria (propertySchema)
 */
export const propertySchema = z.object({
  title: safeText("Título de la propiedad", 3),
  location: safeText("Ubicación", 3),
  salePrice: z.coerce
    .number({
      message: "El precio de venta debe ser un número válido.",
    })
    .gt(0, {
      message:
        "El precio de venta debe ser estrictamente mayor a $0 MXN (no se permiten valores negativos ni cero).",
    }),
  rentPrice: z
    .union([
      z.coerce
        .number()
        .gt(0, { message: "El precio de renta debe ser mayor a $0 MXN." }),
      z.literal(undefined),
      z.literal(""),
    ])
    .optional()
    .transform((val) => (typeof val === "number" ? val : undefined)),
  landArea: z.coerce
    .number({
      message: "El área de terreno debe ser un número válido.",
    })
    .gt(0, {
      message: "El área de terreno (m²) debe ser estrictamente mayor a 0.",
    }),
  constructionArea: z.coerce
    .number({
      message: "El área de construcción debe ser un número válido.",
    })
    .gt(0, {
      message: "El área de construcción (m²) debe ser estrictamente mayor a 0.",
    }),
});

export type PropertyInput = z.infer<typeof propertySchema>;

/**
 * 3. Esquema de Prospecto / Lead (leadSchema)
 */
export const leadSchema = z.object({
  fullName: safeText("Nombre del prospecto", 3),
  email: z
    .string()
    .trim()
    .min(1, { message: "El correo electrónico es obligatorio." })
    .email({ message: "Ingresa un correo electrónico válido." })
    .refine((val) => !containsMaliciousPayload(val), {
      message: "El correo electrónico contiene caracteres no permitidos.",
    }),
  phone: mexicanPhoneSchema,
  interestProperty: safeText("Propiedad de interés", 2),
  budgetDisplay: safeText("Presupuesto estimado", 2),
  privacyAccepted: lfpdpppPrivacySchema,
});

export type LeadInput = z.infer<typeof leadSchema>;

/**
 * 4. Validación y Redimensionamiento de Imágenes en Cliente (HTML5 Canvas -> WebP max 1200px)
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".webp",
  ".png",
] as const;
export const MAX_IMAGE_WIDTH_PX = 1200;

export interface ProcessedImageResult {
  valid: boolean;
  error?: string;
  dataUrl?: string;
  blob?: Blob;
  file?: File;
  width?: number;
  height?: number;
  originalSize?: number;
  optimizedSize?: number;
}

/**
 * Valida que el archivo pese máximo 5 MB y sea .jpg, .jpeg, .webp o .png,
 * y redimensiona automáticamente en cliente con HTML5 Canvas a un máximo
 * de 1200px de ancho en formato .webp antes de guardarla.
 */
export async function validateAndResizeImage(
  file: File
): Promise<ProcessedImageResult> {
  if (!file) {
    return {
      valid: false,
      error: "No se proporcionó ningún archivo de imagen.",
    };
  }

  // 1. Verificar tamaño máximo (5 MB)
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `El archivo excede el límite máximo permitido de 5 MB (tamaño actual: ${sizeMB} MB).`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: "El archivo seleccionado está vacío.",
    };
  }

  // 2. Verificar extensión y tipo MIME (.jpg, .jpeg, .webp, .png)
  const fileNameLower = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_IMAGE_EXTENSIONS.some((ext) =>
    fileNameLower.endsWith(ext)
  );
  const hasValidMime = ALLOWED_IMAGE_MIME_TYPES.includes(
    file.type.toLowerCase() as (typeof ALLOWED_IMAGE_MIME_TYPES)[number]
  );

  if (!hasValidExtension || !hasValidMime) {
    return {
      valid: false,
      error:
        "Formato de imagen no permitido. Únicamente se aceptan archivos .jpg, .jpeg, .webp o .png.",
    };
  }

  // 3. Redimensionar en cliente mediante HTML5 Canvas a máx. 1200px de ancho en formato .webp
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      valid: true,
      file,
      originalSize: file.size,
      optimizedSize: file.size,
    };
  }

  return new Promise<ProcessedImageResult>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      if (targetWidth > MAX_IMAGE_WIDTH_PX) {
        const scaleFactor = MAX_IMAGE_WIDTH_PX / targetWidth;
        targetWidth = MAX_IMAGE_WIDTH_PX;
        targetHeight = Math.round(targetHeight * scaleFactor);
      }

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({
          valid: false,
          error: "No fue posible inicializar el motor gráfico HTML5 Canvas.",
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const dataUrl = canvas.toDataURL("image/webp", 0.86);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              valid: false,
              error: "Error al codificar la imagen optimizada en formato WebP.",
            });
            return;
          }

          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });

          resolve({
            valid: true,
            dataUrl,
            blob,
            file: webpFile,
            width: targetWidth,
            height: targetHeight,
            originalSize: file.size,
            optimizedSize: blob.size,
          });
        },
        "image/webp",
        0.86
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: "El archivo de imagen está corrupto o no pudo decodificarse.",
      });
    };

    img.src = objectUrl;
  });
}
