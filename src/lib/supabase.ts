import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwhdgnjizkehvnvkiyeb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3aGRnbmppemtlaHZudmtpeWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxNzkyNDQsImV4cCI6MjEwNzc1NTI0NH0.4GkC9o2rKwbr4a878kcZvfgE2JDLDJiMwXt8UinYbSo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
