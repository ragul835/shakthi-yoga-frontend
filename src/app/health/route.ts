import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendOrigin = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:3001';

  try {
    const response = await fetch(`${backendOrigin}/api/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Backend health returned ${response.status}`);

    return NextResponse.json(
      { status: 'ok', service: 'shakthi-yoga-frontend', backend: 'reachable' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json(
      { status: 'unavailable', service: 'shakthi-yoga-frontend', backend: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
