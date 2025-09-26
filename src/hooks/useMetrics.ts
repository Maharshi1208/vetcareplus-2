import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function api<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function useMetrics(token: string) {
  const summary = useQuery({
    queryKey: ['metrics', 'summary'],
    queryFn: () =>
      api<{ ok: boolean; data: any }>('/metrics/summary', token).then(r => r.data),
    enabled: !!token,
    refetchInterval: 15000,
  });

  const appointments = useQuery({
    queryKey: ['metrics', 'appointments', 7],
    queryFn: () =>
      api<{ ok: boolean; data: any[] }>('/metrics/appointments?days=7', token).then(r => r.data),
    enabled: !!token,
    refetchInterval: 30000,
  });

  return { summary, appointments };
}
