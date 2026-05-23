/**
 * Configuração centralizada da API do Cerberus.
 * 
 * Detecta automaticamente o hostname do navegador para que o projeto
 * funcione em qualquer máquina sem precisar alterar código.
 * Ex: localhost, 127.0.0.1, 192.168.x.x, etc.
 */
const API_PORT = 5000;

const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.');

export const BASE_URL = isLocalhost 
  ? `http://${window.location.hostname}:${API_PORT}`
  : (import.meta.env.VITE_API_URL || 'https://cerberus-backend-eojx.onrender.com');

