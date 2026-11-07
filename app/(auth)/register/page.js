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
import { callApi } from "@/lib/callApi";
import { inputClass } from "@/lib/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  // quick checks here, the API checks again w/ zod
  function validate() {
    const found = {};
    if (!form.name.trim()) found.name = "Name is required.";
    if (!form.email.trim()) found.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email address.";
    if (form.password.length < 8) found.password = "Use at least 8 characters.";
    if (form.confirm !== form.password) found.confirm = "Passwords don't match.";
    return found;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate();
    setErrors(found);
    setFormError("");
    setNotice("");
    if (Object.keys(found).length > 0) return;

    setLoading(true);

    // create the account first
    const { ok, data } = await callApi("/api/register", "POST", {
      name: form.name,
      email: form.email,
      password: form.password,
    });
    if (!ok) {
      setLoading(false);
      if (data.errors) setErrors(data.errors);
      else setFormError(data.message || "Something went wrong. Try again.");
      return;
    }

    // then log in right away w/ the same email + pw
    const login = await signIn("credentials", {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      redirect: false,
    });
    setLoading(false);

    router.push(login?.error ? "/login" : "/");
    router.refresh();
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start planning your study week in a few seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton
        label="Sign up with Google"
        onClick={() => setNotice("Google sign-up isn't connected yet.")}
      />

      <div className="my-5 flex items-center gap-3 text-xs text-inksoft">
        <span className="h-px flex-1 bg-neutral-200" />
        or register with email
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <Field label="Full name" htmlFor="name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={update("name")}
            placeholder="Juan Dela Cruz"
            className={`${inputClass} ${errors.name ? "border-rose-400" : ""}`}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            placeholder="you@school.edu"
            className={`${inputClass} ${errors.email ? "border-rose-400" : ""}`}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            error={errors.password}
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
          <PasswordInput
            id="confirm"
            value={form.confirm}
            onChange={update("confirm")}
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirm}
          />
        </Field>

        <Alert>{formError}</Alert>
        <Alert type="info">{notice}</Alert>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-blue-700 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-800 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthLayout>
  );
}
