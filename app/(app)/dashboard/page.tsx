import { requireSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import StudentDashboard from './_views/student';
import ParentDashboard from './_views/parent';
import TeacherDashboard from './_views/teacher';
import DirectionDashboard from './_views/direction';
import GenericDashboard from './_views/generic';

export default async function DashboardPage() {
  const user = await requireSession();
  switch (user.role) {
    case 'STUDENT':
      return <StudentDashboard userId={user.id} firstName={user.firstName} />;
    case 'PARENT':
      return <ParentDashboard userId={user.id} firstName={user.firstName} />;
    case 'TEACHER':
      return <TeacherDashboard userId={user.id} firstName={user.firstName} />;
    case 'DIRECTION':
    case 'ADMIN':
      return <DirectionDashboard firstName={user.firstName} />;
    default:
      return <GenericDashboard firstName={user.firstName} role={user.role} />;
  }
}
