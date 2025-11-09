import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignup } from "../hooks/auth";
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'

const signupSchema = z.object({
  name: z.string().min(1, "Please enter your name"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  role: z.enum(["user", "admin"]),
});

type SignupValues = z.infer<typeof signupSchema>;

const Signup: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: "user" },
  });

  const { mutateAsync, isPending } = useSignup();
  const navigate = useNavigate()

  const onSubmit = async (values: SignupValues) => {
    try {
      const res = await mutateAsync(values)
      // Expect backend to return access token in response body
      const token = (res as any)?.accessToken || (res as any)?.token
      if (token) {
        try {
          localStorage.setItem('accessToken', token)
        } catch (err) {
          // ignore storage errors
          // eslint-disable-next-line no-console
          console.warn('Failed to save access token', err)
        }
      }
      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message || 'Signup failed'
      message.error(serverMsg)
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffaf3] relative overflow-hidden">
      {/* Subtle background lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#d2f3e1_0%,transparent_25%),radial-gradient(circle_at_80%_80%,#d2f3e1_0%,transparent_25%)] opacity-50"></div>

      {/* Card */}
      <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 p-6 z-10">
        {/* Brand */}
        <div className="flex items-center justify-center mb-4">
          <div className="text-2xl font-extrabold text-gray-900">PrimePost</div>
        </div>

        {/* Card header */}
        <div className="flex flex-col items-center mb-5">
          <div className="text-xl font-semibold text-gray-800">Sign up</div>
          <p className="text-sm text-gray-500 mt-1">Create your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="Full name"
              {...register("name")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {errors.name && (
              <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <input
              type="email"
              placeholder="Email address"
              {...register("email")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <select
              {...register("role")}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-xs text-red-600 mt-1">{errors.role.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isPending}
            className="w-full mt-2 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white py-2 text-sm font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting || isPending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-2">
          <hr className="flex-1 border-gray-300" />
          <span className="text-xs text-gray-500">or</span>
          <hr className="flex-1 border-gray-300" />
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-600 hover:underline">
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
