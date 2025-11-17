// /src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// The Vite environment variables are not being loaded correctly in this context,
// causing a TypeError. To fix this and allow the application to run, the
// Supabase credentials have been hardcoded here. This is not recommended for
// production but is a necessary workaround for this preview environment.
const supabaseUrl = 'https://sssupabase.made-to-scale.com';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ewogICJyb2xlIjogImFub24iLAogICJpc3MiOiAic3VwYWJhc2UiLAogICJpYXQiOiAxNzE1MDUwODAwLAogICJleHAiOiAxODcyODE3MjAwCn0.qJT2_5MYOjKFRPhAqxQ8WHhGRSaadBxKR81fbn5aNmA'; // <-- esta


if (!supabaseUrl || !supabaseAnonKey) {
  // This check is now somewhat redundant but is kept as a safeguard.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
  throw new Error('Missing Supabase credentials');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'mts' },
});