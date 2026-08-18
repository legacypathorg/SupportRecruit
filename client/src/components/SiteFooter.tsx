import { Link } from "wouter";

const LOGO_URL = "/brand/legacy-path-logo.png";

export default function SiteFooter() {
  return (
    <footer className="bg-[#0F2044] text-white/70 mt-auto">
      <div className="container py-10 grid gap-8 md:grid-cols-3">
        <div>
          <img src={LOGO_URL} alt="Legacy Path Solutions logo" className="h-20 w-auto mb-4" />
          <div className="font-display text-white text-lg font-semibold">
            Legacy Path <span className="text-[#C9A227]">Solutions</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            Helping families take meaningful steps toward organization, protection, and intentional legacy planning.
          </p>
        </div>
        <div>
          <h3 className="font-display text-[#C9A227] text-sm font-semibold tracking-widest uppercase">Quick Links</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-[#C9A227] transition-colors">Program Overview</Link></li>
            <li><Link href="/apply" className="hover:text-[#C9A227] transition-colors">Start Your Application</Link></li>
            <li><Link href="/admin" className="hover:text-[#C9A227] transition-colors">Team Sign In</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-[#C9A227] text-sm font-semibold tracking-widest uppercase">Important Notice</h3>
          <p className="mt-3 text-xs leading-relaxed">
            Submitting an application does not guarantee acceptance into the Support Specialist Program. Do not submit
            payment until you have received an official approval notice. This is an independent contractor
            opportunity, not employment.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-4 text-xs text-white/50 flex flex-col sm:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Legacy Path Solutions. All rights reserved.</span>
          <span>Support Specialist Program</span>
        </div>
      </div>
    </footer>
  );
}
