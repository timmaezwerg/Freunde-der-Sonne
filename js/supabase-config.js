/* =========================================================
   Freunde der Sonne - Supabase Client Configuration
   ========================================================= */

// Trage hier deine Supabase-Projekt-Daten ein (oder hinterlege sie in der App im Admin-Bereich):
const DEFAULT_SUPABASE_URL = 'https://jxipxhxwjcbvafsvtnjx.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_tCz8ghzT0v4vRe9mpsKPGQ_YM05GMQm';

const STORAGE_SUPABASE_URL_KEY = 'fds_supabase_url';
const STORAGE_SUPABASE_KEY_KEY = 'fds_supabase_anon_key';

function getSupabaseCredentials() {
  const customUrl = localStorage.getItem(STORAGE_SUPABASE_URL_KEY);
  const customKey = localStorage.getItem(STORAGE_SUPABASE_KEY_KEY);
  return {
    url: (customUrl || DEFAULT_SUPABASE_URL || '').trim(),
    anonKey: (customKey || DEFAULT_SUPABASE_ANON_KEY || '').trim()
  };
}

function setSupabaseCredentials(url, anonKey) {
  if (url) localStorage.setItem(STORAGE_SUPABASE_URL_KEY, url.trim());
  else localStorage.removeItem(STORAGE_SUPABASE_URL_KEY);

  if (anonKey) localStorage.setItem(STORAGE_SUPABASE_KEY_KEY, anonKey.trim());
  else localStorage.removeItem(STORAGE_SUPABASE_KEY_KEY);

  initSupabaseClient();
}

let supabaseInstance = null;

function initSupabaseClient() {
  const { url, anonKey } = getSupabaseCredentials();

  if (typeof supabase !== 'undefined' && url && anonKey && url.startsWith('http')) {
    try {
      supabaseInstance = supabase.createClient(url, anonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        }
      });
      console.log('✅ Supabase Client initialisiert für:', url);
    } catch (e) {
      console.error('Fehler bei Supabase Client Init:', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return supabaseInstance;
}

// Initialer Aufruf
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupabaseClient);
} else {
  initSupabaseClient();
}

window.fdsSupabase = {
  getClient: () => supabaseInstance,
  isConfigured: () => {
    const { url, anonKey } = getSupabaseCredentials();
    return Boolean(supabaseInstance && url && anonKey);
  },
  getCredentials: getSupabaseCredentials,
  setCredentials: setSupabaseCredentials,
  init: initSupabaseClient
};
