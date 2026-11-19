import { ASSETS } from "../data/site";

interface DeccanLogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES: Record<"sm" | "md" | "lg", string> = {
  sm: "w-[142px] sm:w-[164px] md:w-[192px] h-auto",
  md: "w-[180px] sm:w-[205px] h-auto",
  lg: "w-[230px] sm:w-[280px] md:w-[320px] h-auto",
};

export function DeccanLogo({
  variant = "light",
  size = "sm",
  className = "",
}: DeccanLogoProps) {
  const src = variant === "light" ? ASSETS.brandLogoDarkBg : ASSETS.brandLogo;

  return (
    <img
      src={src}
      alt="Deccan Spice Indian Kitchen + Bar"
      width={960}
      height={240}
      decoding="async"
      className={`block object-contain select-none shrink-0 ${SIZE_CLASSES[size]} ${className}`}
    />
  );
}
