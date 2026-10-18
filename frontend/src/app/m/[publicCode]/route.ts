import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/api';

interface RouteProps {
  params: {
    publicCode: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { publicCode } = params;

  try {
    const data = await api.resolveQrCode(publicCode);
    const redirectUrl = new URL(`/s/${data.canonicalSlug}`, request.url);
    return NextResponse.redirect(redirectUrl, 302);
  } catch (error) {
    // If not found or invalid, redirect to directory with error notification or home
    const fallbackUrl = new URL('/directory', request.url);
    return NextResponse.redirect(fallbackUrl, 302);
  }
}
