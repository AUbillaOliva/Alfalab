const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const p = require("path");
const dir = "./reports";
const upload = multer({ dest: dir });

router.get("/", (req, res) => {
  res.send("Support");
});

router.post("/", upload.single("file"), (req, res) => {
  let deleteFilesRecursive = function(path, rmSelf) {
    fs.readdir(path, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlink(p.join(path, file), err => {
          if (err) throw err;
        });
      }
    });
  };
  let transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: req.body.user,
      pass: req.body.pass
    }
  });
  let message;
  if (req.file) {
    if (req.body.message) {
      message = {
        from: "support@alfalab.cl",
        to: "0f83c3473a-23647d@inbox.mailtrap.io",
        subject: "User report",
        text: req.body.message,
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path
          }
        ]
      };
    } else {
      message = {
        from: "support@alfalab.cl",
        to: "0f83c3473a-23647d@inbox.mailtrap.io",
        subject: "Crash report",
        text: "Alfalab App, Crash report",
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path
          }
        ]
      };
    }
  } else {
    message = {
      from: "support@alfalab.cl",
      to: "0f83c3473a-23647d@inbox.mailtrap.io",
      subject: "User report",
      text: req.body.message
    };
  }
  transport.sendMail(message, (err, info) => {
    if (err) {
      process.stdout.write('\033c');
      res.status(552);
      res.sendStatus(res.statusCode);
    } else {
      res.send("Report Sended");
      res.status(200);
      try {
        fs.stat(dir, function(err, stats) {
          if (!err) deleteFilesRecursive(dir);
        });
      } catch (e) {
        process.stdout.write('\033c');
        console.log("Error: " + e);
      }
    }
  });
});

module.exports = router;