const portfolioService = require('../services/portfolioService');

function handleError(res, error, action) {
  console.error(`[PORTFOLIO] ${action} failed:`, error);

  const statusCode = error.statusCode || 500;

  return res.status(statusCode).json({
    error:
      statusCode === 500
        ? 'Portfolio operation failed.'
        : error.message,
  });
}

async function listPortfolios(req, res) {
  try {
    const portfolios =
      await portfolioService.getUserPortfolios(
        req.user.id,
      );

    return res.status(200).json({
      success: true,
      portfolios,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'list portfolios',
    );
  }
}

async function createPortfolio(req, res) {
  try {
    const result =
      await portfolioService.createPortfolio(
        req.user.id,
        req.body,
      );

    return res.status(201).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'create portfolio',
    );
  }
}

async function getPortfolio(req, res) {
  try {
    const portfolio =
      await portfolioService.getPortfolioForUser(
        req.user.id,
        req.params.id,
      );

    return res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'get portfolio',
    );
  }
}

async function updatePortfolio(req, res) {
  try {
    const result =
      await portfolioService.updatePortfolio(
        req.user.id,
        req.params.id,
        req.body,
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'update portfolio',
    );
  }
}

async function deletePortfolio(req, res) {
  try {
    const result =
      await portfolioService.deletePortfolio(
        req.user.id,
        req.params.id,
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'delete portfolio',
    );
  }
}

async function publishPortfolio(req, res) {
  try {
    const result =
      await portfolioService.publishPortfolio(
        req.user.id,
        req.params.id,
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'publish portfolio',
    );
  }
}

async function unpublishPortfolio(req, res) {
  try {
    const result =
      await portfolioService.unpublishPortfolio(
        req.user.id,
        req.params.id,
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'unpublish portfolio',
    );
  }
}

async function getPublicPortfolio(req, res) {
  try {
    const portfolio =
      await portfolioService.getPublicPortfolio(
        req.params.username,
      );

    return res.status(200).json({
      success: true,
      portfolio,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      'get public portfolio',
    );
  }
}

module.exports = {
  listPortfolios,
  createPortfolio,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
  getPublicPortfolio,
};