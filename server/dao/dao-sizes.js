'use strict';

/* Data Access Object (DAO) module for accessing sizes data */

const db = require('../db');

// This function returns all sizes from the database ordered by price
exports.listSizes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sizes ORDER BY price';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// This function returns size information given its id
exports.getSizeById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM sizes WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};
