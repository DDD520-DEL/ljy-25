import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Tag } from 'lucide-react';
import { PRESET_TAGS } from '@/types';

interface TagSelectorProps {
  selectedTags: string[];
  availableTags?: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  compact?: boolean;
}

const TAG_COLORS = [
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-coral-100 text-coral-800 border-coral-200',
  'bg-mint-100 text-mint-800 border-mint-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-indigo-100 text-indigo-800 border-indigo-200',
  'bg-green-100 text-green-800 border-green-200',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function TagSelector({
  selectedTags,
  availableTags,
  onChange,
  placeholder = '添加标签...',
  compact = false,
}: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('');
  const [showInput, setShowInput] = useState(false);

  const allPresetTags = availableTags && availableTags.length > 0
    ? Array.from(new Set([...availableTags, ...PRESET_TAGS])).sort()
    : [...PRESET_TAGS];

  const unselectedPresetTags = allPresetTags.filter(
    (tag) => !selectedTags.includes(tag)
  );

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    onChange([...selectedTags, trimmed]);
    setCustomTag('');
    setShowInput(false);
  };

  const handleRemoveTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(customTag);
    } else if (e.key === 'Escape') {
      setCustomTag('');
      setShowInput(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.length === 0 ? (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
          >
            <Tag size={12} />
            无标签
          </button>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${getTagColor(tag)}`}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:opacity-70 transition-opacity"
              >
                <X size={10} />
              </button>
            </span>
          ))
        )}

        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (customTag.trim()) {
                    handleAddTag(customTag);
                  } else {
                    setShowInput(false);
                  }
                }}
                placeholder="新标签"
                className="w-24 px-2 py-0.5 text-xs border border-amber-300 rounded-full focus:outline-none focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
            </motion.div>
          )}
        </AnimatePresence>

        {!showInput && selectedTags.length > 0 && (
          <button
            onClick={() => setShowInput(true)}
            className="inline-flex items-center justify-center w-5 h-5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
            title="添加标签"
          >
            <Plus size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <motion.span
            key={tag}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border ${getTagColor(tag)}`}
          >
            <Tag size={12} />
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="hover:opacity-70 transition-opacity ml-1"
            >
              <X size={14} />
            </button>
          </motion.span>
        ))}
      </div>

      {unselectedPresetTags.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 mb-2">快捷标签</div>
          <div className="flex flex-wrap gap-2">
            {unselectedPresetTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className={`px-3 py-1.5 text-sm rounded-full border border-dashed border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50 transition-colors`}
              >
                <span className="opacity-50">+</span> {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs text-gray-500 mb-2">自定义标签</div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={() => handleAddTag(customTag)}
            disabled={!customTag.trim()}
            className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Plus size={16} />
            添加
          </button>
        </div>
      </div>
    </div>
  );
}
