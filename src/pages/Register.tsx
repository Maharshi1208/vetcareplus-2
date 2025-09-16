import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import PasswordInput from "../components/ui/PasswordInput";
import Button from "../components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Minimum 6 characters"),
  confirm: z.string().min(6, "Minimum 6 characters"),
  agree: z.literal(true, { errorMap: () => ({ message: "Please accept terms" }) }),
}).refine((data) => data.password === data.confirm, {
  message: "Passwords do not match",
  path: ["confirm"],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema), mode: "onTouched" });

  const onSubmit = async (_data: FormData) => {
    // frontend-only: pretend success then go to Login
    await new Promise((r) => setTimeout(r, 700));
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 to-emerald-500 grid place-items-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/85 backdrop-blur-sm shadow-soft p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 h-10 w-10 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 grid place-items-center text-white font-bold">V</div>
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-gray-600 text-sm">Start using VetCare+</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Full name"
            placeholder="Jane Doe"
            error={errors.name?.message}
            {...register("name")}
          />
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
          <PasswordInput
            label="Confirm password"
            placeholder="••••••••"
            error={errors.confirm?.message}
            {...register("confirm")}
          />
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" className="mt-1" {...register("agree")} />
            <span>I agree to the <span className="underline">Terms</span> and <span className="underline">Privacy</span>.</span>
          </label>
          {errors.agree && <p className="text-xs text-red-600">{errors.agree.message}</p>}

          <div className="pt-2">
            <Button type="submit" loading={isSubmitting} full>
              Create account
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-700">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-sky-700 hover:text-sky-900">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
