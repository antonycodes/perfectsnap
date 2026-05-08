const cloudinary = require('cloudinary').v2;
cloudinary.config({ cloudinary_url: 'cloudinary://469491542346813:A2KAZ_tYF_fXuOveXM7AeWPxGm4@antony12' });
cloudinary.api.resources({ max_results: 500, resource_type: 'image' }, (err, res) => {
  if (err) return console.error(err);
  const hits = res.resources.filter(r => r.public_id.match(/cps|bose|logo/i));
  hits.forEach(h => console.log(h.secure_url));
});
