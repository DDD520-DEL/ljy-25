import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TAG_COLOR_MAP: Record<string, string> = {
  '快递': 'bg-blue-100 text-blue-800 border-blue-200',
  '装修': 'bg-orange-100 text-orange-800 border-orange-200',
  '遛狗路过': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  '夜间吠叫': 'bg-violet-100 text-violet-800 border-violet-200',
  '陌生人': 'bg-rose-100 text-rose-800 border-rose-200',
  '其他狗': 'bg-pink-100 text-pink-800 border-pink-200',
};

const FALLBACK_COLORS = [
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
  'bg-lime-100 text-lime-800 border-lime-200',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  'bg-sky-100 text-sky-800 border-sky-200',
  'bg-teal-100 text-teal-800 border-teal-200',
  'bg-rose-100 text-rose-800 border-rose-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
];

export function getTagColorClasses(tag: string): string {
  if (TAG_COLOR_MAP[tag]) {
    return TAG_COLOR_MAP[tag];
  }
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}
