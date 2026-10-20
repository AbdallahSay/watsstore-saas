'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MerchantReview, MerchantReviewsResponse } from '@/types';
import { appSwal } from '@/lib/sweetalert';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Star, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  User, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  X
} from 'lucide-react';

export default function DashboardReviewsPage() {
  const { t, language, dir } = useLanguage();
  const [reviewsData, setReviewsData] = useState<MerchantReviewsResponse>({
    totalCount: 0,
    approvedCount: 0,
    pendingCount: 0,
    averageRating: 5.0,
    reviews: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    const token = (localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token'));
    if (!token) return;

    try {
      const data = await api.getMerchantReviews(token);
      setReviewsData(data);
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تحميل التقييمات',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (review: MerchantReview) => {
    const token = (localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token'));
    if (!token) return;

    const newStatus = !review.isApproved;
    setActionLoadingId(review.id);

    try {
      await api.toggleReviewApproval(token, review.id, newStatus);
      
      // Optimistic state update
      setReviewsData(prev => {
        const updatedReviews = prev.reviews.map(r => 
          r.id === review.id ? { ...r, isApproved: newStatus } : r
        );
        const approvedCount = updatedReviews.filter(r => r.isApproved).length;
        const pendingCount = updatedReviews.length - approvedCount;
        const averageRating = approvedCount > 0 
          ? Math.round(updatedReviews.filter(r => r.isApproved).reduce((acc, r) => acc + r.rating, 0) / approvedCount * 10) / 10
          : 5.0;

        return {
          ...prev,
          approvedCount,
          pendingCount,
          averageRating,
          reviews: updatedReviews
        };
      });

      appSwal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        icon: 'success',
        title: newStatus ? 'تم اعتماد ونشر التقييم بنجاح' : 'تم إخفاء التقييم ونقله للمراجعة',
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في تعديل حالة التقييم',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteReview = async (review: MerchantReview) => {
    const token = (localStorage.getItem('watsstore_merchant_token') || localStorage.getItem('watsstore_token'));
    if (!token) return;

    const result = await appSwal.fire({
      title: 'هل أنت متأكد من الحذف؟',
      text: `سيتم حذف تقييم العميل "${review.customerName}" نهائياً ولا يمكن التراجع.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'نعم، احذف التقييم',
      cancelButtonText: 'إلغاء',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setActionLoadingId(review.id);

    try {
      await api.deleteReview(token, review.id);

      setReviewsData(prev => {
        const updatedReviews = prev.reviews.filter(r => r.id !== review.id);
        const approvedCount = updatedReviews.filter(r => r.isApproved).length;
        const pendingCount = updatedReviews.length - approvedCount;
        const averageRating = approvedCount > 0 
          ? Math.round(updatedReviews.filter(r => r.isApproved).reduce((acc, r) => acc + r.rating, 0) / approvedCount * 10) / 10
          : 5.0;

        return {
          totalCount: updatedReviews.length,
          approvedCount,
          pendingCount,
          averageRating,
          reviews: updatedReviews
        };
      });

      appSwal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        icon: 'success',
        title: 'تم حذف التقييم بنجاح',
      });
    } catch (err: any) {
      appSwal.fire({
        icon: 'error',
        title: 'خطأ',
        text: err.message || 'فشل في حذف التقييم',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredReviews = reviewsData.reviews.filter(review => {
    if (activeTab === 'approved' && !review.isApproved) return false;
    if (activeTab === 'pending' && review.isApproved) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchName = review.customerName.toLowerCase().includes(q);
      const matchComment = review.comment.toLowerCase().includes(q);
      return matchName || matchComment;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900">آراء العملاء وتجارب الشراء</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              بناء الثقة ⭐
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            إدارة وتقييمات المشترين. راجع التقييمات الواردة واعتمدها لتظهر مباشرة في متجرك لزيادة المبيعات والمصداقية.
          </p>
        </div>

        <button
          onClick={() => { setIsLoading(true); fetchReviews(); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold transition-all shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث التقييمات</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rating Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">متوسط التقييم العام</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-500">{reviewsData.averageRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-semibold">/ 5.0</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(reviewsData.averageRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
            <Star className="w-6 h-6 fill-amber-400" />
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">إجمالي التقييمات</span>
            <span className="text-3xl font-black text-slate-900 block mt-1">{reviewsData.totalCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">كل الآراء المسجلة</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Approved Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">المعتمدة والمنشورة</span>
            <span className="text-3xl font-black text-emerald-600 block mt-1">{reviewsData.approvedCount}</span>
            <span className="text-[11px] text-emerald-700 font-medium">تظهر للمشترين بالمتجر</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block">في انتظار المراجعة</span>
            <span className="text-3xl font-black text-amber-600 block mt-1">{reviewsData.pendingCount}</span>
            <span className="text-[11px] text-amber-700 font-medium">تحتاج موافقتك للعرض</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({reviewsData.totalCount})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'pending'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>قيد المراجعة</span>
            {reviewsData.pendingCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-black">
                {reviewsData.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'approved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>المعتمدة ({reviewsData.approvedCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل أو كلمات من التقييم..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <span className="text-sm font-bold text-slate-600">جاري تحميل آراء المشترين...</span>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            {searchQuery ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد تقييمات في هذا التبويب'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {reviewsData.totalCount === 0
              ? 'عندما يقوم عملاؤك بكتابة تقييم في واجهة متجرك العامة، ستظهر هنا فوراً لتتمكن من مراجعتها واعتمادها.'
              : 'جرب تبديل التبويب أو إزالة كلمات البحث لعرض باقي التقييمات.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => {
            const dateStr = new Date(review.createdAt).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const isProcessing = actionLoadingId === review.id;

            return (
              <div
                key={review.id}
                className={`bg-white rounded-2xl p-5 border transition-all ${
                  review.isApproved 
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs' 
                    : 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Customer Info & Stars */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 text-sm">
                      {review.customerName.slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{review.customerName}</h4>
                        {review.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>معتمد وظاهر بالمتجر</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>قيد المراجعة</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200 fill-slate-100'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">• {dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleToggleApproval(review)}
                      disabled={isProcessing}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                        review.isApproved
                          ? 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {review.isApproved ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                          <span>إلغاء النشر</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>اعتماد ونشر الآن</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteReview(review)}
                      disabled={isProcessing}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-colors"
                      title="حذف التقييم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review Comment Box */}
                <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
                  "{review.comment}"
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
