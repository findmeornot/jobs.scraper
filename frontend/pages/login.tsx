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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Simple Branding */}
        <div className="mb-12 flex flex-col items-center text-zinc-900">
          <Pickaxe className="size-8 mb-4 text-zinc-900" />
          <h1 className="text-xl font-medium tracking-tight">Instagram Scraper</h1>
        </div>

        {/* Flat Form without container borders */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                autoFocus
                disabled={isSubmitting}
                aria-invalid={errors.password ? "true" : undefined}
                className="h-12 w-full bg-zinc-50 border-0 rounded-none border-b-2 border-zinc-200 focus-visible:border-zinc-900 focus-visible:ring-0 px-2 text-base rounded-t-md transition-colors"
                {...register("password")}
              />
              <button
                type="button"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
              >
                {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
              </button>
            </div>

            {errors.password && (
              <p className="text-sm text-red-600 mt-1 pl-2 font-medium">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-2 bg-zinc-900 text-white hover:bg-zinc-800 rounded-none font-medium text-base transition-colors"
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
