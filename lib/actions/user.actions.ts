"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/database";
import User from "@/lib/database/models/user.model";
import { handleError, handleErrorThrow } from "@/lib/utils";
import { createNotification } from "@/lib/actions/notification.actions";
import { CreateUserParams, UpdateUserParams } from "@/types";

export async function createUser(user: CreateUserParams) {
  try {
    await connectToDatabase();

    // Validate required fields
    if (!user.clerkId) throw new Error("clerkId is required");
    if (!user.email) throw new Error("email is required");
    if (!user.firstName || user.firstName.trim() === '') throw new Error("firstName is required");
    if (!user.username || user.username.trim() === '') throw new Error("username is required");

    // Ensure username is unique by checking for existing users
    const existingUserByUsername = await User.findOne({ userName: user.username });
    if (existingUserByUsername) {
      throw new Error("Username already taken");
    }

    const existingUserByEmail = await User.findOne({ emailId: user.email });
    if (existingUserByEmail) {
      throw new Error("User already exists with this email");
    }

    // Map role to isHost and isPromoter flags.
    // Chain of command (Phase 1): users created by the Clerk webhook have no
    // role yet (roleSelected=false → the app routes them to /role-selection).
    // KJs start 'pending' until a Promoter approves them; Promoters are the
    // top of the chain (auto-verified); KSs are approved per-event by the KJ.
    const role = user.role || 'KS';
    const userData = {
      clerkId: user.clerkId,
      emailId: user.email,
      userName: user.username,
      firstName: user.firstName,
      lastName: user.lastName || '',
      photoAvatar: user.photo || 'default.png',
      role: role,
      roleSelected: Boolean(user.role),
      isHost: role === 'KJ',
      isPromoter: role === 'Promoter',
      kjVerificationStatus: 'pending',
      promoterVerificationStatus: 'verified',
      pendingVerification: role === 'KJ',
    };

    const newUser = await User.create(userData);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error: any) {
    console.error("Error in createUser:", error);
    if (error.code === 11000) {
      // Handle duplicate username by appending a number
      if (error.keyPattern?.username) {
        const baseUsername = error.keyValue?.username || 'user';
        const suffix = Math.floor(Math.random() * 1000);
        const newUsername = `${baseUsername}${suffix}`;

        const userData = {
          ...user,
          username: newUsername,
          isHost: user.role === 'KJ',
          isPromoter: user.role === 'Promoter',
        };

        const newUser = await User.create(userData);
        return JSON.parse(JSON.stringify(newUser));
      }
      throw new Error("User already exists with this email");
    }
    throw new Error(error.message || "Failed to create user");
  }
}

export async function getUserById(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });

    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    handleError(error);
  }
}

export async function updateUser(clerkId: string, user: UpdateUserParams) {
  try {
    await connectToDatabase();

    const updateData = { ...user };
    
    // Map role to flags if provided
    if (user.role) {
      updateData.isHost = user.role === 'KJ';
      updateData.isPromoter = user.role === 'Promoter';
    }

    const updatedUser = await User.findOneAndUpdate({ clerkId }, updateData, {
      new: true,
    });

    if (!updatedUser) throw new Error("User update failed");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleError(error);
  }
}

export async function deleteUser(clerkId: string) {
  try {

    await connectToDatabase();

    const deletedUser = await User.findOneAndDelete({ clerkId });
    revalidatePath("/");

    return deletedUser ? JSON.parse(JSON.stringify(deletedUser)) : null;
  } catch (error) {
    handleError(error);
  }
}

export async function updateUserRole(clerkId: string, role: 'KJ' | 'KS' | 'Promoter') {
  try {
    await connectToDatabase();

    if (!clerkId) throw new Error("clerkId is required");
    if (!role) throw new Error("role is required");

    const updateData: any = {
      role,
      roleSelected: true,
      isHost: role === 'KJ',
      isPromoter: role === 'Promoter',
    };

    // Chain of command: switching to KJ (re-)enters the Promoter approval
    // queue; Promoters are top of chain; KSs need no account-level approval.
    if (role === 'KJ') {
      updateData.kjVerificationStatus = 'pending';
      updateData.pendingVerification = true;
      updateData.verifiedBy = null;
    } else if (role === 'Promoter') {
      updateData.promoterVerificationStatus = 'verified';
      updateData.pendingVerification = false;
    } else {
      updateData.pendingVerification = false;
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      updateData,
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found with clerkId: " + clerkId);

    revalidatePath('/dashboard');
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleErrorThrow(error);
  }
}

// Get users by role
export async function getUsersByRole(role: 'KJ' | 'Promoter' | 'KS') {
  try {
    await connectToDatabase();

    let query = {};
    if (role === 'KJ') query = { isHost: true };
    else if (role === 'Promoter') query = { isPromoter: true };
    else query = { isHost: false, isPromoter: false };

    const users = await User.find(query)
      .select('-clerkId -emailId')
      .sort({ createdAt: -1 });

    return JSON.parse(JSON.stringify(users));
  } catch (error) {
    handleError(error);
  }
}

// Get KJ verification status
export async function getKJVerificationStatus(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    return {
      isKJ: user.isHost,
      verificationStatus: user.kjVerificationStatus || 'pending',
      experience: user.experience,
      equipment: user.equipment,
      genres: user.genres,
    };
  } catch (error) {
    handleError(error);
  }
}

