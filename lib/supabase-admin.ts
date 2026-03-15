/**
 * Admin Supabase client with secret key
 * IMPORTANT: This should ONLY be used server-side (API routes, Server Actions)
 * NEVER import this in client components or pages
 */

import { createClient } from "@supabase/supabase-js";

// Prevent accidental client-side usage
if (typeof window !== "undefined") {
  throw new Error(
    "supabase-admin should only be used server-side. Do not import this in client components!"
  );
}

if (!process.env.SUPABASE_SECRET_KEY) {
  throw new Error("Missing SUPABASE_SECRET_KEY environment variable");
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
