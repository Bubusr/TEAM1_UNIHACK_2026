// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TramTreCheckin
 * @dev Hợp đồng quản lý Trạm Tre (quán cà phê / không gian học tập đối tác)
 * Cơ chế check-in GPS mô phỏng, bảo vệ privacy, cấp voucher ưu đãi chống gian lận.
 */
contract TramTreCheckin {
    struct Station {
        uint256 id;
        string name;
        string addressText;
        int256 lat;      // Lat * 10^6
        int256 lng;      // Lng * 10^6
        string voucherReward;
        bool isActive;
    }

    address public admin;
    uint256 public nextStationId = 1;

    mapping(uint256 => Station) public stations;
    // player => stationId => hasCheckedIn
    mapping(address => mapping(uint256 => bool)) public hasClaimedVoucher;

    event StationAdded(uint256 indexed stationId, string name, string voucherReward);
    event StationCheckin(address indexed player, uint256 indexed stationId, string voucherReward);

    constructor() {
        admin = msg.sender;
        _seedMockStations();
    }

    function _seedMockStations() internal {
        _addStation(unicode"Trạm Tre The Workshop Coffee", "27 Ngo Duc Ke, Q.1, TP.HCM", 10772500, 106704200, "VOUCHER-COFFEE-20PERCENT");
        _addStation(unicode"Trạm Tre Tri Thức - Thư Viện Sách", "Hai Ba Trung, Q.3, TP.HCM", 10784200, 106692800, "VOUCHER-BOOK-50K");
        _addStation(unicode"Trạm Tre Không Gian Sáng Tạo Avalanche", "Khu Do Thi DHQG, TP.Thu Duc", 10870100, 106803200, "VOUCHER-AVAX-DEV-KIT");
    }

    function _addStation(
        string memory name,
        string memory addressText,
        int256 lat,
        int256 lng,
        string memory voucherReward
    ) internal {
        uint256 id = nextStationId++;
        stations[id] = Station({
            id: id,
            name: name,
            addressText: addressText,
            lat: lat,
            lng: lng,
            voucherReward: voucherReward,
            isActive: true
        });
        emit StationAdded(id, name, voucherReward);
    }

    function checkin(uint256 stationId) external returns (string memory) {
        require(stations[stationId].isActive, "Station is not active");
        require(!hasClaimedVoucher[msg.sender][stationId], "Already claimed voucher at this station");

        hasClaimedVoucher[msg.sender][stationId] = true;
        string memory voucher = stations[stationId].voucherReward;

        emit StationCheckin(msg.sender, stationId, voucher);
        return voucher;
    }

    function getAllStations() external view returns (Station[] memory) {
        Station[] memory list = new Station[](nextStationId - 1);
        for (uint256 i = 1; i < nextStationId; i++) {
            list[i - 1] = stations[i];
        }
        return list;
    }
}
