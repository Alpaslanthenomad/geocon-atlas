// lib/supabaseClient.js
//
// ⚠️ PLACEHOLDER — REPLACE WITH YOUR PROJECT'S EXISTING CLIENT
//
// Two options to integrate this package into the existing GEOCON repo:
//
// Option 1 (recommended): delete this file and update the import in
//   `lib/programRpc.js` to point at your existing client, e.g.:
//
//     import { supabase } from '@/lib/supabaseClient';   // your existing path
//     import { supabase } from '../../lib/supabase';     // or wherever
//
// Option 2: replace the contents of this file with a re-export of your client:
//
//     export { supabase } from '@/lib/supabaseClient';
//
// The package only needs `supabase.rpc(name, args)` to work; nothing else.

import { createClient } from '@supabase/supabase-js';

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);
