import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Edit2, MapPin, Dog, StickyNote, X, Check, MoreVertical, Volume2, VolumeX, Tag, ChevronRight } from 'lucide-react';
import { BarkRecord, NoteTemplate } from '@/types';
import { formatFriendlyDateTime } from '@/utils/date';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TagSelector } from '@/components/TagSelector';
import { NoteTemplateSelector } from '@/components/NoteTemplateSelector';
import { useBarkStore } from '@/store/useBarkStore';
import { getTagColorClasses } from '@/lib/utils';

interface RecordItemProps {
  record: BarkRecord;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<BarkRecord>) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function RecordItem({ record, onDelete, onUpdate, selectable, selected, onSelect }: RecordItemProps) {
  const navigate = useNavigate();
  const dogs = useBarkStore((s) => s.dogs);
  const dogName = record.dogId ? dogs.find((d) => d.id === record.dogId)?.name : undefined;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(record.id, !selected);
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [editLocation, setEditLocation] = useState(record.location || '');
  const [editDogDesc, setEditDogDesc] = useState(record.dogDescription || '');
  const [editNote, setEditNote] = useState(record.note || '');
  const [editTags, setEditTags] = useState<string[]>(record.tags || []);
  const [editAudioRemoved, setEditAudioRemoved] = useState(false);

  useEffect(() => {
    setEditLocation(record.location || '');
    setEditDogDesc(record.dogDescription || '');
    setEditNote(record.note || '');
    setEditTags(record.tags || []);
    setEditAudioRemoved(false);
  }, [record.location, record.dogDescription, record.note, record.tags, record.id]);

  const handleNoteTemplateSelect = (template: NoteTemplate) => {
    if (editNote.trim()) {
      setEditNote(editNote + '\n' + template.value);
    } else {
      setEditNote(template.value);
    }
    if (template.tags && template.tags.length > 0) {
      const newTags = Array.from(new Set([...editTags, ...template.tags]));
      setEditTags(newTags);
    }
  };

  const handleSave = () => {
    const updates: Partial<BarkRecord> = {
      location: editLocation.trim() || undefined,
      dogDescription: editDogDesc.trim() || undefined,
      note: editNote.trim() || undefined,
      tags: editTags.length > 0 ? editTags : undefined,
    };
    if (editAudioRemoved) {
      updates.audioData = undefined;
      updates.audioMimeType = undefined;
      updates.audioDuration = undefined;
    }
    onUpdate(record.id, updates);
    setIsEditing(false);
    setShowActions(false);
    setShowAudioPlayer(false);
  };

  const handleCancel = () => {
    setEditLocation(record.location || '');
    setEditDogDesc(record.dogDescription || '');
    setEditNote(record.note || '');
    setEditTags(record.tags || []);
    setEditAudioRemoved(false);
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowActions(false);
    onDelete(record.id);
  };

  const handleClick = () => {
    if (isEditing) return;
    if (selectable) {
      setShowActions(prev => !prev);
    } else {
      navigate(`/records/${record.id}`);
    }
  };

  const toggleActions = () => {
    if (isEditing) return;
    setShowActions(prev => !prev);
  };

  const hasAudio = !!record.audioData && !editAudioRemoved;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={`bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow ${
        selected ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isEditing && setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <button
            onClick={handleCheckboxClick}
            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              selected
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-gray-300 hover:border-amber-400'
            }`}
            title={selected ? '取消选择' : '选择此记录'}
          >
            {selected && <Check size={12} strokeWidth={3} />}
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock className="text-amber-600" size={18} />
        </div>

        <div className="flex-1 min-w-0" onClick={handleClick}>
          <div className="flex items-center gap-2">
            <div className="font-medium text-gray-800">
              {formatFriendlyDateTime(record.timestamp)}
            </div>
            {dogName && (
              <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full border border-amber-200 flex items-center gap-1">
                <Dog size={10} />
                {dogName}
              </span>
            )}
            {hasAudio && !isEditing && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAudioPlayer(prev => !prev);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  showAudioPlayer
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                }`}
                title={showAudioPlayer ? '收起播放器' : '播放录音'}
              >
                {showAudioPlayer ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </motion.button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isEditing ? (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 space-y-1"
              >
                {record.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{record.location}</span>
                  </div>
                )}
                {record.dogDescription && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Dog size={14} />
                    <span>{record.dogDescription}</span>
                  </div>
                )}
                {record.note && (
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <StickyNote size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{record.note}</span>
                  </div>
                )}
                {record.tags && record.tags.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Tag size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {record.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-xs rounded-full border ${getTagColorClasses(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {hasAudio && !showAudioPlayer && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <Volume2 size={14} />
                    <span>录音 {(record.audioDuration || 0)}s · 点击图标播放</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="edit"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="位置（如：3号楼东侧）"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="text"
                  placeholder="狗只特征（如：黄色金毛）"
                  value={editDogDesc}
                  onChange={(e) => setEditDogDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <NoteTemplateSelector
                  onSelect={handleNoteTemplateSelect}
                  compact
                />
                <textarea
                  placeholder="其他备注"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <div className="pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Tag size={12} />
                    标签
                  </div>
                  <TagSelector
                    selectedTags={editTags}
                    onChange={setEditTags}
                    placeholder="输入自定义标签..."
                    compact
                  />
                </div>
                {hasAudio && (
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <Volume2 size={16} />
                      <span>已绑定录音 ({(record.audioDuration || 0)}s)</span>
                    </div>
                    <button
                      onClick={() => setEditAudioRemoved(true)}
                      className="text-xs px-3 py-1 bg-white text-coral-600 rounded-md hover:bg-coral-50 transition-colors border border-coral-200"
                    >
                      移除录音
                    </button>
                  </div>
                )}
                {editAudioRemoved && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <VolumeX size={16} />
                      <span>录音将在保存时被移除</span>
                    </div>
                    <button
                      onClick={() => setEditAudioRemoved(false)}
                      className="text-xs px-3 py-1 bg-white text-amber-600 rounded-md hover:bg-amber-50 transition-colors border border-amber-200"
                    >
                      撤销移除
                    </button>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-3 py-1.5 text-sm bg-amber-500 text-white hover:bg-amber-600 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Check size={14} />
                    保存
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAudioPlayer && hasAudio && !isEditing && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <AudioPlayer
                  audioData={record.audioData!}
                  audioMimeType={record.audioMimeType}
                  duration={record.audioDuration}
                  compact={false}
                  onClose={() => setShowAudioPlayer(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 sm:hidden">
          {!selectable && !isEditing && (
            <ChevronRight size={18} className="text-gray-300" />
          )}
          {selectable && (
            <button
              onClick={toggleActions}
              className="p-2 text-gray-400 hover:text-amber-600 active:bg-amber-50 rounded-lg transition-colors"
              title="更多操作"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1">
          <AnimatePresence>
            {showActions && !isEditing && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1"
              >
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="编辑"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
                  title="删除"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
          {!selectable && !isEditing && !showActions && (
            <ChevronRight size={18} className="text-gray-300" />
          )}
          {isEditing && (
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <AnimatePresence>
          {showActions && !isEditing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4 z-50 flex gap-3"
            >
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowActions(false);
                }}
                className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Edit2 size={18} />
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-3 px-4 bg-coral-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                删除
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showActions && !isEditing && (
        <div
          className="sm:hidden fixed inset-0 bg-black/20 z-40"
          onClick={() => setShowActions(false)}
        />
      )}
    </motion.div>
  );
}
