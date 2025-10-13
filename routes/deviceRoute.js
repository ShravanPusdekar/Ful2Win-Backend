import express from "express";
import { registerDevice } from "../controllers/deviceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/register-device", protect, registerDevice);

export default router;
