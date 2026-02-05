const mongoo = require("mongoose")

const NewUser = new mongoo.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email:
    {
        type: String,
        required: true,
        unique: true
    },
    password:
    {
        type: String,
        required: true
    },
    phoneNumber:
    {
        type: Number,
        unique: true

    },
    profilePicture:
    {
        type: String,
        default: ""

    },
    owner:
    {
        type: Boolean,
        default: false
    }




},
    {
        timestamps: true
    })

const users = mongoo.model("users", NewUser)

module.exports = users;