"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Music, Users } from "lucide-react";
import { createUser, updateUserRole } from "@/lib/actions/user.actions";
import { useAuth, useUser } from "@clerk/nextjs";

interface RoleSelectionProps {
  onComplete?: () => void;
  userId?: string;
}

export default function RoleSelection({ onComplete, userId: propUserId }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { userId: authUserId } = useAuth();
  const { user } = useUser();

  const actualUserId = propUserId || authUserId;

  const roles = [
    {
      id: "KJ",
      title: "Karaoke Host (KJ)",
      description: "Create and manage karaoke events, approve registrations, and host singers",
      icon: Mic,
      features: ["Create Events", "Manage Registrations", "Host Events", "Rate Performances"]
    },
    {
      id: "KS",
      title: "Karaoke Singer",
      description: "Discover events, register to sing, and connect with other singers",
      icon: Music,
      features: ["Browse Events", "Register to Sing", "Track Performances", "Get Rated"]
    },
    {
      id: "Promoter",
      title: "Event Promoter",
      description: "Promote events and help connect KJs with venues and audiences",
      icon: Users,
      features: ["Promote Events", "Manage Venues", "Connect KJs", "Marketing Tools"]
    }
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      setError("Please select a role to continue.");
      return;
    }

    if (!actualUserId) {
      setError("User ID not found. Please sign in again.");
      return;
    }

    setLoading(true);
    setError(null);

    console.log("Attempting role selection:", {
      actualUserId,
      selectedRole,
      user: user ? {
        email: user.emailAddresses?.[0]?.emailAddress,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName
      } : null
    });

    try {
      // Extract user data from Clerk user object
      const email = user?.emailAddresses?.[0]?.emailAddress || '';
      const firstName = user?.firstName || '';
      const lastName = user?.lastName || '';
      const username = user?.username || '';

      console.log("Creating user with data:", {
        clerkId: actualUserId,
        email,
        username,
        firstName,
        lastName,
        role: selectedRole
      });

      await createUser({
        clerkId: actualUserId,
        email: email,
        username: username,
        firstName: firstName,
        lastName: lastName,
        photo: user?.imageUrl || '',
        role: selectedRole as "KJ" | "KS" | "Promoter",
      });

      if (onComplete) {
        onComplete();
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (error: any) {
      console.error("Error creating user with role:", error);

      // Check if it's a duplicate key error (user already exists)
      if (error.message?.includes('duplicate key') || error.message?.includes('E11000') || error.message?.includes('already exists')) {
        console.log("User already exists, attempting to update role...");
        try {
          await updateUserRole(actualUserId, selectedRole as "KJ" | "KS" | "Promoter");
          if (onComplete) {
            onComplete();
          } else {
            router.push("/dashboard");
          }
          router.refresh();
        } catch (updateError: any) {
          console.error("Error updating role:", updateError);
          setError(updateError.message || "Failed to update role. Please try again.");
        }
      } else {
        setError(error.message || "Failed to create user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Role</h1>
        <p className="text-muted-foreground">
          Select how you'd like to participate in karaoke events
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card
              key={role.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole === role.id
                  ? "ring-2 ring-primary border-primary"
                  : "border-gray-200"
              }`}
              onClick={() => setSelectedRole(role.id)}
            >
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {role.description}
                </CardDescription>
                <ul className="space-y-1">
                  {role.features.map((feature) => (
                    <li key={feature} className="text-sm text-muted-foreground">
                      • {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <Button
          onClick={handleRoleSelection}
          disabled={!selectedRole || loading}
          className="px-8 py-3"
        >
          {loading ? "Setting up your account..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}