import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { APPLICATION_STATUSES, STATUS_COLORS, US_STATES, type ApplicationStatus } from "@shared/lps";
import { Search, Download, FilterX, ChevronLeft, ChevronRight, Users } from "lucide-react";

const ALL = "__all__";

export default function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [state, setState] = useState<string>(ALL);
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [industry, setIndustry] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({
    search: search || undefined,
    status: status === ALL ? undefined : status,
    state: state === ALL ? undefined : state,
    city: city || undefined,
    county: county || undefined,
    industry: industry || undefined,
    submittedFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
    submittedTo: dateTo ? new Date(`${dateTo}T23:59:59`) : undefined,
  }), [search, status, state, city, county, industry, dateFrom, dateTo]);

  const { data, isLoading } = trpc.admin.list.useQuery({ ...filters, page, pageSize: 20 });
  const { data: reviewers } = trpc.admin.reviewers.useQuery();
  const exportCsv = trpc.admin.exportCsv.useMutation();

  const reviewerName = (id: number | null) => reviewers?.find(r => r.id === id)?.name ?? "—";

  const applyFilter = (fn: () => void) => { fn(); setPage(1); };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setStatus(ALL); setState(ALL); setCity(""); setCounty("");
    setIndustry(""); setDateFrom(""); setDateTo(""); setPage(1);
  };

  async function handleExport() {
    try {
      const res = await exportCsv.mutateAsync(filters);
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lps-applicants-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${res.count} applicant record${res.count === 1 ? "" : "s"} to CSV.`);
    } catch {
      toast.error("Export failed. Please try again.");
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <AdminLayout title="Applicants">
      {/* Search + export row */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center mb-4">
        <form
          className="flex-1 flex gap-2"
          onSubmit={e => { e.preventDefault(); applyFilter(() => setSearch(searchInput)); }}
        >
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Search applicants"
              placeholder="Search by name, location, profession, status, or reference…"
              className="pl-9 bg-white"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" className="bg-white">Search</Button>
        </form>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={clearFilters}>
            <FilterX className="h-4 w-4 mr-1.5" aria-hidden="true" /> Clear
          </Button>
          <Button onClick={handleExport} disabled={exportCsv.isPending} className="bg-[#0F2044] text-white hover:bg-[#1C3260]">
            <Download className="h-4 w-4 mr-1.5" aria-hidden="true" /> {exportCsv.isPending ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 mb-5 bg-white rounded-xl border p-4">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={v => applyFilter(() => setStatus(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {APPLICATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State</Label>
          <Select value={state} onValueChange={v => applyFilter(() => setState(v))}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All states</SelectItem>
              {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-city" className="text-xs">City</Label>
          <Input id="f-city" className="h-9" placeholder="Any city" value={city} onChange={e => applyFilter(() => setCity(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-county" className="text-xs">County</Label>
          <Input id="f-county" className="h-9" placeholder="Any county" value={county} onChange={e => applyFilter(() => setCounty(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-industry" className="text-xs">Industry</Label>
          <Input id="f-industry" className="h-9" placeholder="Any industry" value={industry} onChange={e => applyFilter(() => setIndustry(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-from" className="text-xs">Submitted from</Label>
          <Input id="f-from" type="date" className="h-9" value={dateFrom} onChange={e => applyFilter(() => setDateFrom(e.target.value))} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="f-to" className="text-xs">Submitted to</Label>
          <Input id="f-to" type="date" className="h-9" value={dateTo} onChange={e => applyFilter(() => setDateTo(e.target.value))} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex justify-center"><Spinner className="h-7 w-7 text-[#0F2044]" /></div>
        ) : !data || data.rows.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p className="font-medium">No applications match your criteria</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FAF7F0]">
                  <TableHead>Reference</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Profession</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewer</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map(app => (
                  <TableRow key={app.id} className="hover:bg-[#FAF7F0]/60">
                    <TableCell>
                      <Link href={`/admin/applicants/${app.id}`} className="font-mono text-xs font-semibold text-[#0F2044] hover:text-[#C9A227] underline-offset-2 hover:underline">
                        {app.referenceNumber ?? "DRAFT"}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/admin/applicants/${app.id}`} className="hover:text-[#C9A227]">{app.fullName ?? "—"}</Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {[app.city, app.state].filter(Boolean).join(", ") || "—"}
                      {app.county ? <span className="block text-xs">{app.county} County</span> : null}
                    </TableCell>
                    <TableCell className="text-sm">{app.profession ?? "—"}{app.industry ? <span className="block text-xs text-muted-foreground">{app.industry}</span> : null}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`${STATUS_COLORS[app.status as ApplicationStatus] ?? ""} font-medium whitespace-nowrap`}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{reviewerName(app.reviewerId)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {data && data.total > 0 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total} applicants
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} aria-label="Previous page">
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-xs font-medium">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} aria-label="Next page">
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
