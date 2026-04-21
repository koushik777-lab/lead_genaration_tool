import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, Kanban, Share2, ChevronRight, Zap, Search, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/search", icon: Search, label: "Lead Discovery" },
  { href: "/leads", icon: Users, label: "Leads" },
  { href: "/crm", icon: Kanban, label: "CRM Pipeline" },
  { href: "/crm-push", icon: Share2, label: "Send to CRM" },
  { href: "/outreach", icon: MessageSquare, label: "Outreach Automations" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-sidebar-foreground">LeadForge</span>
            <span className="ml-1 text-xs text-primary font-medium">Elite</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === "/"
              ? location === "/"
              : location === item.href || location.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 rounded-md bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground">Free Plan</p>
            <p className="text-xs font-medium text-primary mt-0.5">Upgrade to Pro</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
