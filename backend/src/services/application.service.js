/**
 * ApplicationService — VÙNG 2 (Controller → Service → Repository → DB)
 *
 * Quy tắc:
 * - Class với constructor nhận repository qua parameter (Dependency Injection)
 * - KHÔNG được import db, KHÔNG được viết SQL
 * - Chỉ: validate input, business logic, gọi repository, format response
 * - Ném lỗi với mã cụ thể (UPPER_SNAKE)
 */
class ApplicationService {
    constructor(applicationRepository) {
        this.repo = applicationRepository;
    }

    /**
     * Lấy danh sách đơn của user đang đăng nhập.
     * @param {string} userId
     * @param {{ page: number, limit: number, status: string|null }} filters
     * @returns {{ data: array, meta: { page, limit, total } }}
     */
    async getAll(userId, filters = {}) {
        const page = Math.max(1, parseInt(filters.page, 10) || 1);
        const limit = Math.min(
            50,
            Math.max(1, parseInt(filters.limit, 10) || 20),
        );
        const status = filters.status || null;

        const { rows, total } = await this.repo.findAllByUser(userId, {
            page,
            limit,
            status,
        });

        return {
            data: rows.map((row) => this._formatApplication(row)),
            meta: { page, limit, total },
        };
    }

    /**
     * Tạo đơn ứng tuyển mới (mặc định status = 'draft').
     * Xử lý bắt lỗi UNIQUE constraint từ Repository.
     * @throws 'SCHOLARSHIP_NOT_FOUND' — học bổng không tồn tại
     * @throws 'APPLICATION_ALREADY_EXISTS' — đã ứng tuyển rồi
     */
    async create(userId, { scholarshipId, checklist, notes }) {
        const exists = await this.repo.scholarshipExists(scholarshipId);
        if (!exists) {
            const err = new Error("SCHOLARSHIP_NOT_FOUND");
            err.isOperational = true;
            throw err;
        }

        try {
            const app = await this.repo.create(userId, {
                scholarshipId,
                checklist,
                notes,
            });
            return this._formatApplication(app);
        } catch (err) {
            if (err.message === "APPLICATION_ALREADY_EXISTS") {
                const error = new Error("APPLICATION_ALREADY_EXISTS");
                error.isOperational = true;
                throw error;
            }
            throw err;
        }
    }

    /**
     * Lấy chi tiết 1 đơn theo id (chỉ user sở hữu).
     * @throws 'NOT_FOUND' — đơn không tồn tại hoặc không thuộc user
     */
    async getById(userId, applicationId) {
        const app = await this.repo.findByIdAndUser(applicationId, userId);
        if (!app) {
            const err = new Error("NOT_FOUND");
            err.isOperational = true;
            throw err;
        }
        return this._formatApplication(app);
    }

    /**
     * Cập nhật đơn (status, checklist, notes...).
     * Chặn status không hợp lệ (HTTP 400) hoặc chuyển trạng thái không hợp lệ (HTTP 400).
     * @throws 'NOT_FOUND' — đơn không tồn tại hoặc không thuộc user
     * @throws 'INVALID_STATUS' — user truyền status không nằm trong enum cho phép
     * @throws 'INVALID_STATUS_TRANSITION' — chuyển trạng thái không hợp lệ
     */
    async update(userId, applicationId, rawUpdates) {
        // Bước 1: lấy đơn hiện tại
        const existing = await this.repo.findByIdAndUser(applicationId, userId);
        if (!existing) {
            const err = new Error("NOT_FOUND");
            err.isOperational = true;
            throw err;
        }

        // Bước 2: xử lý update status nếu có
        const updates = { ...rawUpdates };

        if (updates.status !== undefined) {
            const VALID_STATUSES = [
                "draft",
                "submitted",
                "under_review",
                "interview",
                "accepted",
                "rejected",
                "withdrawn",
            ];
            if (!VALID_STATUSES.includes(updates.status)) {
                const err = new Error("INVALID_STATUS");
                err.isOperational = true;
                throw err;
            }

            const VALID_TRANSITIONS = {
                draft: ["submitted", "withdrawn"],
                submitted: ["under_review", "rejected", "withdrawn"],
                under_review: ["interview", "rejected", "withdrawn"],
                interview: ["accepted", "rejected", "withdrawn"],
                accepted: [],
                rejected: [],
                withdrawn: [],
            };

            const allowedNext = VALID_TRANSITIONS[existing.status] || [];
            if (!allowedNext.includes(updates.status)) {
                const err = new Error("INVALID_STATUS_TRANSITION");
                err.isOperational = true;
                throw err;
            }

            // Tự động ghi applied_at khi chuyển từ draft → submitted
            if (existing.status === "draft" && updates.status === "submitted") {
                updates.applied_at = new Date().toISOString();
            }
        }

        // Bước 3: gọi repository cập nhật
        const updated = await this.repo.updateByIdAndUser(
            applicationId,
            userId,
            updates,
        );
        return this._formatApplication(updated);
    }

    /**
     * Xóa đơn (chỉ khi thuộc user đang đăng nhập).
     * Không cho phép xóa đơn đã submitted hoặc under_review.
     * @throws 'NOT_FOUND' — đơn không tồn tại hoặc không thuộc user
     * @throws 'CANNOT_DELETE_SUBMITTED' — đơn đã nộp không được xóa
     */
    async delete(userId, applicationId) {
        const existing = await this.repo.findByIdAndUser(applicationId, userId);
        if (!existing) {
            const err = new Error("NOT_FOUND");
            err.isOperational = true;
            throw err;
        }

        const UNDELETABLE = [
            "submitted",
            "under_review",
            "interview",
            "accepted",
        ];
        if (UNDELETABLE.includes(existing.status)) {
            const err = new Error("CANNOT_DELETE_SUBMITTED");
            err.isOperational = true;
            throw err;
        }

        await this.repo.deleteByIdAndUser(applicationId, userId);
        return { deleted: true };
    }

    /**
     * Format raw row từ DB → object sạch trả về cho Controller.
     * @param {object} row - row từ DB (có thể có scholarship_ prefix fields)
     */
    _formatApplication(row) {
        return {
            id: row.id,
            status: row.status,
            applied_at: row.applied_at,
            notes: row.notes,
            checklist: row.checklist,
            documents_used: row.documents_used,
            result: row.result,
            created_at: row.created_at,
            updated_at: row.updated_at,
            scholarship: {
                id: row.scholarship_id,
                title: row.scholarship_title,
                country: row.country,
                deadline: row.deadline,
                amount: row.amount,
                image_url: row.image_url,
            },
        };
    }
}

module.exports = ApplicationService;
