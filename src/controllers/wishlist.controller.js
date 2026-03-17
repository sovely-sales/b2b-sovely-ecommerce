import { Wishlist } from '../models/Wishlist.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const getOrCreateWishlist = async (userId) => {
    try {
        await Wishlist.collection.dropIndex('customerId_1');
        console.log("🧹 Ghost index 'customerId_1' dropped successfully!");
    } catch (error) {}

    let wishlist = await Wishlist.findOne({ userId }).populate(
        'items.productId',
        'title images platformSellPrice compareAtPrice sku'
    );

    if (!wishlist) {
        wishlist = await Wishlist.create({ userId, items: [] });
    } else {
        const originalLength = wishlist.items.length;
        wishlist.items = wishlist.items.filter((item) => item.productId != null);
        if (wishlist.items.length !== originalLength) await wishlist.save();
    }

    return wishlist;
};

export const getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await getOrCreateWishlist(req.user._id);
    return res.status(200).json(new ApiResponse(200, wishlist, 'Wishlist retrieved successfully'));
});

export const toggleWishlistItem = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    if (!productId) throw new ApiError(400, 'Product ID is required');

    const wishlist = await getOrCreateWishlist(req.user._id);

    const itemIndex = wishlist.items.findIndex((item) => {
        if (!item.productId) return false;
        const id = item.productId._id ? item.productId._id.toString() : item.productId.toString();
        return id === productId.toString();
    });

    let isAdded = false;
    if (itemIndex > -1) {
        wishlist.items.splice(itemIndex, 1);
    } else {
        const productExists = await Product.findById(productId);
        if (!productExists) throw new ApiError(404, 'Product not found');
        wishlist.items.push({ productId });
        isAdded = true;
    }

    await wishlist.save();
    await wishlist.populate('items.productId', 'title images platformSellPrice compareAtPrice sku');

    return res
        .status(200)
        .json(new ApiResponse(200, { wishlist, isAdded }, 'Wishlist updated successfully'));
});
