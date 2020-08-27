const request = require("supertest");
const app = require("../src/app");
const Task = require("../src/models/task");
const { userOneId, userOne, userTwo, taskOne, setupDatabase } = require("./fixtures/db");

beforeEach(setupDatabase)

test("Should create task for user", async () => {
    const response = await request(app)
        .post("/tasks")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: "from my test"
        })
        .expect(201)

    const task = await Task.findById(response.body._id);
    expect(task).not.toBeNull();
    expect(task.completed).toBe(false);
})

test("Should get all tasks for user one", async () => {
    const response = await request(app)
        .get("/tasks")
        .set("authorization", `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)

    const tasks = response.body;

    expect(tasks.length).toBe(2);
})

test("Delete the first task with the second user", async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set("authorization", `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(401);

    const task = await Task.findById(taskOne._id);
    expect(task).not.toBeNull();
})
