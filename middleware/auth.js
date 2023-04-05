const jwt = require('jsonwebtoken')
const ErrorResponse = require('../utils/errorResponse')
const User = require('../models/User')

// Útvonalak védelme
exports.protect = async (req, res, next) => {
    try {
        let token 

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // A token beállítása a Bearer tokennel a fejlécben
            token = req.headers.authorization.split(' ')[1]
        }
        else if (req.cookies.token) {
            // A token beállítása a sütiből
            token = req.cookies.token
        }

        // A token létezésének ellenőrzése
        if (!token) {
            return next(new ErrorResponse('Nincs engedélyed ehhez az útvonalhoz', 401))
        }

        // A token tartalmának ellenőrzése
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        console.log(decoded);

        req.user = await User.findById(decoded.id)

        next()
    } catch (error) {
        res.status(400).json({ success: false, msg: error.message });
    }
}

// Meghatározott szerepkör hozzáférési jogainak beállítása
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`A ${req.user.role} szerepköröd nem elégséges ehhez a művelethez`, 403))
        }
        next()
    }
}