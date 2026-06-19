import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Dog, X, Check } from 'lucide-react';
import { useBarkStore } from '@/store/useBarkStore';
import { DogProfile } from '@/types';

export function DogProfileManager() {
  const dogs = useBarkStore((s) => s.dogs);
  const addDog = useBarkStore((s) => s.addDog);
  const updateDog = useBarkStore((s) => s.updateDog);
  const deleteDog = useBarkStore((s) => s.deleteDog);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName('');
    setFormBreed('');
    setFormAge('');
    setFormDesc('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (dog: DogProfile) => {
    setFormName(dog.name);
    setFormBreed(dog.breed);
    setFormAge(dog.age);
    setFormDesc(dog.description);
    setEditingId(dog.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) return;
    if (editingId) {
      updateDog(editingId, {
        name: formName.trim(),
        breed: formBreed.trim(),
        age: formAge.trim(),
        description: formDesc.trim(),
      });
    } else {
      addDog({
        name: formName.trim(),
        breed: formBreed.trim(),
        age: formAge.trim(),
        description: formDesc.trim(),
      });
    }
    resetForm();
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Dog className="text-amber-600" size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-display font-bold text-gray-800">狗狗档案</h2>
          <p className="text-xs text-gray-500">
            {dogs.length > 0 ? `已创建 ${dogs.length} 只狗狗档案` : '创建狗狗档案，记录时选择是哪只狗'}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium"
          >
            <Plus size={18} />
            添加
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-amber-50 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  名字 <span className="text-coral-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="狗狗的名字"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">品种</label>
                  <input
                    type="text"
                    placeholder="如：金毛"
                    value={formBreed}
                    onChange={(e) => setFormBreed(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年龄</label>
                  <input
                    type="text"
                    placeholder="如：3岁"
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">一句话描述</label>
                <input
                  type="text"
                  placeholder="描述这只狗狗的特点"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formName.trim()}
                  className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Check size={16} />
                  {editingId ? '保存修改' : '添加狗狗'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4">
        {dogs.length === 0 && !showForm && (
          <div className="text-center py-6 text-gray-400">
            <Dog size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">还没有创建狗狗档案</p>
            <p className="text-xs mt-1">点击上方「添加」按钮创建</p>
          </div>
        )}

        <div className="space-y-3">
          {dogs.map((dog) => (
            <motion.div
              key={dog.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Dog className="text-amber-600" size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-gray-800">{dog.name}</div>
                <div className="text-xs text-gray-500 truncate">
                  {[dog.breed, dog.age].filter(Boolean).join(' · ')}
                  {dog.description && ` — ${dog.description}`}
                </div>
              </div>

              {deleteConfirmId === dog.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      deleteDog(dog.id);
                      setDeleteConfirmId(null);
                    }}
                    className="px-2 py-1 text-xs bg-coral-500 text-white rounded-md hover:bg-coral-600 transition-colors"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(dog)}
                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(dog.id)}
                    className="p-2 text-gray-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
