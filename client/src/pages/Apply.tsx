import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { trpc } from "@/lib/trpc";
import { getSessionId, getTrafficSource } from "@/lib/analytics";
import {
  WEEKLY_AVAILABILITY,
  WORKING_DAYS,
  EXPERIENCE_OPTIONS,
  DOCUMENT_TYPES,
  US_STATES,
} from "@shared/lps";
import {
  CheckCircle2,
  FileText,
  Trash2,
  UploadCloud,
  Mail,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Save,
} from "lucide-react";

/* ---------------------------------- types ---------------------------------- */

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  county: string;
  zip: string;
  country: string;
  weeklyAvailability: string;
  preferredDays: string[];
  independentWorkComfort: boolean | null;
  experienceAreas: string[];
  profession: string;
  industry: string;
  experienceDescription: string;
  ackIndependentContractor: boolean;
  ackNoLegalAdvice: boolean;
  ackConfidentiality: boolean;
  ackPerformanceComp: boolean;
  ackRegistrationFee: boolean;
  ackFinalCertification: boolean;
}

const initialForm: FormState = {
  fullName: "", email: "", phone: "", address1: "", address2: "", city: "", state: "", county: "", zip: "",
  country: "United States", weeklyAvailability: "", preferredDays: [], independentWorkComfort: null,
  experienceAreas: [], profession: "", industry: "", experienceDescription: "",
  ackIndependentContractor: false, ackNoLegalAdvice: false, ackConfidentiality: false,
  ackPerformanceComp: false, ackRegistrationFee: false, ackFinalCertification: false,
};

interface UploadedDoc { id: number; docType: string; fileName: string; fileSize: number | null }

const STEPS = ["Contact", "Availability", "Experience", "Documents", "Acknowledgments", "Review"] as const;
const TOKEN_KEY = "lps_resume_token";

/* -------------------------------- component -------------------------------- */

