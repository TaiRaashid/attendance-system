const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

const router = express.Router();
//register new user
router.post('/register',async (req,res)=>{
  console.log('REGISTER REQUEST:', req.body);

  const { name,email,password,role,department,enrollmentNumber } = req.body;
    //checking if an email already exists in database
    try{
        const existingUser = await User.findOne({ email });
        if(existingUser){
            return res.status(400).json({ msg: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({name,email,password: hashedPassword,role});
        const savedUser = await user.save();

        if(role === 'student'){
            if(!enrollmentNumber)return res.status(400).json({ msg: 'Enrollment Number missing' });

            const student = new Student({
                user: savedUser._id,
                enrollmentNumber
            });
            await student.save();
        }
        if(role === 'teacher'){
            if(!department)return res.status(400).json({ msg: 'Department missing' });

            const teacher = new Teacher({
                user: savedUser._id,
                department
            });
            await teacher.save();
        }
        res.status(201).json({ msg:'User registered!'});
    }catch(err){
        res.status(500).json({ msg: 'Server error',error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;