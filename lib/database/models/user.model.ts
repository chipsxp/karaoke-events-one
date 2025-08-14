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

  // KJ specific fields (isHost)
  isHost: { type: Boolean, default: false }, // This is the KJ role
  kjVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  experience: { type: String }, // KJ experience description
  equipment: [{ type: String }], // KJ's karaoke equipment
  genres: [{ type: String }], // KJ's preferred genres

  // Promoter specific fields
  isPromoter: { type: Boolean, default: false },
  promoterVerificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending",
  },
  venues: [{ type: String }], // Promoter's managed venues
  promotionExperience: { type: String },

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
