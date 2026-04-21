import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Search as SearchIcon,
  MapPin,
  Phone,
  Globe,
  Star,
  MessageSquare,
  Clock,
  Plus,
  Loader2,
  Building2,
  AlertCircle,
  ExternalLink,
  Tags,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchResult {
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

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

const QUICK_SEARCHES = [
  "top IT companies in Kolkata",
  "digital marketing agencies in Mumbai",
  "software startups in Bangalore",
  "web design companies in Delhi",
  "SaaS companies in Hyderabad",
  "fintech companies in Pune",
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addingLeads, setAddingLeads] = useState<Set<number>>(new Set());
  const [addAllLoading, setAddAllLoading] = useState(false);
  


  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();



  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `/api/search/businesses?q=${encodeURIComponent(q.trim())}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Search failed" }));
        throw new Error(err.error || "Search failed");
      }
      const json: SearchResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(query);
  };

  const handleQuickSearch = (q: string) => {
    setQuery(q);
    doSearch(q);
  };

  const addAsLead = async (result: SearchResult, index: number, silent = false) => {
    if (!silent) setAddingLeads((prev) => new Set(prev).add(index));
    try {
      const domainMatch = result.website
        ? result.website.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/)
        : null;
      const domain = domainMatch ? domainMatch[1] : "";

      const parts = result.name.split(" ");
      const contactName = parts.slice(0, 2).join(" ");

      const body = {
        businessName: result.name,
        contactName: contactName || result.name,
        email: domain ? `info@${domain}` : "",
        phone: result.phone || "",
        website: result.website || "",
        industry: result.category || "Technology",
        location: result.address || "",
        companySize: "1-10",
        notes: result.snippet || `Found via Google search`,
      };

      const res = await fetch(`/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to add lead" }));
        throw new Error(err.error || "Failed to add lead");
      }

      if (!silent) {
        toast({
          title: "Lead added!",
          description: `${result.name} has been added to your leads.`,
        });
      }
      return true;
    } catch (err: any) {
      if (!silent) {
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        });
      }
      return false;
    } finally {
      if (!silent) {
        setAddingLeads((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  };

  const formatPhone = (phone: string, address: string) => {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, "");
    const isIndia = address.toLowerCase().includes("india") || address.toLowerCase().match(/\b(delhi|mumbai|kolkata|bangalore|chennai|hyderabad|pune|gujarat|rajasthan|karnataka)\b/i);
    
    if (isIndia) {
      if (clean.length === 10) return `+91 ${clean.slice(0, 5)}-${clean.slice(5)}`;
      if (clean.length === 12 && clean.startsWith("91")) return `+91 ${clean.slice(2, 7)}-${clean.slice(7)}`;
    }
    // Default international format
    return phone.startsWith("+") ? phone : `+${clean}`;
  };

  const handleAddAll = async () => {
    if (!data || data.results.length === 0) return;
    setAddAllLoading(true);

    toast({
      title: "Bulk Import Started",
      description: `Importing ${data.results.length} leads...`,
    });

    try {
      const leadsToProcess = data.results.map(result => {
        const domainMatch = result.website
          ? result.website.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/)
          : null;
        const domain = domainMatch ? domainMatch[1] : "";
        const parts = result.name.split(" ");

        return {
          businessName: result.name,
          googlePlaceId: result.placeId, // Send unique ID
          contactName: parts.slice(0, 2).join(" "),
          email: domain ? `info@${domain}` : "",
          phone: formatPhone(result.phone, result.address),
          website: result.website || "",
          industry: result.category || "Technology",
          location: result.address || "",
          companySize: "1-10",
          tags: ["Discovery"], // Default tag for bulk management
          notes: result.snippet || `Found via Lead Discovery search`,
        };
      });

      const res = await fetch(`/api/leads/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leadsToProcess }),
      });

      const result = await res.json();
      
      if (res.status === 201 || res.status === 207) {
        toast({
          title: "Bulk Import Complete",
          description: `Successfully added ${result.count} new leads. (Duplicates skipped automatically)`,
        });
      } else {
        throw new Error(result.error || "Bulk import failed");
      }
    } catch (err: any) {
      toast({
        title: "Bulk Import Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAddAllLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">


      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Lead Discovery</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground">Discover businesses & import them into your database</p>
          </div>
        </div>
      </div>

      {/* Search Area */}
      <div className="px-6 py-6 border-b border-border flex-shrink-0 bg-card/30">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-2xl">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "food manufacturing company in kolkata"'
              className="pl-9 bg-background border-border h-10 text-sm"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={loading || !query.trim()} className="h-10 px-5">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <SearchIcon className="w-4 h-4 mr-1.5" />
                Search
              </>
            )}
          </Button>
        </form>

        {/* Quick searches */}
        {!data && !loading && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">Quick searches:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((qs) => (
                <button
                  key={qs}
                  onClick={() => handleQuickSearch(qs)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                >
                  {qs}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching Google Maps...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive max-w-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Search failed</p>
              <p className="text-xs mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {data && data.results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Building2 className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No results found for "{data.query}"</p>
            <p className="text-xs text-muted-foreground/60">Try a different search term</p>
          </div>
        )}

        {data && data.results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-foreground">{data.results.length}</span> results for{" "}
                <span className="text-primary italic">"{data.query}"</span>
              </p>
              <Button 
                onClick={handleAddAll} 
                disabled={addAllLoading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 text-xs font-bold gap-2 shadow-lg shadow-emerald-900/20"
              >
                {addAllLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                Add All Leads
              </Button>
            </div>

            <div className="grid gap-3">
              {data.results.map((result, index) => (
                <div
                  key={index}
                  className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {result.thumbnail ? (
                      <img
                        src={result.thumbnail}
                        alt={result.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {result.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          >
                            Local
                          </Badge>
                        </div>
                        {result.category && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {result.category}
                          </p>
                        )}
                      </div>

                      {result.rating !== null && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-medium text-foreground">
                            {result.rating}
                          </span>
                          {result.reviews !== null && (
                            <span className="text-xs text-muted-foreground">
                              ({result.reviews})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {result.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {result.address}
                        </span>
                      )}
                      {result.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {result.phone}
                        </span>
                      )}
                      {result.website && (
                        <a
                          href={result.website.startsWith("http") ? result.website : `https://${result.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          {result.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addAsLead(result, index)}
                      disabled={addingLeads.has(index)}
                      className="h-8 text-xs gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity border-primary/30 text-primary hover:bg-primary/10"
                    >
                      {addingLeads.has(index) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Add Lead
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <SearchIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Ready for Search</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Search for businesses and add them as leads to start your outreach.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
