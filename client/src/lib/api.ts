// ─── Types ───────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  businessName: string;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsappActive?: boolean | null;
  website?: string | null;
  linkedinProfile?: string | null;
  companySize?: string | null;
  industry?: string | null;
  location?: string | null;
  country?: string | null;
  techStack?: string | null;
  seoScore?: number | null;
  performanceScore?: number | null;
  leadScore: number;
  scoreCategory: "Hot" | "Warm" | "Cold";
  crmStage: CrmStage;
  tags: string[];
  noWebsite: boolean;
  poorSeo: boolean;
  noSocialPresence: boolean;
  mobileUnfriendly: boolean;
  aiInsight?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CrmStage =
  | "New Lead"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Closed Won"
  | "Closed Lost";

export interface Note {
  id: string;
  leadId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: "Draft" | "Active" | "Paused" | "Completed";
  channel: "Email" | "LinkedIn" | "WhatsApp" | "SMS";
  templateId?: string | null;
  sentCount: number;
  openCount: number;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  channel: "Email" | "LinkedIn" | "WhatsApp" | "SMS";
  subject?: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  leadName?: string | null;
  createdAt: string;
}

export interface DashboardStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  closedWon: number;
  activeCampaigns: number;
  emailsSentThisMonth: number;
  avgLeadScore: number;
}

export interface ScoreBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface PipelineValue {
  stage: string;
  count: number;
}

export interface IndustryBreakdown {
  industry: string;
  count: number;
}

export interface LeadListParams {
  search?: string;
  score?: string;
  industry?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface LeadsResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

export interface CrmPipelineResponse {
  stages: { stage: string; leads: Lead[] }[];
}


// ─── Fetch Helper ────────────────────────────────────────────────────────────

import { navigateTo } from "@/lib/navigation";

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    credentials: "include", // SaaS requirement: Enable cookies
  };

  let res = await fetch(url, fetchOptions);

  // If unauthorized, attempt to rotate refresh token
  if (res.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
    try {
      const refreshRes = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
      if (refreshRes.ok) {
        // Retry original request
        res = await fetch(url, fetchOptions);
      } else {
        // Let the app handle logout + routing without a hard reload.
        window.dispatchEvent(new Event("auth:logout"));
        navigateTo("/login");
        throw new Error("Session expired. Please login again.");
      }
    } catch (err) {
      window.dispatchEvent(new Event("auth:logout"));
      navigateTo("/login");
      throw new Error("Session expired. Please login again.");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const getListLeadsQueryKey = (params?: LeadListParams) =>
  ["/api/leads", params] as const;

export const getGetLeadQueryKey = (id: string) => ["/api/leads", id] as const;

export const getGetLeadNotesQueryKey = (id: string) =>
  ["/api/leads", id, "notes"] as const;

export const getGetCrmPipelineQueryKey = () => ["/api/crm/pipeline"] as const;

export const getListCampaignsQueryKey = () => ["/api/outreach/campaigns"] as const;

export const getListTemplatesQueryKey = () => ["/api/outreach/templates"] as const;

// ─── API Functions ───────────────────────────────────────────────────────────

export const apiLeads = {
  list: (params?: LeadListParams) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.score) qs.set("score", params.score);
    if (params?.industry) qs.set("industry", params.industry);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return apiFetch<LeadsResponse>(`/api/leads?${qs.toString()}`);
  },
  get: (id: string) => apiFetch<Lead>(`/api/leads/${id}`),
  create: (data: Partial<Lead>) =>
    apiFetch<Lead>("/api/leads", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lead>) =>
    apiFetch<Lead>(`/api/leads/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch<void>(`/api/leads/${id}`, { method: "DELETE" }),
  bulkDeleteByTag: (tag: string) => apiFetch<{ deletedCount: number }>(`/api/leads?tag=${encodeURIComponent(tag)}`, { method: "DELETE" }),
  getNotes: (id: string) => apiFetch<Note[]>(`/api/leads/${id}/notes`),
  addNote: (id: string, content: string) =>
    apiFetch<Note>(`/api/leads/${id}/notes`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

export const apiDashboard = {
  stats: () => apiFetch<DashboardStats>("/api/dashboard/stats"),
  leadScores: () => apiFetch<ScoreBreakdown[]>("/api/dashboard/lead-scores"),
  pipelineValues: () => apiFetch<PipelineValue[]>("/api/dashboard/pipeline-values"),
  recentActivity: () => apiFetch<Activity[]>("/api/dashboard/recent-activity"),
  industryBreakdown: () => apiFetch<IndustryBreakdown[]>("/api/dashboard/industry-breakdown"),
};

export const apiCrm = {
  pipeline: () => apiFetch<CrmPipelineResponse>("/api/crm/pipeline"),
  updateStage: (id: string, stage: CrmStage) =>
    apiFetch<Lead>(`/api/crm/leads/${id}/stage`, {
      method: "PUT",
      body: JSON.stringify({ stage }),
    }),
};

export const apiOutreach = {
  campaigns: () => apiFetch<Campaign[]>("/api/outreach/campaigns"),
  getCampaign: (id: string) => apiFetch<Campaign>(`/api/outreach/campaigns/${id}`),
  createCampaign: (data: { name: string; channel: string; templateId?: string }) =>
    apiFetch<Campaign>("/api/outreach/campaigns", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  templates: () => apiFetch<Template[]>("/api/outreach/templates"),
  createTemplate: (data: { name: string; channel: string; subject?: string; body: string }) =>
    apiFetch<Template>("/api/outreach/templates", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export interface SearchResult {
  type: "local" | "organic";
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number | null;
  reviews: number | null;
  category: string;
  hours: string;
  thumbnail: string;
  snippet?: string;
  placeId: string;
  googleMapsLink: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export const apiSearch = {
  businesses: (q: string) => apiFetch<SearchResponse>(`/api/search/businesses?q=${encodeURIComponent(q)}`),
};

export const apiAuth = {
  login: (data: any) =>
    apiFetch<any>("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data: any) =>
    apiFetch<any>("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  me: () => apiFetch<any>("/api/auth/me"),
  logout: () => apiFetch<any>("/api/auth/logout", { method: "POST" }),
};
