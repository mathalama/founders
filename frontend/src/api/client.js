if (!import.meta.env.VITE_API_URL) {
  throw new Error("Missing required environment variable: VITE_API_URL");
}
export const API_BASE_URL = import.meta.env.VITE_API_URL;

export const fetchWithAuth = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include', // Important for sending/receiving HttpOnly cookies
  });

  return response;
};
