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
 * Định dạng giờ phút hiển thị hạn: HH:mm
 */
export const formatTime = (date: string | Date | number): string => {
  if (!date) return '';
  return dayjs(date).tz('Asia/Bangkok').format('HH:mm');
};