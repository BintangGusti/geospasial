import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseBucket = process.env.SUPABASE_BUCKET_NAME || 'media'; // Default: media

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Upload file ke Supabase Storage Bucket
 * @param path Path tujuan di dalam bucket, misalnya: 'rumah_photo/file.jpg'
 * @param fileUri URI lokal file (contoh dari ImagePicker)
 * @param contentType Tipe MIME file, default: 'image/jpeg'
 * @returns Path dalam bucket (tanpa prefix), publicUrl, atau error
 */
export const uploadToBucket = async (
  path: string,
  fileUri: string,
  contentType = 'image/jpeg'
): Promise<{ path?: string; publicUrl?: string; error?: any }> => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { error } = await supabase.storage.from(supabaseBucket).upload(path, blob, {
      contentType,
      upsert: true,
    });

    if (error) {
      return { error };
    }

    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(path);
    return { publicUrl: data.publicUrl, path };
  } catch (error) {
    return { error };
  }
};
