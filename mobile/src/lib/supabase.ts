import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://mgsoawteaksivsakobny.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nc29hd3RlYWtzaXZzYWtvYm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4OTA2MjYsImV4cCI6MjA4OTQ2NjYyNn0.F-4Sy1_VkQQ2ZfhbaDVrE3D10Jg5ha1puUiLV3jo9DE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
