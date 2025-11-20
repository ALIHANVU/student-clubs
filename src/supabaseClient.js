import { createClient } from '@supabase/supabase-js';

// ВАЖНО! Замените эти значения на свои из Supabase
const SUPABASE_URL = 'https://lbkpillzvxlgorybgdug.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxia3BpbGx6dnhsZ29yeWJnZHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NDY0NDcsImV4cCI6MjA3OTIyMjQ0N30.2D_09Z-fdASS241wCmEi1nHq8uTA-6pd-Yp0mtLG01s';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
