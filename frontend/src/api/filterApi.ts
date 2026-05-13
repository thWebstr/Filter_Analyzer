import type { FilterRequest, FilterResult } from "../types/filter";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function designFilter(
  request: FilterRequest
): Promise<FilterResult> {
  const response = await fetch(`${API_URL}/api/design`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail ?? "Filter design failed");
  }

  return response.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}