const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./routes/trainings.js']

const doc = {
    info: {
        version: "1.0.0",
        title: "SzF képzések API",
        description: "A dokumentációt a <b>swagger-autogen</b> modul generálta."
    },
    host: "localhost:3000",
    basePath: "/api",
    schemes: ['http', 'https'],
    consumes: ['application/json'], // A Content-Type fejléc típusa
    produces: ['application/json'], // A válasz típusa
  
    tags: [
        {
            "name": "Trainings",
            "description": "Szoftverfejlesztő képzések nyilvántartása"
        },
        {
            "name": "Courses",
            "description": "Adott képzés kurzusainak nyilvántartása"
        },
        {
            "name": "Users",
            "description": "Az API felhasználóinak kezelése"
        },
        {
            "name": "Ratings",
            "description": "Az egyes képzések értékelése"
        },
    ],
    securityDefinitions: {
        api_key: {
            type: "apiKey",
            name: "api_key",
            in: "header"
        },
        store_auth: {
            type: "oauth2",
            authorizationUrl: "https://store.swagger.io/oauth/authorize",
            flow: "implicit",
            scopes: {
                read_pets: "read your trainings",
                write_pets: "modify training in your account"
            }
        }
    },
    definitions: {
        Training: {
            _id: "5d713995b721c3bb38c1f5d0",
            user: "5d7a514b5d2c12c7449be045",
            $name: "Jedlik Ányos Gépipari és Informatikai Technikum", // kötelező
            $description: "Az iskola képzési profilja...",
            website: "https://jedlik.eu",
            email: "jedlik@jedlik.eu",
            address: "7 Szent Istvan Rd Győr 9021",
            careers: ["Web Development", "UI/UX", "Business"],
            housing: true
        }
    }
}

swaggerAutogen(outputFile, endpointsFiles, doc)
.then(() => {
    require('./server.js')
})