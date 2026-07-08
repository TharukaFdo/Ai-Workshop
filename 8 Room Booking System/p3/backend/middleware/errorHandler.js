const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // Mask raw database errors from being exposed to the client
  if (err.sqlState || err.code) {
    statusCode = 500;
    message = 'A database error occurred. Please contact the administrator.';
  }
  
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
