// scripts/seed-admin.ts
// Run with: npx ts-node --project tsconfig.json scripts/seed-admin.ts
// OR add to package.json: "seed": "ts-node scripts/seed-admin.ts"

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI ?? "";
if (!MONGODB_URI) throw new Error("Set MONGODB_URI env variable");

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "superadmin" },
}, { timestamps: true });

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const Admin = mongoose.models.Admin ?? mongoose.model("Admin", AdminSchema);

  const email = "admin@cineflix.com";
  const existing = await Admin.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", email);
    await mongoose.disconnect();
    return;
  }

  const password = await bcrypt.hash("Admin@123456", 12);
  await Admin.create({ email, name: "Super Admin", password, role: "superadmin" });

  console.log("✅ Admin created:");
  console.log("   Email:    admin@cineflix.com");
  console.log("   Password: Admin@123456");
  console.log("   ⚠️  Change password after first login!");
  await mongoose.disconnect();
}

seed().catch(console.error);
