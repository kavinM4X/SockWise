import Product from '../models/Product.js';

// @desc    Get all products
// @route   GET /api/products
// @access  Private
export const getProducts = async (req, res, next) => {
  try {
    const { category, brand, search, page = 1, limit = 10 } = req.query;

    let query = { user: req.user._id };

    if (category) query.category = category;
    if (brand) query.brand = brand;
    if (search) query.productName = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Product not found');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private
export const createProduct = async (req, res, next) => {
  try {
    let {
      productId,
      productName,
      purchasePrice,
      profitPercentage,
      sellingPrice,
      category,
      brand,
      stockQuantity,
      minimumStock,
      description,
    } = req.body;

    if (!productId || !productName || purchasePrice === undefined || profitPercentage === undefined || stockQuantity === undefined) {
      res.status(400);
      throw new Error('Please add all required fields');
    }

    // Check for duplicate productId for this user
    const productExists = await Product.findOne({ user: req.user.id, productId });
    if (productExists) {
      res.status(400);
      throw new Error('Product with this ID already exists');
    }

    // Calculate selling price if not provided
    if (sellingPrice === undefined || sellingPrice === null) {
      sellingPrice = purchasePrice + (purchasePrice * (profitPercentage / 100));
    }

    const product = await Product.create({
      user: req.user.id,
      productId,
      productName,
      purchasePrice,
      profitPercentage,
      sellingPrice,
      category,
      brand,
      stockQuantity,
      minimumStock,
      description,
    });

    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Product not found');
    }

    // Check duplicate productId on update if they change the ID
    if (req.body.productId && req.body.productId !== product.productId) {
      const productExists = await Product.findOne({ user: req.user.id, productId: req.body.productId });
      if (productExists) {
        res.status(400);
        throw new Error('Product with this ID already exists');
      }
    }

    // Recalculate selling price if they updated purchasePrice or profitPercentage but not sellingPrice
    if (req.body.sellingPrice === undefined && (req.body.purchasePrice !== undefined || req.body.profitPercentage !== undefined)) {
      const pPrice = req.body.purchasePrice !== undefined ? req.body.purchasePrice : product.purchasePrice;
      const pProf = req.body.profitPercentage !== undefined ? req.body.profitPercentage : product.profitPercentage;
      req.body.sellingPrice = pPrice + (pPrice * (pProf / 100));
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || product.user.toString() !== req.user.id) {
      res.status(404);
      throw new Error('Product not found');
    }

    await product.deleteOne();

    res.json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private
export const getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      user: req.user.id,
      $expr: { $lte: ['$stockQuantity', '$minimumStock'] }
    }).sort({ stockQuantity: 1 }).lean();

    res.json(products);
  } catch (error) {
    next(error);
  }
};
