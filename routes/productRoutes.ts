import { Router, Response } from 'express';
import { Product } from '../models/Product.ts';
import { Transaction } from '../models/Transaction.ts';
import { authenticateJWT, requireAdmin, logAudit, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/products
// Available to authenticated users (both admin and customers to view product list & prices)
router.get('/', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, category, status, page = 1, limit = 100 } = req.query;

    const query: any = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search && typeof search === 'string' && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { productCode: searchRegex }, { description: searchRegex }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total, categories] = await Promise.all([
      Product.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
      Product.countDocuments(query),
      Product.distinct('category'),
    ]);

    res.json({
      success: true,
      data: {
        products,
        categories,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/products/:id
router.get('/:id', authenticateJWT, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, data: product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/products
// Admin only: Add new product
router.post('/', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { productCode, name, description, category, price, status } = req.body;

    if (!name || price === undefined || price === null) {
      res.status(400).json({
        success: false,
        message: 'Product name and price are required',
      });
      return;
    }

    if (Number(price) < 0) {
      res.status(400).json({
        success: false,
        message: 'Price must be a positive number',
      });
      return;
    }

    let finalCode = productCode?.trim().toUpperCase();
    if (!finalCode) {
      const count = await Product.countDocuments();
      finalCode = `PROD-${100 + count + 1}`;
    }

    const existing = await Product.findOne({ productCode: finalCode });
    if (existing) {
      res.status(409).json({
        success: false,
        message: `Product code "${finalCode}" is already in use`,
      });
      return;
    }

    const product = await Product.create({
      productCode: finalCode,
      name: name.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'General',
      price: Number(price),
      status: status || 'active',
    });

    await logAudit(
      req,
      'Product Added',
      `Added product ${product.name} (${product.productCode}) priced at ₹${product.price}`,
      (product._id as any).toString()
    );

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/products/:id
// Admin only: Edit product
router.put('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, category, price, status } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category !== undefined) product.category = category.trim();
    if (price !== undefined) {
      if (Number(price) < 0) {
        res.status(400).json({ success: false, message: 'Price must be a positive number' });
        return;
      }
      product.price = Number(price);
    }
    if (status) product.status = status;

    await product.save();

    await logAudit(
      req,
      'Product Updated',
      `Updated product ${product.name} (${product.productCode})`,
      id
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/products/:id
// Admin only: Delete product
router.delete('/:id', authenticateJWT, requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    // Check if referenced in transactions
    const usedInTxn = await Transaction.countDocuments({ productId: id });
    if (usedInTxn > 0) {
      // Soft-deactivate instead of hard delete to keep ledger references intact
      product.status = 'inactive';
      await product.save();

      await logAudit(
        req,
        'Product Deactivated',
        `Deactivated product ${product.name} because it is referenced in ${usedInTxn} transaction(s)`,
        id
      );

      res.json({
        success: true,
        message: 'Product has active ledger transactions; status changed to inactive.',
      });
      return;
    }

    await Product.findByIdAndDelete(id);

    await logAudit(
      req,
      'Product Deleted',
      `Deleted product ${product.name} (${product.productCode})`,
      id
    );

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
