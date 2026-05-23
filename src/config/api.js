/**
 * Configuração centralizada da API do Cerberus.
 * 
 * Detecta automaticamente o hostname do navegador para que o projeto
 * funcione em qualquer máquina sem precisar alterar código.
 * Ex: localhost, 127.0.0.1, 192.168.x.x, etc.
 */
const API_PORT = 5000;
export const BASE_URL = `http://${window.location.hostname}:${API_PORT}`;
