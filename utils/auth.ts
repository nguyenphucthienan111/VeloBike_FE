/**
 * Gọi khi API trả 401 (token hết hạn / không hợp lệ).
 * Xóa token, báo layout hiển thị trạng thái đăng xuất, và chuyển về trang đăng nhập.
 */
export function handleSessionExpired(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('authChange'));
  window.location.href = '/login';
}
