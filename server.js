const express = require('express');
require('dotenv').config();

const mongodb = require('./database/connect');
const ObjectId = require('mongodb').ObjectId;
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Swagger config
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Recipe API',
      version: '1.0.0',
      description: 'API for managing recipes'
    },
    servers: [
      {
        url: `http://localhost:${port}`
      }
    ]
  },
  apis: ['./server.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Validation function
function validateRecipe(recipe) {
  const errors = [];

  if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim() === '') {
    errors.push('Name is required and must be a string.');
  }

  if (recipe.price === undefined || typeof recipe.price !== 'number') {
    errors.push('Price is required and must be a number.');
  }

  if (!recipe.category || typeof recipe.category !== 'string' || recipe.category.trim() === '') {
    errors.push('Category is required and must be a string.');
  }

  if (!Array.isArray(recipe.ingredients)) {
    errors.push('Ingredients is required and must be an array.');
  }

  if (recipe.calories === undefined || typeof recipe.calories !== 'number') {
    errors.push('Calories is required and must be a number.');
  }

  if (typeof recipe.available !== 'boolean') {
    errors.push('Available is required and must be true or false.');
  }

  if (!recipe.createdAt || typeof recipe.createdAt !== 'string' || recipe.createdAt.trim() === '') {
    errors.push('CreatedAt is required and must be a string.');
  }

  return errors;
}

/**
 * @swagger
 * /:
 *   get:
 *     summary: Test route
 *     description: Returns a simple message to confirm the API is running.
 *     responses:
 *       200:
 *         description: API is running successfully
 */
app.get('/', (req, res) => {
  res.send('Recipe API is running');
});

/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: Get all recipes
 *     description: Retrieves all recipes from the database.
 *     responses:
 *       200:
 *         description: A list of recipes
 *       500:
 *         description: Server error
 */
app.get('/recipes', async (req, res) => {
  try {
    const db = mongodb.getDb();
    const result = await db.collection('recipes').find().toArray();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a new recipe
 *     description: Adds a new recipe to the database.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               calories:
 *                 type: number
 *               available:
 *                 type: boolean
 *               createdAt:
 *                 type: string
 *             example:
 *               name: Quesadilla
 *               price: 8.99
 *               category: Mexican
 *               ingredients: [cheese, tortilla]
 *               calories: 500
 *               available: true
 *               createdAt: 2026-03-26
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
app.post('/recipes', async (req, res) => {
  try {
    const recipe = req.body;
    const errors = validateRecipe(recipe);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const db = mongodb.getDb();
    const result = await db.collection('recipes').insertOne(recipe);

    res.status(201).json({
      message: 'Recipe created successfully',
      insertedId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /recipes/{id}:
 *   put:
 *     summary: Update a recipe
 *     description: Replaces an existing recipe by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               ingredients:
 *                 type: array
 *                 items:
 *                   type: string
 *               calories:
 *                 type: number
 *               available:
 *                 type: boolean
 *               createdAt:
 *                 type: string
 *             example:
 *               name: Tacos al Pastor
 *               price: 10.99
 *               category: Mexican
 *               ingredients: [pork, tortilla, pineapple]
 *               calories: 650
 *               available: true
 *               createdAt: 2026-03-26
 *     responses:
 *       200:
 *         description: Recipe updated successfully
 *       400:
 *         description: Invalid ID or validation error
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
app.put('/recipes/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    const updatedRecipe = req.body;
    const errors = validateRecipe(updatedRecipe);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const db = mongodb.getDb();
    const recipeId = new ObjectId(req.params.id);

    const result = await db.collection('recipes').replaceOne(
      { _id: recipeId },
      updatedRecipe
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: 'Recipe updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     description: Deletes a recipe by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Recipe ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recipe deleted successfully
 *       400:
 *         description: Invalid recipe ID
 *       404:
 *         description: Recipe not found
 *       500:
 *         description: Server error
 */
app.delete('/recipes/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe ID' });
    }

    const db = mongodb.getDb();
    const recipeId = new ObjectId(req.params.id);

    const result = await db.collection('recipes').deleteOne({ _id: recipeId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.status(200).json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Connect to MongoDB
mongodb.initDb((err) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  }
});