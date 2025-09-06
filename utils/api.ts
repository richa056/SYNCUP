// Utility function to get the correct API base URL
export const getApiBaseUrl = (): string => {
  // In production (Vercel), use the full backend URL
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://syncup-k07k.onrender.com';
  }
  
  // In development, use relative URLs (Vite proxy will handle it)
  return '';
};

// Helper function to make API calls with correct base URL
export const apiCall = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  console.log('API call to:', url);
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
};
