import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Lock, Eye, EyeOff } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated);
  const login = useLogin();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login.mutateAsync(data);
      queryClient.setQueryData(["auth", "me"], { authenticated: true });
      setAuthenticated(true);
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Network error";
      setError("password", { message });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden">
      {/* Glassmorphism Background Orbs */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full mix-blend-screen filter blur-[128px] animate-pulse" />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="w-full max-w-sm z-10 px-4">
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-6 backdrop-blur-2xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl ring-1 ring-white/10"
        >
          <div className="text-center mb-2">
            <h1 className="text-2xl font-light text-white tracking-wide">Welcome back</h1>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-500" />
              <div className="relative flex items-center bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden transition-all group-focus-within:border-white/20">
                <div className="pl-4 pr-2">
                  <Lock className="size-4 text-white/40" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  autoFocus
                  disabled={isSubmitting}
                  className="border-0 bg-transparent text-white placeholder:text-white/30 focus-visible:ring-0 px-2 h-12 text-lg w-full"
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="pr-4 pl-2 h-full flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {errors.password && (
              <p className="text-sm text-rose-400/90 pl-2 animate-in fade-in slide-in-from-top-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "group relative h-12 rounded-xl bg-white text-zinc-950 font-medium text-base overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]",
              isSubmitting && "opacity-70 pointer-events-none",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-fuchsia-100 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center justify-center gap-2">
              {isSubmitting ? "Authenticating..." : "Continue"}
              {!isSubmitting && (
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