// Get Promoter verification status
export async function getPromoterVerificationStatus(userId: string) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkId: userId });
    if (!user) throw new Error("User not found");

    return {
      isPromoter: user.isPromoter,
      verificationStatus: user.promoterVerificationStatus || 'pending',
      venues: user.venues,
      experience: user.promotionExperience,
    };
  } catch (error) {
    handleError(error);
  }
}

// Add these new functions after the existing ones

export async function submitKJVerification(userId: string, verificationData: {
  experience: string;
  equipment: string[];
  genres: string[];
}) {
  try {
    await connectToDatabase();

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        ...verificationData,
        kjVerificationStatus: 'pending',
        pendingVerification: true,
        role: 'KJ',
        isHost: true,
        profileCompleted: true,
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found");

    revalidatePath("/");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleErrorThrow(error);
  }
}

export async function submitPromoterVerification(userId: string, verificationData: {
  venues: string[];
  promotionExperience: string;
}) {
  try {
    await connectToDatabase();

    // Promoters are the top of the chain of command (they approve KJs), so
    // submitting venue details records their business info and keeps them
    // 'verified' rather than queueing them for an approval nobody can give.
    const updatedUser = await User.findOneAndUpdate(
      { clerkId: userId },
      {
        ...verificationData,
        promoterVerificationStatus: 'verified',
        pendingVerification: false,
        role: 'Promoter',
        isPromoter: true,
        profileCompleted: true,
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("User not found");

    revalidatePath("/");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleErrorThrow(error);
  }
}

/**
 * Approve a KJ (chain of command: Promoter → KJ).
 * Only a verified Promoter may approve; records who approved via verifiedBy
 * and notifies the KJ.
 */
export async function approveKJVerification(kjClerkId: string, approverClerkId: string) {
  try {
    await connectToDatabase();

    const approver = await User.findOne({ clerkId: approverClerkId });
    if (!approver || approver.role !== 'Promoter' || approver.promoterVerificationStatus !== 'verified') {
      throw new Error("Only verified Promoters can approve KJs");
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: kjClerkId, role: 'KJ' },
      {
        kjVerificationStatus: 'verified',
        pendingVerification: false,
        verifiedBy: approver._id,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("KJ not found");

    await createNotification({
      userId: kjClerkId,
      type: 'approval',
      title: 'KJ verification approved',
      message: `Congratulations! ${approver.firstName} ${approver.lastName || ''} (Promoter) approved your KJ verification. You can now create and host karaoke events.`.trim(),
      data: { approvedBy: approver._id.toString() },
    });

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleErrorThrow(error);
  }
}

/**
 * Reject a KJ verification (chain of command: Promoter → KJ).
 */
export async function rejectKJVerification(kjClerkId: string, approverClerkId: string, notes?: string) {
  try {
    await connectToDatabase();

    const approver = await User.findOne({ clerkId: approverClerkId });
    if (!approver || approver.role !== 'Promoter' || approver.promoterVerificationStatus !== 'verified') {
      throw new Error("Only verified Promoters can review KJs");
    }

    const updatedUser = await User.findOneAndUpdate(
      { clerkId: kjClerkId, role: 'KJ' },
      {
        kjVerificationStatus: 'rejected',
        pendingVerification: false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) throw new Error("KJ not found");

    await createNotification({
      userId: kjClerkId,
      type: 'approval',
      title: 'KJ verification update',
      message: `Your KJ verification was not approved by ${approver.firstName} ${approver.lastName || ''} (Promoter).${notes ? ` Reason: ${notes}` : ''} You can update your experience and equipment in your profile and request verification again.`,
      data: { rejectedBy: approver._id.toString(), notes },
    });

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(updatedUser));
  } catch (error) {
    handleErrorThrow(error);
  }
}

export async function getPendingKJVerifications() {
  try {
    await connectToDatabase();

    const pendingKJs = await User.find({
      role: 'KJ',
      kjVerificationStatus: 'pending'
    }).select('clerkId firstName lastName emailId experience equipment genres createdAt');

    return JSON.parse(JSON.stringify(pendingKJs));
  } catch (error) {
    handleError(error);
  }
}

export async function getPendingPromoterVerifications() {
  try {
    await connectToDatabase();

    const pendingPromoters = await User.find({
      role: 'Promoter',
      promoterVerificationStatus: 'pending'
    }).select('clerkId firstName lastName emailId venues promotionExperience createdAt');

    return JSON.parse(JSON.stringify(pendingPromoters));
  } catch (error) {
    handleError(error);
  }
}