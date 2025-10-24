// Dynamic import to avoid bundler export warnings and support various builds

export async function getQuickAuthToken() {
  const mod: any = await import("@farcaster/quick-auth");
  const getTokenFn = mod?.getToken || mod?.default?.getToken;
  if (!getTokenFn) throw new Error("Quick Auth getToken not available");
  const { token } = await getTokenFn(); // prompts in Base/Farcaster clients
  return token;
}

export async function authedFetch(path: string, init: RequestInit = {}) {
  const token = await getQuickAuthToken();
  const baseUrl = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` }
  });
}
