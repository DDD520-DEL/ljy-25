import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, Edit2, MapPin, Dog, StickyNote, X, Check, MoreVertical } from 'lucide-react';
import { BarkRecord } from '@/types';
import { formatFriendlyDateTime } from '@/utils/date';

interface RecordItemProps {
  record: BarkRecord;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<BarkRecord>) => void;
}

export function RecordItem({ record, onDelete, onUpdate }: RecordItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editLocation, setEditLocation] = useState(record.location || '');
  const [editDogDesc, setEditDogDesc] = useState(record.dogDescription || '');
  const [editNote, setEditNote] = useState(record.note || '');

  useEffect(() => {
    setEditLocation(record.location || '');
    setEditDogDesc(record.dogDescription || '');
    setEditNote(record.note || '');
  }, [record.location, record.dogDescription, record.note]);

  const handleSave = () => {
    onUpdate(record.id, {
      location: editLocation.trim() || undefined,
      dogDescription: editDogDesc.trim() || undefined,
      note: editNote.trim() || undefined,
    });
    setIsEditing(false);
    setShowActions(false);
  };

  const handleCancel = () => {
    setEditLocation(record.location || '');
    setEditDogDesc(record.dogDescription || '');
    setEditNote(record.note || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowActions(false);
    onDelete(record.id);
  };

  const toggleActions = () => {
    if (isEditing) return;
    setShowActions(prev => !prev);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => !isEditing && setShowActions(false)}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <Clock className="text-amber-600" size={18} />
        </div>

        <div className="flex-1 min-w-0" onClick={toggleActions}>
          <div className="font-medium text-gray-800">
            {formatFriendlyDateTime(record.timestamp)}
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
                <textarea
                  placeholder="其他备注"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
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
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 sm:hidden">
          <button
            onClick={toggleActions}
            className="p-2 text-gray-400 hover:text-amber-600 active:bg-amber-50 rounded-lg transition-colors"
            title="更多操作"
          >
            <MoreVertical size={16} />
          </button>
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
