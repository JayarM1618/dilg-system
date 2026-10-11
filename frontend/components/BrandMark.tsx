import Image from "next/image";
import Link from "next/link";

interface BrandMarkProps {
  /** "light" = white text for dark backgrounds (default). "dark" = navy text for light backgrounds. */
  tone?: "light" | "dark";
  /** Where the logo links to. Defaults to the home page. */
  href?: string;
}

export default function BrandMark({ tone = "light", href = "/" }: BrandMarkProps) {
  return (
    <Link href={href} className="inline-flex items-center gap-3" aria-label="Talaghayan home">
      {/* Eagle mark. File lives in frontend/public/talaghayan-mark.png */}
      <span
        className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full p-1 sm:p-1.5 dark:bg-white transition-colors duration-500 ease-out"
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
          className="block font-display text-sm sm:text-base font-semibold tracking-tight text-navy-900 dark:text-white transition-colors duration-500 ease-out"
        >
          Talaghayan
        </span>
        <span className="hidden sm:block text-xs text-slate-600 dark:text-slate-300 transition-colors duration-500 ease-out">
          Barangay report tracker
        </span>
      </span>
    </Link>
  );
}
