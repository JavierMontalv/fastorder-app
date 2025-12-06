// ======================================================
// 🏪 restauranteApi.js – FASTORDER ENTERPRISE (2026)
// ------------------------------------------------------
// Servicio API para gestionar la configuración del
// restaurante: branding, horarios, métodos de pago,
// estado, QR, PDFs, redes sociales y más.
// Nivel Shopify Admin / Rappi Aliado.
// ======================================================

import api from "./axiosConfig";

// ======================================================
// 🔐 Helper: encabezados con token JWT
// ======================================================
const authHeaders = () => {
  const token = localStorage.getItem("fastorder_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ======================================================
// 🔍 Obtener configuración del restaurante
// ======================================================
export const obtenerRestaurante = async () => {
  try {
    const { data } = await api.get("/restaurante", {
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error obteniendo restaurante" };
  }
};

// ======================================================
// ✏️ Crear / actualizar restaurante (idempotente)
// ------------------------------------------------------
// Puede recibir:
// nombre, descripcion, direccion, telefono,
// horarios, metodosPago, estado,
// colorPrimario, colorSecundario,
// logoUrl, bannerUrl, redes sociales.
// ======================================================
export const actualizarRestaurante = async (payload) => {
  try {
    const { data } = await api.put("/restaurante", payload, {
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error actualizando restaurante" };
  }
};

// ======================================================
// 🖼️ Subir logo (requiere form-data)
// ======================================================
export const subirLogo = async (formData) => {
  try {
    const { data } = await api.post("/restaurante/logo", formData, {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error subiendo logo" };
  }
};

// ======================================================
// 🖼️ Subir banner / portada
// ======================================================
export const subirBanner = async (formData) => {
  try {
    const { data } = await api.post("/restaurante/banner", formData, {
      headers: {
        ...authHeaders(),
        "Content-Type": "multipart/form-data"
      }
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error subiendo banner" };
  }
};

// ======================================================
// 🔗 Obtener QR del restaurante (PNG)
// ------------------------------------------------------
// Permite mostrar o descargar el QR que lleva al menú.
// ======================================================
export const obtenerQRRestaurante = async () => {
  try {
    const response = await api.get("/restaurante/qr", {
      responseType: "blob",
      headers: authHeaders()
    });

    return response.data; // Blob PNG
  } catch (error) {
    throw error.response?.data || { message: "Error obteniendo QR" };
  }
};

// ======================================================
// 🧾 Obtener PDF con QR corporativo
// ------------------------------------------------------
// PDF profesional apto para impresión.
// ======================================================
export const obtenerPdfQRRestaurante = async () => {
  try {
    const response = await api.get("/restaurante/qr/pdf", {
      responseType: "blob",
      headers: authHeaders()
    });

    return response.data; // Blob PDF
  } catch (error) {
    throw error.response?.data || { message: "Error obteniendo PDF QR" };
  }
};

// ======================================================
// 📡 Cambiar estado del restaurante (abierto/cerrado)
// ======================================================
export const cambiarEstadoRestaurante = async (estado) => {
  try {
    const { data } = await api.patch(
      "/restaurante/estado",
      { estado },
      { headers: authHeaders() }
    );
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error cambiando estado" };
  }
};

// ======================================================
// 🌎 Actualizar redes sociales
// ======================================================
export const actualizarRedes = async (payload) => {
  try {
    const { data } = await api.patch("/restaurante/redes", payload, {
      headers: authHeaders()
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: "Error actualizando redes" };
  }
};

// ======================================================
// 📦 Export (para usar en todo el front)
// ======================================================
export default {
  obtenerRestaurante,
  actualizarRestaurante,
  subirLogo,
  subirBanner,
  obtenerQRRestaurante,
  obtenerPdfQRRestaurante,
  cambiarEstadoRestaurante,
  actualizarRedes
};
