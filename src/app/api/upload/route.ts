import { NextResponse } from "next/server";
import sharp from "sharp";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const BUCKET_NAME = "property-media";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get("file") ?? formData.get("image");

    if (!rawFile || !(rawFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de imagen válido." },
        { status: 400 }
      );
    }

    // 1. Validar tamaño máximo de 5 MB (5 * 1024 * 1024 bytes)
    if (rawFile.size === 0) {
      return NextResponse.json(
        { error: "El archivo seleccionado está vacío." },
        { status: 400 }
      );
    }

    if (rawFile.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (rawFile.size / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `La imagen excede el límite máximo permitido de 5 MB (tamaño recibido: ${sizeMB} MB).`,
        },
        { status: 400 }
      );
    }

    // 2. Validar tipo MIME permitido: image/jpeg, image/png o image/webp
    const mimeType = rawFile.type.toLowerCase();
    if (
      !ALLOWED_MIME_TYPES.includes(
        mimeType as (typeof ALLOWED_MIME_TYPES)[number]
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Formato de imagen no permitido. Únicamente se aceptan archivos image/jpeg, image/png o image/webp.",
        },
        { status: 400 }
      );
    }

    // 3. Redimensionar automáticamente con sharp a máx. 1200px de ancho en formato .webp (calidad 82)
    const arrayBuffer = await rawFile.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const { data: optimizedBuffer, info } = await sharp(inputBuffer)
      .rotate()
      .resize({
        width: 1200,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });

    // 4. Subir imagen optimizada al bucket 'property-media' en Supabase Storage
    const originalName =
      "name" in rawFile && typeof rawFile.name === "string"
        ? rawFile.name
        : "propiedad";
    const baseName =
      originalName
        .replace(/\.[^/.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48) || "propiedad";

    const filePath = `properties/${Date.now()}-${baseName}.webp`;

    if (!isSupabaseConfigured) {
      const base64DataUrl = `data:image/webp;base64,${optimizedBuffer.toString(
        "base64"
      )}`;
      return NextResponse.json({
        publicUrl: base64DataUrl,
        width: info.width,
        height: info.height,
        size: info.size,
      });
    }

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          error: `Error al subir la imagen al bucket ${BUCKET_NAME}: ${uploadError.message}`,
        },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return NextResponse.json({
      publicUrl: publicUrlData.publicUrl,
      path: filePath,
      width: info.width,
      height: info.height,
      size: info.size,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Error interno al procesar y redimensionar la imagen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
