'use strict';

/*** Importing modules ***/
const express = require('express');
const morgan = require('morgan');  // logging middleware
const { check, validationResult, param } = require('express-validator'); // validation middleware
const cors = require('cors');

const ordersDao = require('./dao/dao-orders'); // module for accessing the orders table in the DB
const userDao = require('./dao/dao-users'); // module for accessing the user table in the DB
const ingredientsDao = require('./dao/dao-ingredients'); // module for accessing the ingredients table in the DB
const basedishesDao = require('./dao/dao-basedishes'); // module for accessing the basedishes table in the DB
const sizesDao = require('./dao/dao-sizes'); // module for accessing the sizes table in the DB

/*** init express and set-up the middlewares ***/
const app = express();
app.use(morgan('dev'));
app.use(express.json());

/** Set up and enable Cross-Origin Resource Sharing (CORS) **/
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));


/*** Passport ***/

/** Authentication-related imports **/
const passport = require('passport');                              // authentication middleware
const LocalStrategy = require('passport-local');                   // authentication strategy (username and password)


const base32 = require('thirty-two');
const TotpStrategy = require('passport-totp').Strategy; // totp


/** Set up authentication strategy to search in the DB a user with a matching password.
 * The user object will contain other information extracted by the method userDao.getUser (i.e., id, username, name).
 **/
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  try {
    const user = await userDao.getUser(username, password);
    if(!user)
      return callback(null, false, 'Incorrect username or password');
    return callback(null, user);
  } catch (err) {
    return callback(err);
  }
}));

// Serializing in the session the user object given from LocalStrategy(verify).
passport.serializeUser(function (user, callback) {
  callback(null, user);
});

// Starting from the data in the session, we extract the current (logged-in) user.
passport.deserializeUser(function (user, callback) {
  return callback(null, user);
});

