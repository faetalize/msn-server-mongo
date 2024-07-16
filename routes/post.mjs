import express from "express";
import multer from "multer";
import path from "path";

import { client, log } from "../index.mjs";
import { ObjectId } from "mongodb";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./media/images/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
});

export const postRouter = express.Router();

postRouter.get("/all", getAllPosts);
postRouter.post("/create", createPost);
postRouter.post("/upload", upload.single("upload"), imageUpload);
postRouter.get("/article/:id", getArticle);
postRouter.get("/page/:id", getPage);
postRouter.put("/update/:id", updatePost);
postRouter.delete("/delete/:id", deletePost);

async function createPost(req, res) {
  let result = null;
  if (!req.body.title || !req.body.content || !req.body.postType) {
    res
      .status(400)
      .send(
        "Invalid post data, make sure title, content and type are provided"
      );
    console.error(
      "Invalid post data received, either title, content or type is missing"
    );
    log("Tried to create post with invalid data", req.body.username, "error");
    return;
  }
  if (req.body.postType === "Article") {
    console.log("Creating article");
    const article = {
      title: req.body.title,
      banner: req.body.banner,
      category: req.body.category,
      visibility: req.body.visibility || false,
      isFrontPage: req.body.isFrontPage || false,
      isEvent: req.body.isEvent || false,
      //if event, add event date
      ...(req.body.isEvent && { eventDate: new Date(req.body.eventDate) }),
      tags: req.body.tags || [],
      content: req.body.content,
      author: req.body.author || "No author",
      uploadDate: new Date(),
    };
    result = await client.db("msn").collection("articles").insertOne(article);
    console.log("Article created, id: " + result.insertedId);
    log("Article created, id: " + result.insertedId, req.body.username);
  } else if (req.body.postType === "Page") {
    console.log("Creating page");
    const page = {
      title: req.body.title,
      pageType: req.body.pageType,
      category: req.body.category,
      tags: req.body.tags || [],
      content: req.body.content,
      routerLink: req.body.routerLink,
      date: new Date(),
    };
    result = await client.db("msn").collection("pages").insertOne(page);
    console.log("Page created, id: " + result.insertedId);
    log("Page created, id: " + result.insertedId, req.body.username);
  } else {
    res.status(400).send("Invalid post type");
    console.error("Invalid post type");
    log("Tried to create post with invalid type", req.body.username, "error");
    return;
  }
  if (!result) {
    res.status(500).send("Error creating post");
    console.error("Error creating post");
    log("Error creating post", req.body.username, "error");
    return;
  }
  res.send(
    "Post created of type" + req.body.postType + ", id: " + result.insertedId
  );
}

async function getAllPosts(req, res) {
  const articles = await client
    .db("msn")
    .collection("articles")
    .find()
    .toArray();
  const pages = await client.db("msn").collection("pages").find().toArray();
  res.json({ articles, pages });
}

async function getArticle(req, res) {
  console.log("received request for article: " + req.params.id);
  const article = await client
    .db("msn")
    .collection("articles")
    .findOne({ _id: ObjectId.createFromHexString(req.params.id) });
  if (!article) {
    res.status(404).json({success: false, message: "Article not found, id: " + req.params.id});
    return;
  }
  res.json({success: true, ...article});
}

async function getPage(req, res) {
  console.log("received request for page: " + req.params.id);
  const page = await client
    .db("msn")
    .collection("pages")
    .findOne({ _id: ObjectId.createFromHexString(req.params.id) });
  if (!page) {
    res.status(404).send("Page not found, id: " + req.params.id);
    return;
  }
  res.json(page);
}

async function imageUpload(req, res) {
  const url = req.protocol + "://" + req.get("host");
  if (!req.file) {
    res.status(400).send("No file uploaded");
    console.log("No file uploaded");
    return;
  }
  
  res.json({
    url: url + "/media/images/" + req.file.filename,
  });
  console.log("NEW FILE UPLOADED. path: " + url + "/media/images/" + req.file.filename);
}

async function updatePost(req,res){
  if(!req.body.title || !req.body.content || !req.body.postType){
    res.status(400).send("Invalid post data, make sure title, content and type are provided");
    console.error("Invalid post data received, either title, content or type is missing");
    log("Tried to update post with invalid data", req.body.username, "error");
    return;
  }
  if(req.body.postType === "Article"){
    console.log("Updating article");
    const article = {
      title: req.body.title,
      banner: req.body.banner,
      category: req.body.category,
      visibility: req.body.visibility || false,
      isFrontPage: req.body.isFrontPage || false,
      isEvent: req.body.isEvent || false,
      //if event, add event date
      ...(req.body.isEvent && { eventDate: req.body.eventDate }),
      tags: req.body.tags || [],
      content: req.body.content,
    }
    const result = await client.db("msn").collection("articles").updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: article});
    console.log("Article updated, id: " + req.params.id);
    log("Article updated, id: " + req.params.id, req.body.username);
    res.json({success: true, message: "Article updated, id: " + req.params.id});
  }
  else if(req.body.postType === "Page"){
    console.log("Updating page");
    const page = {
      title: req.body.title,
      pageType: req.body.pageType,
      category: req.body.category,
      tags: req.body.tags || [],
      content: req.body.content,
      routerLink: req.body.routerLink,
    }
    const result = await client.db("msn").collection("pages").updateOne({_id: ObjectId.createFromHexString(req.params.id)}, {$set: page});
    console.log("Page updated, id: " + req.params.id);
    log("Page updated, id: " + req.params.id, req.body.username);
    res.json({success: true, message: "Page updated, id: " + req.params.id});
  }
  else{
    res.status(400).json({success: false, message: "Invalid post type"});
    console.error("Invalid post type");
    log("Tried to update post with invalid type", req.body.username, "error");
    return;
  }
}

async function deletePost(req,res){
  if(!req.params.id){
    res.status(400).send("Invalid post id");
    console.error("Invalid post id");
    log("Tried to delete post with invalid id", req.body.username, "error");
    return;
  }
  if(req.body.postType=="Article"){
    const result = await client.db("msn").collection("articles").deleteOne({_id: ObjectId.createFromHexString(req.params.id)});
    console.log("Article deleted, id: " + req.params.id);
    log("Article deleted, id: " + req.params.id, req.body.username);
    res.json({success: true, message: "Article deleted, id: " + req.params.id});
  }
}
