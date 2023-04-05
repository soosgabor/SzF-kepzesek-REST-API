const path = require('path')
const geocoder = require("../utils/geocoder");
const Training = require("../models/Training");
const ErrorResponse = require("../utils/errorResponse");

// @desc   Get all trainings
// @route  GET /api/trainings
// @access Public
exports.getTrainings = async (req, res, next) => {
  try {
    res
      .status(200)
      .json(res.advancedResults);
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

// @desc   Get single training
// @route  GET /api/trainings/:id
// @access Public
exports.getTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(400).json({ success: false, msg: "Not found" });
    }
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    next(new ErrorResponse(`Course id (${req.params.id}) not correct`, 404));
  }
};

// @desc   Create new training
// @route  POST /api/trainings/
// @access Private
exports.createTraining = async (req, res, next) => {
  try {
    // A user hozzáadása a kérés törzséhez
    req.body.user = req.user.id

    // Annak ellenőrzése, hogy az adott felhasználónak van-e publikált képzése
    const publishedTraining = await Training.findOne({ user: req.user.id })
    // Ha az adott felhasználó nem admin, akkor csak egy képzést hozhat létre
    if (publishedTraining && req.user.role !== 'admin') {
      return next(new ErrorResponse(`A (${req.user.id}) id-vel regisztrált user-nek már van publikált képzése `, 400));
    }

    const training = await Training.create(req.body);
    res.status(201).json({ success: true, data: training });
  } catch (error) {
    next(error);
  }
};

// @desc   Update training
// @route  PUT /api/trainings/:id
// @access Private
exports.updateTraining = async (req, res, next) => {
  try {
    let training = await Training.findById(req.params.id)
    if (!training) {
      return res.status(400).json({ success: false, msg: "Not found" });
    }
    // Ellenőrzés, hogy az aktuális user a tulajdonosa a frissítendő képzésnek
    if (training.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(
        new ErrorResponse('A képzést csak a létrehozója frissítheti!', 401)
      )
    }
    training = await Training.findOneAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
    res.status(200).json({ success: true, data: training });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

// @desc   Delete training
// @route  DELETE /api/trainings/:id
// @access Private
exports.deleteTraining = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(400).json({ success: false, msg: "Not found" });
    }
    training.remove()
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

// @desc   Get training within a radius (distance is km, radius is radian)
// @route  GET /api/trainings/radius/:zipcode/:distance
// @access Private
exports.getTrainingsInRadius = async (req, res, next) => {
  try {
    const { zipcode, distance } = req.params; // Get lat/lng from geocoder
    loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude; // Earth radius = 3963 miles / 6378 km
    const radius = distance / 6378;
    const trainings = await Training.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    });
    res
      .status(200)
      .json({ success: true, count: trainings.length, data: trainings });
  } catch (error) {
    res.status(400).json({ success: false });
  }
};

// @desc   Upload photo for training
// @route  PUT /api/trainings/:id/photo
// @access Private
exports.trainingPhotoUpload = async (req, res, next) => {
  try {
    const training = await Training.findById(req.params.id);
    if (!training) {
      return res.status(400).json({ success: false, msg: "Not found" });
    }
    
    if (!req.files) {
      return res.status(400).json({ success: false, msg: "Please upload a file" });
    }
    
    const file = req.files.file
    if (!file.mimetype.startsWith('image')) {
      return res.status(400).json({ success: false, msg: "Please upload an image file" });
    }

    if (file.size > process.env.MAX_FILE_UPLOAD) {
      return res.status(400).json({ success: false, msg: `Please upload an image less than ${process.env.MAX_FILE_UPLOAD}` });
    }

    file.name = `photo_${training.id}${path.parse(file.name).ext}`
    
    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, msg: `Problem with file upload` });
      }
    })

    await Training.findByIdAndUpdate(req.params.id, { photo: file.name })
    res.status(200).json({
      success: true,
      data: file.name
    })
  } catch (error) {
    res.status(400).json({ success: false });
  }
};