import express from "express";
import { client, log } from "../index.mjs";
import { ObjectId } from "mongodb";

export const menuRouter = express.Router();

menuRouter.get("/all", getAllMenus);
menuRouter.post("/create", createMenu);
menuRouter.get("/menu/:id", getMenu);
menuRouter.put("/update/:id", updateMenu);
menuRouter.delete("/delete/:id", deleteMenu);

function menuComponent(label, items, icon, routerLink) {
  const menu = {
    label: label,
    items: items || null,
    icon: icon || null,
    routerLink: routerLink || null,
  };
  return menu;
}

async function createMenu(req, res) {
  let result = null;
  if (!req.body.label) {
    res
      .status(400)
      .json({
        message: "Invalid menu data, make sure name is provided",
        success: false,
      });
    console.error("Invalid menu data, make sure name is provided");
    log("Tried to create menu with invalid data", req.body.username, "error");
    return;
  }
  console.log("Creating menu");
  const menu = menuComponent(
    req.body.label,
    req.body.items,
    req.body.icon,
    req.body.routerLink
  );
  result = await client.db("msn").collection("menus").insertOne(menu);
  console.log("Menu created, id: " + result.insertedId);
  log("Menu created, id: " + result.insertedId, req.body.username);
  res
    .status(201)
    .json({
      success: true,
      message: "Menu created, id: " + result.insertedId,
      body: { id: result.insertedId },
    });
}

async function updateMenu(req, res) {
  if (!req.body.name || !req.body.menuItems) {
    res
      .status(400)
      .json({
        message:
          "Invalid menu data, make sure name and menu items are provided",
        success: false,
      });
    console.error(
      "Invalid menu data, make sure name and menu items are provided"
    );
    log("Tried to update menu with invalid data", req.body.username, "error");
    return;
  }
  console.log("Updating menu");
  const menu = menuComponent(
    req.body.label,
    req.body.items,
    req.body.icon,
    req.body.routerLink
  );
  result = await client
    .db("msn")
    .collection("menus")
    .updateOne(
      { _id: ObjectId.createFromHexString(req.params.id) },
      { $set: menu }
    );
  console.log("Menu updated, id: " + req.params.id);
  res
    .status(201)
    .json({ success: true, message: "Menu updated, id: " + req.params.id });
}

async function getAllMenus(req, res) {
  console.log("Getting all menus");
  const result = await client.db("msn").collection("menus").find().toArray();
  res.status(200).json(result);
}

async function getMenu(req, res) {
  const result = await client
    .db("msn")
    .collection("menus")
    .findOne({ _id: ObjectId.createFromHexString(req.params.id) });
  res.status(200).json(result);
}

async function deleteMenu(req, res) {
  console.log("Deleting menu");
  if (!req.params.id) {
    res
      .status(400)
      .json({ success: false, message: "Invalid menu id provided" });
    console.error("Invalid menu id provided");
    log("Tried to delete menu with invalid id", req.body.username, "error");
    return;
  }
  const result = await client
    .db("msn")
    .collection("menus")
    .deleteOne({ _id: ObjectId.createFromHexString(req.params.id) });
  if (!result.deletedCount) {
    res
      .status(404)
      .json({
        success: false,
        message: "Menu not found, id: " + req.params.id,
      });
    return;
  }
  console.log("Menu deleted, id: " + req.params.id);
  log("Menu deleted, id: " + req.params.id, req.body.username);
  res
    .status(200)
    .json({ success: true, message: "Menu deleted, id: " + req.params.id });
}
