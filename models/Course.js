const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    weeks: {
        type: Number,
        required: [true, 'Please add a number of weeks']
    },
    price: {
        type: Number,
        default: 0.0
    },
    minimumSkill: {
        type: String,
        required: [true, 'Please add a minimum skill'],
        enum: ['beginner', 'intermediate', 'advanced']
    },
    training: {
        type: mongoose.Schema.ObjectId,
        ref: 'Training',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
})

// Statikus metódus az adott képzéshez tartozó kurzusok átlagos költségének kiszámítására
CourseSchema.statics.getAverageCost = async function(trainingId) {
    const obj = await this.aggregate([
        {
            $match: { training: trainingId }
        },
        {
            $group: {
                _id: '$training',
                averageCost: { $sum: '$price' }
            }
        }
    ])
    try {
        await this.model('Training').findByIdAndUpdate(trainingId, {
            totalCost: Math.ceil(obj[0].averageCost/10)*10
        })
    } catch (error) {
        console.error(error);
    }
}

// A getAverageCost hívása a mentés(create) után
CourseSchema.post('save', function() {
    this.constructor.getAverageCost(this.training)
})

// A getAverageCost hívása a remove(delete) előtt
CourseSchema.pre('remove', function() {
    this.constructor.getAverageCost(this.training)
})

module.exports = mongoose.model("Course", CourseSchema, "courses");