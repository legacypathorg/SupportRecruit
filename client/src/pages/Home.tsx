import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { trpc } from "@/lib/trpc";
import { getSessionId, getTrafficSource } from "@/lib/analytics";
import {
  ClipboardList,
  SearchCheck,
  MessagesSquare,
  FileSignature,
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  Compass,
  AlertCircle,
} from "lucide-react";

const HERO_URL = "/brand/hero-handshake.jpg";
const SECONDARY_URL = "/brand/secondary-consultation.png";

const steps = [
  {
    icon: ClipboardList,
    title: "Submit Your Application",
    text: "Complete the online application and provide information about your professional background and network.",
  },
  {
    icon: SearchCheck,
    title: "Application Review",
    text: "Legacy Path Solutions reviews your experience, alignment and potential service area.",
  },
  {
    icon: MessagesSquare,
    title: "Introductory Interview",
    text: "Selected applicants participate in a conversation to discuss expectations, goals and program fit.",
  },
  {
    icon: FileSignature,
    title: "Agreement & Registration",
    text: "Approved applicants complete the independent contractor agreement and pay the required $200 registration fee.",
  },
  {
    icon: GraduationCap,
    title: "Training & Activation",
    text: "Complete required training and receive access to approved tools, materials and support resources.",
  },
];

const values = [
  { icon: HeartHandshake, title: "Serve With Purpose", text: "Introduce individuals and families to Legacy Path Solutions and remain a trusted point of contact throughout their planning journey." },
  { icon: Compass, title: "Guide With Clarity", text: "Help families understand available services and support them through the onboarding process, step by step." },
  { icon: ShieldCheck, title: "Lead With Integrity", text: "Uphold professionalism, confidentiality, and service excellence in every interaction — no legal advice, ever." },
];

export default function Home() {
  const [, navigate] = useLocation();
  const trackEvent = trpc.application.trackEvent.useMutation();

  const handleCta = (label: string) => {
    trackEvent.mutate({
      eventType: "cta_click",
      sessionId: getSessionId(),
      trafficSource: getTrafficSource(),
      metadata: { button: label },
    });
    navigate("/apply");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative bg-[#0F2044] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #C9A227 0, transparent 45%), radial-gradient(circle at 80% 70%, #C9A227 0, transparent 40%)" }} />
        <div className="container relative grid gap-10 lg:grid-cols-2 items-center py-16 md:py-24">
          <div>
            <p className="inline-flex items-center gap-2 text-[#C9A227] text-sm font-semibold tracking-widest uppercase">
              <span className="h-px w-8 bg-[#C9A227]" /> Support Specialist Program
            </p>
            <h1 className="mt-4 font-display text-4xl md:text-5xl font-bold leading-tight">
              Turn Your Relationships Into <span className="text-[#C9A227]">Impact, Income and Legacy</span>
            </h1>
            <p className="mt-5 text-lg text-white/85 leading-relaxed">
              Apply to become a Legacy Path Solutions Support Specialist and help families take meaningful steps toward
              organization, protection and intentional legacy planning.
            </p>
            <p className="mt-4 text-sm text-white/65 leading-relaxed">
              Support Specialists introduce individuals and families to Legacy Path Solutions, help them understand
              available services, support them through the onboarding process, and remain a trusted point of contact
              throughout their planning journey.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-[#C9A227] text-[#0F2044] hover:bg-[#E3C767] font-bold text-base px-8"
                onClick={() => handleCta("hero_start_application")}
              >
                Start Your Application
              </Button>
              <a href="#program">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 w-full sm:w-auto">
                  Learn About the Program
                </Button>
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl border border-[#C9A227]/40 rotate-2" aria-hidden="true" />
            <img
              src={HERO_URL}
              alt="A Legacy Path Solutions specialist meeting with an older couple to review their planning documents"
              className="relative rounded-2xl shadow-2xl w-full object-cover aspect-[4/3]"
            />
          </div>
        </div>
      </section>

      {/* Values */}
      <section id="program" className="py-16 md:py-20 bg-[#FAF7F0]">
        <div className="container">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F2044]">A Role Built on Trust and Service</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              This opportunity is for independent contractors who value professionalism, confidentiality, and service
              excellence — not a generic job posting.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {values.map(v => (
              <div key={v.title} className="bg-white rounded-xl p-7 shadow-sm border border-[#0F2044]/5">
                <v.icon className="h-9 w-9 text-[#C9A227]" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg font-semibold text-[#0F2044]">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5-step process */}
      <section className="py-16 md:py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px] items-start">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-[#0F2044]">Your Path in Five Steps</h2>
              <ol className="mt-10 space-y-0">
                {steps.map((s, i) => (
                  <li key={s.title} className="relative flex gap-5 pb-10 last:pb-0">
                    {i < steps.length - 1 && <span className="absolute left-[27px] top-14 bottom-0 w-px bg-[#C9A227]/30" aria-hidden="true" />}
                    <div className="flex-shrink-0 h-14 w-14 rounded-full bg-[#0F2044] text-[#C9A227] flex items-center justify-center shadow-md">
                      <s.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-semibold tracking-widest text-[#C9A227] uppercase">Step {i + 1}</p>
                      <h3 className="font-display text-xl font-semibold text-[#0F2044]">{s.title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-xl">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="lg:sticky lg:top-28 space-y-5">
              <img src={SECONDARY_URL} alt="A professional Legacy Path Solutions Support Specialist" className="rounded-xl shadow-lg w-full object-cover aspect-[3/4] hidden lg:block" />
              <div className="rounded-xl border border-[#C9A227]/40 bg-[#FAF7F0] p-5 flex gap-3">
                <AlertCircle className="h-5 w-5 text-[#C9A227] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-[#0F2044]/80 leading-relaxed">
                  <strong>Please note:</strong> Submitting an application does not guarantee acceptance into the Support
                  Specialist Program. Do not submit payment until you have received an official approval notice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-[#0F2044] py-14">
        <div className="container text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-white">Ready to Begin Your Legacy Path?</h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto text-sm md:text-base">
            The application takes about 10 minutes. You can save your progress and return anytime.
          </p>
          <Button
            size="lg"
            className="mt-7 bg-[#C9A227] text-[#0F2044] hover:bg-[#E3C767] font-bold text-base px-10"
            onClick={() => handleCta("footer_start_application")}
          >
            Start Your Application
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
