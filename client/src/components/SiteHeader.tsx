import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const LOGO_URL = "/brand/legacy-path-logo.png";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0F2044] shadow-md">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link href="/" className="flex items-center gap-3 no-underline">
          <img src={LOGO_URL} alt="Legacy Path Solutions logo" className="h-11 md:h-14 w-auto" />
          <div className="leading-tight">
            <span className="block font-display text-white text-base md:text-lg font-semibold tracking-wide">
              Legacy Path <span className="text-[#C9A227]">Solutions</span>
            </span>
            <span className="hidden sm:block text-[11px] text-white/60 tracking-widest uppercase">Support Specialist Program</span>
          </div>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <a
            href="https://legacypathsupport.com/become-a-specialist"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline text-sm text-white/80 hover:text-[#C9A227] transition-colors"
          >
            Review the Specialist Opportunity
          </a>
          <Link href="/apply">
            <Button size="sm" className="bg-[#C9A227] text-[#0F2044] hover:bg-[#E3C767] font-semibold">
              Apply Now
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
