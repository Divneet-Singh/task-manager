const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

router.post("/tasks", auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(400).send(error);
    }
})

router.get("/tasks", auth, async (req, res) => {

    const match = {};
    const sort = {};

    if (req.query.completed) {
        match.completed = req.query.completed === "true" ? true : false;
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(":");
        sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
    }

    try {
        // const tasks = await Task.find({ "owner": req.user._id });
        // res.send(tasks);
        await req.user.populate({
            path: "tasks",
            match: match,
            options: {
                limit: +req.query.limit,
                skip: +req.query.skip,
                sort: sort
            }
        }).execPopulate();
        res.send(req.user.tasks);
    } catch (error) {
        res.status(500).send();
    }
})

router.get("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({ "_id": _id, "owner": req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        res.send(task);
    } catch (error) {
        res.status(500).send();
    }
})

router.patch("/tasks/:id", auth, async (req, res) => {
    const _id = req.params.id;
    const _body = req.body;
    const updates = Object.keys(_body);
    const allowedUpdates = ["description", "completed"]

    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid Updates!" });
    }

    try {

        const task = await Task.findOne({ "_id": _id, "owner": req.user._id });

        // const task = await Task.findByIdAndUpdate(_id, _body, { new: true, runValidators: true });
        if (!task) {
            return res.status(404).send();
        }
        updates.forEach((update) => task[update] = _body[update]);

        await task.save();
        return res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.delete("/tasks/:id", auth, async (req, res) => {

    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({ "_id": _id, "owner": req.user._id });
        if (!task) {
            return res.status(404).send();
        }
        return res.send(task);
    } catch (error) {
        res.status(500).send(error);
    }
})

module.exports = router;