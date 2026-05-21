import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Shield } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api";

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
    <div className="min-h-screen flex items-center justify-center bg-white px-4 font-sans">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Neumorphic Shield Icon */}
        <div className="flex items-center justify-center size-20 rounded-full bg-white shadow-[9px_9px_16px_#d1d9e6,-9px_-9px_16px_#ffffff]">
          <Shield className="size-8 text-zinc-900" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                autoComplete="current-password"
                autoFocus
                disabled={isSubmitting}
                className="h-14 w-full border-none rounded-2xl px-4 text-base text-gray-700 bg-white placeholder:text-gray-400 focus-visible:ring-0 shadow-[inset_6px_6px_10px_#d1d9e6,inset_-6px_-6px_10px_#ffffff] transition-all focus:shadow-[inset_8px_8px_14px_#d1d9e6,inset_-8px_-8px_14px_#ffffff]"
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-500 mt-1 pl-2 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-semibold text-lg transition-all shadow-[6px_6px_10px_#d1d9e6,-6px_-6px_10px_#ffffff] hover:bg-zinc-800 active:translate-y-0.5 active:shadow-[2px_2px_5px_#d1d9e6,-2px_-2px_5px_#ffffff] disabled:opacity-70 disabled:pointer-events-none"
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>

          <div className="text-center mt-4">
            <a
              href="https://andikads.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors tracking-widest uppercase"
            >
              DEVELOPER
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
