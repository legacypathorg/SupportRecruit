import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type ApplicationStatus } from "@shared/lps";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, MousePointerClick, PlayCircle, CheckCircle2, Save } from "lucide-react";

export default function AdminAnalytics() {
  const { data, isLoading } = trpc.admin.analytics.useQuery();

  if (isLoading || !data) {
    return (
      <AdminLayout title="Funnel Analytics">
        <div className="p-16 flex justify-center"><Spinner className="h-7 w-7 text-[#0F2044]" /></div>
      </AdminLayout>
    );
  }

  const kpis = [
    { label: "Application Starts", value: data.starts, icon: PlayCircle, note: "Forms started" },
    { label: "Submissions", value: data.submits, icon: CheckCircle2, note: "Completed applications" },
    { label: "Completion Rate", value: `${data.completionRate}%`, icon: TrendingUp, note: "Submitted ÷ started" },
    { label: "Abandonment Rate", value: `${data.abandonmentRate}%`, icon: TrendingDown, note: "Started but not submitted" },
    { label: "CTA Clicks", value: data.ctaClicks, icon: MousePointerClick, note: "Primary apply buttons" },
    { label: "Saved for Later", value: data.savesForLater, icon: Save, note: "Resume links requested" },
  ];

  return (
    <AdminLayout title="Funnel Analytics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <k.icon className="h-4 w-4 text-[#C9A227]" aria-hidden="true" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-[#0F2044]">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-display font-semibold text-[#0F2044] mb-4">Traffic Sources (form starts)</h2>
          {data.sources.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No traffic data yet.</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sources} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="source" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "rgba(201,162,39,0.08)" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.sources.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#C9A227" : "#0F2044"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-display font-semibold text-[#0F2044] mb-4">Pipeline by Status</h2>
          {data.statusCounts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No submitted applications yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.statusCounts.map(s => (
                <li key={s.status} className="flex items-center justify-between gap-3">
                  <Badge variant="secondary" className={`${STATUS_COLORS[s.status as ApplicationStatus] ?? ""} font-medium`}>{s.status}</Badge>
                  <div className="flex-1 h-2 rounded-full bg-[#0F2044]/8 overflow-hidden">
                    <div className="h-full bg-[#C9A227]" style={{ width: `${Math.min(100, (s.count / Math.max(...data.statusCounts.map(x => x.count))) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-[#0F2044] w-8 text-right">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
