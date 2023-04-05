const crypto = require('crypto')
const User = require('../models/User')
const sendEmail = require('../utils/sendEmail')
const ErrorResponse = require('../utils/errorResponse')

// @desc   Register user
// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    //Create user
    const user = await User.create({ name, email, password, role })

    sendTokenResponse(user, 200, res)
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // email és jelszó ellenőrzése
    if (!email || !password) {
      return next(
        new ErrorResponse(
          'Kérem adjon meg egy email címet és egy jelszót!',
          400,
        ),
      )
    }

    // A felhasználó megkeresése az adatbázisban
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return next(new ErrorResponse('Érvénytelen email vagy jelszó!', 401))
    }

    // A jelszó megfelelőségének ellenőrzése
    const isMatch = await user.matchPassword(password)

    if (!isMatch) {
      return next(new ErrorResponse('Érvénytelen email vagy jelszó!', 401))
    }

    sendTokenResponse(user, 200, res)
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   Logout user / süti törlése
// @route  GET /api/auth/logout
// @access Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // 10 mp
      httpOnly: true
    })
    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   A bejelentkezett felhasználó megszerzése
// @route  POST /api/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   Felhasználói adatok frissítése
// @route  PUT /api/auth/updateddetails
// @access Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    })

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   A bejelentkezett felhasználó jelszavának frissítése
// @route  PUT /api/auth/updatepassword
// @access Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password')

    // Az aktuális jelszó ellenőrzése
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return next(new ErrorResponse('A jelszó helytelen', 401))
    }

    user.password = req.body.newPassword
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   Elfelejtett jelszó
// @route  POST /api/auth/forgotpassword
// @access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })

    if (!user) {
      return next(new ErrorResponse('Ehhez az email-hez nem tartozik felhasználó', 404))
    }

    // A reset token megszerzése
    const resetToken = user.getResetPasswordToken()

    await user.save({ validateBeforeSave: false })

    // A visszaállítási URL létrehozása
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/resetpassword/${resetToken}`

    const message = `Azért kaptad ezt az emailt, mert egy kérés érkezett hozzánk a jelszavad visszaállítására. A jelszó visszaállításához kattints az alábbi linkre: \n\n ${resetUrl}`

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password reset token',
        message
      })
      res.status(200).json({
        success: true,
        data: 'Email elküldve',
      })
    } catch (error) {
      console.log(err);
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined

      await user.save({ validateBeforeSave: false })

      return next(new ErrorResponse('Email nem lett elküldve', 500))
    }
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// @desc   A jelszó visszaállítása
// @route  PUT /api/auth/resetpassword/:resettoken
// @access Public
exports.resetPassword = async (req, res, next) => {
  try {
    // A hash-elt token megszerzése
    const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resettoken)
    .digest('hex')

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })

    if (!user) {
      return next(new ErrorResponse('Invalid token', 400))
    }

    // Az új jelszó beállítása
    user.password = req.body.password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    sendTokenResponse(user, 200, res)
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message })
  }
}

// Token megszerzése a modeltől, süti létrehozása és válasz küldése
const sendTokenResponse = (user, statusCode, res) => {
  // Token létrehozása
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false,
  }

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  })
}