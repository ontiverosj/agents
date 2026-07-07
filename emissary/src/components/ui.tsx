import Link from "next/link";
import { useId, type ReactNode } from "react";

/* Brand mark: three ascending bars in a rounded tile — "work getting done". */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  // Unique gradient id per instance — a shared id can resolve to a hidden
  // copy of the SVG, which stops the gradient from painting.
  const gradientId = `em-g-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <rect x="7" y="17" width="4.5" height="8" rx="1.5" fill="white" opacity="0.75" />
      <rect x="13.75" y="12" width="4.5" height="13" rx="1.5" fill="white" opacity="0.9" />
      <rect x="20.5" y="7" width="4.5" height="18" rx="1.5" fill="white" />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32">
          <stop stopColor="#7745ff" />
          <stop offset="1" stopColor="#4c1bb8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className={`text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-ink-950"}`}>
        Emissary
      </span>
    </span>
  );
}

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "inverted";
  size?: "md" | "lg";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", size = "md", className = "" }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200";
  const sizes = { md: "px-5 py-2.5 text-sm", lg: "px-7 py-3.5 text-base" };
  const variants = {
    primary:
      "bg-violet-600 text-white shadow-[0_4px_14px_rgb(107_43_247/0.35)] hover:bg-violet-700 hover:shadow-[0_6px_20px_rgb(107_43_247/0.45)]",
    secondary:
      "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50",
    ghost: "text-ink-700 hover:text-ink-950 hover:bg-ink-100",
    inverted: "bg-white text-ink-950 hover:bg-ink-100",
  };
  return (
    <Link href={href} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-violet-600">{children}</p>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lede,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">{title}</h2>
      {lede && <p className="mt-4 text-lg leading-relaxed text-ink-600">{lede}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-ink-100 bg-white shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function CheckIcon({ className = "h-5 w-5 text-violet-600" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" />
      <path d="M6 10.2l2.6 2.6L14 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M2.5 8h11m0 0L9 3.5M13.5 8L9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Colored agent avatar with initials — deterministic hue per agent. */
export function AgentAvatar({
  initials,
  hue,
  size = "md",
}: {
  initials: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" };
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold text-white ${sizes[size]}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 75% 58%), hsl(${hue + 25} 70% 42%))` }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
