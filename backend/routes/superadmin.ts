import express, { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import SuperAdmin from "../models/SuperAdmin.js";
import Card from "../models/Card.js";
import config from "../config/config.js";

const router = express.Router();

// JWT secret from config
const JWT_SECRET = config.get("security.superadminJwtSecret");
const JWT_EXPIRY = "15m"; // 15 minutes validity

// Middleware to verify super admin JWT
const verifySuperAdminToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// POST /api/superadmin/login - Authenticate super admin
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    // Get super admin (there should only be one)
    let superAdmin = await SuperAdmin.findOne();

    // If no super admin exists, create one with default password from config
    if (!superAdmin) {
      const defaultPassword = config.get("security.superadminDefaultPassword");
      superAdmin = new SuperAdmin({
        password: defaultPassword,
      });
      await superAdmin.save();
    }

    // Verify password
    const isMatch = await superAdmin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token with short expiry
    const token = jwt.sign({ role: "superadmin" }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
    });

    return res.json({
      token,
      expiresIn: JWT_EXPIRY,
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Super admin login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// POST /api/superadmin/change-password - Change super admin password
router.post(
  "/change-password",
  verifySuperAdminToken,
  async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both passwords required" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "New password must be at least 8 characters" });
      }

      const superAdmin = await SuperAdmin.findOne();

      if (!superAdmin) {
        return res.status(404).json({ message: "Super admin not found" });
      }

      // Verify current password
      const isMatch = await superAdmin.comparePassword(currentPassword);

      if (!isMatch) {
        return res.status(401).json({ message: "Current password incorrect" });
      }

      // Update password
      superAdmin.password = newPassword;
      await superAdmin.save();

      return res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

// GET /api/superadmin/cards - List all cards
router.get(
  "/cards",
  verifySuperAdminToken,
  async (_req: Request, res: Response) => {
    try {
      const cards = await Card.find().sort({ createdAt: -1 });
      return res.json(cards);
    } catch (error) {
      console.error("List cards error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

// DELETE /api/superadmin/cards/:id - Delete any card
router.delete(
  "/cards/:id",
  verifySuperAdminToken,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const card = await Card.findByIdAndDelete(id);

      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      return res.json({ message: "Card deleted successfully" });
    } catch (error) {
      console.error("Delete card error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

// DELETE /api/superadmin/users/:ownerId - Delete user and all their cards
router.delete(
  "/users/:ownerId",
  verifySuperAdminToken,
  async (req: Request, res: Response) => {
    try {
      const { ownerId } = req.params;

      // Delete all cards owned by this user
      const result = await Card.deleteMany({ ownerId });

      return res.json({
        message: "User and all their cards deleted successfully",
        deletedCards: result.deletedCount,
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

// GET /api/superadmin/stats - Get system statistics
router.get(
  "/stats",
  verifySuperAdminToken,
  async (_req: Request, res: Response) => {
    try {
      const totalCards = await Card.countDocuments();
      const publishedCards = await Card.countDocuments({ isPublished: true });
      const unpublishedCards = await Card.countDocuments({
        isPublished: false,
      });

      // Get unique owners count
      const uniqueOwners = await Card.distinct("ownerId");

      return res.json({
        totalCards,
        publishedCards,
        unpublishedCards,
        totalUsers: uniqueOwners.length,
      });
    } catch (error) {
      console.error("Get stats error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
