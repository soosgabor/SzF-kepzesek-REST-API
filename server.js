const path = require('path')
const express = require('express')
require('dotenv').config() // A .env fájlt olvassa
const morgan = require('morgan')
const fileUpload = require('express-fileupload')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const xss = require('xss-clean')
const rateLimit = require('express-rate-limit')
const hpp = require('hpp')
const cors = require('cors')
const errorHandler = require('./middleware/error')

const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
const mongoString = process.env.DATABASE_URL;
mongoose.connect(mongoString);
const database = mongoose.connection;

database.on("error", (error) => {
  console.log(error);
});

database.once("connected", () => {
  console.log(`Database Connected ${database.host}`);
});

const trainings = require('./routes/trainings')
const courses = require('./routes/courses')
const auth = require('./routes/auth')

const app = express()

// body parser
app.use(express.json())

// cookie parser
app.use(cookieParser())

app.use(morgan('dev'))

app.use(fileUpload())

// Adat fertőtlenítés
app.use(mongoSanitize())

// Cross Side Scripting támadás megelőzése
app.use(xss())

// Biztonsági fejlécek beállítása
app.use(helmet())

// Lekérésszám korlátozása
const limiter = rateLimit({
  windowMs: 10*60*1000, // 10 perc
  max: 100 // A teszteléshez, később 100 lesz
})
app.use(limiter)

// Http paraméter mérgezés elleni védelem
app.use(hpp())

// CORS engedélyezése
app.use(cors({
  origin: 'https://szf-kepzesek.cyclic.app/'
}))

app.use(express.static(path.join(__dirname, 'public/uploads')))

app.use("/api/trainings", trainings);
app.use("/api/courses", courses);
app.use("/api/auth", auth);
app.use(errorHandler)  

app.get('/', (req, res) => {
    res.status(400).json({ success: false})
})

app.listen(process.env.PORT, console.log(`Server running on port ${process.env.PORT}`));
