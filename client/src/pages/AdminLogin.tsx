import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

const LOGO_URL = "/brand/legacy-path-logo.png";

export default function AdminLogin() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: me, isLoading } = trpc.admin.me.useQuery();
  const login = trpc.admin.login.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (me) navigate("/admin/dashboard");
  }, [me, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      await utils.admin.me.invalidate();
      navigate("/admin/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    }
  }

  return (
    <div className="min-h-screen bg-[#0F2044] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={LOGO_URL} alt="Legacy Path Solutions" className="h-16 w-16 object-contain mx-auto" />
          <h1 className="mt-4 font-display text-2xl font-bold text-white">
            Legacy Path <span className="text-[#C9A227]">Solutions</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">Team Administration Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-5">
          <div className="flex items-center gap-2 text-[#0F2044]">
            <ShieldCheck className="h-5 w-5 text-[#C9A227]" aria-hidden="true" />
            <h2 className="font-display font-semibold">Secure Sign In</h2>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-email">Email</Label>
            <Input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <Input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={login.isPending || isLoading} className="w-full bg-[#0F2044] text-white hover:bg-[#1C3260] h-11">
            {login.isPending ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Access restricted to authorized Legacy Path Solutions team members.
          </p>
        </form>
      </div>
    </div>
  );
}
