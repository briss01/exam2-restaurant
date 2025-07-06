'use strict';

/* Data Access Object (DAO) module for accessing ingredients data */

const db = require('../db');

// This function returns all ingredients with their dependencies and incompatibilities
exports.listIngredients = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM ingredients`;
    db.all(sql, [], async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // For each ingredient, get dependencies and incompatibilities
        const ingredients = await Promise.all(rows.map(async (ing) => {
          // Dependencies - get names of required ingredients
          const depSql = `SELECT i.name FROM ingredient_dependencies d JOIN ingredients i ON d.depends_on_id = i.id WHERE d.ingredient_id = ?`;
          const dependencies = await new Promise((res, rej) => {
            db.all(depSql, [ing.id], (e, depRows) => {
              if (e) rej(e);
              else res(depRows.map(r => r.name));
            });
          });
          // Incompatibilities - get names of incompatible ingredients
          const incSql = `SELECT i.name FROM ingredient_incompatibilities inc JOIN ingredients i ON inc.ingredient2_id = i.id WHERE inc.ingredient1_id = ?`;
          const incompatibilities = await new Promise((res, rej) => {
            db.all(incSql, [ing.id], (e, incRows) => {
              if (e) rej(e);
              else res(incRows.map(r => r.name));
            });
          });
          return { ...ing, dependencies, incompatibilities };
        }));
        resolve(ingredients);
      }
    });
  });
};

// This function returns specific ingredients by their IDs
exports.getIngredientsByIds = (ingredientIds) => {
  return new Promise((resolve, reject) => {
    if (!ingredientIds || ingredientIds.length === 0) {
      resolve([]);
      return;
    }
    
    const placeholders = ingredientIds.map(() => '?').join(',');
    const sql = `SELECT * FROM ingredients WHERE id IN (${placeholders})`;
    
    db.all(sql, ingredientIds, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// This function returns the dependencies for a given ingredient ID
exports.getIngredientDependencies = (ingredientId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT depends_on_id FROM ingredient_dependencies WHERE ingredient_id = ?`;
    db.all(sql, [ingredientId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(r => r.depends_on_id));
      }
    });
  });
};

// This function returns the incompatibilities for a given ingredient ID
exports.getIngredientIncompatibilities = (ingredientId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT ingredient2_id FROM ingredient_incompatibilities WHERE ingredient1_id = ?`;
    db.all(sql, [ingredientId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows.map(r => r.ingredient2_id));
      }
    });
  });
};