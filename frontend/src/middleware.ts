import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Subdomains that should never be treated as store slugs
const RESERVED_SUBDOMAINS = new Set([
  'www',
  'app',
  'api',
  'admin',
  'dashboard',
  'static',
  'mail',
  'webmail',
  'ftp',
  'cpanel',
  'staging',
  'dev',
  'test',
]);

// Main platform routes that should not be rewritten when visited on a subdomain
const PASSTHROUGH_ROUTES = [
  '/dashboard',
  '/login',
  '/register',
  '/directory',
  '/m/',
  '/_not-found',
];

/**
 * Extracts store slug from the incoming request hostname
 */
function extractSubdomain(req: NextRequest): string | null {
  // 1. Check override header or query parameter for testing/previews
  const headerSubdomain = req.headers.get('x-subdomain');
  if (headerSubdomain && !RESERVED_SUBDOMAINS.has(headerSubdomain.toLowerCase())) {
    return headerSubdomain.trim().toLowerCase();
  }

  const querySubdomain = req.nextUrl.searchParams.get('subdomain');
  if (querySubdomain && !RESERVED_SUBDOMAINS.has(querySubdomain.toLowerCase())) {
    return querySubdomain.trim().toLowerCase();
  }

  // 2. Extract from Host or X-Forwarded-Host header
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
  const host = rawHost.split(':')[0].toLowerCase().trim();

  // If IP address or empty, skip
  if (!host || /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return null;
  }

  // A. Localhost development: e.g. "al-amal-fashion.localhost"
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    if (parts.length >= 2 && parts[0]) {
      const sub = parts[0].toLowerCase();
      return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
    }
    return null;
  }

  // B. Vercel deployment preview: e.g. "al-amal-fashion.frontend-bay-ten-58.vercel.app"
  if (host.endsWith('.vercel.app')) {
    const parts = host.split('.');
    // At least 4 parts: [subdomain, project-branch, vercel, app]
    if (parts.length >= 4 && parts[0]) {
      const sub = parts[0].toLowerCase();
      return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
    }
    return null;
  }

  // C. Custom Production Domains: e.g. "al-amal-fashion.watsstore.com", "al-amal.masartech.com"
  const domainParts = host.split('.');
  if (domainParts.length >= 3) {
    const sub = domainParts[0].toLowerCase();
    return RESERVED_SUBDOMAINS.has(sub) ? null : sub;
  }

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip Next.js internal files, API endpoints, and static file extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // 2. Extract potential subdomain
  const subdomain = extractSubdomain(req);

  // If no store subdomain detected, proceed with normal main domain routing
  if (!subdomain) {
    return NextResponse.next();
  }

  // 3. Clone request headers and add store tracking headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-store-subdomain', subdomain);
  requestHeaders.set('x-store-slug', subdomain);

  // 4. Pass through platform routes (/dashboard, /login, /register, /directory, etc.)
  if (PASSTHROUGH_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 5. Handle OpenGraph dynamic social preview image on subdomain
  if (pathname === '/opengraph-image' || pathname === '/opengraph-image.png') {
    const ogUrl = new URL(`/s/${encodeURIComponent(subdomain)}/opengraph-image`, req.url);
    return NextResponse.rewrite(ogUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 6. Subdomain root "/" -> rewrite seamlessly to merchant storefront "/s/[subdomain]"
  if (pathname === '/' || pathname === '') {
    const storeUrl = new URL(`/s/${encodeURIComponent(subdomain)}`, req.url);
    return NextResponse.rewrite(storeUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 7. If path already starts with /s/[subdomain], keep it
  if (pathname.startsWith('/s/')) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 8. Any other store sub-paths on subdomain -> rewrite to /s/[subdomain]/...
  const rewrittenUrl = new URL(`/s/${encodeURIComponent(subdomain)}${pathname}`, req.url);
  return NextResponse.rewrite(rewrittenUrl, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
