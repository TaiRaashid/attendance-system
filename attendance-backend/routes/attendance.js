const express = require('express');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');
const router = express.Router();

// 1. Mark attendance (teacher only)
router.post('/mark', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  const { courseId, date, records } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ msg: 'Course not found' });

    const attendanceDate = new Date(date);
    const bulkOps = records.map(record => ({
      updateOne: {
        filter: {
          course: courseId,
          student: record.studentId,
          date: attendanceDate
        },
        update: {
          $set: {
            status: record.status
          }
        },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(bulkOps);
    res.json({ msg: 'Attendance marked successfully', result });

  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//  2. Get attendance of a student
router.get('/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.params.studentId }).populate('course', 'title code');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//  3. Get attendance of a course
router.get('/course/:courseId', authenticateToken, async (req, res) => {
  try {
    const records = await Attendance.find({ course: req.params.courseId }).populate('student', 'enrollmentNumber user').populate('course', 'title');
    res.json({ records });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

//  4. Filter attendance by date range / percentage
router.post('/report', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  const { courseId, fromDate, toDate, minPercentage } = req.body;

  try {
    const matchStage = {
      course: new mongoose.Types.ObjectId(courseId)
    };

    if (fromDate || toDate) {
      matchStage.date = {};
      if (fromDate) matchStage.date.$gte = new Date(fromDate);
      if (toDate) matchStage.date.$lte = new Date(toDate);
    }

    const totalLectures = await Attendance.distinct('date', matchStage);
    const totalLectureCount = totalLectures.length;

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: "$student",
          presentCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "present"] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          studentId: "$_id",
          _id: 0,
          presentCount: 1,
          total: totalLectureCount,
          percentage: {
            $cond: [
              { $eq: [totalLectureCount, 0] },
              0,
              { $multiply: [{ $divide: ["$presentCount", totalLectureCount] }, 100] }
            ]
          }
        }
      }
    ];

    if (minPercentage) {
      pipeline.push({ $match: { percentage: { $gte: minPercentage } } });
    }

    const report = await Attendance.aggregate(pipeline);
    res.json({ totalLectures: totalLectureCount, report });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});


module.exports = router;
