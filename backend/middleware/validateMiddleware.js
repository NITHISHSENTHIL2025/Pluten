const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({ body: req.body, query: req.query, params: req.params });
    next();
  } catch (error) {
    const issues = error?.issues || error?.errors || [];
    return res.status(400).json({
      error: 'Data validation failed.',
      details: issues.map((item) => ({ field: item.path?.join('.') || 'unknown', message: item.message })),
    });
  }
};

module.exports = validate;
