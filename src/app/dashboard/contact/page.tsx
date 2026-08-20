import { getUser } from '@/lib/auth';
import { ContactContent } from './contact-content';

export const metadata = {
  title: 'Contact — HUBClosing',
};

export default async function ContactPage() {
  const user = await getUser();
  if (!user) return null;

  return <ContactContent user={user} />;
}
