import { SyncHistory } from '../models/SyncHistory.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getSyncHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const history = await SyncHistory.find()
        .populate('admin', 'name email companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await SyncHistory.countDocuments();

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                history,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            },
            'Sync history fetched successfully'
        )
    );
});
