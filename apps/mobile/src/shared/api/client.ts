// apps/mobile/src/shared/api/client.ts

const BASE_URL = 'http://10.0.2.2:3000/api'; // Android Emulator 기준 PC 로컬 주소

export const apiFetch = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Fetch Error] ${endpoint}:`, error);
    throw error;
  }
};