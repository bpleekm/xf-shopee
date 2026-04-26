const Product = require('../models/Product');
const { ApiResponse, asyncHandler } = require('../utils/response');

class ProductController {
  static getProducts = asyncHandler(async (req, res) => {
    const {
      category,
      search,
      page = 1,
      limit = 20,
      status,
      minStock,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      status,
      search,
      minStock: minStock === 'true',
      sortBy,
      sortOrder
    };

    const result = await Product.findAll(options);

    return res.status(200).json(
      ApiResponse.success(result, '获取商品列表成功').toJSON()
    );
  });

  static getLowStockProducts = asyncHandler(async (req, res) => {
    const { page = 1, limit = 50 } = req.query;

    const products = await Product.getLowStockProducts({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    return res.status(200).json(
      ApiResponse.success({ products }, '获取库存预警商品成功').toJSON()
    );
  });

  static getProductById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(parseInt(id));

    if (!product) {
      return res.status(404).json(ApiResponse.notFound('商品不存在').toJSON());
    }

    return res.status(200).json(
      ApiResponse.success({ product }, '获取商品详情成功').toJSON()
    );
  });

  static createProduct = asyncHandler(async (req, res) => {
    const {
      sku, name, description, category, price, cost_price,
      stock_quantity, min_stock_level, image_url, status
    } = req.body;

    if (!sku || !name || !price) {
      return res.status(422).json(
        ApiResponse.error('SKU、商品名称和价格是必填项').toJSON()
      );
    }

    const existingProduct = await Product.findBySKU(sku);
    if (existingProduct) {
      return res.status(409).json(
        ApiResponse.error('SKU已存在').toJSON()
      );
    }

    const productData = {
      sku,
      name,
      description: description || '',
      category: category || '未分类',
      price: parseFloat(price),
      cost_price: cost_price ? parseFloat(cost_price) : null,
      stock_quantity: stock_quantity ? parseInt(stock_quantity) : 0,
      min_stock_level: min_stock_level ? parseInt(min_stock_level) : 10,
      image_url: image_url || null,
      status: status || 'active'
    };

    const product = await Product.create(productData);

    return res.status(201).json(
      ApiResponse.success({ product }, '商品创建成功').toJSON()
    );
  });

  static updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existingProduct = await Product.findById(parseInt(id));
    if (!existingProduct) {
      return res.status(404).json(ApiResponse.notFound('商品不存在').toJSON());
    }

    if (req.body.sku && req.body.sku !== existingProduct.sku) {
      const productWithSKU = await Product.findBySKU(req.body.sku);
      if (productWithSKU) {
        return res.status(409).json(
          ApiResponse.error('SKU已存在').toJSON()
        );
      }
    }

    const updateData = { ...req.body };

    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.cost_price !== undefined) {
      updateData.cost_price = updateData.cost_price ? parseFloat(updateData.cost_price) : null;
    }
    if (updateData.stock_quantity !== undefined) {
      updateData.stock_quantity = parseInt(updateData.stock_quantity);
    }
    if (updateData.min_stock_level !== undefined) {
      updateData.min_stock_level = parseInt(updateData.min_stock_level);
    }

    const product = await Product.update(parseInt(id), updateData);

    return res.status(200).json(
      ApiResponse.success({ product }, '商品更新成功').toJSON()
    );
  });

  static updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined || typeof quantity !== 'number') {
      return res.status(422).json(
        ApiResponse.error('库存变化量是必填项且必须是数字').toJSON()
      );
    }

    try {
      const product = await Product.updateStock(parseInt(id), quantity);
      return res.status(200).json(
        ApiResponse.success({ product }, '库存更新成功').toJSON()
      );
    } catch (error) {
      if (error.message === '库存不足或商品不存在') {
        return res.status(400).json(
          ApiResponse.error('库存不足或商品不存在').toJSON()
        );
      }
      throw error;
    }
  });

  static deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await Product.findById(parseInt(id));
    if (!product) {
      return res.status(404).json(ApiResponse.notFound('商品不存在').toJSON());
    }

    const deleted = await Product.delete(parseInt(id));
    if (!deleted) {
      return res.status(500).json(
        ApiResponse.error('商品删除失败').toJSON()
      );
    }

    return res.status(200).json(
      ApiResponse.success(null, '商品删除成功').toJSON()
    );
  });

  static batchUpdateStatus = asyncHandler(async (req, res) => {
    const { ids, status } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(422).json(
        ApiResponse.error('商品ID列表不能为空').toJSON()
      );
    }

    if (!status || !['active', 'inactive', 'out_of_stock'].includes(status)) {
      return res.status(422).json(
        ApiResponse.error('状态必须是 active、inactive 或 out_of_stock').toJSON()
      );
    }

    const updatedCount = await Product.batchUpdateStatus(ids, status);

    return res.status(200).json(
      ApiResponse.success({ updatedCount }, `成功更新 ${updatedCount} 个商品状态`).toJSON()
    );
  });
}

module.exports = ProductController;
