'use strict';

/** DB access module **/

const sqlite3 = require('sqlite3');

// open the database
const db = new sqlite3.Database('./restaurant.db', (err) => {
  if (err) throw err;
});

module.exports = db; 