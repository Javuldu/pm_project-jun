declare module '*.jpeg' {
  const value: string;
  export default value;
}

interface ImportMetaEnv {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
