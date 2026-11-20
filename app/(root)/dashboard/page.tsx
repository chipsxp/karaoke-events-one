import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/actions/user.actions';
import KJDashboard from '@/components/dashboard/KJDashboard';
import KSDashboard from '@/components/dashboard/KSDashboard';
import PromoterDashboard from '@/components/dashboard/PromoterDashboard';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  const dbUser = await getUserById(userId);

  // Phase 1: no silent role fallback. Users must actively pick their role —
  // the Clerk webhook creates them with a default "KS" role but
  // roleSelected=false until they choose on /role-selection.
  if (!dbUser || !dbUser.roleSelected) {
    redirect('/role-selection');
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (dbUser.role) {
      case 'KJ':
        return <KJDashboard userId={userId} />;
      case 'KS':
        return <KSDashboard userId={userId} />;
      case 'Promoter':
        return <PromoterDashboard userId={userId} />;
      default:
        redirect('/role-selection');
    }
  };

  return (
    <div className="wrapper my-8">
      {renderDashboard()}
    </div>
  );
}
