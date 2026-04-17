import { useGetDashboardStats, useGetLeadScoreBreakdown, useGetPipelineValues, useGetRecentActivity, useGetIndustryBreakdown } from "@workspace/api-client-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, TrendingUp, Flame, Mail, CheckCircle, BarChart2, Clock, Building2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SCORE_COLORS = { Hot: "#ef4444", Warm: "#f59e0b", Cold: "#3b82f6" };
const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444", "#ec4899"];

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-md flex items-center justify-center ${color ?? "bg-primary/10"}`}>
          <Icon className={`w-4 h-4 ${color ? "text-white" : "text-primary"}`} />
        </div>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

const activityIcons: Record<string, React.ElementType> = {
  lead_created: Users,
  note_added: Clock,
  stage_changed: TrendingUp,
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: scoreBreakdown } = useGetLeadScoreBreakdown();
  const { data: pipelineValues } = useGetPipelineValues();
  const { data: recentActivity } = useGetRecentActivity();
  const { data: industryBreakdown } = useGetIndustryBreakdown();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your lead pipeline at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-card-border rounded-lg p-4 h-24 animate-pulse" />
          ))
        ) : stats ? (
          <>
            <StatCard icon={Users} label="Total Leads" value={stats.totalLeads} sub={`Avg. score: ${stats.avgLeadScore}`} />
            <StatCard icon={Flame} label="Hot Leads" value={stats.hotLeads} sub="Ready to close" color="bg-red-500/80" />
            <StatCard icon={TrendingUp} label="Qualified" value={stats.qualifiedLeads} sub="In pipeline" color="bg-amber-500/80" />
            <StatCard icon={CheckCircle} label="Closed Won" value={stats.closedWon} sub="Converted" color="bg-green-500/80" />
            <StatCard icon={Mail} label="Active Campaigns" value={stats.activeCampaigns} />
            <StatCard icon={BarChart2} label="Emails Sent" value={stats.emailsSentThisMonth} sub="This month" />
            <StatCard icon={Users} label="Warm Leads" value={stats.warmLeads} sub="Needs nurturing" />
            <StatCard icon={Users} label="Cold Leads" value={stats.coldLeads} sub="Needs qualification" />
          </>
        ) : null}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lead Score Breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-4">Lead Score Distribution</h3>
          {scoreBreakdown && scoreBreakdown.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={scoreBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={35} outerRadius={55}>
                    {scoreBreakdown.map((entry) => (
                      <Cell key={entry.category} fill={SCORE_COLORS[entry.category as keyof typeof SCORE_COLORS] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(224 14% 11%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "6px" }}
                    labelStyle={{ color: "hsl(210 20% 92%)" }}
                    itemStyle={{ color: "hsl(210 20% 92%)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {scoreBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: SCORE_COLORS[item.category as keyof typeof SCORE_COLORS] }} />
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                    <span className="text-xs font-medium text-foreground ml-auto">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>

        {/* Pipeline Values */}
        <div className="bg-card border border-card-border rounded-lg p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Pipeline Stage Counts</h3>
          {pipelineValues && pipelineValues.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={pipelineValues} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" />
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 55%)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(224 14% 11%)", border: "1px solid hsl(220 14% 18%)", borderRadius: "6px" }}
                  labelStyle={{ color: "hsl(210 20% 92%)" }}
                  itemStyle={{ color: "hsl(210 20% 92%)" }}
                />
                <Bar dataKey="count" fill="hsl(220 90% 56%)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">No pipeline data yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Activity
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((item) => {
                const Icon = activityIcons[item.type] ?? Clock;
                return (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground truncate">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-muted-foreground">No activity yet</div>
            )}
          </div>
        </div>

        {/* Industry Breakdown */}
        <div className="bg-card border border-card-border rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            Top Industries
          </h3>
          {industryBreakdown && industryBreakdown.length > 0 ? (
            <div className="space-y-2">
              {industryBreakdown.slice(0, 6).map((item, i) => {
                const max = industryBreakdown[0]?.count ?? 1;
                const pct = Math.round((item.count / max) * 100);
                return (
                  <div key={item.industry} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                    <span className="text-xs text-foreground flex-1 truncate">{item.industry}</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{item.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No industry data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
