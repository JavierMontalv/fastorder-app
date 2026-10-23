import api from './api';

const parseTokenPayload = (token) => {
  try {
    const base64Payload = token?.split('.')?.[1];
    if (!base64Payload) return null;

    const normalized = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const usuariosApi = {
  async cambiarPassword(payload) {
    const token = localStorage.getItem('comanda_token');
    const jwtPayload = parseTokenPayload(token);
    const userId = jwtPayload?.id;

    if (!userId) {
      throw new Error('No se pudo resolver el usuario autenticado');
    }

    const response = await api.put(`/usuarios/${userId}/password`, payload);
    return response.data;
  }
};

export default usuariosApi;
