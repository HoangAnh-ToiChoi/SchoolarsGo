// Đếm số đơn theo từng trạng thái: { submitted: 2, draft: 1 }
export function countByStatus(applications) {
  return applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] ?? 0) + 1;
    return acc;
  }, {});
}
