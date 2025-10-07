const errorMiddleware = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle specific error types
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Authentication failed.";
    } else if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Session expired. Please log in again.";
    } else if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    } else if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map((val) => val.message).join(", ");
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};

module.exports = errorMiddleware;