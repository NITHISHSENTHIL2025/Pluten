// backend/utils/catchAsync.js

// This function wraps your controllers and automatically passes any crashes to the Error Middleware
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

module.exports = catchAsync;