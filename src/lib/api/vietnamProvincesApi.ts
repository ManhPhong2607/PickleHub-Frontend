import axios from 'axios';

export interface ProvinceOption {
  code: number;
  name: string;
}

export interface DistrictOption {
  code: number;
  name: string;
}

export interface WardOption {
  code: number;
  name: string;
}

// API endpoint chuẩn v1 của provinces.open-api.vn
const OPEN_API_BASE = 'https://provinces.open-api.vn/api/v1';

// Danh mục đầy đủ 63 Tỉnh / Thành phố Việt Nam (Dự phòng 100% khi mất mạng)
const FALLBACK_PROVINCES: ProvinceOption[] = [
  { code: 1, name: 'Thành phố Hà Nội' },
  { code: 79, name: 'Thành phố Hồ Chí Minh' },
  { code: 48, name: 'Thành phố Đà Nẵng' },
  { code: 31, name: 'Thành phố Hải Phòng' },
  { code: 92, name: 'Thành phố Cần Thơ' },
  { code: 74, name: 'Tỉnh Bình Dương' },
  { code: 75, name: 'Tỉnh Đồng Nai' },
  { code: 77, name: 'Tỉnh Bà Rịa - Vũng Tàu' },
  { code: 2, name: 'Tỉnh Hà Giang' },
  { code: 4, name: 'Tỉnh Cao Bằng' },
  { code: 6, name: 'Tỉnh Bắc Kạn' },
  { code: 8, name: 'Tỉnh Tuyên Quang' },
  { code: 10, name: 'Tỉnh Lào Cai' },
  { code: 11, name: 'Tỉnh Điện Biên' },
  { code: 12, name: 'Tỉnh Lai Châu' },
  { code: 14, name: 'Tỉnh Sơn La' },
  { code: 15, name: 'Tỉnh Yên Bái' },
  { code: 17, name: 'Tỉnh Hoà Bình' },
  { code: 19, name: 'Tỉnh Thái Nguyên' },
  { code: 20, name: 'Tỉnh Lạng Sơn' },
  { code: 22, name: 'Tỉnh Quảng Ninh' },
  { code: 24, name: 'Tỉnh Bắc Giang' },
  { code: 25, name: 'Tỉnh Phú Thọ' },
  { code: 26, name: 'Tỉnh Vĩnh Phúc' },
  { code: 27, name: 'Tỉnh Bắc Ninh' },
  { code: 30, name: 'Tỉnh Hải Dương' },
  { code: 33, name: 'Tỉnh Hưng Yên' },
  { code: 34, name: 'Tỉnh Thái Bình' },
  { code: 35, name: 'Tỉnh Hà Nam' },
  { code: 36, name: 'Tỉnh Nam Định' },
  { code: 37, name: 'Tỉnh Ninh Bình' },
  { code: 38, name: 'Tỉnh Thanh Hóa' },
  { code: 40, name: 'Tỉnh Nghệ An' },
  { code: 42, name: 'Tỉnh Hà Tĩnh' },
  { code: 44, name: 'Tỉnh Quảng Bình' },
  { code: 45, name: 'Tỉnh Quảng Trị' },
  { code: 46, name: 'Tỉnh Thừa Thiên Huế' },
  { code: 49, name: 'Tỉnh Quảng Nam' },
  { code: 51, name: 'Tỉnh Quảng Ngãi' },
  { code: 52, name: 'Tỉnh Bình Định' },
  { code: 54, name: 'Tỉnh Phú Yên' },
  { code: 56, name: 'Tỉnh Khánh Hòa' },
  { code: 58, name: 'Tỉnh Ninh Thuận' },
  { code: 60, name: 'Tỉnh Bình Thuận' },
  { code: 62, name: 'Tỉnh Kon Tum' },
  { code: 64, name: 'Tỉnh Gia Lai' },
  { code: 66, name: 'Tỉnh Đắk Lắk' },
  { code: 67, name: 'Tỉnh Đắk Nông' },
  { code: 68, name: 'Tỉnh Lâm Đồng' },
  { code: 70, name: 'Tỉnh Bình Phước' },
  { code: 72, name: 'Tỉnh Tây Ninh' },
  { code: 80, name: 'Tỉnh Long An' },
  { code: 82, name: 'Tỉnh Tiền Giang' },
  { code: 83, name: 'Tỉnh Bến Tre' },
  { code: 84, name: 'Tỉnh Trà Vinh' },
  { code: 86, name: 'Tỉnh Vĩnh Long' },
  { code: 87, name: 'Tỉnh Đồng Tháp' },
  { code: 89, name: 'Tỉnh An Giang' },
  { code: 91, name: 'Tỉnh Kiên Giang' },
  { code: 93, name: 'Tỉnh Hậu Giang' },
  { code: 94, name: 'Tỉnh Sóc Trăng' },
  { code: 95, name: 'Tỉnh Bạc Liêu' },
  { code: 96, name: 'Tỉnh Cà Mau' },
];

