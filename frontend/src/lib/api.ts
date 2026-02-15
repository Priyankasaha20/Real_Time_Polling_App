const API_BASE = "/api";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw {
      status: res.status,
      ...data,
    };
  }

  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  signup: (body: { email: string; password: string; name: string }) =>
    fetchAPI("/auth/signup", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    fetchAPI("/auth/login", { method: "POST", body: JSON.stringify(body) }),

  logout: () => fetchAPI("/auth/logout", { method: "POST" }),

  me: () => fetchAPI("/auth/me"),
};

// ─── Polls ─────────────────────────────────────────────────────────
export const pollsAPI = {
  create: (body: { question: string; options: string[]; isPublic?: boolean }) =>
    fetchAPI("/polls", { method: "POST", body: JSON.stringify(body) }),

  getById: (id: string) => fetchAPI(`/polls/${id}`),

  list: (page = 1, limit = 10) =>
    fetchAPI(`/polls?page=${page}&limit=${limit}`),

  myPolls: () => fetchAPI("/polls/user/mine"),
};

// ─── Votes ─────────────────────────────────────────────────────────
export const votesAPI = {
  checkStatus: (pollId: string, fingerprint: string) =>
    fetchAPI(`/votes/${pollId}/status?fingerprint=${encodeURIComponent(fingerprint)}`),

  cast: (
    pollId: string,
    body: { optionId: string; fingerprint: string; voterName?: string }
  ) =>
    fetchAPI(`/votes/${pollId}`, { method: "POST", body: JSON.stringify(body) }),
};