import { Metadata } from 'next';
import { api } from '@/lib/api';
import { StoreDirectoryCard } from '@/types';
import DirectoryClient from './DirectoryClient';

interface DirectoryPageProps {
  searchParams: {
    city?: string;
    category?: string;
  };
}

const EGYPT_CITIES = [
  'الكل',
  'الفيوم',
  'القاهرة',
  'الجيزة',
  'الإسكندرية',
  'المنصورة',
  'طنطا',
  'أسيوط',
  'سوهاج',
  'المنيا',
  'الشرقية',
  'القليوبية',
  'بني سويف',
  'بورسعيد',
];

const BUSINESS_CATEGORIES = [
  'الكل',
  'ملابس وأزياء',
  'مطاعم وأكلات',
  'حلويات ومخبوزات',
  'عطور ومستحضرات تجميل',
  'إكسسوارات وهدايا',
  'أحذية وحقائب',
  'إلكترونيات وموبايل',
];

export async function generateMetadata({ searchParams }: DirectoryPageProps): Promise<Metadata> {
  const { city, category } = searchParams;
  let title = 'دليل المتاجر ومنيو الواتساب في مصر | WatsStore';
  let desc = 'تصفح دليل متاجر الواتساب والكتالوجات المحلية في محافظات مصر. تسوق واطلب مباشرة من التاجر بضغطة زر.';

  if (city && category) {
    title = `متاجر ${category} في ${city} | دليل WatsStore مصر`;
    desc = `تصفح أفضل محلات وكتالوجات ${category} في ${city}. تسوق أونلاين واطلب مباشرة عبر الواتساب.`;
  } else if (city) {
    title = `متاجر ومنيو الواتساب في ${city} | WatsStore مصر`;
    desc = `تصفح المتاجر والمطاعم المحلية في ${city} واطلب دليفري مباشرة عبر الواتساب.`;
  } else if (category) {
    title = `متاجر ${category} أونلاين في مصر | WatsStore`;
    desc = `أفضل كتالوجات ومتاجر ${category} في جميع محافظات مصر على الواتساب.`;
  }

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      locale: 'ar_EG',
    },
  };
}

export default async function DirectoryPage({ searchParams }: DirectoryPageProps) {
  const selectedCity = searchParams.city && searchParams.city !== 'الكل' ? searchParams.city : undefined;
  const selectedCategory = searchParams.category && searchParams.category !== 'الكل' ? searchParams.category : undefined;

  let stores: StoreDirectoryCard[] = [];
  try {
    stores = await api.getDirectory(selectedCity, selectedCategory);
  } catch {
    stores = [];
  }

  return (
    <DirectoryClient
      stores={stores}
      selectedCity={selectedCity}
      selectedCategory={selectedCategory}
      cities={EGYPT_CITIES}
      categories={BUSINESS_CATEGORIES}
    />
  );
}
