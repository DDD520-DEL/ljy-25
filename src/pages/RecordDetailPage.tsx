import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Dog,
  StickyNote,
  Tag,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  Timer,
  Volume2,
  X,
  Check,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useBarkStore } from '@/store/useBarkStore';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TagSelector } from '@/components/TagSelector';
import { getTagColorClasses } from '@/lib/utils';
import { BarkRecord } from '@/types';

export function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const records = useBarkStore((s) => s.records);
  const dogs = useBarkStore((s) => s.dogs);
  const deleteRecord = useBarkStore((s) => s.deleteRecord);
  const updateRecord = useBarkStore((s) => s.updateRecord);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [editDogDesc, setEditDogDesc] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);

  const record = useMemo(() => records.find((r) => r.id === id), [records, id]);
  const dogName = record?.dogId ? dogs.find((d) => d.id === record.dogId)?.name : undefined;

  const handleBack = () => {
    navigate('/records');
  };

  const handleEdit = () => {
    if (!record) return;
    setEditLocation(record.location || '');
    setEditDogDesc(record.dogDescription || '');
    setEditNote(record.note || '');
    setEditTags(record.tags || []);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!record) return;
    const updates: Partial<BarkRecord> = {
      location: editLocation.trim() || undefined,
      dogDescription: editDogDesc.trim() || undefined,
      note: editNote.trim() || undefined,
      tags: editTags.length > 0 ? editTags : undefined,
    };
    updateRecord(record.id, updates);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!record) return;
    deleteRecord(record.id);
    navigate('/records');
  };

  const formatFullDateTime = (timestamp: number) => {
    return format(timestamp, 'yyyy年M月d日 EEEE HH:mm', { locale: zhCN });
  };

  const formatTimeOfDay = (timestamp: number) => {
    const hour = new Date(timestamp).getHours();
    if (hour >= 0 && hour < 6) return '深夜';
    if (hour >= 6 && hour < 9) return '清晨';
    if (hour >= 9 && hour < 12) return '上午';
    if (hour >= 12 && hour < 14) return '中午';
    if (hour >= 14 && hour < 18) return '下午';
    if (hour >= 18 && hour < 22) return '晚间';
    return '深夜';
  };

  if (!record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 pb-24">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-2xl font-bold text-amber-800">记录详情</h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white/50 rounded-2xl"
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-amber-700 font-medium">找不到该记录</p>
            <p className="text-amber-500 text-sm mt-2">记录可能已被删除</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display text-2xl font-bold text-amber-800">记录详情</h1>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleEdit}
                className="p-2 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                title="编辑"
              >
                <Edit2 size={20} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
                title="删除"
              >
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <div className="text-white/80 text-sm">{formatTimeOfDay(record.timestamp)}</div>
                  <div className="text-white font-bold text-lg">
                    {formatFullDateTime(record.timestamp)}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">日期</div>
                  <div className="text-gray-800">
                    {format(record.timestamp, 'yyyy年M月d日', { locale: zhCN })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Timer size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-400 mb-1">时间</div>
                  <div className="text-gray-800">
                    {format(record.timestamp, 'HH:mm', { locale: zhCN })}
                    {record.duration && (
                      <span className="text-amber-600 text-sm ml-2">
                        · 持续 {record.duration} 秒
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-amber-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">地点</div>
                    <input
                      type="text"
                      placeholder="输入位置（如：3号楼东侧）"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              ) : (
                record.location && (
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400 mb-1">地点</div>
                      <div className="text-gray-800">{record.location}</div>
                    </div>
                  </div>
                )
              )}

              {dogName && (
                <div className="flex items-start gap-3">
                  <Dog size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-gray-400 mb-1">关联狗狗</div>
                    <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      <Dog size={14} />
                      {dogName}
                    </div>
                  </div>
                </div>
              )}

              {isEditing ? (
                <div className="flex items-start gap-3">
                  <Dog size={18} className="text-amber-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-xs text-gray-400 mb-1">狗只特征</div>
                    <input
                      type="text"
                      placeholder="输入狗只特征（如：黄色金毛）"
                      value={editDogDesc}
                      onChange={(e) => setEditDogDesc(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              ) : (
                record.dogDescription && (
                  <div className="flex items-start gap-3">
                    <Dog size={18} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-gray-400 mb-1">狗只特征</div>
                      <div className="text-gray-800">{record.dogDescription}</div>
                    </div>
                  </div>
                )
              )}
            </div>
          </motion.div>

          {record.audioData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-soft p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Volume2 size={18} className="text-amber-500" />
                <span className="font-medium text-gray-800">录音回放</span>
                {record.audioDuration && (
                  <span className="text-xs text-gray-400">({record.audioDuration} 秒)</span>
                )}
              </div>
              <AudioPlayer
                audioData={record.audioData}
                audioMimeType={record.audioMimeType}
                duration={record.audioDuration}
                compact={false}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-soft p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag size={18} className="text-amber-500" />
              <span className="font-medium text-gray-800">标签</span>
            </div>
            {isEditing ? (
              <TagSelector
                selectedTags={editTags}
                onChange={setEditTags}
                placeholder="输入自定义标签..."
              />
            ) : record.tags && record.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-3 py-1.5 text-sm rounded-full border ${getTagColorClasses(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">暂无标签</div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-soft p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <StickyNote size={18} className="text-amber-500" />
              <span className="font-medium text-gray-800">备注</span>
            </div>
            {isEditing ? (
              <textarea
                placeholder="输入备注信息..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
            ) : record.note ? (
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record.note}
              </div>
            ) : (
              <div className="text-gray-400 text-sm">暂无备注</div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/50 rounded-2xl p-4 text-center"
          >
            <div className="text-xs text-gray-400">
              创建于 {format(record.createdAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
              {record.updatedAt !== record.createdAt && (
                <>
                  <span className="mx-2">·</span>
                  更新于 {format(record.updatedAt, 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </>
              )}
            </div>
          </motion.div>
        </div>

        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-amber-100 p-4 z-50 flex gap-3"
          >
            <button
              onClick={handleCancel}
              className="flex-1 py-3 px-4 border border-gray-200 text-gray-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <X size={18} />
              取消
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors"
            >
              <Check size={18} />
              保存
            </button>
          </motion.div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center">
                <AlertTriangle className="text-coral-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">确认删除</h3>
                <p className="text-sm text-gray-500">此操作不可恢复</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              确定要删除这条记录吗？删除后将无法恢复。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 bg-coral-500 text-white rounded-xl hover:bg-coral-600 transition-colors"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