export default function Apply() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [resumeToken, setResumeToken] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);
  const [starting, setStarting] = useState(true);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveEmail, setSaveEmail] = useState("");
  const [submitted, setSubmitted] = useState<{ referenceNumber: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<string>("Resume");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef(form);
  formRef.current = form;

  const startMutation = trpc.application.start.useMutation();
  const saveDraft = trpc.application.saveDraft.useMutation();
  const emailResume = trpc.application.emailResumeLink.useMutation();
  const uploadDoc = trpc.application.uploadDocument.useMutation();
  const removeDoc = trpc.application.removeDocument.useMutation();
  const submitApp = trpc.application.submit.useMutation();
  const emailCopy = trpc.application.emailCopy.useMutation();
  const trackEvent = trpc.application.trackEvent.useMutation();
  const utils = trpc.useUtils();

  /* ------------------------- init: resume or start ------------------------- */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("resume");
    const stored = localStorage.getItem(TOKEN_KEY);
    const token = urlToken || stored;

    async function init() {
      if (token) {
        try {
          const data = await utils.application.loadDraft.fetch({ resumeToken: token });
          const a = data.application;
          if (!a.isDraft && a.referenceNumber) {
            // Already submitted — show confirmation
            setResumeToken(token);
            setSubmitted({ referenceNumber: a.referenceNumber });
            setForm(f => ({ ...f, fullName: a.fullName ?? "", email: a.email ?? "" }));
            setStarting(false);
            return;
          }
          setResumeToken(token);
          localStorage.setItem(TOKEN_KEY, token);
          setForm({
            fullName: a.fullName ?? "", email: a.email ?? "", phone: a.phone ?? "",
            address1: a.address1 ?? "", address2: a.address2 ?? "", city: a.city ?? "",
            state: a.state ?? "", county: a.county ?? "", zip: a.zip ?? "", country: a.country ?? "United States",
            weeklyAvailability: a.weeklyAvailability ?? "", preferredDays: a.preferredDays ?? [],
            independentWorkComfort: a.independentWorkComfort,
            experienceAreas: a.experienceAreas ?? [], profession: a.profession ?? "", industry: a.industry ?? "",
            experienceDescription: a.experienceDescription ?? "",
            ackIndependentContractor: a.ackIndependentContractor ?? false,
            ackNoLegalAdvice: a.ackNoLegalAdvice ?? false,
            ackConfidentiality: a.ackConfidentiality ?? false,
            ackPerformanceComp: a.ackPerformanceComp ?? false,
            ackRegistrationFee: a.ackRegistrationFee ?? false,
            ackFinalCertification: a.ackFinalCertification ?? false,
          });
          setDocuments(data.documents.map(d => ({ ...d, fileSize: d.fileSize ?? null })));
          setStep(Math.min(a.currentStep ?? 0, STEPS.length - 1));
          if (urlToken) toast.success("Welcome back! Your application has been restored.");
          setStarting(false);
          return;
        } catch {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
      // Start fresh
      try {
        const res = await startMutation.mutateAsync({ sessionId: getSessionId(), trafficSource: getTrafficSource() });
        setResumeToken(res.resumeToken);
        localStorage.setItem(TOKEN_KEY, res.resumeToken);
      } catch {
        toast.error("We couldn't start your application. Please refresh the page.");
      }
      setStarting(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------- autosave ------------------------------- */
  const persistDraft = useCallback((currentStep?: number) => {
    if (!resumeToken) return;
    const f = formRef.current;
    saveDraft.mutate({
      resumeToken,
      fields: {
        fullName: f.fullName || undefined, email: f.email || undefined, phone: f.phone || undefined,
        address1: f.address1 || undefined, address2: f.address2 || undefined, city: f.city || undefined,
        state: f.state || undefined, county: f.county || undefined, zip: f.zip || undefined, country: f.country || undefined,
        weeklyAvailability: (f.weeklyAvailability || undefined) as never, preferredDays: f.preferredDays.length ? (f.preferredDays as never) : undefined,
        independentWorkComfort: f.independentWorkComfort ?? undefined,
        experienceAreas: f.experienceAreas.length ? (f.experienceAreas as never) : undefined,
        profession: f.profession || undefined, industry: f.industry || undefined,
        experienceDescription: f.experienceDescription || undefined,
        ackIndependentContractor: f.ackIndependentContractor, ackNoLegalAdvice: f.ackNoLegalAdvice,
        ackConfidentiality: f.ackConfidentiality, ackPerformanceComp: f.ackPerformanceComp,
        ackRegistrationFee: f.ackRegistrationFee, ackFinalCertification: f.ackFinalCertification,
        currentStep,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeToken]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => {
      if (!e[key]) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  /* ------------------------------ validation ------------------------------ */
  function validateStep(s: number): boolean {
    const e: Record<string, string> = {};
    const f = form;
    if (s === 0) {
      if (!f.fullName.trim()) e.fullName = "Please enter your full legal name.";
      if (!f.email.trim()) e.email = "Please enter your email address.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = "That email doesn't look right — please check the format (e.g., name@example.com).";
      if (!f.phone.trim()) e.phone = "Please enter your phone number.";
      else if (f.phone.replace(/\D/g, "").length < 10) e.phone = "Please enter a valid phone number with area code.";
      if (!f.address1.trim()) e.address1 = "Please enter your street address.";
      if (!f.city.trim()) e.city = "Please enter your city or town.";
      if (!f.state) e.state = "Please select your state.";
      if (!f.zip.trim()) e.zip = "Please enter your zip or postal code.";
    }
    if (s === 1) {
      if (!f.weeklyAvailability) e.weeklyAvailability = "Please select how many hours you're available each week.";
      if (f.preferredDays.length === 0) e.preferredDays = "Please choose at least one preferred working day.";
      if (f.independentWorkComfort === null) e.independentWorkComfort = "Please let us know if you're comfortable working independently.";
    }
    if (s === 2) {
      if (f.experienceAreas.length === 0) e.experienceAreas = "Please select at least one area of relevant experience.";
      if (!f.profession.trim()) e.profession = "Please tell us your current profession or role.";
    }
    // Step 3 (documents) is optional
    if (s === 4) {
      if (!f.ackIndependentContractor) e.ackIndependentContractor = "This acknowledgment is required to continue.";
      if (!f.ackNoLegalAdvice) e.ackNoLegalAdvice = "This acknowledgment is required to continue.";
      if (!f.ackConfidentiality) e.ackConfidentiality = "This agreement is required to continue.";
      if (!f.ackPerformanceComp) e.ackPerformanceComp = "This acknowledgment is required to continue.";
      if (!f.ackRegistrationFee) e.ackRegistrationFee = "You must acknowledge the $200 registration fee requirement to continue.";
      if (!f.ackFinalCertification) e.ackFinalCertification = "Please certify that your information is accurate and complete.";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error("Please fix the highlighted fields before continuing.");
      return false;
    }
    return true;
  }

  const goNext = () => {
    if (!validateStep(step)) return;
    const next = Math.min(step + 1, STEPS.length - 1);
    setStep(next);
    persistDraft(next);
    trackEvent.mutate({ eventType: "step_complete", sessionId: getSessionId(), resumeToken: resumeToken ?? undefined, metadata: { step: STEPS[step] } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const goBack = () => {
    const prev = Math.max(step - 1, 0);
    setStep(prev);
    persistDraft(prev);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ------------------------------- documents ------------------------------- */
  async function handleFileChosen(file: File) {
    if (!resumeToken) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("That file is larger than 10 MB. Please choose a smaller file.");
      return;
    }
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await uploadDoc.mutateAsync({
        resumeToken,
        docType: uploadType as (typeof DOCUMENT_TYPES)[number],
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data: base64,
      });
      setDocuments(d => [...d, { id: res.documentId, docType: res.docType, fileName: res.fileName, fileSize: res.fileSize }]);
      toast.success(`${file.name} uploaded successfully.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveDoc(id: number) {
    if (!resumeToken) return;
    try {
      await removeDoc.mutateAsync({ resumeToken, documentId: id });
      setDocuments(d => d.filter(x => x.id !== id));
      toast.success("Document removed.");
    } catch {
      toast.error("Couldn't remove that document. Please try again.");
    }
  }

  /* --------------------------------- submit -------------------------------- */
  async function handleSubmit() {
    if (!resumeToken) return;
    if (!validateStep(4)) { setStep(4); return; }
    try {
      const f = form;
      const res = await submitApp.mutateAsync({
        resumeToken,
        fields: {
          fullName: f.fullName, email: f.email, phone: f.phone, address1: f.address1,
          address2: f.address2 || undefined, city: f.city, state: f.state, county: f.county || undefined,
          zip: f.zip, country: f.country,
          weeklyAvailability: f.weeklyAvailability as never, preferredDays: f.preferredDays as never,
          independentWorkComfort: f.independentWorkComfort ?? undefined,
          experienceAreas: f.experienceAreas as never, profession: f.profession, industry: f.industry || undefined,
          experienceDescription: f.experienceDescription || undefined,
          ackIndependentContractor: f.ackIndependentContractor, ackNoLegalAdvice: f.ackNoLegalAdvice,
          ackConfidentiality: f.ackConfidentiality, ackPerformanceComp: f.ackPerformanceComp,
          ackRegistrationFee: f.ackRegistrationFee, ackFinalCertification: f.ackFinalCertification,
        },
      });
      setSubmitted({ referenceNumber: res.referenceNumber });
      window.scrollTo({ top: 0 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed. Please review your information and try again.");
    }
  }

  async function handleSaveForLater() {
    if (!resumeToken) return;
    const email = saveEmail || form.email;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address so we can send your resume link.");
      return;
    }
    persistDraft(step);
    try {
      await emailResume.mutateAsync({ resumeToken, email });
      toast.success(`Resume link sent to ${email}. You can close this page anytime.`);
      setSaveDialogOpen(false);
    } catch {
      toast.error("We couldn't send the email. Please try again.");
    }
  }

  function handleDownloadCopy() {
    window.print();
  }

  const progressPct = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  /* --------------------------------- render -------------------------------- */

  if (starting) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center"><Spinner className="h-8 w-8 text-[#0F2044]" /></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAF7F0]">
        <SiteHeader />
        <main className="flex-1 container py-14 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-md border border-[#C9A227]/30 p-8 md:p-12 text-center print:shadow-none">
            <CheckCircle2 className="h-16 w-16 text-[#C9A227] mx-auto" aria-hidden="true" />
            <h1 className="mt-5 font-display text-3xl font-bold text-[#0F2044]">Application Submitted!</h1>
            <p className="mt-3 text-muted-foreground">
              Thank you{form.fullName ? `, ${form.fullName.split(" ")[0]}` : ""}. Your application has been received and
              a confirmation email is on its way to {form.email || "your inbox"}.
            </p>
            <div className="mt-7 rounded-xl bg-[#FAF7F0] border-l-4 border-[#C9A227] p-5 text-left">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Your Application Reference Number</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#0F2044] tracking-wider">{submitted.referenceNumber}</p>
              <p className="mt-2 text-xs text-muted-foreground">Keep this number for your records — you'll need it in any correspondence with our team.</p>
            </div>
            <div className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4 text-left flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-amber-900 leading-relaxed">
                Submitting an application does not guarantee acceptance. <strong>Do not submit any payment</strong> until
                you receive an official approval notice from Legacy Path Solutions.
              </p>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center print:hidden">
              <Button variant="outline" className="border-[#0F2044]/30" onClick={handleDownloadCopy}>
                <Download className="h-4 w-4 mr-2" aria-hidden="true" /> Download / Print a Copy
              </Button>
              <Button
                className="bg-[#0F2044] text-white hover:bg-[#1C3260]"
                disabled={emailCopy.isPending}
                onClick={async () => {
                  if (!resumeToken) return;
                  try {
                    await emailCopy.mutateAsync({ resumeToken });
                    toast.success("A copy of your application has been emailed to you.");
                  } catch {
                    toast.error("We couldn't send the copy. Please try again.");
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2" aria-hidden="true" /> {emailCopy.isPending ? "Sending..." : "Email Me a Copy"}
              </Button>
            </div>
            <button className="mt-6 text-sm text-muted-foreground underline print:hidden" onClick={() => { localStorage.removeItem(TOKEN_KEY); navigate("/"); }}>
              Return to the program page
            </button>

            {/* Print-only summary */}
            <div className="hidden print:block mt-8 text-left text-sm">
              <h2 className="font-bold text-lg">Application Summary — {submitted.referenceNumber}</h2>
              <ReviewSummary form={form} documents={documents} plain />
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0]">
      <SiteHeader />
      <main className="flex-1 container py-8 md:py-12 max-w-3xl">
        <div className="mb-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-[#0F2044]">Support Specialist Application</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apply to become a Legacy Path Solutions Support Specialist. This role is for independent contractors who
            value professionalism, confidentiality, and service excellence.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8" role="group" aria-label="Application progress">
          <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2">
            <span className="text-[#0F2044] font-semibold">Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
            <span>{progressPct}% complete</span>
          </div>
          <Progress value={progressPct} className="h-2.5 bg-[#0F2044]/10 [&>div]:bg-[#C9A227]" aria-label={`Application ${progressPct}% complete`} />
          <div className="hidden md:flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span key={s} className={`text-[11px] ${i <= step ? "text-[#C9A227] font-semibold" : "text-muted-foreground/60"}`}>{s}</span>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#0F2044]/8 p-6 md:p-9">
          {step === 0 && <StepContact form={form} set={set} errors={errors} />}
          {step === 1 && <StepAvailability form={form} set={set} errors={errors} />}
          {step === 2 && <StepExperience form={form} set={set} errors={errors} />}
          {step === 3 && (
            <StepDocuments
              documents={documents}
              uploading={uploading}
              uploadType={uploadType}
              setUploadType={setUploadType}
              fileInputRef={fileInputRef}
              onFileChosen={handleFileChosen}
              onRemove={handleRemoveDoc}
            />
          )}
          {step === 4 && <StepAcknowledgments form={form} set={set} errors={errors} />}
          {step === 5 && <ReviewSummary form={form} documents={documents} onEdit={setStep} />}

          {/* Nav buttons */}
          <div className="mt-9 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t pt-6">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={goBack} className="border-[#0F2044]/25">
                  <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" /> Back
                </Button>
              )}
              <Button variant="ghost" className="text-muted-foreground" onClick={() => { setSaveEmail(form.email); setSaveDialogOpen(true); }}>
                <Save className="h-4 w-4 mr-1.5" aria-hidden="true" /> Save & Continue Later
              </Button>
            </div>
            {step < STEPS.length - 1 ? (
              <Button onClick={goNext} className="bg-[#0F2044] text-white hover:bg-[#1C3260] px-8">
                Continue <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitApp.isPending} className="bg-[#C9A227] text-[#0F2044] hover:bg-[#E3C767] font-bold px-8">
                {submitApp.isPending ? "Submitting..." : "Submit My Application"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-5 text-xs text-muted-foreground text-center max-w-lg mx-auto">
          Submitting an application does not guarantee acceptance into the Support Specialist Program. Do not submit
          payment until you have received an official approval notice.
        </p>
      </main>

      {/* Save-for-later dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-[#0F2044]">Save Your Progress</DialogTitle>
            <DialogDescription>
              We'll email you a secure link so you can pick up right where you left off.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="save-email">Email address</Label>
            <Input id="save-email" type="email" placeholder="you@example.com" value={saveEmail} onChange={e => setSaveEmail(e.target.value)} />
          </div>
          <Button onClick={handleSaveForLater} disabled={emailResume.isPending} className="bg-[#0F2044] text-white hover:bg-[#1C3260]">
            {emailResume.isPending ? "Sending..." : "Email My Resume Link"}
          </Button>
        </DialogContent>
      </Dialog>

      <SiteFooter />
    </div>
  );
}

/* ------------------------------ field helpers ------------------------------ */

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" /> {msg}
    </p>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-semibold text-[#0F2044]">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-3 h-0.5 w-12 bg-[#C9A227]" aria-hidden="true" />
    </div>
  );
}

type StepProps = { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; errors: Record<string, string> };

function StepContact({ form, set, errors }: StepProps) {
  return (
    <div>
      <SectionTitle title="Contact Information" subtitle="Tell us how to reach you." />
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="fullName">Full Legal Name <span className="text-destructive">*</span></Label>
          <Input id="fullName" autoComplete="name" value={form.fullName} onChange={e => set("fullName", e.target.value)} aria-invalid={!!errors.fullName} />
          <FieldError msg={errors.fullName} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
          <Input id="email" type="email" autoComplete="email" value={form.email} onChange={e => set("email", e.target.value)} aria-invalid={!!errors.email} />
          <FieldError msg={errors.email} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
          <Input id="phone" type="tel" autoComplete="tel" placeholder="(555) 555-5555" value={form.phone} onChange={e => set("phone", e.target.value)} aria-invalid={!!errors.phone} />
          <FieldError msg={errors.phone} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address1">Address <span className="text-destructive">*</span></Label>
          <Input id="address1" autoComplete="address-line1" value={form.address1} onChange={e => set("address1", e.target.value)} aria-invalid={!!errors.address1} />
          <FieldError msg={errors.address1} />
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address2">Address Line 2 <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="address2" autoComplete="address-line2" value={form.address2} onChange={e => set("address2", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">City / Town <span className="text-destructive">*</span></Label>
          <Input id="city" autoComplete="address-level2" value={form.city} onChange={e => set("city", e.target.value)} aria-invalid={!!errors.city} />
          <FieldError msg={errors.city} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State / Region <span className="text-destructive">*</span></Label>
          <Select value={form.state} onValueChange={v => set("state", v)}>
            <SelectTrigger id="state" aria-invalid={!!errors.state}><SelectValue placeholder="Select your state" /></SelectTrigger>
            <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <FieldError msg={errors.state} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="county">County <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <Input id="county" value={form.county} onChange={e => set("county", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip">Zip / Post Code <span className="text-destructive">*</span></Label>
          <Input id="zip" autoComplete="postal-code" value={form.zip} onChange={e => set("zip", e.target.value)} aria-invalid={!!errors.zip} />
          <FieldError msg={errors.zip} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country</Label>
          <Input id="country" autoComplete="country-name" value={form.country} onChange={e => set("country", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepAvailability({ form, set, errors }: StepProps) {
  return (
    <div>
      <SectionTitle title="Availability & Commitment" subtitle="Help us understand when and how you'd like to serve." />
      <div className="space-y-7">
        <fieldset>
          <legend className="text-sm font-medium mb-2">Weekly Availability <span className="text-destructive">*</span></legend>
          <RadioGroup value={form.weeklyAvailability} onValueChange={v => set("weeklyAvailability", v)} className="grid gap-2 sm:grid-cols-3">
            {WEEKLY_AVAILABILITY.map(opt => (
              <label key={opt} className={`flex items-center gap-2.5 rounded-lg border p-3.5 cursor-pointer transition-colors ${form.weeklyAvailability === opt ? "border-[#C9A227] bg-[#FAF7F0]" : "border-input hover:border-[#C9A227]/50"}`}>
                <RadioGroupItem value={opt} id={`avail-${opt}`} />
                <span className="text-sm font-medium">{opt}</span>
              </label>
            ))}
          </RadioGroup>
          <FieldError msg={errors.weeklyAvailability} />
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium mb-1">Preferred Working Days <span className="text-destructive">*</span></legend>
          <p className="text-xs text-muted-foreground mb-2">Choose as many as you like.</p>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {WORKING_DAYS.map(day => (
              <label key={day} className={`flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${form.preferredDays.includes(day) ? "border-[#C9A227] bg-[#FAF7F0]" : "border-input hover:border-[#C9A227]/50"}`}>
                <Checkbox
                  id={`day-${day}`}
                  checked={form.preferredDays.includes(day)}
                  onCheckedChange={c => set("preferredDays", c ? [...form.preferredDays, day] : form.preferredDays.filter(d => d !== day))}
                />
                <span className="text-sm">{day}</span>
              </label>
            ))}
          </div>
          <FieldError msg={errors.preferredDays} />
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium mb-1">Independent Work Comfort Level <span className="text-destructive">*</span></legend>
          <p className="text-xs text-muted-foreground mb-2">Are you comfortable working independently, meeting deadlines, and following structured processes?</p>
          <RadioGroup
            value={form.independentWorkComfort === null ? "" : form.independentWorkComfort ? "yes" : "no"}
            onValueChange={v => set("independentWorkComfort", v === "yes")}
            className="grid gap-2 grid-cols-2 max-w-xs"
          >
            {["yes", "no"].map(v => (
              <label key={v} className={`flex items-center gap-2.5 rounded-lg border p-3.5 cursor-pointer transition-colors ${(form.independentWorkComfort === (v === "yes")) ? "border-[#C9A227] bg-[#FAF7F0]" : "border-input hover:border-[#C9A227]/50"}`}>
                <RadioGroupItem value={v} id={`iwc-${v}`} />
                <span className="text-sm font-medium capitalize">{v}</span>
              </label>
            ))}
          </RadioGroup>
          <FieldError msg={errors.independentWorkComfort} />
        </fieldset>
      </div>
    </div>
  );
}

function StepExperience({ form, set, errors }: StepProps) {
  return (
    <div>
      <SectionTitle title="Experience & Skills" subtitle="Tell us about your professional background." />
      <div className="space-y-7">
        <fieldset>
          <legend className="text-sm font-medium mb-1">Relevant Experience <span className="text-destructive">*</span></legend>
          <p className="text-xs text-muted-foreground mb-2">Select all that apply.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXPERIENCE_OPTIONS.map(opt => (
              <label key={opt} className={`flex items-start gap-2.5 rounded-lg border p-3.5 cursor-pointer transition-colors ${form.experienceAreas.includes(opt) ? "border-[#C9A227] bg-[#FAF7F0]" : "border-input hover:border-[#C9A227]/50"}`}>
                <Checkbox
                  className="mt-0.5"
                  checked={form.experienceAreas.includes(opt)}
                  onCheckedChange={c => set("experienceAreas", c ? [...form.experienceAreas, opt] : form.experienceAreas.filter(x => x !== opt))}
                />
                <span className="text-sm">{opt}</span>
              </label>
            ))}
          </div>
          <FieldError msg={errors.experienceAreas} />
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="profession">Current Profession / Role <span className="text-destructive">*</span></Label>
            <Input id="profession" placeholder="e.g., Real Estate Agent" value={form.profession} onChange={e => set("profession", e.target.value)} aria-invalid={!!errors.profession} />
            <FieldError msg={errors.profession} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="industry">Industry <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input id="industry" placeholder="e.g., Real Estate, Insurance, Healthcare" value={form.industry} onChange={e => set("industry", e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expDesc">Experience Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
          <p className="text-xs text-muted-foreground">Briefly describe your experience that makes you a good fit for this role.</p>
          <Textarea id="expDesc" rows={5} maxLength={5000} value={form.experienceDescription} onChange={e => set("experienceDescription", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepDocuments(props: {
  documents: UploadedDoc[];
  uploading: boolean;
  uploadType: string;
  setUploadType: (t: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChosen: (f: File) => void;
  onRemove: (id: number) => void;
}) {
  const { documents, uploading, uploadType, setUploadType, fileInputRef, onFileChosen, onRemove } = props;
  return (
    <div>
      <SectionTitle title="Supporting Documents" subtitle="Upload your résumé, ID, or certifications (optional but recommended). Max 10 MB per file." />
      <div className="grid gap-4 sm:grid-cols-[200px_1fr] items-end">
        <div className="space-y-1.5">
          <Label htmlFor="docType">Document Type</Label>
          <Select value={uploadType} onValueChange={setUploadType}>
            <SelectTrigger id="docType"><SelectValue /></SelectTrigger>
            <SelectContent>{DOCUMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            id="file-upload"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
            onChange={e => { const f = e.target.files?.[0]; if (f) onFileChosen(f); }}
          />
          <Button
            variant="outline"
            disabled={uploading}
            className="w-full border-dashed border-2 border-[#C9A227]/60 h-12 text-[#0F2044] hover:bg-[#FAF7F0]"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="h-5 w-5 mr-2 text-[#C9A227]" aria-hidden="true" />
            {uploading ? "Uploading..." : `Choose a ${uploadType} file to upload`}
          </Button>
        </div>
      </div>

      {documents.length > 0 && (
        <ul className="mt-6 space-y-2">
          {documents.map(d => (
            <li key={d.id} className="flex items-center gap-3 rounded-lg border p-3 bg-[#FAF7F0]/60">
              <FileText className="h-5 w-5 text-[#0F2044] flex-shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.fileName}</p>
                <p className="text-xs text-muted-foreground">{d.docType}{d.fileSize ? ` · ${(d.fileSize / 1024).toFixed(0)} KB` : ""}</p>
              </div>
              <Button variant="ghost" size="icon" aria-label={`Remove ${d.fileName}`} onClick={() => onRemove(d.id)}>
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {documents.length === 0 && (
        <p className="mt-5 text-xs text-muted-foreground">No documents uploaded yet. You may continue without uploading, but a résumé strengthens your application.</p>
      )}
    </div>
  );
}

const ACKS: { key: keyof FormState; title: string; text: string }[] = [
  { key: "ackIndependentContractor", title: "Independent Contractor Acknowledgment", text: "I understand that this is an independent contractor role, not employment." },
  { key: "ackNoLegalAdvice", title: "No Legal Advice Acknowledgment", text: "I understand I am not permitted to provide legal advice." },
  { key: "ackConfidentiality", title: "Confidentiality Agreement", text: "I agree to maintain strict client confidentiality and follow all company policies." },
  { key: "ackPerformanceComp", title: "Performance-Based Compensation Understanding", text: "I understand compensation is performance-based and not guaranteed." },
  { key: "ackRegistrationFee", title: "$200 Registration Fee Acknowledgment", text: "I acknowledge and agree that a $200 registration fee is required upon acceptance. It covers onboarding, training, systems access, and resources. Payment does not guarantee assignments or income." },
  { key: "ackFinalCertification", title: "Final Certification", text: "I certify that all information provided is accurate and complete." },
];

function StepAcknowledgments({ form, set, errors }: StepProps) {
  return (
    <div>
      <SectionTitle title="Acknowledgments & Certification" subtitle="Please review and confirm each statement. All are required." />
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 mb-6 flex gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-xs text-amber-900 leading-relaxed">
          <strong>$200 Registration Fee Disclosure:</strong> A $200 registration fee is required upon acceptance. This
          covers onboarding, training, systems access, and resources. Payment does not guarantee assignments or income.
          <strong> No payment is collected on this application.</strong>
        </p>
      </div>
      <div className="space-y-3">
        {ACKS.map(a => (
          <div key={a.key}>
            <label className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${form[a.key] ? "border-[#C9A227] bg-[#FAF7F0]" : errors[a.key] ? "border-destructive" : "border-input hover:border-[#C9A227]/50"}`}>
              <Checkbox
                className="mt-0.5"
                checked={form[a.key] as boolean}
                onCheckedChange={c => set(a.key, !!c as never)}
                aria-describedby={`${a.key}-desc`}
              />
              <span>
                <span className="block text-sm font-semibold text-[#0F2044]">{a.title} <span className="text-destructive">*</span></span>
                <span id={`${a.key}-desc`} className="block text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.text}</span>
              </span>
            </label>
            <FieldError msg={errors[a.key]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewSummary({ form, documents, onEdit, plain }: { form: FormState; documents: UploadedDoc[]; onEdit?: (step: number) => void; plain?: boolean }) {
  const yn = (v: boolean | null) => (v === true ? "Yes" : v === false ? "No" : "—");
  const sections: { title: string; step: number; rows: [string, string][] }[] = [
    {
      title: "Contact Information", step: 0, rows: [
        ["Full Legal Name", form.fullName || "—"],
        ["Email", form.email || "—"],
        ["Phone", form.phone || "—"],
        ["Address", [form.address1, form.address2, form.city, form.state, form.zip].filter(Boolean).join(", ") || "—"],
        ["County", form.county || "—"],
        ["Country", form.country || "—"],
      ],
    },
    {
      title: "Availability & Commitment", step: 1, rows: [
        ["Weekly Availability", form.weeklyAvailability || "—"],
        ["Preferred Days", form.preferredDays.join(", ") || "—"],
        ["Comfortable Working Independently", yn(form.independentWorkComfort)],
      ],
    },
    {
      title: "Experience & Skills", step: 2, rows: [
        ["Relevant Experience", form.experienceAreas.join("; ") || "—"],
        ["Profession", form.profession || "—"],
        ["Industry", form.industry || "—"],
        ["Description", form.experienceDescription || "—"],
      ],
    },
    {
      title: "Documents", step: 3, rows: documents.length
        ? documents.map(d => [d.docType, d.fileName] as [string, string])
        : [["Uploaded Files", "None"]],
    },
    {
      title: "Acknowledgments", step: 4, rows: ACKS.map(a => [a.title, yn(form[a.key] as boolean)] as [string, string]),
    },
  ];

  return (
    <div>
      {!plain && (
        <SectionTitle
          title="Review Your Application"
          subtitle="Please confirm everything is accurate before submitting. Use Edit to make changes."
        />
      )}
      <div className="space-y-6">
        {sections.map(sec => (
          <div key={sec.title} className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between bg-[#0F2044] px-4 py-2.5">
              <h3 className="text-sm font-semibold text-white">{sec.title}</h3>
              {onEdit && !plain && (
                <button className="text-xs text-[#C9A227] hover:underline" onClick={() => onEdit(sec.step)}>Edit</button>
              )}
            </div>
            <dl className="divide-y">
              {sec.rows.map(([label, value], i) => (
                <div key={`${label}-${i}`} className="grid sm:grid-cols-[220px_1fr] gap-1 px-4 py-2.5">
                  <dt className="text-xs text-muted-foreground pt-0.5">{label}</dt>
                  <dd className="text-sm text-[#0F2044] break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
