// Environment variables
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL_DEV;
export const SOCKET_TRANSPORTS = import.meta.env.VITE_SOCKET_TRANSPORTS?.split(",") || ["websocket", "polling"];

// STUN/TURN servers for WebRTC
export const STUN_URL_1 = import.meta.env.VITE_STUN_URL_1;
export const STUN_URL_2 = import.meta.env.VITE_STUN_URL_2;
export const TURN_URL = import.meta.env.VITE_TURN_URL;
export const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME;
export const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL;
export const TURN2_URL = import.meta.env.VITE_TURN2_URL;
export const TURN2_USERNAME = import.meta.env.VITE_TURN2_USERNAME;
export const TURN2_CREDENTIAL = import.meta.env.VITE_TURN2_CREDENTIAL;

// App settings
export const SOCKET_TIMEOUT = 20000;
export const RECONNECTION_DELAY = 2000; 