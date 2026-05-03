/**
 * ApplicationController — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Import DUY NHẤT từ ../container — KHÔNG import service trực tiếp
 * - Mỗi method là 1 route handler (nhận req → gọi service → trả res)
 * - Dùng ERROR_MAP object để map error code → HTTP status
 * - module.exports = new ApplicationController()  ← Singleton
 */
const { applicationService } = require('../container');

const ERROR_MAP = {
  NOT_FOUND: {
    status: 404,
    message: 'Không tìm thấy đơn ứng tuyển hoặc bạn không có quyền truy cập.',
  },
  SCHOLARSHIP_NOT_FOUND: {
    status: 404,
    message: 'Học bổng không tồn tại.',
  },
  APPLICATION_ALREADY_EXISTS: {
    status: 409,
    message: 'Bạn đã ứng tuyển học bổng này rồi.',
  },
  INVALID_STATUS: {
    status: 400,
    message: 'Status không hợp lệ. Các status được phép: draft, submitted, under_review, interview, accepted, rejected, withdrawn.',
  },
  INVALID_STATUS_TRANSITION: {
    status: 400,
    message: 'Không thể chuyển trạng thái này. Kiểm tra luồng trạng thái hợp lệ.',
  },
  CANNOT_DELETE_SUBMITTED: {
    status: 400,
    message: 'Không thể xóa đơn đã nộp. Hãy rút đơn thay vì xóa.',
  },
};

class ApplicationController {
  /**
   * GET /api/applications
   * Lấy danh sách đơn của user đang đăng nhập (kèm phân trang).
   */
  async getAll(req, res) {
    try {
      const { data, meta } = await applicationService.getAll(req.user.id, req.query);
      return res.status(200).json({
        success: true,
        data,
        meta,
      });
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  /**
   * POST /api/applications
   * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
   */
  async create(req, res) {
    try {
      const { scholarship_id, checklist, notes } = req.body;
      const data = await applicationService.create(req.user.id, {
        scholarshipId: scholarship_id,
        checklist,
        notes,
      });
      return res.status(201).json({
        success: true,
        data,
        message: 'Đơn ứng tuyển đã được tạo thành công.',
      });
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  /**
   * GET /api/applications/:id
   * Lấy chi tiết 1 đơn.
   */
  async getById(req, res) {
    try {
      const data = await applicationService.getById(req.user.id, req.params.id);
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  /**
   * PATCH /api/applications/:id
   * Cập nhật đơn (status, checklist, notes...).
   */
  async update(req, res) {
    try {
      const data = await applicationService.update(req.user.id, req.params.id, req.body);
      return res.status(200).json({
        success: true,
        data,
        message: 'Cập nhật đơn ứng tuyển thành công.',
      });
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  /**
   * DELETE /api/applications/:id
   * Xóa đơn ứng tuyển (chỉ khi thuộc user đang đăng nhập).
   */
  async remove(req, res) {
    try {
      await applicationService.delete(req.user.id, req.params.id);
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Đơn ứng tuyển đã được xóa thành công.',
      });
    } catch (err) {
      return this._handleError(res, err);
    }
  }

  /**
   * Map error code từ Service → HTTP status + JSON response.
   * Nếu error code không nằm trong ERROR_MAP → trả 500.
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
    console.error('[ApplicationController] Unhandled error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ, vui lòng thử lại sau.',
      code: 500,
    });
  }
}

module.exports = new ApplicationController();
