import { updateDirectorInfo } from './supabase';

export interface TruecallerResult {
  success: boolean;
  name?: string | null;
  altName?: string | null;
  phone?: string;
  e164?: string;
  webSearchUrl: string;
  error?: string;
  cached?: boolean;
}

export async function lookupTruecaller(
  phone: string,
  centerId?: string
): Promise<TruecallerResult> {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  let bdPhone = cleanPhone;
  if (bdPhone.startsWith('880')) bdPhone = bdPhone.substring(3);
  else if (bdPhone.startsWith('0')) bdPhone = bdPhone.substring(1);

  const fallbackUrl = `https://www.truecaller.com/search/bd/${bdPhone}`;

  if (!bdPhone || bdPhone.length < 8) {
    return {
      success: false,
      error: 'ফোন নম্বরটি সঠিক নয়',
      webSearchUrl: fallbackUrl,
    };
  }

  try {
    const res = await fetch(`/api/truecaller?phone=${encodeURIComponent(phone)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.name) {
        // Cache to Supabase and LocalStorage
        if (centerId) {
          await updateDirectorInfo(centerId, data.name, data.name);
        }
        return {
          success: true,
          name: data.name,
          altName: data.altName,
          phone,
          e164: data.e164,
          webSearchUrl: data.webSearchUrl || fallbackUrl,
        };
      } else if (data.fallback) {
        return {
          success: false,
          error: data.error || 'নাম পাওয়া যায়নি (Web সার্চ দেখুন)',
          webSearchUrl: data.webSearchUrl || fallbackUrl,
        };
      }
    }
  } catch (err) {
    console.warn('API lookup failed, providing web link:', err);
  }

  // Graceful fallback to direct web search
  return {
    success: false,
    error: 'Truecaller Web সার্চে নাম দেখুন',
    webSearchUrl: fallbackUrl,
  };
}
