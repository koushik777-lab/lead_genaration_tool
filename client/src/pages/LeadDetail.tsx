import { useState } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetLead, useGetLeadNotes, useUpdateLeadStage, useAddLeadNote,
  getGetLeadQueryKey, getGetLeadNotesQueryKey, getGetCrmPipelineQueryKey,
} from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import ScoreBadge from "@/components/ScoreBadge";
import { ArrowLeft, Globe, Mail, Phone, Linkedin, MessageCircle, Tag, Clock, ChevronDown, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { CrmStage } from "@/lib/api";

const CRM_STAGES: CrmStage[] = ["New Lead", "Contacted", "Qualified", "Proposal Sent", "Closed Won", "Closed Lost"];

export default function LeadDetail() {
  const [, params] = useRoute("/leads/:id");
  const id = params?.id ?? "";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");

  const { data: lead, isLoading } = useGetLead(id);
  const { data: notes } = useGetLeadNotes(id);
  const updateStage = useUpdateLeadStage();
  const addNote = useAddLeadNote();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded w-48" />
        <div className="h-4 bg-muted animate-pulse rounded w-64" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-card animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Lead not found</p>
      </div>
    );
  }

  const handleStageChange = (stage: CrmStage) => {
    updateStage.mutate({ leadId: id, stage }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetCrmPipelineQueryKey() });
        toast({ title: "Stage updated" });
      },
    });
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addNote.mutate({ leadId: id, content: noteText.trim() }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLeadNotesQueryKey(id) });
        setNoteText("");
        toast({ title: "Note added" });
      },
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/leads" className="mt-1 p-1.5 rounded hover:bg-muted transition-colors block">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-foreground">{lead.businessName}</h1>
            <ScoreBadge category={lead.scoreCategory} score={lead.leadScore} />
          </div>
          {lead.ownerName && <p className="text-sm text-muted-foreground mt-0.5">{lead.ownerName}</p>}
        </div>
        {/* Stage selector */}
        <div className="relative">
          <select
            value={lead.crmStage}
            onChange={(e) => handleStageChange(e.target.value as CrmStage)}
            className="appearance-none pr-8 pl-3 py-1.5 bg-primary/10 border border-primary/20 rounded-md text-sm font-medium text-primary focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            {CRM_STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-primary pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact Details */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {lead.email && (
                <InfoItem icon={Mail} label="Email">
                  <a href={`mailto:${lead.email}`} className="text-blue-400 hover:underline text-sm">{lead.email}</a>
                </InfoItem>
              )}
              {lead.phone && (
                <InfoItem icon={Phone} label="Phone">
                  <span className="text-sm text-foreground">{lead.phone}</span>
                </InfoItem>
              )}
              {lead.website && (
                <InfoItem icon={Globe} label="Website">
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm truncate">{lead.website}</a>
                </InfoItem>
              )}
              {lead.linkedinProfile && (
                <InfoItem icon={Linkedin} label="LinkedIn">
                  <a href={lead.linkedinProfile} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm">View Profile</a>
                </InfoItem>
              )}
              {lead.whatsappActive && (
                <InfoItem icon={MessageCircle} label="WhatsApp">
                  <span className="text-sm text-green-400">Active</span>
                </InfoItem>
              )}
            </div>
          </div>

          {/* Business Details */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Business Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Industry", value: lead.industry },
                { label: "Company Size", value: lead.companySize },
                { label: "Location", value: lead.location },
                { label: "Country", value: lead.country },
                { label: "Tech Stack", value: lead.techStack },
                { label: "SEO Score", value: lead.seoScore != null ? `${lead.seoScore}/100` : null },
                { label: "Performance", value: lead.performanceScore != null ? `${lead.performanceScore}/100` : null },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <span className="text-xs text-muted-foreground block">{label}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Opportunity Flags */}
          <div className="bg-card border border-card-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Opportunity Signals</h3>
            <div className="flex flex-wrap gap-2">
              {lead.noWebsite && <FlagBadge label="No Website" points={30} />}
              {lead.poorSeo && <FlagBadge label="Poor SEO" points={25} />}
              {lead.mobileUnfriendly && <FlagBadge label="Mobile Unfriendly" points={20} />}
              {lead.noSocialPresence && <FlagBadge label="No Social Presence" points={15} />}
              {!lead.noWebsite && !lead.poorSeo && !lead.mobileUnfriendly && !lead.noSocialPresence && (
                <span className="text-sm text-muted-foreground">No specific signals detected</span>
              )}
            </div>
          </div>

          {/* AI Insight */}
          {lead.aiInsight && (
            <div className="bg-primary/5 border border-primary/15 rounded-lg p-4">
              <h3 className="text-sm font-medium text-primary mb-2">AI Insight</h3>
              <p className="text-sm text-foreground">{lead.aiInsight}</p>
            </div>
          )}

          {/* Tags */}
          {lead.tags && lead.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" />
              {lead.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Right - Notes */}
        <div className="bg-card border border-card-border rounded-lg p-4 flex flex-col h-fit">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Notes
          </h3>
          <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
            {notes && notes.length > 0 ? notes.map((note) => (
              <div key={note.id} className="border-l-2 border-primary/30 pl-3">
                <p className="text-sm text-foreground">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </p>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No notes yet</p>
            )}
          </div>
          <div className="flex gap-2 mt-auto">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              rows={2}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || addNote.isPending}
              className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-xs text-muted-foreground block">{label}</span>
        {children}
      </div>
    </div>
  );
}

function FlagBadge({ label, points }: { label: string; points: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
      {label}
      <span className="text-amber-500/60">+{points}pts</span>
    </span>
  );
}
