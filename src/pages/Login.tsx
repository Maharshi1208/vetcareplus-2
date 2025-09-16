import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, Link } from "react-router-dom";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import Button from "../components/ui/Button";
import LogoMark from "../components/LogoMark";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = async (_data: FormData) => {
    await new Promise(r => setTimeout(r, 500)); // fake login
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-soft p-6">
        <div className="mb-6 text-center">
          <div className="mb-2 flex justify-center">
            <LogoMark size={40} />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back</h1>
          <p className="text-gray-600 text-sm">Sign in to continue to VetCare+</p>
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
          <Link to="/register" className="font-medium text-sky-700 hover:text-sky-900">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
