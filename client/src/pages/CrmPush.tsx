import { useState, useMemo } from "react";
import { useListLeads, usePushToCrm } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Send, AlertTriangle, CheckCircle2, ListFilter, RefreshCw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function CrmPush() {
  const [search, setSearch] = useState("");
  const [pushStatusMap, setPushStatusMap] = useState<string>("all");
  const [hasPhone, setHasPhone] = useState(true);
  const [hasEmail, setHasEmail] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Custom fetch parameters (using existing list logic, adding frontend filtering)
  const { data, isLoading } = useListLeads({ limit: 500 }); // fetch more for bulk queueing
  const pushToCrm = usePushToCrm();

  const leads = data?.leads ?? [];

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      // Name/Email/Phone Search
      if (search) {
        const lowerSearch = search.toLowerCase();
        const matchesName = l.businessName.toLowerCase().includes(lowerSearch);
        const matchesEmail = l.email?.toLowerCase().includes(lowerSearch);
        const matchesPhone = l.phone?.toLowerCase().includes(lowerSearch);
        if (!matchesName && !matchesEmail && !matchesPhone) return false;
      }

      // Dropdown filter
      if (pushStatusMap !== "all" && l.pushStatus !== pushStatusMap) return false;

      // MANDATORY RULE: Must have Phone (Always enforced for CRM)
      if (!l.phone) return false;
      
      // USER RULE: Filter by Email only if requested
      if (hasEmail && !l.email) return false;

      return true;
    });
  }, [leads, search, pushStatusMap, hasEmail]);

  // Aggregate selected leads from filtered view
  const selectedLeads = filteredLeads.filter(l => selectedIds.has(l.id));

  // Top metric bar arrays
  const totalCount = filteredLeads.length;
  const sentCount = filteredLeads.filter(l => l.pushStatus === "sent").length;
  const failedCount = filteredLeads.filter(l => l.pushStatus === "failed").length;

  const toggleAll = () => {
    if (selectedIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  const toggleLead = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSendSelected = () => {
    if (selectedIds.size === 0) return;
    
    // Convert Set to Array
    const leadIds = Array.from(selectedIds);

    pushToCrm.mutate(leadIds, {
      onSuccess: (res) => {
        toast({
          title: "Push Process Completed",
          description: `Attempted: ${res.totalRequested} | Succeeded: ${res.succeeded} | Failed: ${res.failed}`,
        });
        setSelectedIds(new Set());
        setShowPreview(false);
      },
      onError: (err: any) => {
        toast({
          title: "System Error during Sync",
          description: err.message,
          variant: "destructive"
        });
      }
    });
  };

  const handleRetryFailed = () => {
    const failedIds = filteredLeads
      .filter((l) => l.pushStatus === "failed")
      .map((l) => l.id);

    if (failedIds.length === 0) {
      toast({ description: "No failed leads in current view to retry."});
      return;
    }

    pushToCrm.mutate(failedIds, {
      onSuccess: (res) => {
        toast({
          title: "Retry Process Completed",
          description: `Retried: ${res.totalRequested} | Succeeded: ${res.succeeded}`,
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header Panel */}
      <div className="px-6 py-5 border-b border-border bg-card">
        <h1 className="text-xl font-semibold text-foreground mb-4">CRM Push Engine</h1>
        
        {/* Progress Overview Panel */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <StatBox label="Total in View" value={totalCount} />
          <StatBox label="Successfully Sent" value={sentCount} color="text-green-500" />
          <StatBox label="Failed Syncs" value={failedCount} color="text-red-500" />
          <StatBox label="Currently Selected" value={selectedIds.size} color="text-primary" />
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(true)}
            disabled={selectedIds.size === 0 || pushToCrm.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pushToCrm.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Review & Send ({selectedIds.size})
          </button>
          <button
            onClick={handleRetryFailed}
            disabled={failedCount === 0 || pushToCrm.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-background border border-border text-foreground hover:bg-muted rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${pushToCrm.isPending ? "animate-spin" : ""}`} />
            Retry Failed ({failedCount})
          </button>
        </div>
      </div>

      {/* Discovery Filters */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-border bg-card/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search pending queue by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-muted-foreground" />
          <select
            value={pushStatusMap}
            onChange={(e) => setPushStatusMap(e.target.value)}
            className="px-3 py-1.5 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex gap-4 px-4 border-l border-border items-center">
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
            Phone Mandatory 
          </span>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={hasEmail} onChange={(e) => setHasEmail(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
            Filter: Must have Email
          </label>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="flex-1 overflow-auto bg-background">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={filteredLeads.length > 0 && selectedIds.size === filteredLeads.length}
                  onChange={toggleAll}
                  className="rounded border-border text-primary focus:ring-primary"
                />
              </th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Target Business</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Phone Link</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Email Address</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Sync Status</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Last Attempt</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading queue data...</td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">No leads found matching your criteria.</td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(lead.id)}
                      onChange={() => toggleLead(lead.id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-sm text-foreground">{lead.businessName}</div>
                    <div className="text-xs text-muted-foreground">{lead.industry}</div>
                  </td>
                  <td className="p-3 text-sm text-foreground">{lead.phone || <em className="text-muted-foreground">Missing</em>}</td>
                  <td className="p-3 text-sm text-foreground">{lead.email || <em className="text-muted-foreground">Missing</em>}</td>
                  <td className="p-3">
                    <PushStatusBadge status={lead.pushStatus} error={lead.errorMessage} />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {lead.sentAt ? formatDistanceToNow(new Date(lead.sentAt), { addSuffix: true }) : "Never"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Map Modal */}
      {showPreview && (
        <PreviewModal 
          selectedLeads={selectedLeads} 
          onClose={() => setShowPreview(false)} 
          onConfirm={handleSendSelected} 
          isLoading={pushToCrm.isPending} 
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-background border border-border rounded-lg p-3">
      <div className={`text-2xl font-bold mb-1 ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground uppercase">{label}</div>
    </div>
  );
}

function PushStatusBadge({ status, error }: { status: "pending" | "sent" | "failed"; error?: string | null }) {
  if (status === "pending") return <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase bg-muted text-muted-foreground">Pending</span>;
  if (status === "sent") return <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-500/10 text-green-500"><CheckCircle2 className="w-3 h-3 mr-1"/> Sent</span>;
  
  // failed
  return (
    <div className="group relative inline-flex items-center">
      <span className="inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-500/10 text-red-500 border border-red-500/20">
        <AlertTriangle className="w-3 h-3 mr-1"/> Failed
      </span>
      {/* Tooltip on hover */}
      {error && (
        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded z-10 shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}

function PreviewModal({ selectedLeads, onClose, onConfirm, isLoading }: { selectedLeads: Lead[], onClose: () => void, onConfirm: () => void, isLoading: boolean }) {
  // Take first 5 mapping examples
  const previewData = selectedLeads.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-card-border rounded-lg w-full max-w-4xl shadow-xl flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Transformation Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Attempting to send {selectedLeads.length} leads. Missing/Invalid phones will automatically fail.
            </p>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          <table className="w-full text-sm text-left border border-border">
            <thead className="bg-muted text-muted-foreground uppercase text-xs">
              <tr>
                <th className="p-3 border-b border-r border-border">Original Local Column</th>
                <th className="p-3 border-b border-border text-primary font-bold">API Payload (Target Field)</th>
              </tr>
            </thead>
            <tbody>
              {previewData.map(lead => {
                const cleanedPhone = lead.phone ? lead.phone.replace(/\D/g, "").slice(-10) : "";
                
                return (
                  <tr key={lead.id} className="border-b border-border">
                    <td className="p-4 border-r border-border align-top bg-background/50">
                      <div className="space-y-1">
                        <div><span className="font-medium">businessName:</span> {lead.businessName}</div>
                        <div><span className="font-medium">phone:</span> {lead.phone || <em className="text-red-400">Empty</em>}</div>
                        <div><span className="font-medium">email:</span> {lead.email || <em>Empty</em>}</div>
                        <div><span className="font-medium">location:</span> {lead.location}</div>
                      </div>
                    </td>
                    <td className="p-4 align-top bg-primary/5">
                      <div className="space-y-1 font-mono text-xs">
                        <div><span className="text-primary font-bold">name:</span> "{lead.businessName}"</div>
                        <div><span className="text-primary font-bold">company:</span> "{lead.businessName}"</div>
                        <div>
                          <span className="text-primary font-bold">number:</span> "{cleanedPhone}" 
                          {cleanedPhone.length < 10 && <span className="text-red-500 ml-2">(Will Fail Runtime Validation)</span>}
                        </div>
                        <div><span className="text-primary font-bold">email:</span> "{lead.email || ""}"</div>
                        <div><span className="text-primary font-bold">address:</span> "{lead.location || ""}"</div>
                        <div><span className="text-primary font-bold">source:</span> "LeadGenTool"</div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {selectedLeads.length > 5 && (
             <div className="mt-4 text-center text-sm text-muted-foreground">...and {selectedLeads.length - 5} more mapped dynamically</div>
          )}
        </div>

        <div className="p-6 border-t border-border bg-muted/20 flex gap-3 justify-end items-center">
           <button 
             onClick={onClose} 
             disabled={isLoading}
             className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted font-medium"
            >
             Abort Processing
           </button>
           <button 
             onClick={onConfirm} 
             disabled={isLoading}
             className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
             {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
             Confirm & Batch Transfer ({selectedLeads.length})
           </button>
        </div>
      </div>
    </div>
  );
}
