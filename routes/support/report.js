const nodemailer = require("nodemailer");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const p = require("path");
const dir = "./tmpFiles/reports";
const upload = multer({ dest: dir });

router.get("/", (req, res) => {
  res.send("Support");
});

router.post("/", upload.single("file"), (req, res) => {
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

  const transport = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.ACRA_USER,
      pass: process.env.ACRA_PASS,
    },
  });

  let message;
  if (req.file) {
    if (req.body.message) {
      message = {
        from: "support@alfalab.cl",
        to: process.env.REPORT_MAIL_ADRESS,
        subject: "User report",
        text: req.body.message,
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path,
          },
        ],
      };
    } else {
      message = {
        from: "support@alfalab.cl",
        to: process.env.REPORT_MAIL_ADRESS,
        subject: "Crash report",
        text: "Alfalab App, Crash report",
        attachments: [
          {
            filename: req.file.originalname,
            path: req.file.path,
          },
        ],
      };
    }
  } else {
    message = {
      from: "support@alfalab.cl",
      to: process.env.REPORT_MAIL_ADRESS,
      subject: "User report",
      text: req.body.message,
    };
  }

  transport.sendMail(message, (err, info) => {
    if (err) {
      res.status(552);
      res.sendStatus(res.statusCode);
    } else {
      res.send("Report Sended");
      res.status(200);
      try {
        fs.stat(dir, function (err, stats) {
          if (!err) deleteFilesRecursive(dir);
        });
      } catch (error) {
        console.error(error.message);
        return res
          .send(500)
          .send(httpError.InternalServerError("Server error"));
      }
    }
  });
});

module.exports = router;
