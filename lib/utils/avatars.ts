const AVATAR_COLORS = [
  { bgValue: "#F5E6DF", textValue: "#D4522A" },
  { bgValue: "#DFF0E8", textValue: "#2A7A4B" },
  { bgValue: "#E0E8F5", textValue: "#2A4A7A" },
  { bgValue: "#F0E0E8", textValue: "#7A2A4A" },
  { bgValue: "#FEF3C7", textValue: "#92400E" },
  { bgValue: "#E8F0E0", textValue: "#2A4A2A" },
];

export function getAvatarColor(index: number): { bgValue: string; textValue: string } {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
