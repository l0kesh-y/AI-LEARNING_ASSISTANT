/**
 * Authentication Routes
 * 
 * Handles user registration, login, profile management, and password changes.
 * All routes except /register and /login require JWT authentication.
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/register
 * 
 * Register a new user account
 * 
 * Request body:
 *   - name: User's full name
 *   - email: User's email address (must be unique)
 *   - password: User's password (will be hashed before storing)
 * 
 * Response:
 *   - 201: User created successfully with JWT token
 *   - 400: User already exists
 *   - 500: Server error
 */
router.post('/register', async (req, res) => {
  try {
    // Extract user data from request body
    const { name, email, password } = req.body;

    // Check if a user with this email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user instance (password will be hashed by pre-save hook)
    const user = new User({ name, email, password });
    await user.save();

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and user data (excluding password)
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * POST /api/auth/login
 * 
 * Authenticate existing user and return JWT token
 * 
 * Request body:
 *   - email: User's email address
 *   - password: User's password (plain text, will be compared with hashed version)
 * 
 * Response:
 *   - 200: Login successful with JWT token
 *   - 400: Invalid credentials (user not found or wrong password)
 *   - 500: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email address
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Compare provided password with hashed password in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token valid for 7 days
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response with token and user data
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * GET /api/auth/me
 * 
 * Get current authenticated user's profile
 * Requires: JWT token in Authorization header
 * 
 * Response:
 *   - 200: User profile data (without password)
 *   - 401: Unauthorized (invalid or missing token)
 *   - 500: Server error
 */
router.get('/me', auth, async (req, res) => {
  try {
    // req.userId is set by auth middleware after JWT verification
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/profile
 * 
 * Update current user's profile information
 * Requires: JWT token in Authorization header
 * 
 * Request body:
 *   - name: Updated name (optional)
 *   - avatar: Updated avatar object with color (optional)
 *   - preferences: Updated user preferences (optional)
 * 
 * Response:
 *   - 200: Updated user profile (without password)
 *   - 401: Unauthorized
 *   - 500: Server error
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;
    
    // Update user and return new data, run validators to ensure data integrity
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, avatar, preferences },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/auth/change-password
 * 
 * Change current user's password
 * Requires: JWT token in Authorization header
 * 
 * Request body:
 *   - currentPassword: User's current password for verification
 *   - newPassword: New password (minimum 6 characters)
 * 
 * Response:
 *   - 200: Password changed successfully
 *   - 400: Validation error (missing fields, wrong current password, or password too short)
 *   - 401: Unauthorized
 *   - 500: Server error
 */
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both current and new password are required' });
    }
    
    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    // Get user and verify current password
    const user = await User.findById(req.userId);
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Set new password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;