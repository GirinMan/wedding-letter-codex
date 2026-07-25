export const invitation = {
  meta: {
    title: "[신랑 이름] · [신부 이름] 결혼합니다",
    description: "소중한 분들을 결혼식에 초대합니다.",
    canonicalUrl: "",
  },
  couple: {
    partner1: {
      name: "[신랑 이름]",
      label: "신랑",
      phone: "",
    },
    partner2: {
      name: "[신부 이름]",
      label: "신부",
      phone: "",
    },
  },
  event: {
    date: "2030-05-18",
    time: "12:30",
    timezone: "Asia/Seoul",
    venueName: "[예식장 이름]",
    hall: "[홀 이름]",
    address: "[예식장 주소]",
    mapUrl: "",
    latitude: null,
    longitude: null,
  },
  copy: {
    headline: "저희 두 사람, 함께 걸어가려 합니다.",
    greeting:
      "서로의 가장 좋은 친구가 되어 같은 방향을 바라보며 살아가겠습니다. 귀한 걸음으로 저희의 시작을 함께해 주세요.",
    closing: "마음을 담아 초대합니다.",
  },
  hosts: [
    {
      side: "partner1",
      relationship: "아버지",
      name: "[신랑 아버지]",
      phone: "",
    },
    {
      side: "partner1",
      relationship: "어머니",
      name: "[신랑 어머니]",
      phone: "",
    },
    {
      side: "partner2",
      relationship: "아버지",
      name: "[신부 아버지]",
      phone: "",
    },
    {
      side: "partner2",
      relationship: "어머니",
      name: "[신부 어머니]",
      phone: "",
    },
  ],
  accounts: [],
  gallery: [],
  rsvp: {
    enabled: false,
    url: "",
    deadline: "",
  },
  music: {
    enabled: false,
    src: "",
    title: "",
  },
  features: {
    countdown: true,
    contacts: false,
    accounts: false,
    gallery: false,
    rsvp: false,
    share: true,
    music: false,
  },
};
