"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AuthLayout from "@/components/auth/AuthLayout";
import GoogleButton from "@/components/auth/GoogleButton";
import PasswordInput from "@/components/auth/PasswordInput";
import Field from "@/components/forms/Field";
import Alert from "@/components/common/Alert";
import { inputClass } from "@/lib/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // quick checks before sending anything
  function validate() {
    const found = {};
    if (!email.trim()) found.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) found.email = "Enter a valid email address.";
    if (!password) found.password = "Password is required.";
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    setNotice("");
    if (Object.keys(found).length > 0) return;

    // signIn() sends email + pw to Auth.js, see authorize() in lib/auth.js
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      setFormError("Invalid email or password.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to see your schedule, tasks, and resources."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </>
      }
    >
      <GoogleButton onClick={() => setNotice("Google sign-in isn't connected yet.")} />

      <div className="my-5 flex items-center gap-3 text-xs text-inksoft">
        <span className="h-px flex-1 bg-neutral-200" />
        or sign in with email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.edu"
            className={`${inputClass} ${errors.email ? "border-rose-400" : ""}`}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            error={errors.password}
          />
        </Field>

        <Alert>{formError}</Alert>
        <Alert type="info">{notice}</Alert>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
}
