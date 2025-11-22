interface Config {
  GOOGLE_MAPS_API_KEY: string;
  BACKEND_URL: string;
}

declare global {
  interface Window {
    APP_CONFIG?: {
      BACKEND_URL: string;
      GOOGLE_MAPS_API_KEY: string;
    };
  }
}

const getConfig = (): Config => {
  if (window.APP_CONFIG) {
    return {
      GOOGLE_MAPS_API_KEY: window.APP_CONFIG.GOOGLE_MAPS_API_KEY || "",
      BACKEND_URL: window.APP_CONFIG.BACKEND_URL || "/api",
    };
  }
  return {
    GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    BACKEND_URL: import.meta.env.VITE_BACKEND_URL || "/api",
  };
};

const env: Config = getConfig();

export default env;
