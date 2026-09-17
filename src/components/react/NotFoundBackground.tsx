import { GradFlow } from "gradflow"

// Neutral animated WebGL gradient — fills the 404 hero.
// Renders as a React island via `client:idle` so it can't compete with LCP.
export default function NotFoundBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 z-0 overflow-hidden">
      <GradFlow
        config={{
          color1: { r: 226, g: 232, b: 240 },
          color2: { r: 241, g: 245, b: 249 },
          color3: { r: 100, g: 116, b: 139 },
          speed: 1,
          scale: 1,
          type: "stripe",
          noise: 0,
        }}
      />
    </div>
  )
}
