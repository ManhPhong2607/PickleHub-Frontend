export interface BankOption {
  code: string;
  name: string;
  shortName: string;
}

export const VIETNAMESE_BANKS: BankOption[] = [
  { code: 'MB', name: 'Ngân hàng Quân Đội', shortName: 'MBBank' },
  { code: 'VCB', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { code: 'ICB', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'VietinBank' },
  { code: 'BIDV', name: 'Ngân hàng Đầu tư và Phát triển Việt Nam', shortName: 'BIDV' },
  { code: 'TCB', name: 'Ngân hàng Kỹ Thương', shortName: 'Techcombank' },
  { code: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { code: 'VPB', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
  { code: 'TPB', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
  { code: 'STB', name: 'Ngân hàng Sài Gòn Thương Tín', shortName: 'Sacombank' },
  { code: 'HDB', name: 'Ngân hàng Phát triển TP.HCM', shortName: 'HDBank' },
  { code: 'VIB', name: 'Ngân hàng Quốc tế Việt Nam', shortName: 'VIB' },
  { code: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội', shortName: 'SHB' },
  { code: 'MSB', name: 'Ngân hàng Hàng Hải Việt Nam', shortName: 'MSB' },
  { code: 'OCB', name: 'Ngân hàng Phương Đông', shortName: 'OCB' },
  { code: 'LPB', name: 'Ngân hàng Bưu Điện Liên Việt', shortName: 'LPBank' },
  { code: 'SEAB', name: 'Ngân hàng Đông Nam Á', shortName: 'SeABank' },
  { code: 'NAB', name: 'Ngân hàng Nam Á', shortName: 'Nam A Bank' },
  { code: 'BAB', name: 'Ngân hàng Bắc Á', shortName: 'Bac A Bank' },
  { code: 'VAB', name: 'Ngân hàng Việt Á', shortName: 'VietABank' },
  { code: 'VCCB', name: 'Ngân hàng Bản Việt', shortName: 'BVBank' },
  { code: 'ABB', name: 'Ngân hàng An Bình', shortName: 'ABBANK' },
  { code: 'NCB', name: 'Ngân hàng Quốc Dân', shortName: 'NCB' },
  { code: 'CAKE', name: 'Ngân hàng số CAKE by VPBank', shortName: 'CAKE' },
  { code: 'TIMO', name: 'Ngân hàng số Timo by BVBank', shortName: 'Timo' },
  { code: 'VIETBANK', name: 'Ngân hàng Việt Nam Thương Tín', shortName: 'VietBank' },
];
