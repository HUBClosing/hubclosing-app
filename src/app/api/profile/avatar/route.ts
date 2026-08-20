import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // 1. Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 2. Lire le fichier depuis le FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Validation type + taille
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
    }

    // 3. Upload via admin client (bypass storage RLS)
    const admin = getSupabaseAdmin();
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${authUser.id}/avatar.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await admin.storage
      .from('avatars')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadErr) {
      console.error('[avatar] upload error:', uploadErr.message);

      // Si le bucket n'existe pas, le créer
      if (uploadErr.message.includes('not found') || uploadErr.message.includes('Bucket')) {
        // Créer le bucket public
        const { error: bucketErr } = await admin.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024,
          allowedMimeTypes: allowedTypes,
        });

        if (bucketErr && !bucketErr.message.includes('already exists')) {
          console.error('[avatar] bucket creation error:', bucketErr.message);
          return NextResponse.json({ error: 'Erreur configuration stockage' }, { status: 500 });
        }

        // Retenter l'upload
        const { error: retryErr } = await admin.storage
          .from('avatars')
          .upload(path, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (retryErr) {
          console.error('[avatar] retry upload error:', retryErr.message);
          return NextResponse.json({ error: 'Erreur upload de l\'image' }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: 'Erreur upload de l\'image' }, { status: 500 });
      }
    }

    // 4. Récupérer l'URL publique
    const { data: urlData } = admin.storage
      .from('avatars')
      .getPublicUrl(path);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    // 5. Mettre à jour avatar_url dans la table users (admin bypass RLS)
    const { error: updateErr } = await admin
      .from('users')
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', authUser.id);

    if (updateErr) {
      console.error('[avatar] update user error:', updateErr.message);
      return NextResponse.json({ error: 'Image uploadée mais erreur de sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error('[avatar] unexpected error:', err);
    return NextResponse.json({ error: 'Erreur inattendue' }, { status: 500 });
  }
}
