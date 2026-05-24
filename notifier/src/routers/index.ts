import { Router } from "express";
import { getPreferences } from "../controllers/preferences.controller.js";

const router: Router = Router();

router.get("/preferences/:userId", getPreferences);

export default router;