const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { userOneId, userOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase)
afterEach(() => {

});

test("Should sign up a new user", async () => {
    const response = await request(app).post('/users').send({
        name: "Andrew",
        email: "andrew@example.com",
        password: "Red123$"
    }).expect(201)

    const user = await User.findById(response.body.user._id);
    expect(user).not.toBeNull()

    // assertions about the response.
    expect(response.body).toMatchObject({
        user: {
            name: "Andrew",
            email: "andrew@example.com"
        },
        token: user.tokens[0].token
    });

    expect(user.password).not.toBe("Red123$");
})

test("Should log in existing user", async () => {
    const response = await request(app).post("/users/login").send({
        email: userOne.email,
        password: userOne.password
    }).expect(200);

    const user = await User.findById(response.body.user._id);
    expect(user.tokens[1].token).toBe(response.body.token);
})

test("Should not log in non existing user", async () => {
    await request(app).post("/users/login").send({
        email: userOne.email,
        password: 'thisisnotmypassword'
    }).expect(400);
})

test("Should get profile for User", async () => {
    await request(app)
        .get("/users/me")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
})

test("Should not get profile for unauthorized User", async () => {
    await request(app)
        .get("/users/me")
        .send()
        .expect(401);
})

test("Should delete user for authorized user", async () => {
    await request(app)
        .delete("/users/me")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200);
    const user = await User.findById(userOneId);
    expect(user).toBeNull();
})

test("Should not delete user for unauthorized user", async () => {
    await request(app)
        .delete("/users/me")
        .send()
        .expect(401)
})

test("Should upload test image", async () => {
    await request(app)
        .post("/users/me/avatar")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .attach("avatar", "tests/fixtures/profile-pic.jpg")
        .expect(200)
    const user = await User.findById(userOneId)
    expect(user.avatar).toEqual(expect.any(Buffer));
})

test("Should update valid user fields", async () => {
    await request(app)
        .patch("/users/me")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            name: "James"
        })
        .expect(200)

    const user = await User.findById(userOneId);
    expect(user.name).toBe("James");
})

test("Should not update invalid user fields", async () => {
    await request(app)
        .patch("/users/me")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            location: "Philly"
        })
        .expect(400)
})