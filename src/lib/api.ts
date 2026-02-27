const API_BASE = "/api";

async function fetchAPI(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  return res.json();
}

export const api = {
  auth: {
    signUp: (data: { email: string; password: string; role: string }) =>
      fetchAPI("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
    signIn: (data: { email: string; password: string }) =>
      fetchAPI("/auth/signin", { method: "POST", body: JSON.stringify(data) }),
    signOut: () => fetchAPI("/auth/signout", { method: "POST" }),
    me: () => fetchAPI("/auth/me"),
  },
  centers: {
    list: (params?: { search?: string; language?: string; ccs?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set("search", params.search);
      if (params?.language) q.set("language", params.language);
      if (params?.ccs) q.set("ccs", "true");
      return fetchAPI(`/centers?${q.toString()}`);
    },
    get: (slug: string) => fetchAPI(`/centers/${slug}`),
  },
  enquiries: {
    create: (data: any) =>
      fetchAPI("/enquiries", { method: "POST", body: JSON.stringify(data) }),
    list: () => fetchAPI("/enquiries"),
    update: (id: string, data: any) =>
      fetchAPI(`/enquiries/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  educators: {
    create: (data: any) =>
      fetchAPI("/educators", { method: "POST", body: JSON.stringify(data) }),
  },
  families: {
    getProfile: () => fetchAPI("/families/profile"),
    updateProfile: (data: any) =>
      fetchAPI("/families/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    getChildren: () => fetchAPI("/families/children"),
    addChild: (data: any) =>
      fetchAPI("/families/children", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateChild: (id: string, data: any) =>
      fetchAPI(`/families/children/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
  admin: {
    stats: () => fetchAPI("/admin/stats"),
    enquiries: () => fetchAPI("/admin/enquiries"),
    centers: () => fetchAPI("/admin/centers"),
    educators: () => fetchAPI("/admin/educators"),
  },
};
