import Link from "next/link";

interface BrandMarkProps {
  /** "light" = white text for dark backgrounds (default). "dark" = navy text for light backgrounds. */
  tone?: "light" | "dark";
  /** Where the logo links to. Defaults to the home page. */
  href?: string;
}

export default function BrandMark({ tone = "light", href = "/" }: BrandMarkProps) {
  const dark = tone === "dark";

  return (
    <Link href={href} className="inline-flex items-center gap-3" aria-label="DILG Makati home">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-md font-display text-sm font-bold ${
          dark ? "bg-navy-900 text-white" : "bg-white text-navy-900"
        }`}
        aria-hidden="true"
      >
        DM
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-base font-semibold tracking-tight ${
            dark ? "text-navy-900" : "text-white"
          }`}
        >
          DILG Makati
        </span>
        <span className={`block text-xs ${dark ? "text-muted" : "text-navy-100/80"}`}>
          Barangay report tracker
        </span>
      </span>
    </Link>
  );
}
