const express = require("express");

require("./db/mongoose");

const User = require("./models/user");
const Task = require("./models/task");

const userRouter = require("./router/user");
const taskRouter = require("./router/task");

const app = express();

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);


module.exports = app;
