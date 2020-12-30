const express = require("express");
const router = express.Router();
const multer = require("multer");
const { check, validationResult } = require("express-validator");
const httpError = require("http-errors");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const UserSchema = require("../../modules/User");
const User = mongoose.model("user", UserSchema);
const RefreshToken = require("../../modules/RefreshToken");
const auth = require("../../middleware/auth");
const {
  signAccessToken,
  signRefreshToken,
} = require("../../helpers/jwt_helper");
const { uploadImage } = require("../../helpers/profile_picture_helper");
const dir = "./tmpFiles/images";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    console.log(file);
    callback(null, dir);
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

/**
@route   POST api/users 
@desc    Register new users
@access  Public
*/
router.post(
  "/",
  [
    check("firstname", "Firstname is required").not().isEmpty(),
    check("lastname", "Lastname is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  upload.single("file"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstname, lastname, email, password } = req.body;

    const userFields = {};
    if (firstname) {
      userFields.firstname = firstname;
    }
    if (lastname) {
      userFields.lastname = lastname;
    }
    if (email) {
      userFields.email = email;
    }
    if (password) {
      userFields.password = password;
    }

    try {
      let user = await User.findOne({ email });
      if (user) {
        return res
          .status(406)
          .json({ errors: [{ msg: "User already exists" }] });
      } else {
        const salt = await bcrypt.genSalt(10);
        userFields.password = await bcrypt.hash(password, salt);
        user = await new User(userFields).save();

        const authToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);

        refreshTokenFields = {};
        if (user) {
          refreshTokenFields.user = user.id;
        }
        refreshTokenFields.token = refreshToken;
        refreshTokenFields.expires = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        new RefreshToken(refreshTokenFields).save();
        res.setHeader("Refresh-Token", refreshToken);
        return res.status(200).json({ token: authToken });
      }
    } catch (err) {
      console.log(err.message);
      return res
        .status(500)
        .send(httpError.InternalServerError("Server error"));
    }
  }
);

router.put(
  "/",
  [
    check("firstname", "Firstname is required").not().isEmpty(),
    check("lastname", "Lastname is required").not().isEmpty(),
    check("email", "Email is required").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 6 }),
  ],
  auth,
  async (req, res) => {
    try {
      let user = await User.findById(req.user.id).select("-password");
      console.log(user);
      if (user) {
        const { firstname, lastname, email, password } = req.body;
        userFields = user;
        if (firstname) {
          userFields.firstname = firstname;
        }
        if (lastname) {
          userFields.lastname = lastname;
        }
        if (email) {
          userFields.email = email;
        }
        if (password) {
          userFields.password;
          const salt = await bcrypt.genSalt(10);
          userFields.password = await bcrypt.hash(password, salt);
        }
        user = await new User(userFields).save();

        const authToken = await signAccessToken(user.id);
        const refreshToken = await signRefreshToken(user.id);

        res.setHeader("Refresh-Token", refreshToken);
        return res.status(200).json({ token: authToken });

        //return res.status(200).send(user);
      } else {
        return res.status(404).send(httpError.NotFound("User not found"));
      }
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .send(httpError.InternalServerError("Server error"));
    }
  }
);

router.post("/picture", upload.single("file"), auth, async (req, res) => {
  const deleteFilesRecursive = function (path, rmSelf) {
    fs.readdir(path, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(p.join(path, file), (err) => {
          if (err) throw err;
        });
      }
    });
  };
  try {
    let user = await User.findById(req.user.id);
    if (user) {
      const response = await uploadImage(req.file);
      userFields = user;
      userFields.profileImage = response.url;
      user = await User.findOneAndUpdate(
        { _id: user.id },
        {
          $set: userFields,
          new: false,
        }
      );
      deleteFilesRecursive(dir);
      return res.status(200).send(user);
    } else {
      return res.status(404).send(httpError.NotFound());
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send(httpError.InternalServerError("Server error"));
  }
});

/**
@route POST api/users/tokens 
@desc Return refresh tokens of user 
@param id User id 
@access Private 
*/
router.get("/tokens/:id?", auth, async (req, res) => {
  try {
    let tokens = await RefreshToken.find({
      user: mongoose.Types.ObjectId(req.user.id),
    });
    if (tokens) {
      return res.status(200).send(tokens);
    } else {
      return res.status(404).json(httpError.NotFound("No tokens found"));
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json(httpError.InternalServerError("Server error"));
  }
});

/**
@route   DELETE api/users
@desc    Delete user from DB
@param id User id
@access  Private
*/
router.delete("/:id?", auth, async (req, res) => {
  try {
    let user = await User.findById(req.user.userId);
    if (user) {
      await RefreshToken.findOneAndDelete({ user: user._id });
      await User.findOneAndDelete({ _id: user._id });
      return res.status(200).json({ msg: `User ${user._id} deleted` });
    } else {
      return res.status(404).send(httpError.NotFound("User not found"));
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).json(httpError.InternalServerError("Server error"));
  }
});

module.exports = router;
