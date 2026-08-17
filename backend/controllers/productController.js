const prisma = require('../lib/prisma');
const recordAudit = require('../utils/auditLogger');
const { cleanupReplacedAssets } = require('../utils/assetCleanup');
const { cleanupRequestUploads } = require('../middleware/uploadMiddleware');
const { getActiveOffers, calculateProductPricing } = require('../services/pricingService');

const publicProductSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  isDigital: true,
  category: true,
  thumbnail: true,
  createdAt: true,
  updatedAt: true,
  isArchived: false,
};

const adminProductSelect = { ...publicProductSelect, isArchived: true };

const withPricing = (product, offers) => ({ ...product, ...calculateProductPricing(product, offers) });

const getPublicProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 24));
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const category = String(req.query.category || '').trim();
    const where = {
      isArchived: false,
      ...(category ? { category } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    };

    const [products, total, offers] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: publicProductSelect }),
      prisma.product.count({ where }),
      getActiveOffers(),
    ]);

    res.status(200).json({
      data: products.map((product) => withPricing(product, offers)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (error) {
    console.error('[PRODUCTS] Storefront sync error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve the product catalog.' });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const product = await prisma.product.findFirst({ where: { id: req.params.id, isArchived: false }, select: publicProductSelect });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    const offers = await getActiveOffers();
    res.status(200).json(withPricing(product, offers));
  } catch (error) {
    console.error('[PRODUCTS] Single product error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve product details.' });
  }
};

const getAdminProducts = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
    const skip = (page - 1) * limit;
    const search = String(req.query.search || '').trim();
    const where = {
      isArchived: false,
      ...(search ? { OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ] } : {}),
    };
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: adminProductSelect }),
      prisma.product.count({ where }),
    ]);
    res.status(200).json({ data: products, pagination: { totalRecords: totalCount, currentPage: page, totalPages: Math.max(1, Math.ceil(totalCount / limit)), limit } });
  } catch (error) {
    console.error('[PRODUCTS] Admin fetch error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to retrieve products.' });
  }
};

const normalizePrice = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? Number(n.toFixed(2)) : null;
};

const createProduct = async (req, res) => {
  try {
    const { title, description, price, isDigital, category } = req.body || {};
    const numericPrice = normalizePrice(price);
    const thumbnailPath = req.files?.thumbnail?.[0]?.location || null;
    const assetPath = req.files?.assetFile?.[0]?.key || null;
    if (numericPrice === null || numericPrice <= 0) return res.status(400).json({ error: 'Price must be greater than zero.' });
    if (!assetPath) return res.status(400).json({ error: 'A digital asset file is required.' });

    const newProduct = await prisma.product.create({
      data: {
        title: String(title).trim(),
        description: String(description || '').trim(),
        price: numericPrice,
        isDigital: isDigital === true || isDigital === 'true',
        category: String(category || 'Uncategorized').trim(),
        thumbnail: thumbnailPath,
        assetUrl: assetPath,
        isArchived: false,
      },
    });

    await recordAudit({ userId: req.user.id, action: 'CREATE_PRODUCT', entity: 'PRODUCT', entityId: newProduct.id, details: { title: newProduct.title, price: newProduct.price }, req });
    res.status(201).json({ message: 'Product created.', product: newProduct });
  } catch (error) {
    if (req.uploadCommitted) await cleanupRequestUploads(req);
    console.error('[PRODUCTS] Create error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to create product.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category } = req.body || {};
    const numericPrice = normalizePrice(price);
    if (numericPrice === null || numericPrice <= 0) return res.status(400).json({ error: 'Price must be greater than zero.' });

    const existingProduct = await prisma.product.findUnique({ where: { id }, select: { id: true, thumbnail: true, assetUrl: true } });
    if (!existingProduct) return res.status(404).json({ error: 'Product not found.' });

    const updateData = { title: String(title || '').trim(), description: String(description || '').trim(), price: numericPrice, category: String(category || 'Uncategorized').trim() };
    if (req.files?.thumbnail?.[0]) updateData.thumbnail = req.files.thumbnail[0].location;
    if (req.files?.assetFile?.[0]) updateData.assetUrl = req.files.assetFile[0].key;

    const updatedProduct = await prisma.product.update({ where: { id }, data: updateData });
    await cleanupReplacedAssets({ oldThumbnail: existingProduct.thumbnail, oldAssetUrl: existingProduct.assetUrl, newThumbnail: updatedProduct.thumbnail, newAssetUrl: updatedProduct.assetUrl });
    await recordAudit({ userId: req.user.id, action: 'UPDATE_PRODUCT', entity: 'PRODUCT', entityId: id, details: { title: updatedProduct.title, price: updatedProduct.price, category: updatedProduct.category }, req });
    res.status(200).json({ message: 'Product updated.', product: updatedProduct });
  } catch (error) {
    if (req.uploadCommitted) await cleanupRequestUploads(req);
    console.error('[PRODUCTS] Update error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to update product.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    await prisma.product.update({ where: { id }, data: { isArchived: true } });
    await recordAudit({ userId: req.user.id, action: 'ARCHIVE_PRODUCT', entity: 'PRODUCT', entityId: id, details: { archivedTitle: product.title }, req });
    res.status(200).json({ message: 'Product archived. Existing buyers retain access.' });
  } catch (error) {
    console.error('[PRODUCTS] Archive error:', { requestId: req.requestId, message: error.message });
    res.status(500).json({ error: 'Failed to archive product.' });
  }
};

module.exports = { getPublicProducts, getSingleProduct, getAdminProducts, createProduct, updateProduct, deleteProduct };
