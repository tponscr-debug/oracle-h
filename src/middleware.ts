import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Protéger le dashboard complet :
    // - racine (/)
    // - /api/v1/requests (données du dashboard)
    // - /api/v1/decide (prise de décision)
    const isProtected =
        url.pathname === '/dashboard' ||
        url.pathname === '/api/v1/requests' ||
        url.pathname.startsWith('/api/v1/decide');

    if (!isProtected) {
        return NextResponse.next();
    }

    const basicAuth = req.headers.get('authorization');
    if (basicAuth) {
        const authValue = basicAuth.split(' ')[1];
        const [user, pwd] = atob(authValue).split(':');

        const adminSecret = process.env.ORACLE_ADMIN_SECRET || 'oracle-admin-dev-secret';

        if (user === 'admin' && pwd === adminSecret) {
            return NextResponse.next();
        }
    }

    return new NextResponse('Accès refusé. Veuillez vous authentifier.', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="ORACLE-H Secure Dashboard"' }
    });
}
