const mongoose= require('mongoose');

const imageSchema= mongoose.Schema(
    {   
        images : [
            {
                type: String
            },
        ],
        appId: String
    }
);

module.exports = mongoose.model("Images",imageSchema)