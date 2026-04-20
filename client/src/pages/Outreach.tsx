import { useState } from "react";
import {
  useListCampaigns, useListTemplates, useCreateCampaign, useCreateTemplate,
  getListCampaignsQueryKey, getListTemplatesQueryKey,
} from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Mail, MessageCircle, Linkedin, Users, Send, Eye, Reply } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CHANNEL_ICONS: Record<string, React.ElementType> = {
  Email: Mail,
  WhatsApp: MessageCircle,
  LinkedIn: Linkedin,
};

const STATUS_STYLES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Active: "bg-green-500/10 text-green-400",
  Paused: "bg-amber-500/10 text-amber-400",
  Completed: "bg-blue-500/10 text-blue-400",
};

export default function Outreach() {
  const [tab, setTab] = useState<"campaigns" | "templates">("campaigns");
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: campaigns, isLoading: campaignsLoading } = useListCampaigns();
  const { data: templates, isLoading: templatesLoading } = useListTemplates();

  const createCampaign = useCreateCampaign();
  const createTemplate = useCreateTemplate();

  const handleCreateCampaign = (data: { name: string; channel: string }) => {
    createCampaign.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCampaignsQueryKey() });
        setShowCreateCampaign(false);
        toast({ title: "Campaign created" });
      },
    });
  };

  const handleCreateTemplate = (data: { name: string; channel: string; subject?: string; body: string }) => {
    createTemplate.mutate(data, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListTemplatesQueryKey() });
        setShowCreateTemplate(false);
        toast({ title: "Template created" });
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Outreach</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage campaigns and message templates</p>
        </div>
        <button
          onClick={() => tab === "campaigns" ? setShowCreateCampaign(true) : setShowCreateTemplate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {tab === "campaigns" ? "New Campaign" : "New Template"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6">
        {(["campaigns", "templates"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "campaigns" ? (
          campaignsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-card border border-card-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : campaigns && campaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((campaign) => {
                const Icon = CHANNEL_ICONS[campaign.channel] ?? Mail;
                return (
                  <div key={campaign.id} className="bg-card border border-card-border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-foreground">{campaign.name}</h3>
                          <span className="text-xs text-muted-foreground">{campaign.channel}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { icon: Send, label: "Sent", value: campaign.sentCount },
                        { icon: Eye, label: "Opens", value: campaign.openCount },
                        { icon: Reply, label: "Replies", value: campaign.replyCount },
                      ].map(({ icon: StatIcon, label, value }) => (
                        <div key={label} className="bg-background rounded-md p-2">
                          <StatIcon className="w-3 h-3 text-muted-foreground mx-auto mb-1" />
                          <div className="text-sm font-semibold text-foreground">{value}</div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>

                    {campaign.sentCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Open rate: {Math.round((campaign.openCount / campaign.sentCount) * 100)}% ·
                        Reply rate: {Math.round((campaign.replyCount / campaign.sentCount) * 100)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Send className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No campaigns yet. Create your first campaign.</p>
            </div>
          )
        ) : (
          /* Templates */
          templatesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-card border border-card-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => {
                const Icon = CHANNEL_ICONS[template.channel] ?? Mail;
                return (
                  <div key={template.id} className="bg-card border border-card-border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground">{template.name}</h3>
                        <span className="text-xs text-muted-foreground">{template.channel}</span>
                      </div>
                    </div>
                    {template.subject && (
                      <p className="text-xs text-muted-foreground mb-1">Subject: {template.subject}</p>
                    )}
                    <p className="text-sm text-foreground line-clamp-2">{template.body}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Mail className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No templates yet. Create your first message template.</p>
            </div>
          )
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <CreateCampaignModal
          onClose={() => setShowCreateCampaign(false)}
          onSubmit={handleCreateCampaign}
          loading={createCampaign.isPending}
        />
      )}

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onSubmit={handleCreateTemplate}
          loading={createTemplate.isPending}
        />
      )}
    </div>
  );
}

function CreateCampaignModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (data: { name: string; channel: string }) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: "", channel: "Email" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-sm p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">New Campaign</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Campaign Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Channel</label>
            <select
              value={form.channel}
              onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option>Email</option>
              <option>WhatsApp</option>
              <option>LinkedIn</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateTemplateModal({ onClose, onSubmit, loading }: { onClose: () => void; onSubmit: (data: { name: string; channel: string; subject?: string; body: string }) => void; loading: boolean }) {
  const [form, setForm] = useState({ name: "", channel: "Email", subject: "", body: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, subject: form.subject || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-md p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">New Template</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Template Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Channel</label>
              <select
                value={form.channel}
                onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option>Email</option>
                <option>WhatsApp</option>
                <option>LinkedIn</option>
              </select>
            </div>
          </div>
          {form.channel === "Email" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Subject Line</label>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Message Body *</label>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={5}
              placeholder="Hi {{name}}, I noticed your business..."
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-3 py-2 border border-border rounded-md text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {loading ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
