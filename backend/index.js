import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
const app = express();
const server = createServer(app);
const io= connectToSocket(server);
import userRouter from "./routes/user.routes.js"


app.use(cors({
    origin: "https://videocall-frontend-guue.onrender.com",
    credentials: true
}));
app.use(express.json({limit:"40kb"}))
app.use(express.urlencoded({limit:"40kb", extended:true}))

app.use("/api/v1/users",userRouter)

const port = process.env.PORT;
const url = process.env.MONGO_URL;

const path = require("path");
app.use(express.static(path.join(__dirname, "frontend"))); 
app.use((req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

async function start() {
    await mongoose.connect(url);
    console.log("DB connected")
    server.listen(port, () => {
        console.log(`listening on ${port}`)
    })
}
start();