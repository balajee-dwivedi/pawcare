/** Attach an HTTP status to expected application errors. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Forward rejected async controller promises to Express error middleware. */
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export function requireDatabase(req, res, next) {
  // Mongoose connection state 1 is connected; avoiding buffered queries keeps failures clear.
  import('./db.js').then(({ isDatabaseReady }) => {
    if (!isDatabaseReady()) return next(new HttpError(503, 'MongoDB is not connected. Configure MONGODB_URI and try again.'));
    next();
  }).catch(next);
}
