// Keystone B2B CRM - Supabase Live Sync Configuration
// You can enter your credentials below, or configure them through the CRM UI modal,
// or append query parameters: ?sb_url=https://xyz.supabase.co&sb_key=eyJhbGci...

export const SUPABASE_CONFIG = {
  // Replace with your project URL, e.g. "https://abcdefghijklmnopqrst.supabase.co"
  url: window.__KEYSTONE_SUPABASE_URL__ || "",
  
  // Replace with your Anon public key
  anonKey: window.__KEYSTONE_SUPABASE_ANON_KEY__ || ""
};
