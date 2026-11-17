export interface BusLine {
  id: string;
  routeNumber: string;
  name: string;
  ticketPrice: string;
  studentPrice?: string;
  frequency: string;
  operatingHours: string;
  nearbyStops: string[];
  description: string;
}

export interface TransitStopInfo {
  orderIndex: number;
  stopName: string;
  lat: number;
  lng: number;
  nearbyBusStopName: string;
  distanceToStop: string;
  servingBusLines: string[];
  walkingTip: string;
  googleMapsUrl: string;
}

export interface TransitItineraryLeg {
  fromStop: string;
  toStop: string;
  recommendedMode: 'bus' | 'walk' | 'both';
  instruction: string;
  estimatedTime: string;
  busOption?: string;
}

export const BUS_LINES_DATA: BusLine[] = [
  {
    id: 'bus-19',
    routeNumber: '19',
    name: 'Bến Thành ⇄ ĐHQG TP.HCM',
    ticketPrice: '7.000đ',
    studentPrice: '3.000đ',
    frequency: '10 – 15 phút/chuyến',
    operatingHours: '05:00 – 20:15',
    nearbyStops: ['Nhà thờ Đức Bà', 'Bưu điện Trung tâm'],
    description: 'Tuyến buýt sinh viên phổ biến nhất, đón trả khách trực tiếp tại trạm Công Xã Paris ngay trước cổng Nhà thờ Đức Bà.',
  },
  {
    id: 'bus-04',
    routeNumber: '04',
    name: 'Bến Thành ⇄ Bến xe An Sương',
    ticketPrice: '6.000đ',
    studentPrice: '3.000đ',
    frequency: '8 – 12 phút/chuyến',
    operatingHours: '05:00 – 20:30',
    nearbyStops: ['Dinh Độc Lập'],
    description: 'Chạy dọc trục đường Nam Kỳ Khởi Nghĩa, trả khách ngay cổng chính Dinh Độc Lập.',
  },
  {
    id: 'bus-18',
    routeNumber: '18',
    name: 'Bến Thành ⇄ Chợ Hiệp Thành',
    ticketPrice: '6.000đ',
    studentPrice: '3.000đ',
    frequency: '10 – 15 phút/chuyến',
    operatingHours: '05:00 – 19:30',
    nearbyStops: ['Nhà thờ Đức Bà', 'Bưu điện Trung tâm', 'Dinh Độc Lập'],
    description: 'Tuyến buýt kết nối xuyên tâm Quận 1, dừng gần đường Hai Bà Trưng và Lê Duẩn.',
  },
  {
    id: 'bus-sightseeing',
    routeNumber: 'Sightseeing',
    name: 'Xe buýt 2 tầng TP.HCM (Hop-on Hop-off)',
    ticketPrice: '150.000đ (Vé ngày)',
    frequency: '30 phút/chuyến',
    operatingHours: '09:00 – 22:00',
    nearbyStops: ['Nhà thờ Đức Bà', 'Bưu điện Trung tâm', 'Dinh Độc Lập'],
    description: 'Tuyến buýt du lịch mui trần dừng đón trả trực tiếp tại cả 3 điểm di tích trên lộ trình BusQuest.',
  },
];

export const TRANSIT_STOPS_DATA: TransitStopInfo[] = [
  {
    orderIndex: 0,
    stopName: 'Nhà thờ Đức Bà Sài Gòn',
    lat: 10.7798,
    lng: 106.699,
    nearbyBusStopName: 'Trạm Công Xã Paris (Mã trạm: Q1-042)',
    distanceToStop: 'Cách điểm đến 50m (1 phút đi bộ)',
    servingBusLines: ['19', '18', '36', 'Sightseeing'],
    walkingTip: 'Bước xuống xe là quảng trường Đức Bà ngay trước mắt.',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=10.7798,106.6990&travelmode=transit',
  },
  {
    orderIndex: 1,
    stopName: 'Bưu điện Trung tâm Sài Gòn',
    lat: 10.78,
    lng: 106.6998,
    nearbyBusStopName: 'Trạm Bưu Điện Thành Phố (Mã trạm: Q1-043)',
    distanceToStop: 'Cách điểm đến 40m',
    servingBusLines: ['19', '18', 'Sightseeing'],
    walkingTip: 'Nằm ngay bên hông Nhà thờ Đức Bà, đối diện đường sách Nguyễn Văn Bình.',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=10.7800,106.6998&travelmode=transit',
  },
  {
    orderIndex: 2,
    stopName: 'Dinh Độc Lập',
    lat: 10.7769,
    lng: 106.6955,
    nearbyBusStopName: 'Trạm Nam Kỳ Khởi Nghĩa / Lê Duẩn (Mã trạm: Q1-018)',
    distanceToStop: 'Cách cổng chính 80m',
    servingBusLines: ['04', '31', '93', 'Sightseeing'],
    walkingTip: 'Đi bộ từ cổng vào công viên râm mát để quét mã tại bảng thông tin.',
    googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=10.7769,106.6955&travelmode=transit',
  },
];

export const TRANSIT_LEGS_DATA: TransitItineraryLeg[] = [
  {
    fromStop: 'Nhà thờ Đức Bà',
    toStop: 'Bưu điện Trung tâm',
    recommendedMode: 'walk',
    instruction: 'Hai địa điểm nằm sát cạnh nhau. Băng qua khoảng sân quảng trường và đi bộ 50m sang phía đối diện đường sách.',
    estimatedTime: '2 phút đi bộ (70m)',
  },
  {
    fromStop: 'Bưu điện Trung tâm',
    toStop: 'Dinh Độc Lập',
    recommendedMode: 'both',
    instruction: 'Có thể đi bộ thư thả 400m rợp bóng cây dọc đường Alexandre de Rhodes hoặc đón tuyến buýt số 04 / 31 tại trạm Pasteur.',
    estimatedTime: '5 phút đi bộ hoặc 3 phút xe buýt (450m)',
    busOption: 'Tuyến buýt 04 hoặc 31',
  },
];

