/**
 * SavedController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Nhận service qua constructor (tránh circular dependency)
 * - Mỗi method là 1 route handler (nhận req → gọi service → trả res)
 * - Lỗi đẩy qua next(error) → Global Error Handler xử lý
 */
const { success, created } = require('../utils/responseHelper');

class SavedController {
    constructor(savedService) {
        this.savedService = savedService;
    }

    /**
     * GET /api/saved
     * Lấy danh sách scholarships đã lưu của user
     */
    getAll = async (req, res, next) => {
        try {
            const data = await this.savedService.getAll(req.user.id);
            return success(res, data);
        } catch (err) {
            next(err);
        }
    };

    /**
     * POST /api/saved/:scholarshipId
     * Lưu một scholarship
     */
    save = async (req, res, next) => {
        try {
            const { scholarshipId } = req.params;
            const { note } = req.body;
            const data = await this.savedService.save(
                req.user.id,
                scholarshipId,
                note,
            );
            return created(res, data, 'Scholarship saved successfully.');
        } catch (err) {
            next(err);
        }
    };

    /**
     * DELETE /api/saved/:scholarshipId
     * Bỏ lưu một scholarship
     */
    remove = async (req, res, next) => {
        try {
            const { scholarshipId } = req.params;
            await this.savedService.remove(req.user.id, scholarshipId);
            return success(res, null, 'Scholarship removed from saved list.');
        } catch (err) {
            next(err);
        }
    };
}

module.exports = SavedController;
