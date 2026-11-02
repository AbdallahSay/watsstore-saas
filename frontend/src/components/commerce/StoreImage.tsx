import Image from 'next/image';
import { ImgHTMLAttributes } from 'react';
import { API_BASE_URL } from '@/lib/api-base';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'> & {
  src: string; alt: string; width: number | string; height: number | string; sizes: string;
};

/** Resize our public raster uploads; preserve external links and local fixtures. */
export default function StoreImage({src, alt, width, height, sizes, ...props}: Props) {
  let optimize = false;
  try {
    const image = new URL(src);
    optimize = image.protocol === 'https:' && image.origin === new URL(API_BASE_URL).origin
      && image.pathname.startsWith('/uploads/') && !image.pathname.toLowerCase().endsWith('.svg');
  } catch { /* Relative and unsupported URLs retain normal browser image behavior. */ }
  const loading = props.loading || (props.fetchPriority === 'high' ? 'eager' : 'lazy');
  if (!optimize) return <img src={src} alt={alt} width={width} height={height} sizes={sizes} decoding="async" {...props} loading={loading}/>;
  return <Image src={src} alt={alt} width={Number(width)} height={Number(height)} sizes={sizes} {...props} loading={loading}/>;
}
