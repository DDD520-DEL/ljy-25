import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { PRESET_NOTE_TEMPLATES, NoteTemplate } from '@/types';
import { getTagColorClasses } from '@/lib/utils';

interface NoteTemplateSelectorProps {
  onSelect: (template: NoteTemplate) => void;
  compact?: boolean;
}

export function NoteTemplateSelector({ onSelect, compact = false }: NoteTemplateSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const handleSelect = (template: NoteTemplate) => {
    onSelect(template);
    setJustSelected(template.label);
    setTimeout(() => setJustSelected(null), 800);
  };

  if (compact) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <StickyNote size={14} />
            快捷备注模板
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_NOTE_TEMPLATES.map((template) => (
                  <button
                    key={template.label}
                    onClick={() => handleSelect(template)}
                    className={`relative px-2.5 py-1.5 text-xs rounded-full border transition-all hover:scale-105 active:scale-95 ${
                      justSelected === template.label
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50'
                    }`}
                    title={template.value}
                  >
                    <span className="mr-1">{template.emoji}</span>
                    {template.label}
                    {justSelected === template.label && (
                      <Check size={12} className="inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <StickyNote size={14} className="text-amber-600" />
          快捷备注模板
          <span className="text-xs text-gray-400 font-normal">点击即可填入</span>
        </div>
        <button
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1"
        >
          {isExpanded ? (
            <>
              收起 <ChevronUp size={14} />
            </>
          ) : (
            <>
              展开全部 <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      <div className={`grid gap-2 ${isExpanded ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {(isExpanded ? PRESET_NOTE_TEMPLATES : PRESET_NOTE_TEMPLATES.slice(0, 6)).map((template) => (
          <motion.button
            key={template.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelect(template)}
            className={`relative p-3 text-left rounded-xl border transition-all ${
              justSelected === template.label
                ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg flex-shrink-0">{template.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-1">
                  {template.label}
                  {justSelected === template.label && (
                    <Check size={14} className="inline" />
                  )}
                </div>
                <div
                  className={`text-xs mt-0.5 line-clamp-2 ${
                    justSelected === template.label ? 'text-white/80' : 'text-gray-500'
                  }`}
                >
                  {template.value}
                </div>
                {template.tags && template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-1.5 py-0.5 text-[10px] rounded-full border ${
                          justSelected === template.label
                            ? 'bg-white/20 text-white border-white/30'
                            : getTagColorClasses(tag)
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
