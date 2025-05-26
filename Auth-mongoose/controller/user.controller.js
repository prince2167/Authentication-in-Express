import User from './../models/user.model.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

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
  if (!token) {
    return res.status(400).json({ message: 'Invalid token' });
  }
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
      process.env.JWT_SECRET,
      {
        expiresIn: '1d',
      }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {}
};

const getMe = async (req, res) => {
  try {
    const id = res.locals.userData.id;
    const user = await User.findById(id).select('-password');
    console.log('user', user);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      message: 'User found',
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error });
  }
};
const logoutUser = async (req, res) => {
  try {
    res.userDaata = null;
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({
      success: true,
      message: 'User logged out successfully',
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Internal Server Error', error });
  }
};
const forgotPassword = async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '15m',
    });
    console.log('resetToken: ', resetToken);
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();
    console.log('user: ', user);

    const resetURL = `${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}`;

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
      text: `Please click in the following link to reset your password: ${resetURL}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (error) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ message: 'Token and password are required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    if (
      !user ||
      user.resetPasswordToken !== token ||
      user.resetPasswordExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid or expired token' });
    }

    user.resetPasswordToken = '';
    user.resetPasswordExpires = '';
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export {
  registerUser,
  verifyUser,
  login,
  getMe,
  logoutUser,
  forgotPassword,
  resetPassword,
};
