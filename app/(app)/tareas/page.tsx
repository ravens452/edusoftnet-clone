import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth';

export default async function TareasPage() {
  const user = await requireSession();
  if (user.role === 'STUDENT' || user.role === 'PARENT') redirect('/eclass');
  redirect('/eclass');
}
