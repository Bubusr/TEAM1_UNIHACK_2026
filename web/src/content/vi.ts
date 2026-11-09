/**
 * MĂNG NON — File Nội Dung Tập Trung (vi.ts)
 * Toàn bộ chuỗi hiển thị và microcopy được gom tại đây để chạy copy-lint tự động.
 * ĐẢM BẢO: Không chứa các từ gây áp lực (mất, hết hạn, cảnh báo, streak, nhiệm vụ, phần thưởng, XP, v.v.)
 */

export const content = {
  common: {
    appName: 'MĂNG NON',
    tagline: 'Vùng đất giữa ký ức và cổ tích',
    loreQuote: 'Một đêm trong rừng tre, bạn tìm thấy một sinh linh nhỏ đang chờ được kể cho nghe về thế giới — và việc nuôi nó lớn không phải bằng cách dạy nó, mà bằng cách sống cuộc đời của chính bạn và mang về kể lại.',
    gentleReminder: 'Không vội đâu, khi nào cậu thuận tiện thì ghé lại nhé.',
    back: 'Quay lại',
    close: 'Đóng',
    confirm: 'Đồng ý',
    cancel: 'Để sau',
    save: 'Lưu lại',
    loading: 'Đang lắng nghe...',
  },

  navigation: {
    forest: 'Rừng',
    village: 'Làng',
    memory: 'Vườn',
  },

  s01_nightForest: {
    hintTitle: 'Có một thứ đang sáng trong rừng.',
    hintTap: 'Chạm vào ống nứa nhé.',
  },

  s02_openBamboo: {
    title: 'Ống nứa đang mở ra...',
    subtitle: 'Ánh sáng vàng ấm lan toả khắp rừng đêm',
    skip: 'Bỏ qua',
  },

  s03_createFigure: {
    heading: 'Bạn ấy trông như thế nào? Cậu cho mình thấy nhé.',
    tabDraw: 'Vẽ tay',
    tabPhoto: 'Chụp ảnh',
    tabUpload: 'Tải ảnh lên',
    tabSamples: 'Dùng một hình mẫu',
    previewLiving: 'Bạn ấy đang thở nhẹ nhàng giữa rừng tre',
    btnRetry: 'Chưa ưng, làm lại',
    btnConfirm: 'Là bạn ấy rồi',
    cameraDenied: 'Chưa chụp được cũng không sao. Cậu chọn một tấm ảnh có sẵn nhé.',
    segmentSlow: 'Mình đang cắt nền hơi lâu. Cậu muốn tự khoanh bạn ấy lại không?',
  },

  s04_namingPersonality: {
    heading: 'Cậu muốn gọi bạn ấy là gì?',
    placeholderName: 'Măng',
    personalityTitle: 'Tính cách của Măng Non',
    personalities: {
      tomo: {
        name: 'Tò mò',
        desc: 'Hỏi dồn dập, tò mò về thế giới xung quanh',
        sample: 'Cậu vừa nói xong một điều mới à? Kể tiếp đi, rồi sao nữa? Nó trông như thế nào?',
      },
      diemtinh: {
        name: 'Điềm tĩnh',
        desc: 'Trầm lặng, kiên định lắng nghe từng điều nhỏ',
        sample: '...À. Vậy là hôm nay cậu học được điều đó. Mình sẽ nhớ.',
      },
      haohung: {
        name: 'Hào hứng',
        desc: 'Năng nổ, hay đố vui và khích lệ tinh thần',
        sample: 'Ồ hay quá!! Mình đoán thử nhé — cái đó có liên quan đến hôm qua không?',
      },
      nhutnhat: {
        name: 'Nhút nhát',
        desc: 'Rụt rè, ngập ngừng, cần cậu chủ động bắt chuyện',
        sample: '...Cậu quay lại rồi à. Mình... mình có nghĩ về điều cậu kể hôm trước.',
      },
    },
    btnMeet: 'Gặp bạn ấy',
  },

  s05_firstMeeting: {
    turn2_askJourney: 'Cậu đang muốn lớn lên cùng điều gì?',
    turn2_placeholder: 'Ví dụ: Đọc sách, học một kỹ năng mới...',
    turn2_chips: ['Học một thứ mới', 'Giữ một thói quen nhẹ nhàng', 'Vượt qua giai đoạn khó', 'Chưa biết'],
    turn3_askDuration: 'Cậu muốn đi cùng nhau bao lâu cũng được, không vội đâu.',
    turn3_chips: ['7 ngày', '14 ngày', '30 ngày', 'Mình tự báo khi xong'],
    btnStart: 'Vậy mình bắt đầu nhé',
  },

  s06_homeForest: {
    actionTell: 'Kể cho Măng Non nghe',
    idleSpeech: ['Mình đang ngắm lá.', 'Gió đêm mát quá.', 'Cậu về rồi à.'],
    emptyNight: 'Rừng đang yên. Có một ống nứa đang chờ cậu.',
    emptyDay: 'Ống nứa sáng rõ nhất vào ban đêm. Nhưng nếu cậu sẵn sàng, mình mở sớm cũng được.',
    btnOpenNow: 'Mở thôi',
    welcomeBackMild: 'Cậu về rồi. Mình vẫn ở đây.',
    welcomeBackLong: 'Lâu rồi mới gặp. Không cần kể gì cũng được, ngồi cạnh mình một lát cũng tốt.',
  },

  s07_chat: {
    inputPlaceholder: 'Hôm nay cậu muốn kể gì…',
    starterChips: [
      'Hôm nay mình học được…',
      'Có chuyện làm mình nghĩ mãi…',
      'Mình vừa thấy một điều lạ…',
    ],
    leaveMessage: 'Khi nào cậu muốn kể tiếp, mình ở đây.',
    memorySavedToast: 'Mình nhớ rồi.',
  },

  s08_memories: {
    title: 'Điều Măng Non nhớ',
    empty: 'Mình chưa nhớ gì nhiều. Cậu kể mình nghe nhé, khi nào cậu muốn.',
    btnPin: 'Giữ thật lâu',
    btnForget: 'Quên điều này',
    forgetConfirm: 'Quên rồi thì Măng Non sẽ không nhắc lại nữa. Cậu chắc nhé?',
    stages: {
      1: { name: 'Tò Mò Thô', poetic: 'Mình đang bỡ ngỡ học những điều đầu tiên về thế giới.' },
      2: { name: 'Biết Liên Tưởng', poetic: 'Mình đang học nối những điều cậu kể với nhau.' },
      3: { name: 'Có Góc Nhìn Riêng', poetic: 'Mình đã bắt đầu có những suy nghĩ nho nhỏ của riêng mình.' },
      4: { name: 'Đồng Hành Sâu Sắc', poetic: 'Mình hiểu cậu nhiều hơn, và luôn ở cạnh cậu trong thầm lặng.' },
    },
  },

  s09_journeySheet: {
    title: 'Hành trình đang đi',
    btnEdit: 'Sửa tên',
    btnCloseJourney: 'Khép lại hành trình',
    journeyRestNotice: 'Hình như hành trình đang ở chỗ nghỉ chân. Cậu thấy sao?',
    btnExtend: 'Đi tiếp thêm',
  },

  s10_restingRitual: {
    step1Title: 'Một hành trình đã khép lại rồi. Mình muốn nói lời cảm ơn trước khi ngủ…',
    step2Title: 'Nhìn lại những điều mình nhớ nhất',
    step3Title: 'Lời cuối gửi cậu',
    step4Title: 'Măng Non hoá thành phiến đá nhẵn dưới lòng suối trong vắt',
    step5Contribution: 'Hành trình của cậu đã góp một chiếc lá cho Cây Đa.',
    btnReturnForest: 'Về rừng',
  },

  s11_memoryStream: {
    title: 'Suối Ký Ức',
    subtitle: 'Nước chảy qua nhưng phiến đá không mòn.',
    empty: 'Chỗ này đang chờ một người bạn đầu tiên.',
  },

  s12_villageTree: {
    title: 'Làng Phù Đổng',
    banyanName: 'Cây Đa Phù Đổng',
    leavesCountText: 'lá phát sáng trên tán cây',
    afterBloomText: 'Đêm qua Cây Đa đã nở hoa.',
    btnRewatch: 'Xem lại',
    newSeasonText: 'Một mùa mới ở làng đã bắt đầu.',
  },

  s13_settings: {
    title: 'Cài đặt',
    rename: 'Đổi tên Măng Non',
    reminder: 'Nhắc nhẹ dịu dàng',
    reducedMotion: 'Giảm chuyển động',
    sound: 'Âm thanh tự nhiên',
    loreIntro: 'Giới thiệu về thế giới',
    clearData: 'Xoá toàn bộ dữ liệu',
    clearDataConfirm1: 'Mọi điều đã kể và các bạn ở Vườn sẽ không còn nữa. Cậu muốn đi tiếp không?',
    clearDataConfirm2: 'Hãy gõ tên Măng Non để xác nhận xoá hoàn toàn:',
    demoModeToggle: 'Chế độ trình diễn (Demo Panel)',
  },

  s14_demoPanel: {
    title: 'Demo Control Panel (3 Phút)',
    timeLabel: 'Thời gian:',
    seasonLabel: 'Mùa:',
    stageLabel: 'Giai đoạn nhận thức:',
    btnSeedMemories: 'Thêm 8 ký ức mẫu',
    btnJumpRest: 'Nhảy tới hoàn thành (An nghỉ)',
    btnTriggerBloom: 'Kích hoạt bùng nổ hoa gạo',
    btnSimulateOffline: 'Mô phỏng quay lại sau 7 ngày',
    btnResetAll: 'Đặt lại như mới (S01)',
  },
};

