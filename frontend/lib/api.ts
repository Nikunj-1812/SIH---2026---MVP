const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
    try {
      const errData = await response.json();
      if (errData?.detail) {
        errorMsg = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData?.error?.message) {
        errorMsg = errData.error.message;
      }
    } catch (e) {
      // json parse fallback
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export async function uploadFileApi(endpoint: string, formData: FormData): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMsg = `Upload Failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData?.detail) errorMsg = errData.detail;
    } catch (e) {}
    throw new Error(errorMsg);
  }

  return response.json();
}
