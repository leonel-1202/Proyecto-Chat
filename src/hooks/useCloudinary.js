import { useState, useCallback } from "react";

// ── Configura estas variables en tu .env ──────────────────────────────────────
// VITE_CLOUDINARY_CLOUD_NAME=tu_cloud_name
// VITE_CLOUDINARY_UPLOAD_PRESET=tu_upload_preset  (debe ser "unsigned")

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Límite real: Cloudinary free tier permite hasta 100MB por archivo
// Para videos grandes puedes subir el plan, pero 100MB ya cubre la mayoría
export const MAX_SIZE_MB  = 100;
export const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Determina el resource_type para Cloudinary según el tipo MIME
 */
function getResourceType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "video"; // Cloudinary maneja audio como video
  return "raw"; // PDFs, docs, zips, etc.
}

/**
 * Determina el tipo de media para el Bubble
 */
function getMediaType(mimeType = "") {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "file";
}

/**
 * Hook principal para subir archivos a Cloudinary
 * Devuelve { upload, progress, uploading, error }
 */
export function useCloudinary() {
  const [progress,  setProgress]  = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  const upload = useCallback(async (file, onProgress) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      throw new Error("Cloudinary no configurado. Revisa VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env");
    }

    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`El archivo supera el límite de ${MAX_SIZE_MB}MB`);
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    const resourceType = getResourceType(file.type);
    const url = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const formData = new FormData();
    formData.append("file",           file);
    formData.append("upload_preset",  UPLOAD_PRESET);
    formData.append("folder",         "nexus_chat");

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
          onProgress?.(pct);
        }
      });

      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve({
            url:      data.secure_url,
            name:     file.name,
            size:     file.size,
            mimeType: file.type,
            type:     getMediaType(file.type),
            publicId: data.public_id,
            width:    data.width,
            height:   data.height,
            duration: data.duration, // para video/audio
          });
        } else {
          const msg = `Error al subir: ${xhr.status}`;
          setError(msg);
          reject(new Error(msg));
        }
      });

      xhr.addEventListener("error", () => {
        setUploading(false);
        const msg = "Error de red al subir el archivo";
        setError(msg);
        reject(new Error(msg));
      });

      xhr.addEventListener("abort", () => {
        setUploading(false);
        reject(new Error("Subida cancelada"));
      });

      xhr.open("POST", url);
      xhr.send(formData);
    });
  }, []);

  const reset = useCallback(() => {
    setProgress(0);
    setUploading(false);
    setError(null);
  }, []);

  return { upload, progress, uploading, error, reset };
}