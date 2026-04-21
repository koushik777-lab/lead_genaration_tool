import logger from "../lib/logger.js";

const errorHandler = (err, req, res, next) => {
  logger.error(`❌ STACK TRACE: ${err.stack}`);
  logger.error(`❌ API ERROR: ${err.message} - ${req.originalUrl} - ${req.method}`);

  const statusCode = err.status || (res.statusCode === 200 ? 500 : res.statusCode);
  
  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

export default errorHandler;
