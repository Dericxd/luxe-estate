import { supabase } from "./supabase";

export const PROPERTY_IMAGES_BUCKET = "property-images";
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const BUCKET_PUBLIC_PATH_MARKER = `/storage/v1/object/public/${PROPERTY_IMAGES_BUCKET}/`;

export function isSupabasePropertyImageUrl(url: string): boolean {
  return typeof url === "string" && url.includes(BUCKET_PUBLIC_PATH_MARKER);
}

export function extractStoragePathFromUrl(url: string): string | null {
  if (!isSupabasePropertyImageUrl(url)) return null;
  const idx = url.indexOf(BUCKET_PUBLIC_PATH_MARKER);
  if (idx === -1) return null;
  const rawPath = url.slice(idx + BUCKET_PUBLIC_PATH_MARKER.length).split("?")[0];
  return decodeURIComponent(rawPath);
}

export function validatePropertyImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return "Formato no soportado. Usa JPG, PNG o WEBP.";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "La imagen supera el tamaño máximo permitido de 5 MB.";
  }
  return null;
}

function getFileExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function sanitizeFolder(folder: string): string {
  const cleaned = folder
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "general";
}

export async function uploadPropertyImage(
  file: File,
  propertyFolder: string = "general"
): Promise<string> {
  const validationError = validatePropertyImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = getFileExtension(file);
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}`;
  const filePath = `${sanitizeFolder(propertyFolder)}/${Date.now()}-${uniqueId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "No se pudo subir la imagen a Supabase Storage.");
  }

  const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(filePath);
  if (!data?.publicUrl) {
    throw new Error("No se pudo obtener la URL pública de la imagen subida.");
  }

  return data.publicUrl;
}

export async function deletePropertyImageByUrl(url: string): Promise<void> {
  const path = extractStoragePathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove([path]);
  if (error) {
    console.error("[storage] Error removing property image:", error.message);
  }
}

export async function deletePropertyImagesByUrls(urls: string[]): Promise<void> {
  const paths = urls
    .map((url) => extractStoragePathFromUrl(url))
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(PROPERTY_IMAGES_BUCKET).remove(paths);
  if (error) {
    console.error("[storage] Error removing property images:", error.message);
  }
}

export async function replacePropertyImage(
  file: File,
  previousUrl: string,
  propertyFolder: string = "general"
): Promise<string> {
  const newUrl = await uploadPropertyImage(file, propertyFolder);
  if (previousUrl && isSupabasePropertyImageUrl(previousUrl)) {
    await deletePropertyImageByUrl(previousUrl);
  }
  return newUrl;
}
