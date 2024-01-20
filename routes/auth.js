const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/userSchema");
const UserOtp = require("../models/userOtpSchema");
const nodemailer = require("nodemailer");
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");
const emailExistence = require("email-existence");

// email config
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Temporary storage for user registration data
const registrationData = {};
// Temporary storage for user login data
const loginData = {};

// register router
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please filled all fields" });
  }

  try {
    let userExists = await User.findOne({ email: email });

    if (userExists) {
      return res
        .status(400)
        .json({ error: "User with this email is already exist" });
    } else {
      try {
        emailExistence.check(email, (err, result) => {
          if (err) {
            res.status(400).json({ error: "Internal Server Error" });
          } else {
            if (result) {
              // Generate OTP
              const OTP = Math.floor(100000 + Math.random() * 900000);

              // Send OTP to user's email
              const mailOptions = {
                from: process.env.EMAIL,
                to: email,
                subject: "OTP for Registration",
                text: `Hi, 👋\n\nWe have noticed that a new action was taken on your Evernote account. ✅ To ensure that this action was initiated by you, we require you to verify your account by entering the following code on your Evernote platform. 🔒 Please note that this code will expire after 10 minutes. ⏰\n\nVerification Code: ${OTP} 📝\n\nIf you did not initiate this action, please ignore this email. ❌\n\nThank you for choosing Evernote. 🚀\n\nBest regards,\nEvernote Team 👩‍💻👨‍💻`,
              };

              transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                  res.status(400).json({ error: "Internal Server Error" });
                } else {
                  let userOtpExists = await UserOtp.findOne({ email: email });

                  if (userOtpExists) {
                    // update existing user OTP to userotp collection
                    userOtpExists.otp = OTP;
                    await userOtpExists.save();
                  } else {
                    // Save new user OTP to userotp collection
                    const saveOtpData = new UserOtp({
                      email,
                      otp: OTP,
                    });

                    await saveOtpData.save();
                  }

                  // generate new password
                  const salt = await bcrypt.genSalt(10);
                  const secPass = await bcrypt.hash(req.body.password, salt);

                  // Save user registration data in temporary storage
                  registrationData[email] = {
                    name: name,
                    email: email,
                    password: secPass,
                    otp: OTP,
                  };
                  res.status(200).json({ message: "OTP Sent Successfully" });
                }
              });
            } else {
              res
                .status(400)
                .json({ error: "Invalid Email...!" });
            }
          }
        });
      } catch (error) {
        res.status(400).json({ error: "Internal Server Error" });
      }
    }
  } catch (error) {
    res.status(400).json({ error: "Internal Server Error" });
  }
});

// register otp verification router
router.post("/registerOtpVerify", async (req, res) => {
  const { otp, email } = req.body;

  if ((!otp, !email)) {
    return res.status(400).json({ error: "Please filled the OTP" });
  }
  try {
    let userData = registrationData[email];
    if (userData && userData.otp == otp) {
      // Save user registration data to users collection
      const userRegisterData = new User(userData);
      await userRegisterData.save();

      const authtoken = jwt.sign(userRegisterData.id, JWT_SECRET);
      res.status(200).json({
        message: "User registered Successfully",
        authtoken: authtoken,
      });

      // Remove the user data from temporary storage
      delete registrationData[email];
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    res.status(400).json({ error: "Internal Server Error" });
  }
});

// login router
router.post("/loginWithOtp", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Please filled all fields" });
  }

  try {
    let userExists = await User.findOne({ email: email });

    if (userExists) {
      // Generate OTP
      const OTP = Math.floor(100000 + Math.random() * 900000);

      // Send OTP to user's email
      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "OTP for Login",
        text: `Hi, 👋\n\nWe have noticed that a new action was taken on your Evernote account. ✅ To ensure that this action was initiated by you, we require you to verify your account by entering the following code on your Evernote platform. 🔒 Please note that this code will expire after 10 minutes. ⏰\n\nVerification Code: ${OTP} 📝\n\nIf you did not initiate this action, please ignore this email. ❌\n\nThank you for choosing Evernote. 🚀\n\nBest regards,\nEvernote Team 👩‍💻👨‍💻`,
      };

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          res
            .status(400)
            .json({ error: "OTP not Sent. Try one more time.OTP not sent" });
        } else {
          let userOtpExists = await UserOtp.findOne({ email: email });

          // update existing user OTP to userotp collection
          userOtpExists.otp = OTP;
          await userOtpExists.save();

          // Save user login data in temporary storage
          loginData[email] = {
            email: email,
            otp: OTP,
          };
          res.status(200).json({ message: "OTP Sent Successfully" });
        }
      });
    } else {
      return res
        .status(400)
        .json({ error: "User with this email doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error: "Internal Server Error" });
  }
});

// login otp verification router
router.post("/loginOtpVerify", async (req, res) => {
  const { otp, email } = req.body;

  if ((!otp, !email)) {
    return res.status(400).json({ error: "Please filled the OTP" });
  }
  try {
    let userData = loginData[email];
    if (userData && userData.otp == otp) {
      let userExists = await User.findOne({ email: email });
      const authtoken = jwt.sign(userExists.id, JWT_SECRET);
      res
        .status(200)
        .json({ message: "User login Successfully", authtoken: authtoken });

      // Remove the user data from temporary storage
      delete loginData[email];
    } else {
      res.status(400).json({ error: "Invalid OTP" });
    }
  } catch (error) {
    res.status(400).json({ error: "Internal Server Error" });
  }
});

// login with password router
router.post("/loginWithPassword", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please filled all fields" });
  }

  try {
    let userExists = await User.findOne({ email: email });

    if (userExists) {
      const isMatch = await bcrypt.compare(password, userExists.password);

      if (isMatch) {
        const authtoken = jwt.sign(userExists.id, JWT_SECRET);
        res
          .status(200)
          .json({ message: "User login Successfully", authtoken: authtoken });
      } else {
        return res.status(400).json({ error: "Invalid credentials" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "User with this email doesn't exist" });
    }
  } catch (error) {
    res.status(400).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
