import express from "express";
import { registerDevice } from "../controllers/deviceController.js";

const router = express.Router();
router.post("/register-device", registerDevice);

export default router;
