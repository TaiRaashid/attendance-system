const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Create a course (admin or teacher)
router.post('/create', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
  const { title, code } = req.body;

  try {
    const existing = await Course.findOne({ code });
    if (existing) return res.status(400).json({ msg: 'Course code already exists' });

    const course = new Course({ title, code });
    await course.save();
    res.status(201).json({ msg: 'Course created', course });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Assign teacher to a course
router.post('/assign-teacher', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { courseId, teacherId } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

    course.teacher = teacher._id;
    await course.save();

    teacher.courses.push(course._id);
    await teacher.save();

    res.json({ msg: 'Teacher assigned', course });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Enroll student in a course
router.post('/enroll-student', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
  const { courseId, studentId } = req.body;

  try {
    const course = await Course.findById(courseId);
    const student = await Student.findById(studentId);

    if (!course || !student) return res.status(404).json({ msg: 'Course or Student not found' });

    if (!course.students.includes(student._id)) {
      course.students.push(student._id);
      await course.save();
    }

    if (!student.courses.includes(course._id)) {
      student.courses.push(course._id);
      await student.save();
    }

    res.json({ msg: 'Student enrolled successfully', course });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Get all students of a course
router.get('/:courseId/students', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId).populate({
      path: 'students',
      populate: { path: 'user', select: 'name email' }
    });

    if (!course) return res.status(404).json({ msg: 'Course not found' });

    res.json({ students: course.students });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// GET all students with attendance summary for a course
router.get('/:id/students', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate('students', '-password');

    if (!course) {
      return res.status(404).json({ msg: 'Course not found' });
    }

    // Total distinct lecture dates for this course
    const totalLectures = await Attendance.distinct('date', { course: courseId });
    const totalLectureCount = totalLectures.length;

    const studentSummaries = await Promise.all(
      course.students.map(async (student) => {
        const presentCount = await Attendance.countDocuments({
          course: courseId,
          student: student._id,
          status: 'present',
        });

        const percentage = totalLectureCount > 0
          ? ((presentCount / totalLectureCount) * 100).toFixed(2)
          : '0.00';

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          presentCount,
          totalLectures: totalLectureCount,
          percentage,
        };
      })
    );

    res.json({
      course: {
        _id: course._id,
        name: course.name,
      },
      students: studentSummaries,
    });

  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


module.exports = router;

//Delete a course form database
router.post('/delete', authenticateToken, authorizeRoles("admin"), async(req, res) => {

    const { courseId }  = req.body

  try{
    const course = await Course.findById(courseId)
    if(!course){
      return res.status(404).json({ msg: 'Course not found'});
    }

    //Delete course from Teacher collection
    if(course.teacher){
      await Teacher.findByIdAndUpdate(course.teacher, {
        $pull: {courses: course._id}
      })
    }

    //Delete course from studnet collection
    if(course.students && course.students.length > 0){
      await Student.updateMany(
        {_id: { $in: course.students }},
        {$pull: {courses: course._id}}
      )
    }

    //Delete Attendance record for the course
    await Attendance.deleteMany({ course: course._id });

    
    await Course.findByIdAndDelete(courseId);

    res.json({msg: "Course Deleted", deletedCourse: course})
  }catch(err){
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
})

//Update course data
router.post('/:courseId/update', authenticateToken, authorizeRoles("admin"), async (req, res) =>{
  const courseId = req.params.courseId
  const { title, code} = req.body
  try {

    if(!title || !code) return res.status(400).json({msg:"Insufficient given data"});

    const course = await Course.findById(courseId);
    if(!course) return res.status(404).json({ msg: 'Course not found'});

    course.code = code;
    course.title = title;
    await course.save();

    res.json({msg: "Course Updated Succesfully"})

  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
})

//Get all courses
router.get('/all', authenticateToken, authorizeRoles("admin", "teacher"), async (req, res) => {

  try { 
    const courses = await Course.find({}).populate({
      path: 'students',
      populate: {path: 'user', select: 'name email'}
    }).populate({
      path: 'teacher',
      populate: {path: 'user', select: "name email"}
    })
    res.json({msg: "Courses Fetched Succesfully", courses})
  }
  catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }

})