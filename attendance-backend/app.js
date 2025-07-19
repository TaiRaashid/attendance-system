const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

const courseRoutes = require('./routes/course');
app.use('/api/courses', courseRoutes);

const attendanceRoutes = require('./routes/attendance');
app.use('/api/attendance', attendanceRoutes);

const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

app.get('/',(req,res)=>{
    res.send("Attendance portal running");
});

mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(()=>console.log('MongoDB connected successfully.')).catch(err=>console.err("MongoDB connection unsuccessful",err));

const PORT = process.env.PORT || 5000;
app.listen(PORT,()=>console.log(`Server running on ${PORT}`));