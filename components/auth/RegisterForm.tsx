"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const schema = z
  .object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, "Must contain uppercase, number, and special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, loading, error } = useAuth();
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await registerUser(values.name, values.email, values.password);
      toast.success("Registered! Please log in.");
      router.push("/login");
    } catch {}
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><Label htmlFor="name">Name</Label><Input id="name" {...register("name")} />{errors.name && <p className="mt-1 text-sm text-[var(--error)]">{errors.name.message}</p>}</div>
      <div><Label htmlFor="email">Email</Label><Input id="email" type="email" {...register("email")} />{errors.email && <p className="mt-1 text-sm text-[var(--error)]">{errors.email.message}</p>}</div>
      <div><Label htmlFor="password">Password</Label><Input id="password" type="password" {...register("password")} />{errors.password && <p className="mt-1 text-sm text-[var(--error)]">{errors.password.message}</p>}</div>
      <div><Label htmlFor="confirmPassword">Confirm password</Label><Input id="confirmPassword" type="password" {...register("confirmPassword")} />{errors.confirmPassword && <p className="mt-1 text-sm text-[var(--error)]">{errors.confirmPassword.message}</p>}</div>
      {error && <p className="text-sm text-[var(--error)]">{error}</p>}
      <Button type="submit" isLoading={loading} disabled={loading} className="w-full bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]">{loading ? "Creating account..." : "Create account"}</Button>
    </form>
  );
}
