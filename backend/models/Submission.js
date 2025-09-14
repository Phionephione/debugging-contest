const mongoose = require('mongoose');
const SubmissionSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }, username: String, problemId: mongoose.Schema.Types.ObjectId, problemTitle: String, status: String, submittedAt: { type: Date, default: Date.now } });
module.exports = mongoose.model('Submission', SubmissionSchema);