import { useState, useRef } from "react";
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
  searchInformation: any;
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

  const addAsLead = async (result: SearchResult, index: number) => {
    setAddingLeads((prev) => new Set(prev).add(index));
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
        notes: result.snippet || `Found via Google search: "${data?.query}"`,
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

      toast({
        title: "Lead added!",
        description: `${result.name} has been added to your leads.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAddingLeads((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">Lead Discovery</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Search Google to discover and import real businesses as leads
        </p>
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
              placeholder='e.g. "top IT companies in Kolkata"'
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
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Searching Google...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive max-w-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Search failed</p>
              <p className="text-xs mt-0.5 opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* No results */}
        {data && data.results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Building2 className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No results found for "{data.query}"</p>
            <p className="text-xs text-muted-foreground/60">Try a different search term</p>
          </div>
        )}

        {/* Results list */}
        {data && data.results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{data.total}</span> results for{" "}
                <span className="text-primary">"{data.query}"</span>
              </p>
            </div>

            <div className="grid gap-3">
              {data.results.map((result, index) => (
                <div
                  key={index}
                  className="group flex gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-card/80 transition-all"
                >
                  {/* Thumbnail / Icon */}
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

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm text-foreground truncate">
                            {result.name}
                          </h3>
                          {result.type === "local" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            >
                              Local
                            </Badge>
                          )}
                        </div>
                        {result.category && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {result.category}
                          </p>
                        )}
                      </div>

                      {/* Rating */}
                      {result.rating !== null && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs font-medium text-foreground">
                            {result.rating}
                          </span>
                          {result.reviews !== null && (
                            <span className="text-xs text-muted-foreground">
                              ({result.reviews.toLocaleString()})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Details row */}
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
                      {result.hours && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {result.hours}
                        </span>
                      )}
                    </div>

                    {/* Snippet for organic results */}
                    {result.snippet && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}

                    {/* Reviews count for local */}
                    {result.reviews !== null && result.reviews > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <MessageSquare className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {result.reviews.toLocaleString()} reviews
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add as Lead button */}
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

        {/* Empty state */}
        {!data && !loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <SearchIcon className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Search for businesses</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Type any query like "top IT companies in Kolkata" and get real Google results you
                can instantly add as leads
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
