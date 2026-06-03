import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const steps: Record<string, unknown> = {};

  try {
    const supabase = await createClient();
    steps.clientCreated = true;

    // Step 1: Check auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    steps.authUser = authUser ? { id: authUser.id, email: authUser.email } : null;
    steps.authError = authError?.message || null;

    if (!authUser) {
      return NextResponse.json({ ...steps, conclusion: 'No auth session — user not logged in' });
    }

    // Step 2: Query users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, role, role_type, is_onboarded, tier')
      .eq('id', authUser.id)
      .maybeSingle();

    steps.dbUser = user;
    steps.dbError = userError?.message || null;

    if (!user) {
      return NextResponse.json({ ...steps, conclusion: 'Auth OK but no user in DB' });
    }

    return NextResponse.json({ ...steps, conclusion: 'All OK — user fully authenticated' });

  } catch (err: unknown) {
    steps.exception = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ...steps, conclusion: 'Exception thrown' }, { status: 500 });
  }
}
