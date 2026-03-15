import { Category } from "../models/Category.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
    const rawCategories = await Category.find({
        parentCategoryId: null,
        name: { $ne: "Uncategorized" }
    })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    const seen = new Set();
    const categories = rawCategories.filter((category) => {
        const normalizedName = category.name.trim().toLowerCase();
        if (seen.has(normalizedName)) {
            return false;
        }

        seen.add(normalizedName);
        return true;
    });

    return res.status(200).json(
        new ApiResponse(200, categories, "Categories fetched successfully")
    );
});
