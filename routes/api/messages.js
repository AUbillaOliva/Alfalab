const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const httpError = require("http-errors");
const Message = require("../../modules/Message");
const auth = require("../../middleware/auth");
const { check, validationResult } = require("express-validator");
const UserSchema = require("../../modules/User");
const User = mongoose.model("user", UserSchema);

/**
@route   GET api/messages
@desc    Get all messages
@access  Private
*/
router.get("/", auth, async (req, res) => {
  try {
    const message = await Message.find();
    if (message) {
      return res.status(200).send(message);
    } else {
      return res.status(404).send(httpError.NotFound("Messages not found"));
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send(httpError.InternalServerError("Server error"));
  }
});

/**
@route   GET api/messages
@desc    Get all messages
@param   id message id
@access  Private
*/
router.post(
  "/:id?",
  [
    [
      check("title").not().isEmpty(),
      check("author").not().isEmpty(),
      check("created_at").not().isEmpty(),
    ],
  ],
  auth,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, author, created_at } = req.body;

    const messageFields = {};
    if (title) {
      messageFields.title = title;
    }
    if (content) {
      messageFields.content = content;
    }
    if (author) {
      let user = await User.findOne({ email: author.email }).select(
        "-password"
      );
      if (user) {
        messageFields.author = user;
      } else {
        return res.status(404).send(httpError.NotFound("User not found"));
      }
    }
    if (created_at) {
      messageFields.created_at = created_at;
    }

    const id = req.query.id;
    let message;
    try {
      if (id) {
        message = await Message.findOneAndUpdate(
          { _id: id },
          {
            $set: messageFields,
            new: false,
          }
        );
        console.log(`Message ${id} updated`);
        return res.status(204).send(message);
      } else {
        message = new Message(messageFields);
        await message.save();
        return res.status(200).send(message);
      }
    } catch (error) {
      console.error(error.message);
      return res
        .status(500)
        .send(httpError.InternalServerError("Server error"));
    }
  }
);

/**
@route   GET api/messages
@desc    Get all messages
@param   id message id
@access  Private
*/
router.delete("/:id?", auth, async (req, res) => {
  try {
    const id = req.query.id;
    if (id) {
      let message = await Message.findById(id);
      if (message) {
        await Message.findByIdAndRemove({ _id: id })
          .then(() => {
            return res.status(200).json({ msg: `Message ${id} removed` });
          })
          .catch((error) => {
            return res.status(402).send(httpError.BadRequest(error.message));
          });
      } else {
        return res.status(404).send(httpError.NotFound("Message not found"));
      }
    } else {
      return res.status(402).send(httpError.BadRequest(error.message));
    }
  } catch (error) {
    console.error(error.message);
    return res.status(500).send(httpError.InternalServerError("Server error"));
  }
});

module.exports = router;
