// src/api/authApi.js
import api from './api';

export const loginRequest = async (payload) => {
  const res = await api.post('/auth/login', payload);
  return res.data;
};

export const profileRequest = async () => {
  const res = await api.get('/auth/profile');
  return res.data;
};
