import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Pickaxe } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import { useLogin } from "@/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 font-sans text-zinc-900">
      <div className="w-full max-w-md bg-white rounded-4xl px-8 py-12">
        {/* Branding */}
        <div className="mb-4 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center size-12 rounded-lg bg-zinc-900 shadow-sm mb-4">
            <Pickaxe className="size-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Enter your password to continue</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  autoFocus
                  disabled={isSubmitting}
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {errors.password && (
                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="text-center mt-8">
          <a
            href="https://andikads.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            DEVELOPER
          </a>
        </div>
      </div>
    </div>
  );
}
