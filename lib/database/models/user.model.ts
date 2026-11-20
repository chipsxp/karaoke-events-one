import { models, model, Schema } from "mongoose";

// Schema design for users with KJ/KS roles
export const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  emailId: { type: String, required: true, unique: true },
  userName: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  photoAvatar: { type: String, required: true, default: "default.png" },

  // Role-based fields
  role: {
    type: String,
    enum: ["KJ", "Promoter", "KS"],
    required: true,
    default: "KS",
  },

  // True once the user actively picked a role in /role-selection.
  // Users auto-created by the Clerk webhook start with role "KS" but
  // roleSelected=false so the app routes them to role selection first.
  roleSelected: { type: Boolean, default: false },

  // KJ specific fields (KJ = event host/director, approved by a Promoter)
  isHost: { type: Boolean, default: false }, // Legacy flag mirroring role === "KJ"
  kjVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  experience: { type: String }, // KJ experience description
  equipment: [{ type: String }], // KJ's karaoke equipment
  genres: [{ type: String }], // KJ's preferred genres

  // Promoter specific fields (Promoter = venue owner/location host, top of chain)
  isPromoter: { type: Boolean, default: false },
  promoterVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "verified", // Promoters are the top of the chain of command (admin)
  },
  venues: [{ type: String }], // Legacy free-text venue names (see Venue model)
  promotionExperience: { type: String },

  // Chain of command (Phase 1): who approved this user, and whether an
  // approval is currently pending. KJs are approved by Promoters;
  // KSs are approved per-event by the KJ via EventRegistration.
  verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  pendingVerification: { type: Boolean, default: false },

  // KS specific fields
  vocalRange: { type: String }, // KS vocal range
  preferredGenres: [{ type: String }], // KS preferred genres

  // Profile completion tracking
  profileCompleted: { type: Boolean, default: false },

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance (clerkId and emailId already have unique indexes from schema definition)
UserSchema.index({ role: 1 });
UserSchema.index({ isHost: 1 });
UserSchema.index({ isPromoter: 1 });

const User = models.User || model("User", UserSchema);
export default User;
