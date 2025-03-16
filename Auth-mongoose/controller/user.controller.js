import User from './../models/user.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if ((!name, !email, !password)) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      return res.status(400).json({ message: 'User not registered' });
    }
    const token = crypto.randomBytes(64).toString('hex');
    console.log('token: ', token);
    user.verificationToken = token;
    await user.save();
    console.log('user: ', user);
    //mail
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDER_EMAIL,
      to: user.email,
      subject: 'Verify your email',
      text: `Please click in the following link to verify your email: ${process.env.BASE_URL}/api/v1/users/verify/${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'User not registered', error });
  }

  console.log(req.body);
};

const verifyUser = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid token' });
    }
    user.isVerified = true;
    user.verificationToken = null;
    await user.save();
    res.status(200).json({ message: 'User verified successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'User not verified', error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid email and password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('isMatch', isMatch);
    if (!isMatch) {
      res
        .status(400)
        .json({ success: false, message: 'Invalid email and password' });
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      'shhhh',
      {
        expiresIn: '1d',
      }
    );
  } catch (error) {}
};

export { registerUser, verifyUser };
