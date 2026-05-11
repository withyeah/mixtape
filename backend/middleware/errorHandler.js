const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  console.error(`[${req.method}] ${req.path} → ${err.message}`);
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;