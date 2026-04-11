/// <reference types="google.maps" />
declare module "*.css"

interface ImportMetaEnv {
  readonly PUBLIC_API_URL: string;
	readonly GOOGLE_API_KEY: string;
	readonly MAPBOX_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  gtag?: (...args: unknown[]) => void;
  google: typeof google;
}
