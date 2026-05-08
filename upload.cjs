const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloudinary_url: 'cloudinary://469491542346813:A2KAZ_tYF_fXuOveXM7AeWPxGm4@antony12' });
cloudinary.uploader.upload("/Users/antonynguyen/Antony/Workshop_Apple_05.2026/Logo CPS + Bose.png", function(error, result) {
  if (error) console.error(error);
  else console.log(result.secure_url);
});
