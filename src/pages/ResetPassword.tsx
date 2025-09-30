// src/pages/ResetPassword.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import Button from "../components/ui/Button";
import logo from "../assets/logofinal.png";
import PasswordStrength from "../components/ui/PasswordStrength"; // ✅ New import

// Validation schema
const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type FormData = z.infer<typeof schema>;

export default function ResetPassword() {
  const {
    register,
    handleSubmit,
    watch, // Added watch for password
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  });

  const onSubmit = async (data: FormData) => {
    // UI-only for now
    console.log("Reset password data:", data);
    alert("Password reset request submitted (UI-only, no backend).");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-soft p-6">
        <div className="mb-2 text-center">
          <div className="flex justify-center mb-1">
            <img
              src={logo}
              alt="VetCare+"
              className="h-58 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Reset Password</h1>
          <p className="text-gray-600 text-sm">
            Enter your email and new password
          </p>
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
            label="New Password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />
          {/* Password Strength Indicator */}
          <PasswordStrength password={watch("password") || ""} />

          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <div className="pt-2">
            <Button type="submit" loading={isSubmitting} full>
              Reset Password
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Back to{" "}
          <Link
            to="/login"
            className="font-medium text-sky-700 hover:text-sky-900"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
