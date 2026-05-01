import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 sm:gap-3 ${className}`}
      aria-label="Digital Wealth Partners"
    >
      <Image
        src="/dwp-logo.jpeg"
        alt="Digital Wealth Partners"
        width={739}
        height={415}
        priority
        className="h-10 w-auto rounded-md sm:h-12"
      />
      <span className="font-display text-sm font-semibold leading-tight tracking-tight text-white sm:text-base">
        Digital Wealth <span className="text-gold">Partners</span>
      </span>
    </Link>
  );
}
