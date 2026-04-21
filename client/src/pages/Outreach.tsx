import { useState } from "react";
import { useListCampaigns, useCreateCampaign, useListTemplates, useCreateTemplate, useToggleCampaign } from "@/lib/hooks";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageSquare, Save, Play, Pause, Plus, FileText, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Outreach() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "templates">("campaigns");

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      <div className="px-6 py-5 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground mb-4">Outreach Automation</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "campaigns" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Active Campaigns
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${activeTab === "templates" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Message Templates
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "campaigns" ? <CampaignsTab /> : <TemplatesTab />}
      </div>
    </div>
  );
}

function CampaignsTab() {
  const { data: campaigns, isLoading } = useListCampaigns();
  const toggleCampaign = useToggleCampaign();
  const [showNew, setShowNew] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading Campaigns...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">Marketing Campaigns</h2>
        <button 
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showNew && <NewCampaignForm onCancel={() => setShowNew(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns?.map((c) => (
          <div key={c.id} className="bg-card border border-border rounded-lg p-5 flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-foreground text-lg">{c.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  {c.channel === "Email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  {c.channel}
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${
                c.status === "Active" ? "bg-green-500/10 text-green-500" :
                c.status === "Paused" ? "bg-yellow-500/10 text-yellow-500" :
                "bg-muted text-muted-foreground"
              }`}>
                {c.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 border-y border-border mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{c.sentCount}</div>
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{c.openCount}</div>
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Opened</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{c.replyCount}</div>
                <div className="text-[10px] uppercase text-muted-foreground font-semibold">Replied</div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground pt-3 border-t border-border">
                <span>Updated {formatDistanceToNow(new Date(c.updatedAt))} ago</span>
                <button 
                  onClick={() => toggleCampaign.mutate(c.id)}
                  disabled={toggleCampaign.isPending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded font-medium disabled:opacity-50 text-foreground"
                >
                  {c.status === "Active" ? <><Pause className="w-3.5 h-3.5" /> Pause</> : <><Play className="w-3.5 h-3.5" /> Start</>}
                </button>
              </div>
              {c.isScheduled && c.scheduledAt && (
                <div className="text-[10px] text-primary font-medium flex items-center gap-1">
                  <Send className="w-3 h-3" /> Scheduled: {new Date(c.scheduledAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {campaigns?.length === 0 && !showNew && (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 border border-border rounded-lg border-dashed">
          No campaigns found. Create your first campaign.
        </div>
      )}
    </div>
  );
}

function NewCampaignForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("Email");
  const [templateId, setTemplateId] = useState("");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  
  const { data: templates } = useListTemplates();
  const createCampaign = useCreateCampaign();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaign.mutate(
      { 
        name, 
        channel, 
        templateId: templateId || undefined,
        isScheduled,
        scheduledAt: isScheduled ? scheduledAt : undefined
      },
      {
        onSuccess: () => {
          toast({ title: "Campaign Scheduled Successfully" });
          onCancel();
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-primary/20 rounded-lg p-5 mb-6 shadow-sm">
      <h3 className="font-semibold mb-4 text-primary">New Campaign Setup</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Campaign Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Summer B2B Outreach" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Channel</label>
          <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option>Email</option>
            <option>LinkedIn</option>
            <option>WhatsApp</option>
            <option>SMS</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Assigned Template</label>
          <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">(No Template)</option>
            {templates?.filter(t => t.channel === channel).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-2 cursor-pointer">
            <input type="checkbox" checked={isScheduled} onChange={e => setIsScheduled(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
            Schedule for later?
          </label>
          {isScheduled && (
            <input 
              type="datetime-local" 
              required={isScheduled}
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          )}
        </div>
      </div>
      <div className="flex gap-3 justify-end border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
        <button type="submit" disabled={createCampaign.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Campaign
        </button>
      </div>
    </form>
  );
}

function TemplatesTab() {
  const { data: templates, isLoading } = useListTemplates();
  const [showNew, setShowNew] = useState(false);

  if (isLoading) return <div className="text-muted-foreground">Loading Templates...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-foreground">Message Templates</h2>
        <button 
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          <FileText className="w-4 h-4" /> New Template
        </button>
      </div>

      {showNew && <NewTemplateForm onCancel={() => setShowNew(false)} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates?.map((t) => (
          <div key={t.id} className="bg-card border border-border rounded-lg p-5 flex flex-col h-[280px]">
             <div className="flex justify-between items-start mb-4">
               <div>
                  <h3 className="font-semibold text-foreground text-lg">{t.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    {t.channel === "Email" ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {t.channel}
                  </div>
               </div>
             </div>
             {t.subject && (
               <div className="mb-2 text-sm">
                 <span className="font-semibold text-muted-foreground">Subj: </span>
                 <span className="text-foreground">{t.subject}</span>
               </div>
             )}
             <div className="flex-1 bg-muted/40 rounded border border-border/50 p-3 overflow-y-auto text-sm text-muted-foreground whitespace-pre-wrap font-mono relative">
                {t.body}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewTemplateForm({ onCancel }: { onCancel: () => void }) {
  const [name, setName] = useState("");
  const [channel, setChannel] = useState("Email");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  
  const createTemplate = useCreateTemplate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTemplate.mutate(
      { name, channel, subject, body },
      {
        onSuccess: () => {
          toast({ title: "Template Saved Successfully" });
          onCancel();
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-primary/20 rounded-lg p-5 mb-6 shadow-sm">
      <h3 className="font-semibold mb-4 text-primary">Template Builder</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Template Name</label>
          <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Intro Email" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Target Channel</label>
          <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option>Email</option>
            <option>LinkedIn</option>
            <option>WhatsApp</option>
            <option>SMS</option>
          </select>
        </div>
      </div>
      {channel === "Email" && (
        <div className="mb-4">
           <label className="block text-xs font-medium text-muted-foreground mb-1">Email Subject Line</label>
           <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Quick question about your software..." />
        </div>
      )}
      <div className="mb-4">
         <label className="block text-xs font-medium text-muted-foreground mb-1">Message Body HTML/Text</label>
         <textarea required value={body} onChange={e => setBody(e.target.value)} className="w-full h-32 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono placeholder:text-muted-foreground" placeholder="Hi {{ownerName}},\n\nSaw that {{businessName}} is doing great!..." />
      </div>
      <div className="flex gap-3 justify-end border-t border-border pt-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
        <button type="submit" disabled={createTemplate.isPending} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
          <Save className="w-4 h-4" /> Save Template
        </button>
      </div>
    </form>
  )
}