const FALLBACK_DISTRICTS: Record<number, DistrictOption[]> = {
  79: [
    { code: 760, name: 'Quận 1' },
    { code: 761, name: 'Quận 12' },
    { code: 764, name: 'Quận Gò Vấp' },
    { code: 765, name: 'Quận Bình Thạnh' },
    { code: 766, name: 'Quận Tân Bình' },
    { code: 767, name: 'Quận Tân Phú' },
    { code: 768, name: 'Quận Phú Nhuận' },
    { code: 769, name: 'Thành phố Thủ Đức' },
    { code: 770, name: 'Quận 3' },
    { code: 771, name: 'Quận 10' },
    { code: 772, name: 'Quận 11' },
    { code: 773, name: 'Quận 4' },
    { code: 774, name: 'Quận 5' },
    { code: 775, name: 'Quận 6' },
    { code: 776, name: 'Quận 8' },
    { code: 777, name: 'Quận Bình Tân' },
    { code: 778, name: 'Quận 7' },
    { code: 783, name: 'Huyện Củ Chi' },
    { code: 784, name: 'Huyện Hóc Môn' },
    { code: 785, name: 'Huyện Bình Chánh' },
    { code: 786, name: 'Huyện Nhà Bè' },
    { code: 787, name: 'Huyện Cần Giờ' },
  ],
  1: [
    { code: 1, name: 'Quận Ba Đình' },
    { code: 2, name: 'Quận Hoàn Kiếm' },
    { code: 3, name: 'Quận Tây Hồ' },
    { code: 4, name: 'Quận Long Biên' },
    { code: 5, name: 'Quận Cầu Giấy' },
    { code: 6, name: 'Quận Đống Đa' },
    { code: 7, name: 'Quận Hai Bà Trưng' },
    { code: 8, name: 'Quận Hoàng Mai' },
    { code: 9, name: 'Quận Thanh Xuân' },
    { code: 16, name: 'Huyện Sóc Sơn' },
    { code: 17, name: 'Huyện Đông Anh' },
    { code: 18, name: 'Huyện Gia Lâm' },
    { code: 19, name: 'Quận Nam Từ Liêm' },
    { code: 20, name: 'Huyện Thanh Trì' },
    { code: 21, name: 'Quận Bắc Từ Liêm' },
    { code: 268, name: 'Quận Hà Đông' },
    { code: 269, name: 'Thị xã Sơn Tây' },
  ],
  48: [
    { code: 490, name: 'Quận Hải Châu' },
    { code: 491, name: 'Quận Thanh Khê' },
    { code: 492, name: 'Quận Sơn Trà' },
    { code: 493, name: 'Quận Ngũ Hành Sơn' },
    { code: 494, name: 'Quận Liên Chiểu' },
    { code: 495, name: 'Quận Cẩm Lệ' },
    { code: 497, name: 'Huyện Hòa Vang' },
  ],
};

export const vietnamProvincesApi = {
  /**
   * Lấy danh sách 63 Tỉnh / Thành phố Việt Nam
   */
  async getProvinces(): Promise<ProvinceOption[]> {
    try {
      const res = await axios.get<ProvinceOption[]>(`${OPEN_API_BASE}/p/`, { timeout: 4000 });
      if (Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((item) => ({
          code: item.code,
          name: item.name,
        }));
      }
      return FALLBACK_PROVINCES;
    } catch (err) {
      console.warn('[provinces.open-api.vn] Using fallback provinces dataset');
      return FALLBACK_PROVINCES;
    }
  },

  /**
   * Lấy danh sách Quận / Huyện theo mã Tỉnh / Thành phố (provinceCode)
   */
  async getDistricts(provinceCode: number): Promise<DistrictOption[]> {
    if (!provinceCode) return [];
    try {
      const res = await axios.get<any>(`${OPEN_API_BASE}/p/${provinceCode}?depth=2`, { timeout: 4000 });
      const districts = res.data?.districts || [];
      if (Array.isArray(districts) && districts.length > 0) {
        return districts.map((item: any) => ({
          code: item.code,
          name: item.name,
        }));
      }
      return FALLBACK_DISTRICTS[provinceCode] || [];
    } catch (err) {
      console.warn(`[provinces.open-api.vn] Using fallback districts for province ${provinceCode}`);
      return FALLBACK_DISTRICTS[provinceCode] || [];
    }
  },

  /**
   * Lấy danh sách Phường / Xã theo mã Quận / Huyện (districtCode)
   */
  async getWards(districtCode: number): Promise<WardOption[]> {
    if (!districtCode) return [];
    try {
      const res = await axios.get<any>(`${OPEN_API_BASE}/d/${districtCode}?depth=2`, { timeout: 4000 });
      const wards = res.data?.wards || [];
      return wards.map((item: any) => ({
        code: item.code,
        name: item.name,
      }));
    } catch (err) {
      console.warn(`[provinces.open-api.vn] Error fetching wards for district ${districtCode}`);
      return [];
    }
  },
};
