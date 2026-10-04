interface LiveProjectButtonProps {
  className?: string;
  href?: string;
}

export default function LiveProjectButton({ className, href = 'https://csi-sfit-26-27.vercel.app/mosaic' }: LiveProjectButtonProps) {
  return (
    <a
      href={href}
      rel="noreferrer"
      className={`rounded-full border-2 border-[#D7E2EA] px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base font-medium uppercase tracking-widest text-[#D7E2EA] transition-colors duration-200 hover:bg-[#D7E2EA]/10 ${
        className ?? ''
      }`}
    >
      Visit Website
    </a>
  );
}
