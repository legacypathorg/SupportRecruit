import { useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  APPLICATION_STATUSES,
  STATUS_COLORS,
  STATUS_EMAIL_MAP,
  EMAIL_TEMPLATE_KEYS,
  EMAIL_TEMPLATE_LABELS,
  MILESTONE_STATUS,
  type ApplicationStatus,
  type EmailTemplateKey,
} from "@shared/lps";
import { ArrowLeft, Download, FileText, Mail, StickyNote, History, User, CalendarClock } from "lucide-react";

const NONE = "__none__";

export default function AdminApplicantDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { data, isLoading } = trpc.admin.detail.useQuery({ id }, { enabled: Number.isFinite(id) });
  const utils = trpc.useUtils();
  const invalidate = () => utils.admin.detail.invalidate({ id });

  const updateStatus = trpc.admin.updateStatus.useMutation({ onSuccess: invalidate });
  const assignReviewer = trpc.admin.assignReviewer.useMutation({ onSuccess: invalidate });
  const addNote = trpc.admin.addNote.useMutation({ onSuccess: invalidate });
  const updateTracking = trpc.admin.updateTracking.useMutation({ onSuccess: invalidate });
  const documentUrl = trpc.admin.documentUrl.useMutation();
  const sendTemplated = trpc.admin.sendTemplatedEmail.useMutation({ onSuccess: invalidate });

  const [statusDialog, setStatusDialog] = useState<{ status: ApplicationStatus } | null>(null);
  const [statusSendEmail, setStatusSendEmail] = useState(true);
  const [statusExtra, setStatusExtra] = useState("");
  const [noteText, setNoteText] = useState("");
  const [emailDialog, setEmailDialog] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<string>(EMAIL_TEMPLATE_KEYS[0]);
  const [emailExtra, setEmailExtra] = useState("");
  const [viewEmail, setViewEmail] = useState<{ subject: string; html: string } | null>(null);

  if (isLoading || !data) {
    return (
      <AdminLayout title="Applicant Detail">
        <div className="p-16 flex justify-center"><Spinner className="h-7 w-7 text-[#0F2044]" /></div>
      </AdminLayout>
    );
  }

  const { application: app, documents, notes, activity, emails, admins } = data;
  const yn = (v: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");
  const fmtDate = (d: Date | null) => (d ? new Date(d).toLocaleString() : "—");
  const fmtDateInput = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 16) : "");

  async function handleStatusConfirm() {
    if (!statusDialog) return;
    try {
      const res = await updateStatus.mutateAsync({ id, status: statusDialog.status, sendEmail: statusSendEmail, extraMessage: statusExtra || undefined });
      toast.success(`Status updated to "${statusDialog.status}"${res.emailSent ? " and the applicant was emailed." : "."}`);
      setStatusDialog(null); setStatusExtra(""); setStatusSendEmail(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function handleDownload(documentId: number) {
    try {
      const res = await documentUrl.mutateAsync({ documentId });
      window.open(res.url, "_blank", "noopener");
    } catch {
      toast.error("Couldn't generate the download link. Please try again.");
    }
  }

  const infoRow = (label: string, value: React.ReactNode) => (
    <div className="grid sm:grid-cols-[200px_1fr] gap-0.5 py-2 border-b last:border-0">
      <dt className="text-xs text-muted-foreground pt-0.5">{label}</dt>
      <dd className="text-sm">{value ?? "—"}</dd>
    </div>
  );

  return (
    <AdminLayout title={app.fullName ?? "Applicant"}>
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[#0F2044] -mt-4 mb-5">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to applicants
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border p-5 mb-5 flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#0F2044]">{app.referenceNumber ?? "DRAFT"}</span>
            <Badge variant="secondary" className={`${STATUS_COLORS[app.status as ApplicationStatus] ?? ""} font-medium`}>{app.status}</Badge>
            {app.isDraft && <Badge variant="outline">In-progress draft</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {app.email} · {app.phone ?? "no phone"} · Submitted {app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "—"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={app.status}
            onValueChange={v => { setStatusDialog({ status: v as ApplicationStatus }); setStatusSendEmail(!!STATUS_EMAIL_MAP[v as ApplicationStatus]); }}
          >
            <SelectTrigger className="w-[230px] bg-white" aria-label="Update status"><SelectValue /></SelectTrigger>
            <SelectContent>{APPLICATION_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setEmailDialog(true)}>
            <Mail className="h-4 w-4 mr-1.5" aria-hidden="true" /> Send Email
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Left: application info in tabs */}
        <Tabs defaultValue="application">
          <TabsList className="bg-white border">
            <TabsTrigger value="application"><User className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Application</TabsTrigger>
            <TabsTrigger value="documents"><FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="emails"><Mail className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Emails ({emails.length})</TabsTrigger>
            <TabsTrigger value="activity"><History className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />Activity ({activity.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="application" className="bg-white rounded-xl border p-5 mt-3">
            <dl>
              {infoRow("Full Legal Name", app.fullName)}
              {infoRow("Email", app.email)}
              {infoRow("Phone", app.phone)}
              {infoRow("Address", [app.address1, app.address2].filter(Boolean).join(", ") || "—")}
              {infoRow("City / State / Zip", [app.city, app.state, app.zip].filter(Boolean).join(", ") || "—")}
              {infoRow("County", app.county)}
              {infoRow("Country", app.country)}
              {infoRow("Weekly Availability", app.weeklyAvailability)}
              {infoRow("Preferred Days", (app.preferredDays ?? []).join(", ") || "—")}
              {infoRow("Independent Work Comfort", yn(app.independentWorkComfort))}
              {infoRow("Relevant Experience", (app.experienceAreas ?? []).join("; ") || "—")}
              {infoRow("Profession", app.profession)}
              {infoRow("Industry", app.industry)}
              {infoRow("Experience Description", app.experienceDescription)}
              {infoRow("Independent Contractor Ack.", yn(app.ackIndependentContractor))}
              {infoRow("No Legal Advice Ack.", yn(app.ackNoLegalAdvice))}
              {infoRow("Confidentiality Agreement", yn(app.ackConfidentiality))}
              {infoRow("Performance Comp. Ack.", yn(app.ackPerformanceComp))}
              {infoRow("$200 Registration Fee Ack.", yn(app.ackRegistrationFee))}
              {infoRow("Final Certification", yn(app.ackFinalCertification))}
              {infoRow("Traffic Source", app.trafficSource)}
            </dl>
          </TabsContent>

          <TabsContent value="documents" className="bg-white rounded-xl border p-5 mt-3">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {documents.map(d => (
                  <li key={d.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <FileText className="h-5 w-5 text-[#0F2044] flex-shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.docType} · {d.fileSize ? `${(d.fileSize / 1024).toFixed(0)} KB · ` : ""}uploaded {new Date(d.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" disabled={documentUrl.isPending} onClick={() => handleDownload(d.id)}>
                      <Download className="h-4 w-4 mr-1" aria-hidden="true" /> Download
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="emails" className="bg-white rounded-xl border p-5 mt-3">
            {emails.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No emails sent yet.</p>
            ) : (
              <ul className="space-y-2">
                {emails.map(e => (
                  <li key={e.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium">{e.subject}</p>
                      <Badge variant="secondary" className={e.deliveryStatus === "sent" ? "bg-emerald-100 text-emerald-800" : e.deliveryStatus === "failed" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}>
                        {e.deliveryStatus === "logged" ? "logged (no email provider)" : e.deliveryStatus}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      To {e.recipient} · by {e.sentBy} · {new Date(e.createdAt).toLocaleString()}
                    </p>
                    {e.htmlBody && (
                      <button className="text-xs text-[#C9A227] hover:underline mt-1.5" onClick={() => setViewEmail({ subject: e.subject, html: e.htmlBody! })}>
                        Preview email
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="activity" className="bg-white rounded-xl border p-5 mt-3">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No activity recorded.</p>
            ) : (
              <ol className="relative space-y-4 ml-2 border-l border-[#C9A227]/40 pl-5">
                {activity.map(a => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-[#C9A227]" aria-hidden="true" />
                    <p className="text-sm"><strong>{a.action}</strong> — {a.detail}</p>
                    <p className="text-xs text-muted-foreground">{a.actor} · {new Date(a.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>

        {/* Right column: reviewer, tracking, notes */}
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-display font-semibold text-[#0F2044] flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-[#C9A227]" aria-hidden="true" /> Assigned Reviewer
            </h2>
            <Select
              value={app.reviewerId ? String(app.reviewerId) : NONE}
              onValueChange={async v => {
                try {
                  await assignReviewer.mutateAsync({ id, reviewerId: v === NONE ? null : Number(v) });
                  toast.success("Reviewer updated.");
                } catch { toast.error("Couldn't update reviewer."); }
              }}
            >
              <SelectTrigger aria-label="Assign reviewer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Unassigned</SelectItem>
                {admins.map(a => <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-display font-semibold text-[#0F2044] flex items-center gap-2 mb-3">
              <CalendarClock className="h-4 w-4 text-[#C9A227]" aria-hidden="true" /> Milestone Tracking
            </h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="t-interview" className="text-xs">Interview Date & Time</Label>
                <Input
                  id="t-interview" type="datetime-local" className="h-9"
                  defaultValue={fmtDateInput(app.interviewDate)}
                  onBlur={async e => {
                    const val = e.target.value;
                    const newDate = val ? new Date(val) : null;
                    if ((newDate?.getTime() ?? null) === (app.interviewDate ? new Date(app.interviewDate).getTime() : null)) return;
                    try {
                      await updateTracking.mutateAsync({ id, interviewDate: newDate });
                      toast.success("Interview date updated.");
                    } catch { toast.error("Couldn't update interview date."); }
                  }}
                />
              </div>
              {([
                ["agreementStatus", "Agreement Status"],
                ["registrationFeeStatus", "Registration Fee Status"],
                ["trainingStatus", "Training Status"],
              ] as const).map(([field, label]) => (
                <div key={field} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={app[field]}
                    onValueChange={async v => {
                      try {
                        await updateTracking.mutateAsync({ id, [field]: v });
                        toast.success(`${label} updated.`);
                      } catch { toast.error("Update failed."); }
                    }}
                  >
                    <SelectTrigger className="h-9" aria-label={label}><SelectValue /></SelectTrigger>
                    <SelectContent>{MILESTONE_STATUS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
              <div className="space-y-1">
                <Label htmlFor="t-activation" className="text-xs">Activation Date</Label>
                <Input
                  id="t-activation" type="date" className="h-9"
                  defaultValue={app.activationDate ? new Date(app.activationDate).toISOString().slice(0, 10) : ""}
                  onBlur={async e => {
                    const val = e.target.value;
                    const newDate = val ? new Date(`${val}T12:00:00`) : null;
                    try {
                      await updateTracking.mutateAsync({ id, activationDate: newDate });
                      toast.success("Activation date updated.");
                    } catch { toast.error("Couldn't update activation date."); }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-display font-semibold text-[#0F2044] flex items-center gap-2 mb-3">
              <StickyNote className="h-4 w-4 text-[#C9A227]" aria-hidden="true" /> Internal Notes
              <span className="text-xs font-normal text-muted-foreground">(admins only)</span>
            </h2>
            <div className="space-y-2">
              <Textarea rows={3} placeholder="Add a private note about this applicant…" value={noteText} onChange={e => setNoteText(e.target.value)} />
              <Button
                size="sm" className="bg-[#0F2044] text-white hover:bg-[#1C3260]"
                disabled={addNote.isPending || !noteText.trim()}
                onClick={async () => {
                  try {
                    await addNote.mutateAsync({ id, note: noteText.trim() });
                    setNoteText("");
                    toast.success("Note added.");
                  } catch { toast.error("Couldn't add note."); }
                }}
              >
                Add Note
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {notes.map(n => (
                <li key={n.id} className="rounded-lg bg-[#FAF7F0] border border-[#C9A227]/20 p-3">
                  <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{n.adminName} · {new Date(n.createdAt).toLocaleString()}</p>
                </li>
              ))}
              {notes.length === 0 && <p className="text-xs text-muted-foreground">No notes yet.</p>}
            </ul>
          </div>
        </div>
      </div>

      {/* Status change dialog */}
      <Dialog open={!!statusDialog} onOpenChange={open => !open && setStatusDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-[#0F2044]">Update Status</DialogTitle>
            <DialogDescription>
              Change status from <strong>{app.status}</strong> to <strong>{statusDialog?.status}</strong>.
            </DialogDescription>
          </DialogHeader>
          {statusDialog && STATUS_EMAIL_MAP[statusDialog.status] && (
            <label className="flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer">
              <Checkbox className="mt-0.5" checked={statusSendEmail} onCheckedChange={c => setStatusSendEmail(!!c)} />
              <span className="text-sm">
                Send the applicant the branded "<strong>{EMAIL_TEMPLATE_LABELS[STATUS_EMAIL_MAP[statusDialog.status]!]}</strong>" email automatically.
              </span>
            </label>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="status-extra">Optional personal message (added to the email)</Label>
            <Textarea id="status-extra" rows={3} value={statusExtra} onChange={e => setStatusExtra(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button className="bg-[#0F2044] text-white hover:bg-[#1C3260]" disabled={updateStatus.isPending} onClick={handleStatusConfirm}>
              {updateStatus.isPending ? "Updating…" : "Confirm Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send templated email dialog */}
      <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-[#0F2044]">Send Templated Email</DialogTitle>
            <DialogDescription>Send a branded lifecycle email to {app.email ?? "this applicant"}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Template</Label>
            <Select value={emailTemplate} onValueChange={setEmailTemplate}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EMAIL_TEMPLATE_KEYS.map(k => <SelectItem key={k} value={k}>{EMAIL_TEMPLATE_LABELS[k]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-extra">Optional personal message</Label>
            <Textarea id="email-extra" rows={3} value={emailExtra} onChange={e => setEmailExtra(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEmailDialog(false)}>Cancel</Button>
            <Button
              className="bg-[#C9A227] text-[#0F2044] hover:bg-[#E3C767] font-semibold"
              disabled={sendTemplated.isPending}
              onClick={async () => {
                try {
                  await sendTemplated.mutateAsync({ id, templateKey: emailTemplate as EmailTemplateKey, extraMessage: emailExtra || undefined });
                  toast.success("Email sent and logged.");
                  setEmailDialog(false); setEmailExtra("");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Send failed.");
                }
              }}
            >
              {sendTemplated.isPending ? "Sending…" : "Send Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Email preview dialog */}
      <Dialog open={!!viewEmail} onOpenChange={open => !open && setViewEmail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-[#0F2044] text-base">{viewEmail?.subject}</DialogTitle>
          </DialogHeader>
          {viewEmail && (
            <iframe title="Email preview" srcDoc={viewEmail.html} className="w-full h-[60vh] rounded-lg border bg-white" sandbox="" />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
