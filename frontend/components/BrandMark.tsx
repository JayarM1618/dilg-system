import Image from "next/image";
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
    <Link href={href} className="inline-flex items-center gap-3" aria-label="Talaghayan home">
      {/* Eagle mark. File lives in frontend/public/talaghayan-mark.png */}
      <span
        className={`flex h-11 w-12 items-center justify-center overflow-hidden rounded-md ${dark ? "" : "bg-white"}`}
        aria-hidden="true"
      >
        <Image
          src="/talaghayan-mark.png"
          alt=""
          width={464}
          height={318}
          priority
          className="h-full w-full object-contain"
        />
      </span>
      <span className="leading-tight">
        <span
          className={`block font-display text-base font-semibold tracking-tight ${
            dark ? "text-navy-900" : "text-white"
          }`}
        >
          Talaghayan
        </span>
        <span className={`block text-xs ${dark ? "text-muted" : "text-navy-100/80"}`}>
          Barangay report tracker
        </span>
      </span>
    </Link>
  );
}