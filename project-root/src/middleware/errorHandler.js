import logger from '../logger.js';

const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Внутренняя ошибка сервера';

  // Логирование ошибки
  logger.error({
    message: err.message,
    stack: err.stack,
    status: status,
    path: req.path,
    method: req.method
  });

  res.status(status).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;