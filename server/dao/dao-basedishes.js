'use strict';

/* Data Access Object (DAO) module for accessing basedishes data */

const db = require('../db');

// This function returns all base dishes from the database
exports.listBaseDishes = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, name FROM basedishes';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// This function returns a specific dish by ID
exports.getDishById = (dishId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, name FROM basedishes WHERE id = ?';
    db.get(sql, [dishId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // Returns null if not found
      }
    });
  });
};