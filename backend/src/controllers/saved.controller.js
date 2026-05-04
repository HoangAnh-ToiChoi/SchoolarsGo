/**
 * SavedController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Nhận service qua constructor (tránh circular dependency)
 * - Mỗi method là 1 route handler (nhận req → gọi service → trả res)
 * - Dùng ERROR_MAP object để map error code → HTTP status
 */
const { success } = require('../utils/responseHelper');

const ERROR_MAP = {
    SCHOLARSHIP_NOT_FOUND: {
        status: 404,
        message: "Học bổng không tồn tại.",
    },
    SCHOLARSHIP_ALREADY_SAVED: {
        status: 409,
        message: "Bạn đã lưu học bổng này rồi.",
    },
    SCHOLARSHIP_NOT_SAVED: {
        status: 404,
        message: "Học bổng này chưa được lưu.",
    },
};

class SavedController {
    constructor(savedService) {
        this.savedService = savedService;
    }

    /**
     * GET /api/saved
     * Lấy danh sách scholarships đã lưu của user
     */
    getAll = async (req, res) => {
        try {
            const data = await this.savedService.getAll(req.user.id);
            return res.status(200).json({
                success: true,
                data,
            });
        } catch (err) {
            return this._handleError(res, err);
        }
    };

    /**
     * POST /api/saved/:scholarshipId
     * Lưu một scholarship
     */
    save = async (req, res) => {
        try {
            const { scholarshipId } = req.params;
            const { note } = req.body;
            const data = await this.savedService.save(
                req.user.id,
                scholarshipId,
                note,
            );
            return res.status(201).json({
                success: true,
                data,
                message: "Scholarship saved successfully.",
            });
        } catch (err) {
            return this._handleError(res, err);
        }
    };

    /**
     * DELETE /api/saved/:scholarshipId
     * Bỏ lưu một scholarship
     */
    remove = async (req, res) => {
        try {
            const { scholarshipId } = req.params;
            await this.savedService.remove(req.user.id, scholarshipId);
            return res.status(200).json({
                success: true,
                data: null,
                message: "Scholarship removed from saved list.",
            });
        } catch (err) {
            return this._handleError(res, err);
        }
    };

    /**
     * Map error code từ Service → HTTP status + JSON response
     */
    _handleError(res, err) {
        const mapped = ERROR_MAP[err.message];
        if (mapped) {
            return res.status(mapped.status).json({
                success: false,
                message: mapped.message,
                code: mapped.status,
            });
        }
        console.error("[SavedController] Unhandled error:", err);
        return res.status(500).json({
            success: false,
            message: "Lỗi máy chủ, vui lòng thử lại sau.",
            code: 500,
        });
    }
}

module.exports = SavedController;
