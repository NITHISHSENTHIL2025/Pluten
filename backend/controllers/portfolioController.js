const portfolioService = require('../services/portfolioService');
const { recordAnalyticsEvent } = require('../utils/analytics');

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

    const sessionKey = String(req.headers['x-analytics-session'] || '').trim() || null;
    const visitorId = String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim();
    await recordAnalyticsEvent({type:'PORTFOLIO_CREATED',visitorId,sessionKey,userId:req.user.id,portfolioId:result?.portfolio?.id||result?.id||null}).catch(()=>null);
    return res.status(201).json({ success:true, ...result });
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

    return res.status(200).json({ success:true, ...result });
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

    const sessionKey = String(req.headers['x-analytics-session'] || '').trim() || null;
    const visitorId = String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim();
    await recordAnalyticsEvent({type:'PORTFOLIO_PUBLISHED',visitorId,sessionKey,userId:req.user.id,portfolioId:result?.portfolio?.id||result?.id||req.params.id}).catch(()=>null);

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

    const sessionKey = String(req.headers['x-analytics-session'] || '').trim() || null;
    const visitorId = String(req.headers['x-analytics-visitor'] || `user:${req.user.id}`).trim();
    await recordAnalyticsEvent({type:'PORTFOLIO_UNPUBLISHED',visitorId,sessionKey,userId:req.user.id,portfolioId:result?.portfolio?.id||result?.id||req.params.id}).catch(()=>null);

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
    const portfolio = await portfolioService.getPublicPortfolio(req.params.username);
    return res.status(200).json({ success: true, portfolio });
  } catch (error) {
    if (error?.statusCode === 404) {
      const redirectTo = await portfolioService.getRedirectForOldSlug(req.params.username).catch(() => null);
      if (redirectTo) return res.status(200).json({ success: true, redirectTo });
    }
    return handleError(res, error, 'get public portfolio');
  }
}

async function getPublicPortfolioIndex(req, res) {
  try {
    const portfolios = await portfolioService.listPublishedPortfolioIndex(req.query.limit || 500);
    return res.status(200).json({ success: true, portfolios });
  } catch (error) {
    return handleError(res, error, 'get public portfolio index');
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
  getPublicPortfolioIndex,
};