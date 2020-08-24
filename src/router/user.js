const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const sharp = require("sharp");
const multer = require("multer");

const { sendWelcomeEmail, sendCancellationEmail } = require("../emails/account");

const router = new express.Router();

const avatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error("Upload a JPG, JPEG or PNG file"));
        }
        cb(undefined, true);
    }
})


router.post("/users", async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }
});

router.post("/users/login", async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token });
    } catch (error) {
        res.status(400).send();
    }
})

router.get("/users/me", auth, async (req, res) => {
    res.send(req.user);
});

// router.get("/users/:id", async (req, res) => {
//     const _id = req.params.id;
//     try {
//         const user = await User.findById(_id);
//         if (!user) {
//             return res.status(404).send();
//         }
//         res.status(200).send(user);
//     } catch (error) {
//         res.status(500).send(error);
//     }
// })

router.patch("/users/me", auth, async (req, res) => {
    const _body = req.body;
    const updates = Object.keys(_body);
    const allowedUpdates = ["name", "email", "password", "age"];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: "Invalid Updates!" });
    }


    try {
        updates.forEach((update) => req.user[update] = _body[update]);

        await req.user.save();

        // since findByIdAndUpdate will bypass the middleware in user model ie hashing, use the conventional way to save a user.
        // This will ensure password hashing.
        // const user = await User.findByIdAndUpdate(_id, _body, { new: true, runValidators: true });
        res.send(req.user);

    } catch (error) {
        res.status(400).send(error);
    }
})

router.delete("/users/me", auth, async (req, res) => {
    const _id = req.user._id;
    try {
        // const user = await User.findByIdAndDelete(_id);
        // if (!user) {
        //     return res.status(404).send();
        // }
        await req.user.remove();
        sendCancellationEmail(req.user.email, req.user.name);
        res.status(200).send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }
})

router.post("/users/logout", auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

router.post("/users/logoutAll", auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (error) {
        res.status(500).send();
    }
})

router.post("/users/me/avatar", auth, avatar.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ "error": error.message });
})

router.delete("/users/me/avatar", auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
})

router.get("/users/:id/avatar", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set("Content-Type", "image/png");
        res.send(user.avatar);
    } catch (error) {
        res.status(404).send();
    }
})

module.exports = router;