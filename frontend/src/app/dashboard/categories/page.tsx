'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Category } from '@/types';
import Swal from 'sweetalert2';
import { 
  FolderTree, 
  Plus, 
  Edit3, 
  Trash2, 
  X,
  Check
} from 'lucide-react';

export default function DashboardCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [formName, setFormName] = useState('');
  const [formSortOrder, setFormSortOrder] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const fetchCategories = async () => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    try {
      const data = await api.getCategories(token);
      setCategories(data);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل الأقسام',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormSortOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSortOrder(cat.sortOrder);
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    if (!formName.trim()) {
      Swal.fire({ icon: 'warning', text: 'يرجى إدخال اسم القسم' });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        sortOrder: Number(formSortOrder) || 0,
        isActive: true,
      };

      if (editingCategory) {
        await api.updateCategory(token, editingCategory.id, payload);
        Swal.fire({ icon: 'success', title: 'تم تعديل القسم بنجاح', timer: 1200, showConfirmButton: false });
      } else {
        await api.createCategory(token, payload);
        Swal.fire({ icon: 'success', title: 'تم إنشاء القسم بنجاح', timer: 1200, showConfirmButton: false });
      }

      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'حدث خطأ أثناء الحفظ' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    const token = localStorage.getItem('watsstore_token');
    if (!token) return;

    const confirm = await Swal.fire({
      title: 'هل تريد حذف هذا القسم؟',
      text: `سيتم حذف قسم "${cat.name}". لن يتم حذف المنتجات التابعة له بل ستصبح بدون قسم.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'نعم، احذف',
      cancelButtonText: 'إلغاء',
      confirmButtonColor: '#e11d48',
    });

    if (confirm.isConfirmed) {
      try {
        await api.deleteCategory(token, cat.id);
        Swal.fire({ icon: 'success', title: 'تم الحذف بنجاح', timer: 1200, showConfirmButton: false });
        fetchCategories();
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'خطأ', text: err.message || 'فشل في حذف القسم' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">إدارة أقسام المتجر</h1>
          <p className="text-xs text-slate-500 mt-1">
            قسم منتجاتك إلى مجموعات واضحة (مثلاً: فساتين، عبايات، إكسسوارات) لتسهيل تصفح المتجر على العميل.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>إضافة قسم جديد</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto my-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FolderTree className="w-8 h-8 stroke-1" />
          </div>
          <h3 className="text-base font-bold text-slate-800">لا توجد أقسام مسجلة</h3>
          <p className="text-xs text-slate-500">
            أضف قسماً لترتيب المنتجات داخل الكتالوج وعرض تبويبات التصفية.
          </p>
          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
          >
            إضافة أول قسم
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-4 px-4">اسم القسم</th>
                <th className="py-4 px-4">ترتيب الظهور</th>
                <th className="py-4 px-4">عدد المنتجات</th>
                <th className="py-4 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                    {cat.name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    #{cat.sortOrder}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md text-[11px]">
                      {cat.productCount || 0} منتج
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        aria-label="تعديل"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        aria-label="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingCategory ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم القسم *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: عبايات كاجوال"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ترتيب الظهور في القائمة</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'جاري الحفظ...' : 'حفظ القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
