const router = require("express").Router();
const bcrypt = require("bcrypt");
const pool = require("../db");
const validInfo = require("../middleware/validInfo");
const jwtGenerator = require("../utils/jwtGenerator");
const authorization = require("../middleware/authorization");
const otpGenerator = require("otp-generator");
const { check, validationResult } = require('express-validator');
// const { exec } = require('child_process');
const nodemailer = require("nodemailer");

router.post("/send-otp", async (req, res) => {
  try {
    const { email, password } = req.body;
   
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "Email and password are required" });
    }

  
    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const storedPassword = user.rows[0].user_password;


    const passwordMatch = await bcrypt.compare(password, storedPassword);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: "Invalid email or password" });
    }

    const userId = user.rows[0].user_id;

    
    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    const existingVerification = await pool.query(
      "SELECT * FROM userVerification WHERE user_id = $1",
      [userId]
    );

    if (existingVerification.rows.length > 0) {

      await pool.query(
        "UPDATE userVerification SET user_verification_code = $1 WHERE user_id = $2",
        [otp, userId]
      );
    } else {

      await pool.query(
        "INSERT INTO userVerification (user_id, user_verification_code) VALUES ($1, $2)",
        [userId, otp]
      );
    }


    

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      auth: {
          user: 'the email that is going to provide the otp',
          pass: 'passcode of the email'
      }
  });


  const mailOptions = {
      from: '"Verification Provider"<the email that is going to provide the otp>',
      to: `${email}`,
      subject: "OTP Verification",
      text: `Your OTP for login verification is: ${otp}`,
    };

   
  
    

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ success: false, error: "Failed to send OTP" });
      } else {
        console.log("OTP email sent");
        res.json({ success: true });
      } 

      // console.log("Message sent: %s", info.messageId);
      // console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

    });
  } catch (err) {
    console.error("Server error:", err.message);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});




router.post("/register",[
  check('name').notEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Invalid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], validInfo, async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array()[0].msg });
  }
  
  const { name, email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email
    ]);


    

    if (user.rows.length !== 0) {
      return res.status(401).json("User already exist!");
    }

    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (user_name, user_email, user_password) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
    );

      
    const token = jwtGenerator(newUser.rows[0].user_id);
  

    res.json({token});

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


const MAX_LOGIN_ATTEMPTS = 3; 
const LOCKOUT_DURATION = 1 * 60 * 60 * 1000; 


router.post("/login", [
  check("email").isEmail().withMessage("Invalid email"),
  check("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  check("otp").notEmpty().withMessage("OTP is required"),
], validInfo, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array()[0].msg });
    }

    const { email, password, otp } = req.body;

    const user = await pool.query("SELECT * FROM users WHERE user_email = $1", [
      email
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Password or Email is incorrect");
    }

    const userId = user.rows[0].user_id;

    const check = await pool.query("SELECT * FROM userVerification WHERE user_id = $1 AND user_verification_code = $2", [userId, otp]);

    if (check.rows.length === 0) {
      // Incorrect OTP
      const userAttempt = await pool.query("SELECT * FROM userAttempt WHERE user_id = $1", [
        userId
      ]);

      let attemptCount = 0;
      let attemptTime = new Date().getTime();

      if (userAttempt.rows.length > 0) {
        attemptCount = userAttempt.rows[0].user_attempt_count;
        attemptTime = userAttempt.rows[0].user_attempt_time.getTime();
      }

      attemptCount++;

      // Update attempt count and time
      await pool.query(
        "INSERT INTO userAttempt (user_id, user_attempt_count, user_attempt_time) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET user_attempt_count = $2, user_attempt_time = $3",
        [userId, attemptCount, new Date()]
      );

      if (attemptCount > MAX_LOGIN_ATTEMPTS && attemptTime + LOCKOUT_DURATION > new Date().getTime()) {

        // Account locked
        const remainingTime = attemptTime + LOCKOUT_DURATION - new Date().getTime();
        return res.status(401).json({ error: `Account locked. Please try again after ${remainingTime} milliseconds` });
      } else {
        return res.status(401).json("OTP is incorrect");
      }
    }

    const userAttempt = await pool.query("SELECT * FROM userAttempt WHERE user_id = $1", [
      userId
    ]);

    let attemptCount = 0;
    let attemptTime = new Date().getTime();

    if (userAttempt.rows.length > 0) {
      attemptCount = userAttempt.rows[0].user_attempt_count;
      attemptTime = userAttempt.rows[0].user_attempt_time.getTime();
    }

    const currentTime = new Date().getTime();
    const timeDifference = currentTime - attemptTime;

    if (attemptCount >= MAX_LOGIN_ATTEMPTS && timeDifference < LOCKOUT_DURATION) {

      // Account is locked
      const remainingTime = LOCKOUT_DURATION - timeDifference;
      return res.status(401).json({ error: `Account locked. Please try again after ${remainingTime} milliseconds` });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].user_password
    );

    if (!validPassword) {

      // Invalid password
      attemptCount++;

      if (attemptCount >= MAX_LOGIN_ATTEMPTS) {

        // Account locked after maximum attempts
        await pool.query(
          "INSERT INTO userAttempt (user_id, user_attempt_count, user_attempt_time) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET user_attempt_count = $2, user_attempt_time = $3",
          [userId, attemptCount, new Date()]
        );
        return res.status(401).json({ error: `Account locked. Please try again after ${LOCKOUT_DURATION} milliseconds` });
      } else {
        // Update attempt count and time
        await pool.query(
          "INSERT INTO userAttempt (user_id, user_attempt_count, user_attempt_time) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET user_attempt_count = $2, user_attempt_time = $3",
          [userId, attemptCount, new Date()]
        );
        return res.status(401).json("Password or Email is incorrect");
      }
    }

   
    // Reset the user attempt count and time after the lockout duration
    if (timeDifference >= LOCKOUT_DURATION) {
      // Reset attempt count and time
      attemptCount = 0;
      attemptTime = new Date().getTime();
      await pool.query(
        "INSERT INTO userAttempt (user_id, user_attempt_count, user_attempt_time) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET user_attempt_count = $2, user_attempt_time = $3",
        [userId, attemptCount, new Date()]
      );
    }

   
    const token = jwtGenerator(user.rows[0].user_id);
    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});



router.get("/is-verify", authorization, async (req, res) => {
  
    try {
  
      res.json(true);
  
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
});

module.exports = router;
