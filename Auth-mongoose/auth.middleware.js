import jwt from 'jsonwebtoken';

export const isLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies?.token || '';
    console.log('Token Found', token ? 'Yes' : 'No');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token Verified', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Error in isLoggedIn middleware', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal Server Error' });
  }
  next();
};
