export interface Ward {
  name: string;
}

export interface District {
  name: string;
  wards: string[];
}

export interface Province {
  name: string;
  districts: District[];
}

export const VIETNAM_LOCATIONS: Province[] = [
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Cô Giang', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh', 'Phường Nguyễn Thái Bình', 'Phường Phạm Ngũ Lão', 'Phường Tân Định']
      },
      {
        name: 'Quận 3',
        wards: ['Phường 01', 'Phường 02', 'Phường 03', 'Phường 04', 'Phường 05', 'Phường 09', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường Vo Thi Sau']
      },
      {
        name: 'Quận 7',
        wards: ['Phường Bình Thuận', 'Phường Phú Mỹ', 'Phường Phú Thuận', 'Phường Tân Hưng', 'Phường Tân Kiểng', 'Phường Tân Phong', 'Phường Tân Phú', 'Phường Tân Quy', 'Phường Tân Thuận Đông', 'Phường Tân Thuận Tây']
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 17', 'Phường 19', 'Phường 21', 'Phường 22', 'Phường 24', 'Phường 25', 'Phường 26', 'Phường 27', 'Phường 28']
      },
      {
        name: 'TP. Thủ Đức',
        wards: ['Phường An Khánh', 'Phường An Lợi Đông', 'Phường An Phú', 'Phường Bình Chiểu', 'Phường Bình Thọ', 'Phường Bình Trưng Đông', 'Phường Bình Trưng Tây', 'Phường Hiệp Bình Chánh', 'Phường Hiệp Bình Phước', 'Phường Hiệp Phú', 'Phường Linh Trung', 'Phường Linh Xuân', 'Phường Phước Long A', 'Phường Phước Long B', 'Phường Thảo Điền', 'Phường Thạnh Mỹ Lợi', 'Phường Thủ Thiêm']
      },
      {
        name: 'Quận Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15']
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12', 'Phường 13', 'Phường 14', 'Phường 15', 'Phường 16', 'Phường 17']
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 13', 'Phường 15', 'Phường 17']
      },
      {
        name: 'Huyện Bình Chánh',
        wards: ['Thị trấn Tân Túc', 'Xã An Phú Tây', 'Xã Bình Chánh', 'Xã Bình Hưng', 'Xã Bình Lợi', 'Xã Đa Phước', 'Xã Hưng Long', 'Xã Lê Minh Xuân', 'Xã Phạm Văn Hai', 'Xã Phong Phú', 'Xã Quy Đức', 'Xã Tân Kiên', 'Xã Tân Nhựt', 'Xã Tân Quý Tây', 'Xã Vĩnh Lộc A', 'Xã Vĩnh Lộc B']
      },
      {
        name: 'Huyện Hóc Môn',
        wards: ['Thị trấn Hóc Môn', 'Xã Bà Điểm', 'Xã Đông Thạnh', 'Xã Nhị Bình', 'Xã Tân Hiệp', 'Xã Tân Thới Nhì', 'Xã Tân Xuân', 'Xã Thới Tam Thôn', 'Xã Trung Chánh', 'Xã Xuân Thới Đông', 'Xã Xuân Thới Sơn', 'Xã Xuân Thới Thượng']
      }
    ]
  },
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Cống Vị', 'Phường Điện Biên', 'Phường Đội Cấn', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Liễu Giai', 'Phường Ngọc Hà', 'Phường Ngọc Khánh', 'Phường Nguyễn Trung Trực', 'Phường Phúc Xá', 'Phường Quán Thánh', 'Phường Thành Công', 'Phường Thụy Khuê', 'Phường Trúc Bạch']
      },
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Chương Dương', 'Phường Cửa Đông', 'Phường Cửa Nam', 'Phường Đồng Xuân', 'Phường Hàng Bạc', 'Phường Hàng Bồ', 'Phường Hàng Bông', 'Phường Hàng Buồm', 'Phường Hàng Đào', 'Phường Hàng Gai', 'Phường Hàng Mã', 'Phường Hàng Trống', 'Phường Lý Thái Tổ', 'Phường Phan Chu Trinh', 'Phường Phúc Tân', 'Phường Trần Hưng Đạo', 'Phường Tràng Tiền']
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Quan Hoa', 'Phường Trung Hòa', 'Phường Yên Hòa']
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Hàng Bột', 'Phường Khâm Thiên', 'Phường Khương Thượng', 'Phường Kim Liên', 'Phường Láng Hạ', 'Phường Láng Thượng', 'Phường Nam Đồng', 'Phường Ô Chợ Dừa', 'Phường Phương Liên', 'Phường Phương Mai', 'Phường Quang Trung', 'Phường Quốc Tử Giám', 'Phường Thịnh Quang', 'Phường Thổ Quan', 'Phường Trung Liệt', 'Phường Trung Phụng', 'Phường Trung Tự', 'Phường Văn Chương', 'Phường Văn Miếu']
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Bạch Mai', 'Phường Cầu Dền', 'Phường Đống Mác', 'Phường Đồng Nhân', 'Phường Đồng Tâm', 'Phường Lê Đại Hành', 'Phường Minh Khai', 'Phường Ngô Thì Nhậm', 'Phường Nguyễn Du', 'Phường Phạm Đình Hổ', 'Phường Phố Huế', 'Phường Quỳnh Lôi', 'Phường Quỳnh Mai', 'Phường Thanh Lương', 'Phường Thanh Nhàn', 'Phường Trương Định', 'Phường Vĩnh Tuy']
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Khương Trung', 'Phường Kim Giang', 'Phường Nhân Chính', 'Phường Phương Liệt', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Nam', 'Phường Thanh Xuân Trung', 'Phường Thượng Đình']
      },
      {
        name: 'Quận Nam Từ Liêm',
        wards: ['Phường Cầu Diễn', 'Phường Đại Mỗ', 'Phường Mễ Trì', 'Phường Mỹ Đình 1', 'Phường Mỹ Đình 2', 'Phường Phú Đô', 'Phường Phương Canh', 'Phường Tây Mỗ', 'Phường Trung Văn', 'Phường Xuân Phương']
      }
    ]
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hải Châu I', 'Phường Hải Châu II', 'Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam', 'Phường Hòa Thuận Đông', 'Phường Hòa Thuận Tây', 'Phường Nam Dương', 'Phường Phước Ninh', 'Phường Thạch Thang', 'Phường Thanh Bình', 'Phường Thuận Phước']
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Hòa Khê', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Thanh Khê Đông', 'Phường Thanh Khê Tây', 'Phường Thạc Gián', 'Phường Vĩnh Trung', 'Phường Xuân Hà']
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Phước Mỹ', 'Phường Thọ Quang', 'Phường Nại Hiên Đông']
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Khuê Mỹ', 'Phường Mỹ An']
      }
    ]
  },
  {
    name: 'Bình Dương',
    districts: [
      {
        name: 'TP. Thủ Dầu Một',
        wards: ['Phường Phú Cường', 'Phường Hiệp Thành', 'Phường Chánh Nghĩa', 'Phường Phú Thọ', 'Phường Phú Hòa', 'Phường Phú Lợi', 'Phường Định Hòa', 'Phường Hiệp An', 'Phường Tân An', 'Phường Tương Bình Hiệp', 'Phường Chánh Mỹ', 'Phường Hòa Phú', 'Phường Phú Tân']
      },
      {
        name: 'TP. Dĩ An',
        wards: ['Phường Dĩ An', 'Phường Tân Bình', 'Phường Tân Đông Hiệp', 'Phường Bình An', 'Phường Bình Thắng', 'Phường Đông Hòa', 'Phường An Bình']
      },
      {
        name: 'TP. Thuận An',
        wards: ['Phường Lái Thieu', 'Phường An Thạnh', 'Phường Vĩnh Phú', 'Phường Bình Hòa', 'Phường Bình Nhâm', 'Phường Thuận Giao', 'Phường An Phú', 'Phường Bình Chuẩn']
      }
    ]
  },
  {
    name: 'Đồng Nai',
    districts: [
      {
        name: 'TP. Biên Hòa',
        wards: ['Phường Trảng Dài', 'Phường Tân Phong', 'Phường Tân Hiệp', 'Phường Hố Nai', 'Phường Tân Biên', 'Phường Tân Hòa', 'Phường Bình Đa', 'Phường Tam Hiệp', 'Phường Tam Hòa', 'Phường Tân Mai', 'Phường Thống Nhất', 'Phường Quyết Thắng', 'Phường Trung Dũng', 'Phường Thanh Bình']
      },
      {
        name: 'TP. Long Khánh',
        wards: ['Phường Xuân Trung', 'Phường Xuân Thanh', 'Phường Xuân An', 'Phường Xuân Bình', 'Phường Xuân Hòa', 'Phường Phú Bình', 'Phường Bảo Vinh']
      }
    ]
  },
  {
    name: 'Cần Thơ',
    districts: [
      {
        name: 'Quận Ninh Kiều',
        wards: ['Phường An Bình', 'Phường An Cư', 'Phường An Hòa', 'Phường An Khánh', 'Phường An Nghiệp', 'Phường An Phú', 'Phường Cái Khế', 'Phường Hưng Lợi', 'Phường Tân An', 'Phường Thới Bình', 'Phường Xuân Khánh']
      },
      {
        name: 'Quận Cái Răng',
        wards: ['Phường Ba Láng', 'Phường Hưng Thạnh', 'Phường Hưng Phú', 'Phường Lê Bình', 'Phường Phú Thứ', 'Phường Tân Phú']
      }
    ]
  },
  {
    name: 'Hải Phòng',
    districts: [
      {
        name: 'Quận Hồng Bàng',
        wards: ['Phường Hoàng Văn Thụ', 'Phường Minh Khai', 'Phường Phan Bội Châu', 'Phường Quán Toan', 'Phường Thượng Lý', 'Phường Trại Chuối']
      },
      {
        name: 'Quận Ngô Quyền',
        wards: ['Phường Cầu Đất', 'Phường Cầu Tre', 'Phường Đằng Giang', 'Phường Đông Khê', 'Phường Đồng Quốc Bình', 'Phường Lạc Viên', 'Phường Lạch Tray', 'Phường Máy Tơ']
      }
    ]
  },
  { name: 'An Giang', districts: [{ name: 'TP. Long Xuyên', wards: ['Phường Mỹ Bình', 'Phường Mỹ Long', 'Phường Mỹ Xuyên'] }] },
  { name: 'Bà Rịa - Vũng Tàu', districts: [{ name: 'TP. Vũng Tàu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Thắng Tam', 'Phường Rạch Dừa'] }] },
  { name: 'Bắc Giang', districts: [{ name: 'TP. Bắc Giang', wards: ['Phường Trần Phú', 'Phường Ngô Quyền', 'Phường Hoàng Văn Thụ'] }] },
  { name: 'Bắc Kạn', districts: [{ name: 'TP. Bắc Kạn', wards: ['Phường Đức Xuân', 'Phường Phùng Chí Kiên', 'Phường Sông Cầu'] }] },
  { name: 'Bạc Liêu', districts: [{ name: 'TP. Bạc Liêu', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 5', 'Phường 7', 'Phường 8'] }] },
  { name: 'Bắc Ninh', districts: [{ name: 'TP. Bắc Ninh', wards: ['Phường Suối Hoa', 'Phường Tiền An', 'Phường Ninh Xá', 'Phường Vệ An'] }] },
  { name: 'Bến Tre', districts: [{ name: 'TP. Bến Tre', wards: ['Phường An Hội', 'Phường Phường 4', 'Phường Phú Khương'] }] },
  { name: 'Bình Định', districts: [{ name: 'TP. Quy Nhơn', wards: ['Phường Bồng Sơn', 'Phường Nhơn Phú', 'Phường Quang Trung'] }] },
  { name: 'Bình Phước', districts: [{ name: 'TP. Đồng Xoài', wards: ['Phường Tân Phú', 'Phường Tân Bình', 'Phường Tân Xuân'] }] },
  { name: 'Bình Thuận', districts: [{ name: 'TP. Phan Thiết', wards: ['Phường Đức Thắng', 'Phường Đức Nghĩa', 'Phường Phú Trinh'] }] },
  { name: 'Cà Mau', districts: [{ name: 'TP. Cà Mau', wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 8', 'Phường 9'] }] },
  { name: 'Cao Bằng', districts: [{ name: 'TP. Cao Bằng', wards: ['Phường Hợp Giang', 'Phường Sông Bằng', 'Phường Tân Giang'] }] },
  { name: 'Đắk Lắk', districts: [{ name: 'TP. Buôn Ma Thuột', wards: ['Phường Tân An', 'Phường Tân Lợi', 'Phường Thắng Lợi', 'Phường Thống Nhất'] }] },
  { name: 'Đắk Nông', districts: [{ name: 'TP. Gia Nghĩa', wards: ['Phường Nghĩa Đức', 'Phường Nghĩa Thành', 'Phường Nghĩa Phú'] }] },
  { name: 'Điện Biên', districts: [{ name: 'TP. Điện Biên Phủ', wards: ['Phường Mường Thanh', 'Phường Tân Thanh', 'Phường Nam Thanh'] }] },
  { name: 'Đồng Tháp', districts: [{ name: 'TP. Cao Lãnh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường Hòa Thuận'] }] },
  { name: 'Gia Lai', districts: [{ name: 'TP. Pleiku', wards: ['Phường Diên Hồng', 'Phường Hoa Lư', 'Phường Hội Thương', 'Phường Tây Sơn'] }] },
  { name: 'Hà Giang', districts: [{ name: 'TP. Hà Giang', wards: ['Phường Trần Phú', 'Phường Minh Khai', 'Phường Nguyễn Trãi'] }] },
  { name: 'Hà Nam', districts: [{ name: 'TP. Phủ Lý', wards: ['Phường Minh Khai', 'Phường Hai Bà Trưng', 'Phường Tran Hưng Đạo'] }] },
  { name: 'Hà Tĩnh', districts: [{ name: 'TP. Hà Tĩnh', wards: ['Phường Bắc Hà', 'Phường Nam Hà', 'Phường Tân Giang', 'Phường Trần Phú'] }] },
  { name: 'Hải Dương', districts: [{ name: 'TP. Hải Dương', wards: ['Phường Quang Trung', 'Phường Trần Phú', 'Phường Ngô Quyền', 'Phường Lê Thanh Nghị'] }] },
  { name: 'Hậu Giang', districts: [{ name: 'TP. Vị Thanh', wards: ['Phường I', 'Phường III', 'Phường IV', 'Phường V'] }] },
  { name: 'Hòa Bình', districts: [{ name: 'TP. Hòa Bình', wards: ['Phường Phương Lâm', 'Phường Tân Hòa', 'Phường Đồng Tiến'] }] },
  { name: 'Hưng Yên', districts: [{ name: 'TP. Hưng Yên', wards: ['Phường Hiến Nam', 'Phường Lê Lợi', 'Phường Minh Khai'] }] },
  { name: 'Khánh Hòa', districts: [{ name: 'TP. Nha Trang', wards: ['Phường Lộc Thọ', 'Phường Phước Tiến', 'Phường Tân Lập', 'Phường Phước Hòa', 'Phường Vĩnh Nguyên', 'Phường Vĩnh Hải'] }] },
  { name: 'Kiên Giang', districts: [{ name: 'TP. Rạch Giá', wards: ['Phường Vĩnh Thanh', 'Phường Vĩnh Bảo', 'Phường Vĩnh Lạc', 'Phường An Hòa'] }, { name: 'TP. Phú Quốc', wards: ['Phường Dương Đông', 'Phường An Thới', 'Xã Cửa Dương', 'Xã Gành Dầu'] }] },
  { name: 'Kon Tum', districts: [{ name: 'TP. Kon Tum', wards: ['Phường Quyết Thắng', 'Phường Quang Trung', 'Phường Thống Nhất'] }] },
  { name: 'Lai Châu', districts: [{ name: 'TP. Lai Châu', wards: ['Phường Tân Phong', 'Phường Đông Phong', 'Phường Quyết Thắng'] }] },
  { name: 'Lâm Đồng', districts: [{ name: 'TP. Đà Lạt', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường 8', 'Phường 9', 'Phường 10', 'Phường 11', 'Phường 12'] }, { name: 'TP. Bảo Lộc', wards: ['Phường 1', 'Phường 2', 'Phường B\'Lao', 'Phường Lộc Phát', 'Phường Lộc Tiến'] }] },
  { name: 'Lạng Sơn', districts: [{ name: 'TP. Lạng Sơn', wards: ['Phường Hoàng Văn Thụ', 'Phường Tam Thanh', 'Phường Vĩnh Trại'] }] },
  { name: 'Lào Cai', districts: [{ name: 'TP. Lào Cai', wards: ['Phường Cốc Lếu', 'Phường Kim Tân', 'Phường Bắc Cường', 'Phường Nam Cường'] }, { name: 'Thị xã Sa Pa', wards: ['Phường Sa Pa', 'Phường Sa Pả', 'Phường Ô Quý Hồ'] }] },
  { name: 'Long An', districts: [{ name: 'TP. Tân An', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 6', 'Phường 7', 'Phường Tân Khánh'] }] },
  { name: 'Nam Định', districts: [{ name: 'TP. Nam Định', wards: ['Phường Quang Trung', 'Phường Tran Hưng Đạo', 'Phường Ngô Quyền', 'Phường Vị Hoàng'] }] },
  { name: 'Nghệ An', districts: [{ name: 'TP. Vinh', wards: ['Phường Lê Lợi', 'Phường Hưng Bình', 'Phường Bến Thủy', 'Phường Trường Thi', 'Phường Hà Huy Tập'] }] },
  { name: 'Ninh Bình', districts: [{ name: 'TP. Ninh Bình', wards: ['Phường Vân Giang', 'Phường Tân Thành', 'Phường Đông Thành', 'Phường Nam Bình'] }] },
  { name: 'Ninh Thuận', districts: [{ name: 'TP. Phan Rang-Tháp Chàm', wards: ['Phường Phan Đăng Lưu', 'Phường Đổ Vinh', 'Phường Phước Mỹ'] }] },
  { name: 'Phú Thọ', districts: [{ name: 'TP. Việt Trì', wards: ['Phường Gia Cẩm', 'Phường Tiên Cát', 'Phường Nông Trang', 'Phường Tân Dân'] }] },
  { name: 'Phú Yên', districts: [{ name: 'TP. Tuy Hòa', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 9'] }] },
  { name: 'Quảng Bình', districts: [{ name: 'TP. Đồng Hới', wards: ['Phường Đồng Mỹ', 'Phường Hải Đình', 'Phường Nam Lý', 'Phường Bắc Lý'] }] },
  { name: 'Quảng Nam', districts: [{ name: 'TP. Tam Kỳ', wards: ['Phường An Xuân', 'Phường Phước Hòa', 'Phường An Mỹ', 'Phường Hòa Hương'] }, { name: 'TP. Hội An', wards: ['Phường Minh An', 'Phường Cẩm Phô', 'Phường Tân An', 'Phường Cẩm Châu'] }] },
  { name: 'Quảng Ngãi', districts: [{ name: 'TP. Quảng Ngãi', wards: ['Phường Tran Phú', 'Phường Nguyễn Nghiêm', 'Phường Chánh Lộ', 'Phường Nghĩa Chánh'] }] },
  { name: 'Quảng Ninh', districts: [{ name: 'TP. Hạ Long', wards: ['Phường Bãi Cháy', 'Phường Hồng Gai', 'Phường Cao Xanh', 'Phường Ha Lòng', 'Phường Tuần Châu'] }, { name: 'TP. Móng Cái', wards: ['Phường Hòa Lạc', 'Phường Trần Phú', 'Phường Ka Long'] }] },
  { name: 'Quảng Trị', districts: [{ name: 'TP. Đông Hà', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5'] }] },
  { name: 'Sóc Trăng', districts: [{ name: 'TP. Sóc Trăng', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 6', 'Phường 8'] }] },
  { name: 'Sơn La', districts: [{ name: 'TP. Sơn La', wards: ['Phường Chiềng Lề', 'Phường Quyết Thắng', 'Phường Tô Hiệu'] }] },
  { name: 'Tây Ninh', districts: [{ name: 'TP. Tây Ninh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường Hiệp Ninh'] }] },
  { name: 'Thái Bình', districts: [{ name: 'TP. Thái Bình', wards: ['Phường Bồ Xuyên', 'Phường Đề Thám', 'Phường Kỳ Bá', 'Phường Quang Trung'] }] },
  { name: 'Thái Nguyên', districts: [{ name: 'TP. Thái Nguyên', wards: ['Phường Phan Đình Phùng', 'Phường Hoàng Văn Thụ', 'Phường Trưng Vương', 'Phường Quang Trung'] }] },
  { name: 'Thanh Hóa', districts: [{ name: 'TP. Thanh Hóa', wards: ['Phường Lam Sơn', 'Phường Điện Biên', 'Phường Ba Đình', 'Phường Ngọc Trạo', 'Phường Tân Sơn'] }] },
  { name: 'Thừa Thiên Huế', districts: [{ name: 'TP. Huế', wards: ['Phường Phú Hòa', 'Phường Phú Hội', 'Phường Vĩnh Ninh', 'Phường Phường Đúc', 'Phường Thuận Thành'] }] },
  { name: 'Tiền Giang', districts: [{ name: 'TP. Mỹ Tho', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8'] }] },
  { name: 'Trà Vinh', districts: [{ name: 'TP. Trà Vinh', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 5', 'Phường 7', 'Phường 8', 'Phường 9'] }] },
  { name: 'Tuyên Quang', districts: [{ name: 'TP. Tuyên Quang', wards: ['Phường Tân Quang', 'Phường Minh Xuân', 'Phường Phan Thiết'] }] },
  { name: 'Vĩnh Long', districts: [{ name: 'TP. Vĩnh Long', wards: ['Phường 1', 'Phường 2', 'Phường 3', 'Phường 4', 'Phường 8', 'Phường 9'] }] },
  { name: 'Vĩnh Phúc', districts: [{ name: 'TP. Vĩnh Yên', wards: ['Phường Ngô Quyền', 'Phường Liên Bảo', 'Phường Tích Sơn', 'Phường Đồng Tâm'] }] },
  { name: 'Yên Bái', districts: [{ name: 'TP. Yên Bái', wards: ['Phường Đồng Tâm', 'Phường Minh Tân', 'Phường Nguyễn Thái Học', 'Phường Hồng Hà'] }] }
];
