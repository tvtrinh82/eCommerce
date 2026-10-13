import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Định dạng tiền: 45.980.000 ₫ (dấu chấm ngăn cách nghìn, không phần thập phân)
 */
export const formatCurrency = (amount: number): string => {
  if (isNaN(amount)) return '0 đ';
  return `${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ`;
};

/**
 * Định dạng thời gian theo giờ Việt Nam (UTC+7): DD/MM/YYYY HH:mm:ss (có giờ phút giây)
 */
export const formatDateTime = (date: string | Date | number): string => {
  if (!date) return '';
  return dayjs(date).tz('Asia/Bangkok').format('DD/MM/YYYY HH:mm:ss');
};

/**
 * Định dạng ngày: DD/MM/YYYY
 */
export const formatDateOnly = (date: string | Date | number): string => {
  if (!date) return '';
  return dayjs(date).tz('Asia/Bangkok').format('DD/MM/YYYY');
};

/**
 * Định dạng giờ phút giây: HH:mm:ss
 */
export const formatTimeOnly = (date: string | Date | number): string => {
  if (!date) return '';
  return dayjs(date).tz('Asia/Bangkok').format('HH:mm:ss');
};

/**
 * Định dạng giờ phút hiển thị hạn: HH:mm
 */
export const formatTime = (date: string | Date | number): string => {
  if (!date) return '';
  return dayjs(date).tz('Asia/Bangkok').format('HH:mm');
};

/**
 * Định dạng tên hiển thị người dùng theo vai trò:
 * - Role USER: hiển thị tên khách hàng (name), nếu chưa có mới fallback email
 * - Role PRODUCT_OWNER hoặc ADMIN: hiển thị email và cắt bỏ phần @gmail.com
 */
export const getUserDisplayName = (user?: { name?: string; email?: string; role?: string; username?: string } | null): string => {
  if (!user) return 'Tài khoản';

  if (user.role === 'USER') {
    return user.name || user.email || 'Khách hàng';
  }

  // PO và Admin chỉ dùng email và cắt bỏ @gmail.com
  const email = user.email || '';
  if (email) {
    return email.replace(/@gmail\.com$/i, '').split('@')[0];
  }

  return user.name || user.username || 'Admin';
};