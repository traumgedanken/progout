const cloudinary = require("cloudinary");
const { promisify } = require("util");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

cloudinary.uploadFile = promisify((file, folder, type, callback) => {
    cloudinary.v2.uploader
        .upload_stream(
            { resource_type: type || "raw", folder, public_id: file.name },
            (err, result) => {
                if (err) callback(err);
                else callback(null, result.url);
            }
        )
        .end(file.data);
});

// !
cloudinary.deleteFile = promisify((url, callback) => {
    cloudinary.v2.uploader.destroy(url, (err, result) => {
        if (err) callback(err);
        else callback(null, result);
    });
});

module.exports = cloudinary;
