import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const steps: Record<string, unknown> = {};

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // Lister les cookies (noms seulement)
    steps.cookieNames = allCookies.map(c => c.name);
    steps.cookieCount = allCookies.length;
    steps.hasSupabaseCookies = allCookies.some(c => c.name.includes('sb-'));

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              try { cookieStore.set(name, value, options as any); } catch {}
            });
          },
        },
      }
    );

    // Step 1: Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    steps.authUser = authUser ? { id: authUser.id, email: authUser.email } : null;
    steps.authError = authError?.message || null;

    if (!authUser) {
      return NextResponse.json({ ...steps, conclusion: 'No auth — cookies missing or expired' });
    }

    // Step 2: DB
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, email, role, role_type, is_onboarded')
      .eq('id', authUser.id)
      .maybeSingle();

    steps.dbUser = user;
    steps.dbError = dbError?.message || null;

    return NextResponse.json({ ...steps, conclusion: user ? 'All OK' : 'Auth OK but DB failed' });

  } catch (err: unknown) {
    steps.exception = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ...steps, conclusion: 'Exception' }, { status: 500 });
  }
}