/** Creating the session */
const session = require('express-session');
app.use(session({
  secret: "restaurant exam 2025", 
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session'));

passport.use(new TotpStrategy(
  function (user, done) {
    try {
      return done(null, base32.decode(user.secret), 30);
    } catch (err) {
      return done(err);
    }
  })
);

/** Defining authentication verification middleware **/
const isLoggedIn = (req, res, next) => {
  if(req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({error: 'Not authorized'});
}

function isTotp(req, res, next) {
  if(req.session.method === 'totp')
    return next();
  return res.status(401).json({ error: 'Missing TOTP authentication'});
}

/*** Utility Functions ***/
const errorFormatter = ({ location, msg, param }) => {
  return `${location}[${param}]: ${msg}`;
};

/*** ORDERS APIs ***/

// GET /api/orders
app.get('/api/orders', isLoggedIn, async (req, res) => {
  try {
    const orders = await ordersDao.listOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/orders
app.post('/api/orders', isLoggedIn, [
  check('dishId').isInt({min:1}),
  check('sizeId').isInt({min:1}),
  check('ingredients').isArray(),
  check('total').isFloat({min:0})
], async (req, res) => {
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(422).json(errors.errors);
  }
  
  try {
    const order = req.body;
    order.user_id = req.user.id;
    
    // Server-side logic validation
    
    // Check if the selected dish exists
    const dishInfo = await basedishesDao.getDishById(order.dishId);
    if (!dishInfo) {
      return res.status(400).json({ error: 'Invalid dish selected' });
    }
    
    // Check if the selected size exists
    const sizeInfo = await sizesDao.getSizeById(order.sizeId);
    if (!sizeInfo) {
      return res.status(400).json({ error: 'Invalid size selected' });
    }
    
    // Validate ingredients if present
    if (order.ingredients && order.ingredients.length > 0) {
      // Get ingredient data from database for all validations
      const ingredientIds = order.ingredients.map(ing => ing.id);
      const currentIngredients = await ingredientsDao.getIngredientsByIds(ingredientIds);

      // Validate ingredient existence and availability using fetched data
      for (const orderIng of order.ingredients) {
        const dbIng = currentIngredients.find(ing => ing.id === orderIng.id);
        if (!dbIng) {
          return res.status(400).json({ error: `Ingredient with id ${orderIng.id} not found` });
        }
        if (dbIng.availability !== null && dbIng.availability === 0) {
          return res.status(400).json({ error: `${dbIng.name} is not available` });
        }
      }

      // Check size limits using data already retrieved
      if (order.ingredients.length > sizeInfo.max_ingredients) {
        return res.status(400).json({ error: `${sizeInfo.name} dishes can only have up to ${sizeInfo.max_ingredients} ingredients` });
      }

      // Check dependencies
      for (const ingredient of order.ingredients) {
        // Find ingredient info from database for name
        const dbIngredient = currentIngredients.find(ing => ing.id === ingredient.id);
        const ingredientName = dbIngredient ? dbIngredient.name : `ingredient ID ${ingredient.id}`;
        
        // Get list of ingredient IDs that this ingredient depends on
        const dependencies = await ingredientsDao.getIngredientDependencies(ingredient.id);
        
        // Verify that all required dependencies are present in the order
        for (const depId of dependencies) {
          if (!ingredientIds.includes(depId)) {
            // Get the name of the missing required ingredient
            let reqName;
            const reqIng = currentIngredients.find(ing => ing.id === depId);
            if (reqIng) {
              reqName = reqIng.name;
            } else {
              // Ingredient not in current order, need to fetch its name
              const missingIngredients = await ingredientsDao.getIngredientsByIds([depId]);
              reqName = missingIngredients.length > 0 ? missingIngredients[0].name : `ingredient ID ${depId}`;
            }
            return res.status(400).json({ error: `${ingredientName} requires ${reqName}` });
          }
        }
      }

      // Check incompatibilities
      for (const ingredient of order.ingredients) {
        // Find ingredient info from database for name
        const dbIngredient = currentIngredients.find(ing => ing.id === ingredient.id);
        const ingredientName = dbIngredient ? dbIngredient.name : `ingredient ID ${ingredient.id}`;
        
        // Get list of ingredient IDs that are incompatible with current ingredient
        const incompatibilities = await ingredientsDao.getIngredientIncompatibilities(ingredient.id);
        
        // Check if any incompatible ingredient is present in the order
        for (const incompId of incompatibilities) {
          if (ingredientIds.includes(incompId)) {
            // Find the name of the incompatible ingredient for error message
            const incompIng = currentIngredients.find(ing => ing.id === incompId);
            const incompName = incompIng ? incompIng.name : `ingredient ID ${incompId}`;
            return res.status(400).json({ error: `${ingredientName} is incompatible with ${incompName}` });
          }
        }
      }
    }
    
    // Final availability check just before order creation to prevent race conditions
    if (order.ingredients && order.ingredients.length > 0) {
      // Re-check ingredient existence and availability one more time
      const finalIngredientIds = order.ingredients.map(ing => ing.id);
      const finalIngredients = await ingredientsDao.getIngredientsByIds(finalIngredientIds);
      
      for (const orderIng of order.ingredients) {
        const dbIng = finalIngredients.find(ing => ing.id === orderIng.id);
        if (!dbIng) {
          return res.status(400).json({ error: `Ingredient with id ${orderIng.id} not found` });
        }
        if (dbIng.availability !== null && dbIng.availability === 0) {
          return res.status(400).json({ error: `${dbIng.name} is not available` });
        }
      }
    }
    
    // All validations passed, create the order
    const result = await ordersDao.createOrder(order);
    res.json(result);
  } catch (err) {
    if (err.error) {
      res.status(400).json({ error: err.error });
    } else {
      res.status(503).json({ error: 'Database error during order creation' });
    }
  }
});

// DELETE /api/orders/:id
app.delete('/api/orders/:id',
  isLoggedIn,
  isTotp,
  param('id').isInt({ min: 1 }).withMessage('Invalid order ID'),
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter);
    if (!errors.isEmpty()) {
      return res.status(422).json(errors.errors);
    }
    try {
      const orderId = parseInt(req.params.id);
      const numChanges = await ordersDao.deleteOrder(req.user.id, orderId);
      if (numChanges === 0) {
        res.status(404).json({ error: 'Order not found or unauthorized' });
      } else {
        res.status(200).json({ message: 'Order cancelled successfully', changes: numChanges });
      }
    } catch (err) {
      if (err.error) {
        res.status(400).json({ error: err.error });
      } else {
        res.status(503).json({ error: 'Database error during order cancellation' });
      }
    }
  }
);

/*** INGREDIENTS APIs ***/

// GET /api/ingredients
app.get('/api/ingredients', async (req, res) => {
  try {
    const ingredients = await ingredientsDao.listIngredients();
    res.json(ingredients);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

/*** BASEDISHES APIs ***/

// GET /api/basedishes
app.get('/api/basedishes', async (req, res) => {
  try {
    const dishes = await basedishesDao.listBaseDishes();
    res.json(dishes);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

/*** SIZES APIs ***/

// GET /api/sizes
app.get('/api/sizes', async (req, res) => {
  try {
    const sizes = await sizesDao.listSizes();
    res.json(sizes);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

/*** USER APIs ***/

function clientUserInfo(req) {
  const user = req.user;
  return {id: user.id, username: user.username, name: user.name, canDoTotp: user.secret ? true : false, isTotp: req.session.method === 'totp'};
}

// POST /api/sessions 
// This route is used for performing login.
app.post('/api/sessions', function(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      return res.status(401).json({ error: info });
    }
    req.login(user, (err) => {
      if (err)
        return next(err);
      return res.json(clientUserInfo(req));
    });
  })(req, res, next);
});

// POST /api/login-totp
app.post('/api/login-totp', isLoggedIn,
  passport.authenticate('totp'),
  function(req, res) {
    req.session.method = 'totp';
    res.json({otp: 'authorized'});
  }
);

// GET /api/sessions/current
// This route checks whether the user is logged in or not.
app.get('/api/sessions/current', (req, res) => {
  if(req.isAuthenticated()) {
    res.status(200).json(clientUserInfo(req));
  }
  else
    res.status(401).json({error: 'Not authenticated'});
});

// DELETE /api/sessions/current
// This route is used for logging out the current user.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.status(200).json({});
  });
});

// Activating the server
const PORT = 3001;
app.listen(PORT, (err) => {
  if (err) {
    console.log('Error starting server:', err);
  } else {
    console.log(`Server listening at http://localhost:${PORT}`);
  }
});