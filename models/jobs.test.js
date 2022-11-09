"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "test",
    salary: 100,
    equity: "0.1",
    companyHandle: "c1"
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      ...newJob,
      id: expect.any(Number),
    });
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works", async function () {
    let jobs = await Job.findAll();
    expect(jobs.length).toEqual(4);
    expect(jobs[0].companyHandle).toEqual(jobs[1].companyHandle);
  });
});

/************************************** findAllFiltered */

describe("findAllFiltered", function () {
  test("works: by min salary", async function () {
    let jobs = await Job.findAllFiltered({ minSalary: 250 });
    expect(jobs[0].title).toEqual("Job3");
  });

  test("works: by equity", async function () {
    let jobs = await Job.findAllFiltered({ hasEquity: true });
    expect(jobs.length).toEqual(2);
  });

  test("works: by min salary & equity", async function () {
    let jobs = await Job.findAllFiltered({ minSalary: 150, hasEquity: true });
    expect(jobs[0].title).toEqual("Job2");
  });

  test("works: by title", async function () {
    let jobs = await Job.findAll({ title: "ob1" });
    expect(jobs[0].title).toEqual("Job1");
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testJobIds[0]);
    expect(job.title).toEqual("Job1");
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 1000,
    equity: "0.5"
  };

  test("works", async function () {
    let job = await Job.update(testJobIds[0], updateData);
    expect(job.title).toEqual("New");
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testJobIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id=$1", [testJobIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
