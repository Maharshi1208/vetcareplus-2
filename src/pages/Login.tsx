// src/pages/Login.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logofinal.png";

// API helpers
import { apiPost, setTokenFromAuthPayload } from "../services/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      email: "admin@vetcare.local",
      password: "admin123",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const resp = await apiPost<any>("/auth/login", data);
      const token = setTokenFromAuthPayload(resp);
      if (!token) throw new Error("Missing access token in response");
      await login(token);
      navigate("/dashboard");
    } catch (err: any) {
      alert(err?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-soft p-6">
        <div className="mb-2 text-center">
          <div className="flex justify-center mb-1">
            <img src={logo} alt="VetCare+" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="text-gray-600 text-sm">Welcome back to VetCare+</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-sky-500 ${
                errors.email ? "border-red-400" : "border-gray-300"
              }`}
              {...register("email")}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Link
                to="/reset-password"
                className="text-xs font-medium text-sky-700 hover:text-sky-900"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              className={`w-full rounded-lg border px-3 py-2 outline-none focus:border-sky-500 ${
                errors.password ? "border-red-400" : "border-gray-300"
              }`}
              {...register("password")}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            )}
          </div>

          <div className="pt-2">
            <Button type="submit" loading={isSubmitting} full>
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Don’t have an account?{" "}
          <Link to="/register" className="font-medium text-sky-700 hover:text-sky-900">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
