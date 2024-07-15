//user class, used to store user information, data is in mangoDB database
import { client } from "../index.mjs";
// crypto module to use scrypt
import crypto from "crypto";
import express from "express";
import { log } from "../index.mjs";

export const userRouter = express.Router();

//get all users
userRouter.get("/all", getAllUsers);

//login
userRouter.post("/login", authenticate);

userRouter.post("/create", createUser);

async function createUser(req, res) {
  if (!req.body.username || !req.body.password || !req.body.displayName) {
    res
      .status(400)
      .send(
        "Invalid user data, make sure username, password and displayName are provided"
      );
    return;
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const user = {
    username: req.body.username,
    role: req.body.role || "editor",
    salt: salt,
    password: crypto.scryptSync(req.body.password, salt, 64).toString("hex"),
    displayName: req.body.displayName,
    dateOfCreation: new Date(),
  };
  const result = await client.db("msn").collection("users").insertOne(user);
  console.log(result);
  res.send("User created");
}

async function getAllUsers(req, res){
  console.log("Getting all users");
  const result = await client.db("msn").collection("users").find().toArray();
  for(let user of result){
    delete user.password;
    delete user.salt;
    user.id = user._id;
    delete user._id;
  }
  res.json(result);
}

async function authenticate(req, res) {
  console.log("Authentication request received");
  if (!req.body.username || !req.body.password) {
    console.error("Invalid login data received");
    res
      .status(400)
      .send("Invalid login data, make sure username and password are provided");
      log("Invalid login data received", req.body.username, "error");
    return;
  }
  const user = await client
    .db("msn")
    .collection("users")
    .findOne({ username: req.body.username });
  if (!user) {
    console.error("Authentication failed, user not found");
    res.status(401).json({ message: "Login Failed", success: false });
    log("User not found", req.body.username, "error");
    return;
  }
  const hash = crypto
    .scryptSync(req.body.password, user.salt, 64)
    .toString("hex");
  if (hash !== user.password) {
    console.error("Authentication failed, invalid password");
    res.status(401).json({ message: "Login Failed", success: false });
    log("Invalid password", req.body.username, "error");
    return;
  }
  //store session in database, with expiry date of 1 day
  const session = {
    sessionid: crypto.randomBytes(16).toString("hex"),
    username: user.username,
    role: user.role,
    expiry: new Date(Date.now() + 86400000),
  };
  console.log("Session created: " + session.sessionid);
  res.json({ message: "Login successful", success: true, user: user, session: session});
  log("Login successful", req.body.username);
}
