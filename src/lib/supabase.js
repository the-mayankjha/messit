import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sync user profile to Supabase 'profiles' table.
 * Uses an upsert strategy based on the user's email.
 */
export async function syncSupabaseProfile(profileData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        email: profileData.email,
        name: profileData.name,
        hostel: profileData.hostel,
        room_number: profileData.roomNumber,
        mess_type: profileData.messType,
        gender: profileData.gender,
        role: profileData.role || 'None',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email'
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Supabase Sync Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch user profile from Supabase by email.
 */
export async function getSupabaseProfile(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return { success: true, data: null }; // Not found
      throw error;
    }

    // Map snake_case to camelCase
    const mappedData = {
      ...data,
      roomNumber: data.room_number,
      messType: data.mess_type,
    };

    return { success: true, data: mappedData };
  } catch (err) {
    console.error("Supabase Fetch Error:", err.message);
    return { success: false, error: err.message };
  }
}
