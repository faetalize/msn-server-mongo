import { MongoClient } from "mongodb";
import express from "express";
import { postRouter } from "./routes/post.mjs";
import cors from "cors";
import { userRouter } from "./routes/user.mjs";
import { menuRouter } from "./routes/menu.mjs";
import path from "path";
import { logsRouter } from "./routes/logs.mjs";

//connect to mongodb
const uri = "mongodb://localhost:27017";
export const client = new MongoClient(uri);

//routes
const app = express();
app.use(express.json({limit: "1000mb"}));
app.use(
  cors({
    origin: "http://localhost:4200",
  })
);
app.use('/media', express.static("./media"))
app.use(express.urlencoded({ extended: true}));
app.use("/post", postRouter);
app.use("/user", userRouter);
app.use("/menu", menuRouter);
app.use("/logs", logsRouter);

//listen to port 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

export async function log(message, user, type){
  await client.db("msn").collection("logs").insertOne({
    message: message,
    user: user || undefined,
    type: type || "info",
    date: new Date()
  });
}