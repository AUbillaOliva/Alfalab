const uploader = require("imgbb-uploader");

module.exports = {
  uploadImage: (file) => {
    return new Promise((res, rej) => {
      const secret = process.env.IMAGEBB_TOKEN;
      uploader(secret, file.path)
        .then((response) => {
          res(response);
          return;
        })
        .catch((error) => {
          rej(error.message);
          return;
        });
    });
  },
};
