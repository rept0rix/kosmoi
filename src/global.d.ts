export { };

declare global {
    interface Window {
        google: any;
    }

    interface ImportMetaEnv {
        readonly VITE_GEMINI_API_KEY: string;
        readonly VITE_SUPABASE_URL: string;
        readonly VITE_SUPABASE_ANON_KEY: string;
        readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string;
        readonly VITE_GOOGLE_MAPS_API_KEY: string;
        [key: string]: any;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}
