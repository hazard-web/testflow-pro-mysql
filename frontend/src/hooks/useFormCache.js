import { useState } from 'react';

/**
 * Hook for caching non-sensitive form data to localStorage
 * Usage: const [form, setForm, saveCache, clearCache] = useFormCache('formName', initialState)
 */
export function useFormCache(formKey, initialState) {
  const [form, setForm] = useState(() => {
    try {
      const cached = localStorage.getItem(`form_cache_${formKey}`);
      if (cached) {
        return { ...initialState, ...JSON.parse(cached) };
      }
    } catch (e) {
      console.warn(`Failed to load form cache for ${formKey}:`, e);
    }
    return initialState;
  });

  const saveCache = (data = form) => {
    try {
      localStorage.setItem(`form_cache_${formKey}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to save form cache for ${formKey}:`, e);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(`form_cache_${formKey}`);
    } catch (e) {
      console.warn(`Failed to clear form cache for ${formKey}:`, e);
    }
  };

  const updateForm = (updates) => {
    const newForm = typeof updates === 'function' ? updates(form) : { ...form, ...updates };
    setForm(newForm);
    saveCache(newForm);
  };

  return [form, updateForm, saveCache, clearCache];
}

/**
 * Get cached user details without being logged in
 * Returns: { name, email, initials, avatar_color, role }
 */
export function getCachedUserDetails() {
  try {
    const cached = localStorage.getItem('user_cache');
    return cached ? JSON.parse(cached) : null;
  } catch (e) {
    console.warn('Failed to get cached user details:', e);
    return null;
  }
}

/**
 * Clear all cached form and user data
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('form_cache_') || key === 'user_cache') {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}
