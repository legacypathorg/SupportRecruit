import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LayoutDashboard, BarChart3, Mail, LogOut, ExternalLink } from "lucide-react";

const LOGO_URL = "/brand/legacy-path-logo.png";

const NAV = [
  { href: "/admin/dashboard", label: "Applicants", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/emails", label: "Email Templates", icon: Mail },
];

export default function AdminLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const [location, navigate] = useLocation();
  const { data: me, isLoading } = trpc.admin.me.useQuery();
  const logout = trpc.admin.logout.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!isLoading && !me) navigate("/admin");
  }, [isLoading, me, navigate]);

  if (isLoading || !me) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner className="h-8 w-8 text-[#0F2044]" /></div>;
  }

  return (
    <div className="min-h-screen flex bg-[#F5F3EC]">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col bg-[#0F2044] text-white fixed inset-y-0">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/10">
          <img src={LOGO_URL} alt="" className="h-8 w-8 object-contain" />
          <div className="leading-tight">
            <span className="block text-sm font-display font-semibold">Legacy Path <span className="text-[#C9A227]">Solutions</span></span>
            <span className="text-[10px] text-white/50 tracking-widest uppercase">Admin</span>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(item => {
            const active = location.startsWith(item.href) || (item.href === "/admin/dashboard" && location.startsWith("/admin/applicants"));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-[#C9A227] text-[#0F2044] font-semibold" : "text-white/75 hover:bg-white/10 hover:text-white"}`}>
                <item.icon className="h-4.5 w-4.5 h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <a href="/apply" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-white/60 hover:text-[#C9A227]">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> View public application
          </a>
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{me.name}</p>
              <p className="text-[10px] text-white/50 truncate">{me.email}</p>
            </div>
            <Button
              variant="ghost" size="icon" aria-label="Sign out" className="text-white/60 hover:text-white hover:bg-white/10"
              onClick={async () => { await logout.mutateAsync(); await utils.admin.me.invalidate(); navigate("/admin"); }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#0F2044] text-white">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="" className="h-7 w-7 object-contain" />
            <span className="text-sm font-display font-semibold">LPS Admin</span>
          </div>
          <div className="flex gap-1">
            {NAV.map(item => (
              <Link key={item.href} href={item.href} aria-label={item.label} className={`p-2 rounded-md ${location.startsWith(item.href) ? "bg-[#C9A227] text-[#0F2044]" : "text-white/75"}`}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </Link>
            ))}
            <button aria-label="Sign out" className="p-2 text-white/75" onClick={async () => { await logout.mutateAsync(); await utils.admin.me.invalidate(); navigate("/admin"); }}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0">
        <div className="px-4 md:px-8 py-6 md:py-8">
          <h1 className="font-display text-2xl font-bold text-[#0F2044] mb-6">{title}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
