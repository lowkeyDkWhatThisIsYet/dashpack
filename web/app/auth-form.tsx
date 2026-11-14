"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Layers3,
  Loader2,
  LockKeyhole,
  Rocket,
  Terminal,
} from "lucide-react";
import "./marketing.css";
import "./auth.css";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const signup = mode === "signup";
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/auth/${signup ? "sign-up" : "sign-in"}/email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.get("name"),
            email: String(values.get("email")).trim(),
            password: values.get("password"),
            rememberMe: signup || values.get("remember") === "on",
          }),
        },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.message || "We couldn’t sign you in. Please try again.",
        );
      window.location.assign("/dashboard");
    } catch (error) {
      setError((error as Error).message);
      setPending(false);
    }
  }
  return (
    <div className="auth-shell">
      <section className="auth-form-panel">
        <Link href="/" className="marketing-brand">
          <Layers3 size={25} />
          dashpack<span>.</span>
        </Link>
        <div className="auth-form-content">
          <Link href="/" className="auth-back">
            <ArrowLeft size={13} />
            Back to home
          </Link>
          <span className="auth-overline">
            {signup ? "MAKE YOURSELF AT HOME" : "YOUR NEXT CHAPTER AWAITS"}
          </span>
          <h1>
            {signup ? "Great things start here." : "Welcome back, builder."}
          </h1>
          <p className="auth-description">
            {signup
              ? "Create the owner account for your deployment workspace."
              : "Sign in to your workspace. Your projects are waiting."}
          </p>
          <form onSubmit={submit}>
            {signup && (
              <label className="auth-field" htmlFor="name">
                Your name
                <input
                  id="name"
                  name="name"
                  required
                  maxLength={64}
                  autoComplete="name"
                  placeholder="What should we call you?"
                />
              </label>
            )}
            <label className="auth-field" htmlFor="email">
              Email address
              <input
                id="email"
                name="email"
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label className="auth-field" htmlFor="password">
              Password
              <div className="password-input">
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  required
                  minLength={signup ? 12 : undefined}
                  maxLength={128}
                  autoComplete={signup ? "new-password" : "current-password"}
                  placeholder={
                    signup ? "Choose a strong password" : "Enter your password"
                  }
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {signup && (
                <small>
                  At least 12 characters. Make it something only you know.
                </small>
              )}
            </label>
            {!signup && (
              <label className="remember-me">
                <input type="checkbox" name="remember" defaultChecked />
                Keep me signed in on this device
              </label>
            )}
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="marketing-button auth-submit"
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <Loader2 size={16} className="spin" />
              ) : signup ? (
                "Create your workspace"
              ) : (
                "Sign in"
              )}
              {!pending && <ArrowRight size={16} />}
            </button>
          </form>
          <div className="auth-local-note">
            <LockKeyhole size={15} />
            <p>
              {signup
                ? "This account owns the local Docker workspace. Once it’s created, new registration closes."
                : "Your session is protected. Only the workspace owner can access apps and deployments."}
            </p>
          </div>
          <p className="auth-switch">
            {signup ? (
              <>
                Already set up your workspace?{" "}
                <Link href="/login">
                  Sign in <ArrowUp />
                </Link>
              </>
            ) : (
              <>
                New to Dashpack?{" "}
                <Link href="/signup">
                  Set up a workspace <ArrowUp />
                </Link>
              </>
            )}
          </p>
        </div>
        <p className="auth-copyright">
          © {new Date().getFullYear()} Dashpack · A small push. A big
          possibility.
        </p>
      </section>
      <aside className="auth-story-panel">
        <div className="auth-story-grid" aria-hidden="true" />
        <span className="auth-story-label">
          <span />
          BUILT FOR WHAT’S NEXT
        </span>
        <div className="auth-story-content">
          <span className="auth-story-spark">✳</span>
          <h2>
            A little less setup.
            <br />A lot more <em>possibility.</em>
          </h2>
          <p>
            From the idea in your head to the app on your screen.
            <br />
            Let’s make the in-between a little simpler.
          </p>
          <div className="auth-deploy-visual">
            <div className="auth-visual-header">
              <span>
                <Terminal size={14} />
                your-next-project
              </span>
              <span>
                <span />
                READY
              </span>
            </div>
            <div className="auth-visual-line">
              <Check size={14} />
              <span>Framework detected</span>
              <small>Done</small>
            </div>
            <div className="auth-visual-line">
              <Check size={14} />
              <span>Application built</span>
              <small>Done</small>
            </div>
            <div className="auth-visual-line">
              <Check size={14} />
              <span>Health check passed</span>
              <small>Done</small>
            </div>
            <div className="auth-visual-ready">
              <span>
                <Rocket size={18} />
              </span>
              <div>
                <strong>Ready for your next big thing.</strong>
                <small>Your code. Your workspace. Your move.</small>
              </div>
            </div>
            <span className="auth-example">Illustrative deployment</span>
          </div>
          <div className="auth-story-bottom">
            <Layers3 size={18} />
            <span>
              You bring the ideas.
              <br />
              <strong>We’ll help you get them running.</strong>
            </span>
          </div>
        </div>
        <span className="auth-panel-foot">
          YOUR INFRASTRUCTURE. YOUR POSSIBILITIES.
        </span>
      </aside>
    </div>
  );
}

function ArrowUp() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M4 12 12 4M4 4h8v8" />
    </svg>
  );
}
