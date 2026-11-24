
const mongoose = require('mongoose')

const placementFeedbackSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },

  jobRole: {
    type: String,
    default: '',
    trim: true,
    maxlength: 120
  },

  driveDate: {
    type: String,
    default: ''
  },

  rounds: [{
    type: String,
    enum: [
      'Aptitude',
      'Online Assessment',
      'Coding',
      'Group Discussion',
      'Technical Interview',
      'HR Interview',
      'Other'
    ]
  }],

  questionsAsked: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 5000
  },

  difficulty: {
    type: String,
    enum: ['Not sure', 'Easy', 'Moderate', 'Hard'],
    default: 'Not sure'
  },

  experience: {
    type: String,
    default: '',
    maxlength: 2000
  },

  consent: {
    type: Boolean,
    required: true,
    enum: [true]
  },

  reviewStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  source: {
    type: String,
    default: 'placement-portal'
  }

}, { timestamps: true })

module.exports = mongoose.model(
  'PlacementFeedback',
  placementFeedbackSchema
)
