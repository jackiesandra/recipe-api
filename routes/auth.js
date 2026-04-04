const express = require('express');
const passport = require('passport');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   get:
 *     summary: Login with GitHub
 *     description: Redirects the user to GitHub OAuth login.
 *     responses:
 *       302:
 *         description: Redirect to GitHub
 */
router.get('/login', passport.authenticate('github', { scope: ['user:email'] }));

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub OAuth callback
 *     description: GitHub redirects here after successful login.
 *     responses:
 *       302:
 *         description: Redirect after login
 */
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth/failure'
  }),
  (req, res) => {
    res.redirect('/auth/me');
  }
);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Current logged in user
 *     description: Returns the currently authenticated user.
 *     responses:
 *       200:
 *         description: Logged in user
 *       401:
 *         description: Not logged in
 */
router.get('/me', (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  res.status(200).json({
    message: 'Login successful',
    user: req.user
  });
});

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout current user
 *     description: Logs out the current authenticated user.
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }

    req.session.destroy(() => {
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });
});

/**
 * @swagger
 * /auth/failure:
 *   get:
 *     summary: OAuth failure route
 *     description: Returns authentication failure message.
 *     responses:
 *       401:
 *         description: Authentication failed
 */
router.get('/failure', (req, res) => {
  res.status(401).json({ message: 'GitHub authentication failed' });
});

module.exports = router;