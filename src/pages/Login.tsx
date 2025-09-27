// src/pages/Login.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext"; // ⬅️ NEW
import logo from "../assets/logofinal.png"; // ✅ Import logo

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"; // ⬅️ NEW

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ⬅️ NEW

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body?.error || "Login failed");
      }

      // ✅ token is at body.tokens.access — store via AuthContext
      if (body?.tokens?.access) {
        await login(body.tokens.access); // sets localStorage 'access' + role in context
        navigate("/dashboard");
      } else {
        throw new Error("Missing access token in response");
      }
    } catch (err: any) {
      alert(err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-soft p-6">
        <div className="mb-2 text-center">
          {/* ✅ Replaced V with logo */}
          <div className="flex justify-center mb-1">
            <img
              src={logo}
              alt="VetCare+"
              className="h-58 w-auto object-contain"
            />
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
          <div className="pt-2">
            <Button type="submit" loading={isSubmitting} full>
              Sign in
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-sky-700 hover:text-sky-900"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
