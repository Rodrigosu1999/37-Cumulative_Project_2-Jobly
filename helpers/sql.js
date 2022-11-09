const { BadRequestError } = require("../expressError");

// The function receives the data to update from the request.body 
// And writes it into SQL syntax to insert into our models
// This is done so we can update different number of columns from users 
// or companies without commiting to always write all of the possible keys 

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  //Get an array of keys (what we want to update)
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
