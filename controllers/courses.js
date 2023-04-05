const geocoder = require('../utils/geocoder')
const Course = require('../models/Course')
const Training = require('../models/Training')
const ErrorResponse = require('../utils/errorResponse')

// @desc   Get courses
// @route  GET /api/courses
// @route  GET /api/trainings/:trainingId/courses
// @access Public
exports.getCourses = async (req, res, next) => {
  try {
    if (req.params.trainingId) {
      const courses = await Course.find({ training: req.params.trainingId })

      return res.status(200).json({
        success: true,
        count: courses.length,
        data: courses
      })
    } else {
      res.status(200).json(res.advancedResults)
    }

  } catch (error) {
    next(error)
  }
}

// @desc   Get single course
// @route  GET /api/courses/:id
// @access Public
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'training',
      select: 'name description'
    })

    if (!course) {
      return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404))
    }
    res.status(200).json({ success: true, data: course })
  } catch (error) {
    next(error)
  }
}

// @desc   Add course
// @route  POST /api/trainings/:trainingId/courses
// @access Private
exports.addCourse = async (req, res, next) => {
  try {
    req.body.training = req.params.trainingId
    req.body.user = req.user.id

    const training = await Training.findById(req.params.trainingId)

    if (!training) {
      return next(new ErrorResponse(`No training with the id of ${req.params.trainingId}`, 404))
    }

    // Ellenőrzés, hogy az aktuális user a tulajdonosa a frissítendő képzésnek
    if (training.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('Csak a képzés létrehozója vehet fel új kurzust!', 401)
      )
    }

    const course = await Course.create(req.body)

    res.status(200).json({ success: true, data: course })
  } catch (error) {
    next(error)
  }
}

// @desc   Update course
// @route  PUT /api/courses/:id
// @access Private
exports.updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id)

    if (!course) {
      return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404))
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })

    res.status(200).json({ success: true, data: course })
  } catch (error) {
    next(error)
  }
}

// @desc   Delete course
// @route  DELETE /api/courses/:id
// @access Private
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return next(new ErrorResponse(`No course with the id of ${req.params.id}`, 404))
    }

    await course.remove()

    res.status(200).json({ success: true, data: {} })
  } catch (error) {
    next(error)
  }
}