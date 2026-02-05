const mongoose = require("mongoose");
const ownersSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true
        },
        contactNumber: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true, 
            unique: true
        },
        password: {
            type: String,
            required: true
        },
         proofOfOwnership: {
            type: String,
            required: true  
        },
        profilePicture: {
            type: String,
            default: ""
        },
            owner: {
            type: Boolean,
            default: true
        }

    },
    {
        timestamps: true
    }
);  
const ownersData = mongoose.model("ownersData", ownersSchema);
module.exports = ownersData;