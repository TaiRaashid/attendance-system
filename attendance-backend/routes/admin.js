const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// GET all users
// routes/admin.js
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Create a new user (admin only)
router.post('/create-user', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, email, password, role, enrollmentNumber, department } = req.body;

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User already exists' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    if (role === 'student') newUser.enrollmentNumber = enrollmentNumber;
    if (role === 'teacher') newUser.department = department;

    const savedUser = await newUser.save();

    // Create linked student/teacher document if needed
    if (role === 'student') {
      await Student.create({ user: savedUser._id, enrollmentNumber });
    } else if (role === 'teacher') {
      await Teacher.create({ user: savedUser._id, department });
    }

    res.status(201).json({ msg: 'User created successfully', user: savedUser });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//Update User Profile
router.put('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name, email, role, enrollmentNumber, department } = req.body;

  try {
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role }, { new: true });

    if (role === 'student') {
      await Student.findOneAndUpdate({ user: user._id }, { enrollmentNumber }, { upsert: true });
    } else if (role === 'teacher') {
      await Teacher.findOneAndUpdate({ user: user._id }, { department }, { upsert: true });
    }

    res.status(200).json({ message: 'User updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');

    // Now fetch extra info for students and teachers
    const populatedUsers = await Promise.all(users.map(async user => {
      let extra = {};
      if (user.role === 'student') {
        const student = await Student.findOne({ user: user._id });
        if (student) extra.enrollmentNumber = student.enrollmentNumber;
      } else if (user.role === 'teacher') {
        const teacher = await Teacher.findOne({ user: user._id });
        if (teacher) extra.department = teacher.department;
      }
      return {
        ...user.toObject(),
        ...extra
      };
    }));

    res.json(populatedUsers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


const Course = require('../models/Course');

// Add student to course
router.post('/courses/:courseId/add-student/:studentId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      await course.save();
    }

    res.json({ msg: 'Student added to course' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Remove student from course
router.post('/courses/:courseId/remove-student/:studentId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    course.students = course.students.filter(id => id.toString() !== studentId);
    await course.save();

    res.json({ msg: 'Student removed from course' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Delete user
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
