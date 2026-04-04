import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function upsertProfileRecord(payload) {
  return supabase
    .from('profiles')
    .upsert(payload, {
      onConflict: 'email'
    })
    .select();
}

/**
 * Sync user profile to Supabase 'profiles' table.
 * Uses an upsert strategy based on the user's email.
 */
export async function syncSupabaseProfile(profileData) {
  try {
    const payload = {
      email: profileData.email,
      name: profileData.name,
      hostel: profileData.hostel,
      room_number: profileData.roomNumber,
      mess_type: profileData.messType,
      gender: profileData.gender,
      role: profileData.role || 'None',
      picture: profileData.picture || null,
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await upsertProfileRecord(payload);

    // Backward-compatible fallback in case the profiles table
    // does not yet have a `picture` column.
    if (error && payload.picture) {
      const retryPayload = { ...payload };
      delete retryPayload.picture;
      const retry = await upsertProfileRecord(retryPayload);
      data = retry.data;
      error = retry.error;
    }

    if (error) throw error;

    // Some Supabase setups behave more reliably when the avatar URL
    // is updated explicitly after the conflict-based upsert.
    if (profileData.picture) {
      const { data: pictureData, error: pictureError } = await supabase
        .from('profiles')
        .update({
          picture: profileData.picture,
          updated_at: new Date().toISOString(),
        })
        .eq('email', profileData.email)
        .select();

      if (!pictureError && pictureData) {
        data = pictureData;
      } else if (pictureError) {
        console.error('Supabase Picture Sync Error:', pictureError.message);
      }
    }

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

/**
 * Upload Parsed Mess Menu to Cloud (Admin Only via RLS)
 * @param {string} category 'MH' or 'LH' (generalized category)
 * @param {string} messType 'Veg', 'Non-Veg', 'Special'
 * @param {object} menuData Parsed JSON menu
 * @param {string} adminEmail Requester's email for auditing
 */
export async function uploadMessMenu(category, messType, menuData, adminEmail) {
  try {
    const { data, error } = await supabase
      .from('mess_menus')
      .upsert({
        hostel: category,
        mess_type: messType,
        menu_data: menuData,
        updated_by: adminEmail,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'hostel, mess_type' // Requires a unique constraint on (hostel, mess_type)
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Supabase Upload Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch Mess Menu from Cloud based on user profile.
 * @param {string} hostel The user's specific hostel (e.g., 'MH1')
 * @param {string} messType The user's mess type (e.g., 'Veg')
 */
export async function getMessMenu(hostel, messType) {
  try {
    const category = hostel.startsWith('MH') ? 'MH' : (hostel.startsWith('LH') ? 'LH' : hostel);

    // 1. Try Exact Match
    let { data, error } = await supabase
      .from('mess_menus')
      .select('*')
      .eq('hostel', category)
      .eq('mess_type', messType)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return { 
        success: true, 
        data: data.menu_data, 
        updatedAt: data.updated_at, 
        actualMessType: data.mess_type,
        isFallback: false 
      };
    }

    // 2. Fallback: Get the latest menu for this hostel regardless of type
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('mess_menus')
      .select('*')
      .eq('hostel', category)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fallbackError) throw fallbackError;

    if (fallbackData) {
      return { 
        success: true, 
        data: fallbackData.menu_data, 
        updatedAt: fallbackData.updated_at, 
        actualMessType: fallbackData.mess_type,
        isFallback: true 
      };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("Supabase Menu Fetch Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Submit a request to become a Coordinator.
 */
export async function submitCoordinatorRequest(email, name, hostel) {
  try {
    const { data, error } = await supabase
      .from('coordinator_requests')
      .upsert({
        user_email: email,
        user_name: name,
        hostel: hostel,
        status: 'pending',
        created_at: new Date().toISOString()
      }, { onConflict: 'user_email' }) // One request at a time
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Request Update Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all pending coordinator requests (Admin Only)
 */
export async function getPendingRequests() {
  try {
    const { data, error } = await supabase
      .from('coordinator_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Fetch Requests Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Approve or Reject a Coordinator Request
 */
export async function updateRequestStatus(requestId, status, userEmail, newRole = 'None') {
  try {
    // 1. Update the request status
    const { error: requestError } = await supabase
      .from('coordinator_requests')
      .update({ status })
      .eq('id', requestId);

    if (requestError) throw requestError;

    // 2. If approved, update the user profile role
    if (status === 'approved') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('email', userEmail);

      if (profileError) throw profileError;
    }

    return { success: true };
  } catch (err) {
    console.error("Status Update Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Create a Global Announcement
 */
export async function createAnnouncement(title, content, adminEmail) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title,
        content,
        created_by: adminEmail,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Announcement Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch latest global announcements
 */
export async function getAnnouncements() {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Fetch Announcements Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Update an existing Global Announcement
 */
export async function updateAnnouncement(id, title, content) {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title,
        content
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Update Announcement Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a Global Announcement
 */
export async function deleteAnnouncement(id) {
  try {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Delete Announcement Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch a specific user's coordinator request status.
 */
export async function getUserCoordinatorRequest(email) {
  try {
    const { data, error } = await supabase
      .from('coordinator_requests')
      .select('*')
      .eq('user_email', email)
      .maybeSingle();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("Fetch Request Error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all users with a privileged role (Admin, Developer, Coordinator)
 */
export async function getPrivilegedUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('role', ['Admin', 'Developer', 'Coordinator'])
      .order('role', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Fetch Privileged Users Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Fetch all users from the profiles table for developer visibility tools.
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Fetch All Users Error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Revoke a user's privileged role and reset it to 'None'
 * @param {string} email - The user's email
 */
export async function revokeUserRole(email) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'None' })
      .eq('email', email);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Revoke Role Error:', err.message);
    return { success: false, error: err.message };
  }
}
