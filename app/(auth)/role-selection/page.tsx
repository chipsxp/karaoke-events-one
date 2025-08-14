import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserById } from "@/lib/actions/user.actions";
import RoleSelection from "@/components/toptemp/RoleSelection";

const RoleSelectionPage = async () => {
  const { userId } = auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  // Check if user already exists and has a role
  const existingUser = await getUserById(userId);
  
  if (existingUser && existingUser.role) {
    // User already has a role, redirect to dashboard
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Karaoke Events!
          </h1>
          <p className="text-white/80">
            Please select your role to get started
          </p>
        </div>
        <RoleSelection userId={userId} />
      </div>
    </div>
  );
};

export default RoleSelectionPage;