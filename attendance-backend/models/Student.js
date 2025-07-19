const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    enrollmentNumber: { type: String, required: true},
    courses: [{type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

module.exports = mongoose.model('Student', studentSchema);