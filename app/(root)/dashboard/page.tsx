import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getUserById, createUser } from '@/lib/actions/user.actions';
import KJDashboard from '@/components/dashboard/KJDashboard';
import KSDashboard from '@/components/dashboard/KSDashboard';
import PromoterDashboard from '@/components/dashboard/PromoterDashboard';

export default async function DashboardPage() {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect('/sign-in');
  }

  let dbUser = await getUserById(userId);

  // Create user in database if they don't exist (fallback)
  if (!dbUser) {
    try {
      dbUser = await createUser({
        clerkId: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.username || `${user.firstName || ''}${user.lastName || ''}`,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        photo: user.imageUrl || '',
        role: 'KS', // Default role, will be updated by role selection
      });
    } catch (error) {
      console.error("Error creating user:", error);
      redirect('/role-selection');
    }
  }

  // If user exists but has no role, redirect to role selection
  if (!dbUser.role) {
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