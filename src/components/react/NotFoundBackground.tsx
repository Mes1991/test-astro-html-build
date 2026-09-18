import { useEffect, useState } from "react"
import { GradFlow } from "gradflow"

// Neutral animated WebGL gradient — fills the 404 hero.
// Renders as a React island via `client:idle` so it can't compete with LCP.

const COLORS = {
  color1: { r: 226, g: 232, b: 240 },
  color2: { r: 241, g: 245, b: 249 },
  color3: { r: 100, g: 116, b: 139 },
} as const

const rgb = ({ r, g, b }: { r: number; g: number; b: number }) => `rgb(${r} ${g} ${b})`

/** A still gradient in the same palette. Shown whenever motion is not allowed. */
function StaticGradient() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(135deg, ${rgb(COLORS.color1)} 0%, ${rgb(
          COLORS.color2,
        )} 45%, ${rgb(COLORS.color3)} 100%)`,
      }}
    />
  )
}

export default function NotFoundBackground() {
  // Default to the still gradient. Animation is opt-in and only switches on after
  // the media query has been read and reports that reduced motion was NOT requested.
  // That keeps the component motion-safe during SSR, before hydration, and in any
  // environment where `matchMedia` is unavailable or throws.
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return

    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setAnimate(!query.matches)

    sync()
    query.addEventListener("change", sync)
    return () => query.removeEventListener("change", sync)
  }, [])

  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
      {animate ? (
        <GradFlow
          config={{
            ...COLORS,
            speed: 1,
            scale: 1,
            type: "stripe",
            noise: 0,
          }}
        />
      ) : (
        <StaticGradient />
      )}
    </div>
  )
}
