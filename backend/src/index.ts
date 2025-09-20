import express from "express";
import "dotenv/config";

const port = parseInt(process.env.PORT || "3001", 10);

const app = express();

app.get("/hello", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
