import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type TagColorVariant = 'light' | 'solid';

interface TagColorSet {
  light: string;
  solid: string;
}

const PRESET_TAG_COLORS: Record<string, TagColorSet> = {
  '快递': {
    light: 'bg-blue-100 text-blue-800 border-blue-200',
    solid: 'bg-blue-500 text-white border-blue-500',
  },
  '装修': {
    light: 'bg-orange-100 text-orange-800 border-orange-200',
    solid: 'bg-orange-500 text-white border-orange-500',
  },
  '遛狗路过': {
    light: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    solid: 'bg-emerald-500 text-white border-emerald-500',
  },
  '夜间吠叫': {
    light: 'bg-violet-100 text-violet-800 border-violet-200',
    solid: 'bg-violet-500 text-white border-violet-500',
  },
  '陌生人': {
    light: 'bg-rose-100 text-rose-800 border-rose-200',
    solid: 'bg-rose-500 text-white border-rose-500',
  },
  '其他狗': {
    light: 'bg-pink-100 text-pink-800 border-pink-200',
    solid: 'bg-pink-500 text-white border-pink-500',
  },
};

const FALLBACK_COLOR_SETS: TagColorSet[] = [
  {
    light: 'bg-amber-100 text-amber-800 border-amber-200',
    solid: 'bg-amber-500 text-white border-amber-500',
  },
  {
    light: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    solid: 'bg-cyan-500 text-white border-cyan-500',
  },
  {
    light: 'bg-lime-100 text-lime-800 border-lime-200',
    solid: 'bg-lime-500 text-white border-lime-500',
  },
  {
    light: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    solid: 'bg-fuchsia-500 text-white border-fuchsia-500',
  },
  {
    light: 'bg-sky-100 text-sky-800 border-sky-200',
    solid: 'bg-sky-500 text-white border-sky-500',
  },
  {
    light: 'bg-teal-100 text-teal-800 border-teal-200',
    solid: 'bg-teal-500 text-white border-teal-500',
  },
  {
    light: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    solid: 'bg-indigo-500 text-white border-indigo-500',
  },
  {
    light: 'bg-rose-100 text-rose-800 border-rose-200',
    solid: 'bg-rose-500 text-white border-rose-500',
  },
];

function getFallbackColorIndex(tag: string): number {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % FALLBACK_COLOR_SETS.length;
}

export function getTagColorClasses(tag: string, variant: TagColorVariant = 'light'): string {
  const preset = PRESET_TAG_COLORS[tag];
  if (preset) {
    return preset[variant];
  }
  const index = getFallbackColorIndex(tag);
  return FALLBACK_COLOR_SETS[index][variant];
}
