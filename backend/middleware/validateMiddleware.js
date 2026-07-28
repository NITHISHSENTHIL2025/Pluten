// backend/middleware/validateMiddleware.js

const validate = (schema) => (req, res, next) => {
    try {
        // Parse the request against the Zod schema
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });
        next(); // Data is perfectly valid, proceed to the controller
    } catch (error) {
        // If validation fails, intercept and return exact error messages
        const formattedErrors = error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
        }));
        
        return res.status(400).json({ 
            error: "Data Validation Failed", 
            details: formattedErrors 
        });
    }
};

module.exports = validate;