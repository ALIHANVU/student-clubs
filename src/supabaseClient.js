import { createClient } from '@supabase/supabase-js';

// ВАЖНО! Замените эти значения на свои из Supabase
const SUPABASE_URL = 'ВАШ_PROJECT_URL_ЗДЕСЬ';
const SUPABASE_ANON_KEY = 'ВАШ_ANON_KEY_ЗДЕСЬ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
