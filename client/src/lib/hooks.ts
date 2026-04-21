import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiLeads,
  apiDashboard,
  apiCrm,
  apiCrmPush,
  apiOutreach,
  getListLeadsQueryKey,
  getGetLeadQueryKey,
  getGetLeadNotesQueryKey,
  getGetCrmPipelineQueryKey,
  getListCampaignsQueryKey,
  getListTemplatesQueryKey,
  type LeadListParams,
  type CrmStage,
  type Lead,
} from "./api";

// ─── Dashboard Hooks ─────────────────────────────────────────────────────────

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: apiDashboard.stats,
  });
}

export function useGetLeadScoreBreakdown() {
  return useQuery({
    queryKey: ["/api/dashboard/lead-scores"],
    queryFn: apiDashboard.leadScores,
  });
}

export function useGetPipelineValues() {
  return useQuery({
    queryKey: ["/api/dashboard/pipeline-values"],
    queryFn: apiDashboard.pipelineValues,
  });
}

export function useGetRecentActivity() {
  return useQuery({
    queryKey: ["/api/dashboard/recent-activity"],
    queryFn: apiDashboard.recentActivity,
  });
}

export function useGetIndustryBreakdown() {
  return useQuery({
    queryKey: ["/api/dashboard/industry-breakdown"],
    queryFn: apiDashboard.industryBreakdown,
  });
}

// ─── Leads Hooks ─────────────────────────────────────────────────────────────

export function useListLeads(params?: LeadListParams) {
  return useQuery({
    queryKey: getListLeadsQueryKey(params),
    queryFn: () => apiLeads.list(params),
  });
}

export function useGetLead(id: string) {
  return useQuery({
    queryKey: getGetLeadQueryKey(id),
    queryFn: () => apiLeads.get(id),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Lead>) => apiLeads.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    },
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) =>
      apiLeads.update(id, data),
    onSuccess: (_r, variables) => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: getGetLeadQueryKey(variables.id) });
      qc.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    },
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiLeads.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    },
  });
}

export function useBulkDeleteLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => apiLeads.bulkDeleteByTag(tag),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
      qc.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
    },
  });
}

// ─── Notes Hooks ─────────────────────────────────────────────────────────────

export function useGetLeadNotes(leadId: string) {
  return useQuery({
    queryKey: getGetLeadNotesQueryKey(leadId),
    queryFn: () => apiLeads.getNotes(leadId),
    enabled: !!leadId,
  });
}

export function useAddLeadNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      apiLeads.addNote(leadId, content),
    onSuccess: (_r, variables) => {
      qc.invalidateQueries({ queryKey: getGetLeadNotesQueryKey(variables.leadId) });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
    },
  });
}

// ─── CRM Hooks ───────────────────────────────────────────────────────────────

export function useGetCrmPipeline() {
  return useQuery({
    queryKey: getGetCrmPipelineQueryKey(),
    queryFn: apiCrm.pipeline,
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: CrmStage }) =>
      apiCrm.updateStage(leadId, stage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/crm/pipeline"] });
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
  });
}

// ─── CRM Push Hooks ────────────────────────────────────────────────────────
export function usePushToCrm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leadIds: string[]) => apiCrmPush.pushLeads(leadIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leads"] });
    },
  });
}

// ─── Outreach Hooks ──────────────────────────────────────────────────────────

export function useListCampaigns() {
  return useQuery({
    queryKey: getListCampaignsQueryKey(),
    queryFn: apiOutreach.campaigns,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; channel: string; templateId?: string }) =>
      apiOutreach.createCampaign(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    },
  });
}

export function useToggleCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiOutreach.toggleCampaignStatus(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
    }
  });
}

export function useListTemplates() {
  return useQuery({
    queryKey: getListTemplatesQueryKey(),
    queryFn: apiOutreach.templates,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; channel: string; subject?: string; body: string }) =>
      apiOutreach.createTemplate(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
    },
  });
}

// Re-export query key helpers for use in page components
export {
  getListLeadsQueryKey,
  getGetLeadQueryKey,
  getGetLeadNotesQueryKey,
  getGetCrmPipelineQueryKey,
  getListCampaignsQueryKey,
  getListTemplatesQueryKey,
};
