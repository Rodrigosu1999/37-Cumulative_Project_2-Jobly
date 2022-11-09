"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle } * */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          companyHandle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);
    return jobsRes.rows;
  }

  /** Find all jobs with filters.
   *
   * Returns [{ id, title, salary, equity, companyHandle }, ...]
   * */

  static async findAllFiltered(data) {
    const title = data.title || null;
    const minSalary = data.minSalary || 0;
    const hasEquity = data.hasEquity || 0;

    let querySql;
    let result;

    //Query depends on if a title was provided
    if (!title) {
      querySql = `
                      SELECT id,
                          title,
                          salary,
                          equity,
                          company_handle AS "companyHandle"
                      FROM jobs`;
      result = await db.query(querySql);
    } else {
      querySql = `
                      SELECT id, 
                          title,
                          salary,
                          equity,
                          company_handle AS "companyHandle"
                      FROM jobs
                      WHERE title ILIKE '%'||$1||'%'`;
      result = await db.query(querySql, [title]);
    }
    
    const jobs = result.rows;

    if (!jobs) throw new NotFoundError(`No companies with said filters`);

    let filteredCompanies;

    //If no equity was filtered, we will get all  jobs, if equity is given as true, all jobs with equity above 0 will be provided
    if (!hasEquity) {
      filteredCompanies = jobs.filter(job => job.salary >= minSalary && job.equity >= hasEquity);
      
      return filteredCompanies;
    }

    filteredCompanies = jobs.filter(job => job.salary >= minSalary && job.equity > 0);

    return filteredCompanies;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

   static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    //Request to get the company from the job
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity, companyHandle}
   *
   * Returns {id, title, salary, equity, companyHandle
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "copmany_handle"
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${handleVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No company: ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
