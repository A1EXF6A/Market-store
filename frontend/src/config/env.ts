interface Config {
  googleMapsApiKey: string;
}

const env: Config = {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
};

export default env;
