import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { commerceApi, type TrackingOrder } from '@/lib/commerce-api';
import LiveTracking from './LiveTracking';

export const metadata: Metadata = {title:'متابعة طلبك | WatsStore',robots:{index:false,follow:false},referrer:'no-referrer'};
export const dynamic = 'force-dynamic';

export default async function TrackingPage({params:pendingParams}:{params:Promise<{storeSlug:string;token:string}>}) {
  const {storeSlug, token} = await pendingParams;
  if (!/^[a-f0-9]{64}$/.test(token)) notFound();
  let order: TrackingOrder;
  try {
    order = await commerceApi<TrackingOrder>(`/public/stores/${encodeURIComponent(storeSlug)}/orders/track/${token}`);
  } catch { notFound(); }
  return <LiveTracking initialOrder={order} storeSlug={storeSlug} token={token}/>;
}
