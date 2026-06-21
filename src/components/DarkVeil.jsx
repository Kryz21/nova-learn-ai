// src/components/Darkveil.jsx
//
// Animated background — loops a video clip behind the rest of the app.
// Place the source file at public/dark-veil.mp4 (served at "/dark-veil.mp4").

export default function DarkVeil({ src = '/dark-veil.mp4', opacity = 1 }) {
  return (
    <video
      className="fixed inset-0 w-full h-full object-cover -z-20 pointer-events-none select-none"
      style={{ opacity }}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      src={src}
      aria-hidden="true"
    />
  )
}
