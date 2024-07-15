import express from "express";
import { client } from "../index.mjs";

export const logsRouter = express.Router();

logsRouter.get("/all", getAllLogs);

async function getAllLogs(req, res) {
  console.log("Getting all logs");
  const result = await client.db("msn").collection("logs").find().toArray();
  res.json(result);
}