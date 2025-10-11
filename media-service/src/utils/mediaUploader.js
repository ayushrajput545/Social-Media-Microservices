const logger = require("./logger");
const cloudinary = require("cloudinary").v2;

exports.uploadMediaToCloudinary = async (file, folder, height, quality) => {
  return new Promise((resolve, reject) => {

    // ✅ Build dynamic upload options
    const options = {
      folder: folder || "default-folder",
      resource_type: "auto",
    };

    if (height) options.height = height;
    if (quality) options.quality = quality;

    logger.info("Starting Cloudinary upload stream...");

    // ✅ Create upload stream (for buffer-based upload)
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        logger.error("❌ Error occurred while uploading media to Cloudinary:", error);
        reject(error);
      } else {
        logger.info(`✅ Cloudinary upload successful! Public ID: ${result.public_id}`);
        resolve(result);
      }
    });

    // ✅ Stream file buffer directly to Cloudinary
    uploadStream.end(file.buffer);
  });
};


//delete media from cloudinary
exports.deleteMediaFromCloudinary = async(publicId)=>{
  try{
    const result = await cloudinary.uploader.destroy(publicId)
    logger.info('Media deleted successfully from cloud storage', publicId)
    return result
  }
  catch(err){
    logger.error('Error deleting media from cloudinary...' , err)
    throw err
  }
}