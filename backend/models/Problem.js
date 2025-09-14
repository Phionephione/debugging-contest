// =================================================================
// == models/Problem.js - FINAL WITH OPTIONAL INPUT               ==
// =================================================================
const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    title: String,
    description: String,
    language: String,
    buggyCode: String,
    marks: {
        type: Number,
        required: true,
        default: 10
    },
    testCases: [{
        // This field is now optional. It can be an empty string or not exist.
        input: String, 
        
        expectedOutput: {
            type: String,
            required: true
        },
    }]
});

module.exports = mongoose.model('Problem', ProblemSchema);