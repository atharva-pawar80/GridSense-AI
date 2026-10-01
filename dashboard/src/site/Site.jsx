import { useEffect } from "react";
import Bento from "./Bento";
import Closing from "./Closing";
import Hero from "./Hero";
import Integrity, { LimitsAndStack } from "./Integrity";
import Nav from "./Nav";
import Pipeline from "./Pipeline";

/** Writes the cursor position into CSS custom properties for the spotlight layer. */
function useCursorSpotlight() {
  useEffect(() => {
    let frame = 0;
    const handleMove = (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const root = document.documentElement;
        root.style.setProperty("--mx", `${event.clientX}px`);
        root.style.setProperty("--my", `${event.clientY}px`);
      });
    };
    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

function Rule() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
      <div className="hairline" />
    </div>
  );
}

export default function Site() {
  useCursorSpotlight();

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-950">
      {/* ambience */}
      <div aria-hidden className="ambient-layer" />
      <div aria-hidden className="grid-layer-baseline" />
      <div aria-hidden className="grid-layer" />
      <div aria-hidden className="spotlight-layer" />
      <div aria-hidden className="noise-layer" />

      <Nav />

      <main className="relative z-10">
        <Hero />
        <Rule />
        <Bento />
        <Rule />
        <Pipeline />
        <Rule />
        <Integrity />
        <LimitsAndStack />
        <Closing />
      </main>
    </div>
  );
}
