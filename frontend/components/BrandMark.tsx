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
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-2xl px-2.5 py-1.5 -mx-2.5 transition-all hover:bg-white/50 dark:hover:bg-white/5"
      aria-label="Talaghayan home"
    >
      {/* Eagle mark. File lives in frontend/public/talaghayan-mark.png */}
      <span
        className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full p-1 sm:p-1.5 dark:bg-white transition-transform duration-300 group-hover:scale-105 shadow-sm"
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
        <span className="block font-display text-sm sm:text-base font-semibold tracking-tight text-navy-900 dark:text-white transition-colors duration-300 group-hover:text-[#0039A6] dark:group-hover:text-[#93C5FD]">
          Talaghayan
        </span>
        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
          E-Sub LGRRC
        </span>
      </span>
    </Link>
  );
}
