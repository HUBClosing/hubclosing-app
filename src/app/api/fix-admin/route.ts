import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Temporary route to fix admin role - DELETE AFTER USE
export async function GET() {
  const supabase = await createClient();

  const { error } = await supabase
    .from('users')
    .update({ role: 'admin' })
    .eq('email', 'clcb.pro@gmail.com');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Admin role restored for clcb.pro@gmail.com' });
}
