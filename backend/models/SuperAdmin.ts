import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

interface ISuperAdmin {
  password: string;
  lastChanged: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface ISuperAdminDocument extends ISuperAdmin, Document {}

const superAdminSchema = new Schema<ISuperAdminDocument>(
  {
    password: {
      type: String,
      required: true,
    },
    lastChanged: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Hash password before saving
superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.lastChanged = new Date();
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare passwords
superAdminSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const SuperAdmin = mongoose.model<ISuperAdminDocument>(
  "SuperAdmin",
  superAdminSchema,
);

export default SuperAdmin;
