import { useState } from "react";
import { useListLeads, useCreateLead, useDeleteLead } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getListLeadsQueryKey } from "@workspace/api-client-react";
import ScoreBadge from "@/components/ScoreBadge";
import { Search, Plus, Trash2, ExternalLink, Globe, Globe2, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const STAGES = ["", "New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];
const SCORES = ["", "Hot", "Warm", "Cold"];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [score, setScore] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const params = {
    search: search || undefined,
    score: score as "Hot" | "Warm" | "Cold" | undefined || undefined,
    status: status || undefined,
    page,
    limit: 20,
  };

  const { data, isLoading } = useListLeads(params, {
    query: { queryKey: getListLeadsQueryKey(params) },
  });

  const deleteLead = useDeleteLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        toast({ title: "Lead deleted" });
      },
    },
  });

  const createLead = useCreateLead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListLeadsQueryKey() });
        setShowCreate(false);
        toast({ title: "Lead created" });
      },
    },
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground">{total} total leads</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-card/50">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={score}
          onChange={(e) => { setScore(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Scores</option>
          {SCORES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Stages</option>
          {STAGES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-background border-b border-border">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Business</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Score</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Industry</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Location</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Website</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Stage</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-muted animate-pulse rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                  No leads found. Add your first lead to get started.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-card/40 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                      {lead.businessName}
                    </Link>
                    {lead.ownerName && <div className="text-xs text-muted-foreground">{lead.ownerName}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge category={lead.scoreCategory} score={lead.leadScore} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.industry ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{lead.location ?? "—"}</td>
                  <td className="px-4 py-3">
                    {lead.noWebsite ? (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <Globe2 className="w-3 h-3" /> No Website
                      </span>
                    ) : lead.website ? (
                      <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {new URL(lead.website).hostname.replace("www.", "")}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{lead.email ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{lead.crmStage}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/leads/${lead.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteLead.mutate({ id: lead.id })}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-border">
          <span className="text-xs text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= total}
              className="p-1 rounded hover:bg-muted disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateLeadModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createLead.mutate({ data })}
          loading={createLead.isPending}
        />
      )}
    </div>
  );
}

function CreateLeadModal({ onClose, onSubmit, loading }: {
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    website: "",
    industry: "",
    location: "",
    country: "",
    noWebsite: false,
    poorSeo: false,
    noSocialPresence: false,
    mobileUnfriendly: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      ownerName: form.ownerName || null,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      industry: form.industry || null,
      location: form.location || null,
      country: form.country || null,
      tags: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground mb-5">Add New Lead</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Business Name *</label>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Owner Name</label>
              <input
                value={form.ownerName}
                onChange={(e) => setForm((f) => ({ ...f, ownerName: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Industry</label>
              <input
                value={form.industry}
                onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Location</label>
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "noWebsite", label: "No Website (+30pts)" },
              { key: "poorSeo", label: "Poor SEO (+25pts)" },
              { key: "noSocialPresence", label: "No Social (+15pts)" },
              { key: "mobileUnfriendly", label: "Mobile Unfriendly (+20pts)" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  className="rounded border-border"
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
              {loading ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
