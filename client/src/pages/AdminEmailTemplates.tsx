import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trpc } from "@/lib/trpc";
import { Spinner } from "@/components/ui/spinner";
import { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_LABELS, type EmailTemplateKey } from "@shared/lps";

export default function AdminEmailTemplates() {
  const [selected, setSelected] = useState<EmailTemplateKey>(EMAIL_TEMPLATE_KEYS[0]);
  const { data, isLoading } = trpc.admin.previewEmail.useQuery({ templateKey: selected });

  return (
    <AdminLayout title="Email Templates">
      <p className="text-sm text-muted-foreground -mt-4 mb-5 max-w-2xl">
        These nine branded lifecycle templates are sent automatically on status changes or manually from an applicant's
        detail page. Preview shows sample data (Jane Doe, LPS-2026-SAMPLE).
      </p>
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <nav className="bg-white rounded-xl border p-2 h-fit" aria-label="Email templates">
          {EMAIL_TEMPLATE_KEYS.map(k => (
            <button
              key={k}
              onClick={() => setSelected(k)}
              className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${selected === k ? "bg-[#0F2044] text-white font-medium" : "hover:bg-[#FAF7F0]"}`}
            >
              {EMAIL_TEMPLATE_LABELS[k]}
            </button>
          ))}
        </nav>
        <div className="bg-white rounded-xl border overflow-hidden">
          {isLoading || !data ? (
            <div className="p-16 flex justify-center"><Spinner className="h-7 w-7 text-[#0F2044]" /></div>
          ) : (
            <>
              <div className="border-b px-5 py-3 bg-[#FAF7F0]">
                <p className="text-xs text-muted-foreground">Subject</p>
                <p className="text-sm font-medium text-[#0F2044]">{data.subject}</p>
              </div>
              <iframe title={`Preview: ${EMAIL_TEMPLATE_LABELS[selected]}`} srcDoc={data.html} className="w-full h-[70vh] bg-white" sandbox="" />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
