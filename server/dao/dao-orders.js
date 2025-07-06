'use strict';

/* Data Access Object (DAO) module for accessing orders data */

const db = require('../db');

// This function returns all orders for a specific user with their ingredients
exports.listOrders = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT o.id, o.dish_id, o.size_id, o.total, b.name as dishName, s.name as sizeName, s.price as sizePrice
                 FROM orders o 
                 JOIN basedishes b ON o.dish_id = b.id 
                 JOIN sizes s ON o.size_id = s.id 
                 WHERE o.user_id = ?`;
    db.all(sql, [userId], async (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // For each order, get ingredients
        const orders = await Promise.all(rows.map(async (order) => {
          const ingSql = `SELECT i.* FROM order_ingredients oi JOIN ingredients i ON oi.ingredient_id = i.id WHERE oi.order_id = ?`;
          const ingredients = await new Promise((res, rej) => {
            db.all(ingSql, [order.id], (e, ingRows) => {
              if (e) rej(e);
              else res(ingRows);
            });
          });
          return { 
            id: order.id,
            dish: order.dishName,
            dishId: order.dish_id,
            size: order.sizeName,
            sizeId: order.size_id,
            sizePrice: order.sizePrice,
            total: order.total,
            ingredients: ingredients
          };
        }));
        // Sort orders by ID in descending order (most recent first)
        orders.sort((a, b) => b.id - a.id);
        resolve(orders);
      }
    });
  });
};

// This function creates a new order 
exports.createOrder = (order) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err);
        reject({ error: 'Failed to start transaction: ' + err.message });
        return;
      }
      
      const sql = `INSERT INTO orders (user_id, dish_id, size_id, total) VALUES (?, ?, ?, ?)`;
      
      db.run(sql, [order.user_id, order.dishId, order.sizeId, order.total], function(err) {
        if (err) {
          console.error('Error creating order:', err);
          db.run('ROLLBACK');
          reject({ error: 'Failed to create order: ' + err.message });
          return;
        }
        
        const orderId = this.lastID;
        
        // Handle case where there are no ingredients
        if (!order.ingredients || order.ingredients.length === 0) {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('Error committing empty order:', err);
              db.run('ROLLBACK');
              reject({ error: 'Failed to commit order: ' + err.message });
              return;
            }
            resolve({ id: orderId });
          });
          return;
        }
        
        // Insert ingredients and update availability sequentially 
        let currentIndex = 0;
        function processNextIngredient() {
          if (currentIndex >= order.ingredients.length) {
            db.run('COMMIT', (err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                db.run('ROLLBACK');
                reject({ error: 'Failed to commit order: ' + err.message });
                return;
              }
              resolve({ id: orderId });
            });
            return;
          }
          const ing = order.ingredients[currentIndex];
          db.run('INSERT INTO order_ingredients (order_id, ingredient_id) VALUES (?, ?)', [orderId, ing.id], (err) => {
            if (err) {
              console.error('Error adding ingredient:', err);
              db.run('ROLLBACK');
              reject({ error: 'Failed to add ingredients: ' + err.message });
              return;
            }
            db.run('UPDATE ingredients SET availability = availability - 1 WHERE id = ? AND availability IS NOT NULL AND availability > 0', [ing.id], (err) => {
              if (err) {
                console.error('Error updating availability:', err);
                db.run('ROLLBACK');
                reject({ error: 'Failed to update availability: ' + err.message });
                return;
              }
              currentIndex++;
              processNextIngredient();
            });
          });
        }
        processNextIngredient();
      });
    });
  });
};

// This function deletes an order and restores ingredient availability
exports.deleteOrder = (userId, orderId) => {
  return new Promise((resolve, reject) => {
    db.run('BEGIN TRANSACTION', (err) => {
      if (err) {
        console.error('Error beginning transaction:', err);
        reject({ error: 'Failed to start transaction: ' + err.message });
        return;
      }
      // Get ingredients for the order to restore availability
      const ingSql = 'SELECT ingredient_id FROM order_ingredients WHERE order_id = ?';
      db.all(ingSql, [orderId], (err, ingRows) => {
        if (err) {
          db.run('ROLLBACK');
          reject({ error: 'Failed to get order ingredients' });
          return;
        }
        let currentIndex = 0;
        function processNextRestore() {
          if (currentIndex >= ingRows.length) {
            db.run('DELETE FROM order_ingredients WHERE order_id = ?', [orderId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject({ error: 'Failed to delete order ingredients' });
                return;
              }
              db.run('DELETE FROM orders WHERE id = ? AND user_id = ?', [orderId, userId], function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  reject({ error: 'Failed to delete order' });
                  return;
                }
                db.run('COMMIT', (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject({ error: 'Failed to commit deletion' });
                    return;
                  }
                  resolve(this.changes);
                });
              });
            });
            return;
          }
          const row = ingRows[currentIndex];
          db.run('UPDATE ingredients SET availability = availability + 1 WHERE id = ? AND availability IS NOT NULL', [row.ingredient_id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject({ error: 'Failed to restore ingredient availability' });
              return;
            }
            currentIndex++;
            processNextRestore();
          });
        }
        processNextRestore();
      });
    });
  });
};