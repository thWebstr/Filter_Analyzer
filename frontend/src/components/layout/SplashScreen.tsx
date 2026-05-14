import { useEffect, useState } from "react";
import { Logo } from "./Logo";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"drawing" | "showing" | "fading">(
    "drawing"
  );

  useEffect(() => {
    // After logo draws (800ms) + small pause → show tagline
    const t1 = setTimeout(() => setPhase("showing"), 900);
    // After tagline shows → start fade out
    const t2 = setTimeout(() => setPhase("fading"), 1600);
    // After fade → unmount
    const t3 = setTimeout(() => onComplete(), 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className={`splash ${phase === "fading" ? "fade-out" : ""}`}>
      <Logo animate={true} size="lg" />

      <p
        className={`splash__tagline ${phase === "showing" || phase === "fading" ? "is-visible" : ""}`}
      >
        Analog &amp; Digital Filter Design
      </p>
    </div>
  );
}