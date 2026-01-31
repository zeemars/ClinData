
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 请确保在环境变量中配置了以下信息
const supabaseUrl = (window as any)._env_?.SUPABASE_URL || 'https://ipnlsdowoilhbthgxbyt.supabase.co';
const supabaseAnonKey = (window as any)._env_?.SUPABASE_ANON_KEY || 'sb_publishable_MQ-O2LaYUlNJrWE4c8d5BQ_dyP-v9g_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
