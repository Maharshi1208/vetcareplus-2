// src/pages/Login.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logofinal.png";

// Use your API helpers so token storage is centralized
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
      // POST /auth/login
      const resp = await apiPost<any>("/auth/login", data);

      // Store access token in localStorage ("access")
      const token = setTokenFromAuthPayload(resp);
      if (!token) throw new Error("Missing access token in response");

      // Tell AuthContext we’re logged in (also resolves role)
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
            <img src={logo} alt="VetCare+" className="h-58 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="text-gray-600 text-sm">Welcome back to VetCare+</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex justify-end">
            <Link to="/reset-password" className="text-sm font-medium text-sky-700 hover:text-sky-900">
              Forgot password?
            </Link>
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
