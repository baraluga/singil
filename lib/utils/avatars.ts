const AVATAR_COLORS = [
  { bg: "bg-accent-light", text: "text-accent" },
  { bg: "bg-green-light", text: "text-green" },
  { bg: "bg-[#E0E8F5]", text: "text-[#2A4A7A]" },
  { bg: "bg-[#F0E0E8]", text: "text-[#7A2A4A]" },
  { bg: "bg-[#FEF3C7]", text: "text-[#92400E]" },
  { bg: "bg-[#E8F0E0]", text: "text-[#2A4A2A]" },
];

export function getAvatarColor(index: number): { bg: string; text: string } {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
