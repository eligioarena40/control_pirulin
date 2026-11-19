import { v2 as cloudinary } from 'cloudinary';

export const eliminarImagenCloudinary = async (url) => {
  if (!url || typeof url !== 'string' || !url.includes('cloudinary.com')) {
    return;
  }

  try {
    const partes = url.split('/upload/');
    if (partes.length < 2) return;

    // Elimina versión (ej. v1700000000/) y extensión (.jpg, .png, .webp, etc.)
    const rutaSinVersion = partes[1].replace(/^v\d+\//, '');
    const ultimoPunto = rutaSinVersion.lastIndexOf('.');
    const publicId = ultimoPunto !== -1 ? rutaSinVersion.substring(0, ultimoPunto) : rutaSinVersion;

    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error al eliminar imagen en Cloudinary:', error.message);
  }
};