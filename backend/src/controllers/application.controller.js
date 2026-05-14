/**
 * ApplicationController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Nhận service qua constructor (tránh circular dependency)
 * - Mỗi method là 1 route handler (nhận req → gọi service → trả res)
 * - Lỗi đẩy qua next(error) → Global Error Handler xử lý
 */
const { success, created } = require('../utils/responseHelper');

class ApplicationController {
    constructor(applicationService) {
        this.applicationService = applicationService;
    }

    /**
   * GET /api/applications
   * Lấy danh sách đơn của user đang đăng nhập (kèm phân trang).
   */
    getAll = async (req, res, next) => {
        try {
            const { data, meta } = await this.applicationService.getAll(req.user.id, req.query);
            return success(res, data, 'OK', meta);
        } catch (err) {
            next(err);
        }
    };

    /**
   * POST /api/applications
   * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
   */
    create = async (req, res, next) => {
        try {
            const { scholarship_id, checklist, notes } = req.body;
            const data = await this.applicationService.create(req.user.id, {
                scholarshipId: scholarship_id,
                checklist,
                notes,
            });
            return created(res, data, 'Đơn ứng tuyển đã được tạo thành công.');
        } catch (err) {
            next(err);
        }
    };

    /**
   * GET /api/applications/:id
   * Lấy chi tiết 1 đơn.
   */
    getById = async (req, res, next) => {
        try {
            const data = await this.applicationService.getById(req.user.id, req.params.id);
            return success(res, data);
        } catch (err) {
            next(err);
        }
    };

    /**
   * PATCH /api/applications/:id
   * Cập nhật đơn (status, checklist, notes...).
   */
    update = async (req, res, next) => {
        try {
            const data = await this.applicationService.update(req.user.id, req.params.id, req.body);
            return success(res, data, 'Cập nhật đơn ứng tuyển thành công.');
        } catch (err) {
            next(err);
        }
    };

    /**
   * DELETE /api/applications/:id
   * Xóa đơn ứng tuyển (chỉ khi thuộc user đang đăng nhập).
   */
    remove = async (req, res, next) => {
        try {
            await this.applicationService.delete(req.user.id, req.params.id);
            return success(res, null, 'Đơn ứng tuyển đã được xóa thành công.');
        } catch (err) {
            next(err);
        }
    };
}

module.exports = ApplicationController;
