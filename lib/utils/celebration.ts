import confetti from "canvas-confetti";

export function triggerPaymentCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { x: 0.5, y: 0.75 },
    colors: ["#D4522A", "#2A7A4B", "#FEF3C7", "#ffffff"],
    disableForReducedMotion: true,
  });
}
