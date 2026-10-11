import express from "express";
import { testGemini } from "../controller/aiController.js";

const aiRouter = express.Router();

aiRouter.post("/test", testGemini);

export default aiRouter;