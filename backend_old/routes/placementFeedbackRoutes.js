
const express = require('express')
const { rateLimit } = require('express-rate-limit')
const PlacementFeedback = require('../models/PlacementFeedback')

const router = express.Router()

const allowedRounds = new Set([
  'Aptitude',
  'Online Assessment',
  'Coding',
  'Group Discussion',
  'Technical Interview',
  'HR Interview',
  'Other'
])

const allowedDifficulty = new Set([
  'Not sure',
  'Easy',
  'Moderate',
  'Hard'
])

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false
})

router.post('/', limiter, async (req, res) => {
  try {
    const data = req.body

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({
        error: 'Invalid feedback.'
      })
    }

    const companyName = typeof data.companyName === 'string'
      ? data.companyName.trim() : ''

    const jobRole = typeof data.jobRole === 'string'
      ? data.jobRole.trim() : ''

    const questionsAsked = typeof data.questionsAsked === 'string'
      ? data.questionsAsked.trim() : ''

    const experience = typeof data.experience === 'string'
      ? data.experience.trim() : ''

    const rounds = data.rounds ?? []
    const difficulty = data.difficulty ?? 'Not sure'
    const driveDate = data.driveDate ?? ''

    if (
      companyName.length < 2 ||
      companyName.length > 120 ||
      jobRole.length > 120 ||
      questionsAsked.length < 20 ||
      questionsAsked.length > 5000 ||
      experience.length > 2000
    ) {
      return res.status(400).json({
        error: 'Please check the required fields and length limits.'
      })
    }

    if (
      !Array.isArray(rounds) ||
      rounds.length > allowedRounds.size ||
      new Set(rounds).size !== rounds.length ||
      !rounds.every(r => allowedRounds.has(r))
    ) {
      return res.status(400).json({
        error: 'Invalid interview rounds.'
      })
    }

    if (!allowedDifficulty.has(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty.'
      })
    }

    if (typeof driveDate !== 'string') {
      return res.status(400).json({
        error: 'Invalid drive date.'
      })
    }

    if (driveDate) {
      const parsedDate = new Date(`${driveDate}T00:00:00Z`)

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(driveDate) ||
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== driveDate ||
        driveDate > new Date().toISOString().slice(0, 10)
      ) {
        return res.status(400).json({
          error: 'Invalid drive date.'
        })
      }
    }

    if (data.consent !== true) {
      return res.status(400).json({
        error: 'Consent is required.'
      })
    }

    await PlacementFeedback.create({
      companyName,
      jobRole,
      driveDate,
      rounds,
      questionsAsked,
      difficulty,
      experience,
      consent: true
    })

    return res.status(201).json({
      message: 'Feedback submitted successfully.'
    })

  } catch (error) {
    console.error('Feedback submission error:', error)

    return res.status(500).json({
      error: 'Failed to submit feedback.'
    })
  }
})

module.exports = router
