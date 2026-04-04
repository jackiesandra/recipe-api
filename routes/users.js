const express = require('express');
const { ObjectId } = require('mongodb');
const mongodb = require('../database/connect');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

function validateUser(user) {
  const errors = [];

  if (!user.name || typeof user.name !== 'string' || user.name.trim() === '') {
    errors.push('Name is required and must be a string.');
  }

  if (!user.email || typeof user.email !== 'string' || user.email.trim() === '') {
    errors.push('Email is required and must be a string.');
  }

  if (!user.role || typeof user.role !== 'string' || user.role.trim() === '') {
    errors.push('Role is required and must be a string.');
  }

  return errors;
}

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves all users from the database.
 *     responses:
 *       200:
 *         description: A list of users
 *       500:
 *         description: Server error
 */
router.get('/', async (req, res) => {
  try {
    const db = mongodb.getDb();
    const result = await db.collection('users').find().toArray();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get one user by ID
 *     description: Retrieves a single user by ID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const db = mongodb.getDb();
    const userId = new ObjectId(req.params.id);
    const result = await db.collection('users').findOne({ _id: userId });

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Protected route. Requires login.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *             example:
 *               name: Sandra Rodriguez
 *               email: sandra@email.com
 *               role: admin
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const user = req.body;
    const errors = validateUser(user);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const db = mongodb.getDb();
    const result = await db.collection('users').insertOne(user);

    res.status(201).json({
      message: 'User created successfully',
      insertedId: result.insertedId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Protected route. Requires login.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *             example:
 *               name: Sandra Rodriguez
 *               email: sandra@email.com
 *               role: employee
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid ID or validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const updatedUser = req.body;
    const errors = validateUser(updatedUser);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const db = mongodb.getDb();
    const userId = new ObjectId(req.params.id);

    const result = await db.collection('users').replaceOne(
      { _id: userId },
      updatedUser
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Protected route. Requires login.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const db = mongodb.getDb();
    const userId = new ObjectId(req.params.id);

    const result = await db.collection('users').deleteOne({ _id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;