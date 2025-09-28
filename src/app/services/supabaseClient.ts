// Placeholder for Supabase integration. To enable Supabase as a backend
// database, install `@supabase/supabase-js` and uncomment the following
// lines. Then fill in the environment variables in your .env file.
//
// import { createClient } from '@supabase/supabase-js';
// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// At the moment, Supabase is not included in the project dependencies,
// so this module simply exports null. The rest of the application falls
// back to localStorage for persistence. Once Supabase is installed and
// configured, replace the export below with the commented out code above.
export const supabase = null;