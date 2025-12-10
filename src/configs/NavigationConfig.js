import { AppstoreOutlined, MailOutlined, MessageOutlined, UserOutlined, TeamOutlined, SafetyOutlined, SettingOutlined, EnvironmentOutlined, CustomerServiceOutlined, PlusSquareOutlined, WalletOutlined, ShopOutlined, CalendarOutlined, DollarOutlined, PercentageOutlined, IdcardOutlined, ShoppingOutlined, CrownOutlined, TrophyOutlined, UsergroupAddOutlined, ScanOutlined,BookOutlined, CameraOutlined, BarcodeOutlined, DashboardOutlined, WhatsAppOutlined, BarChartOutlined, FileSearchOutlined, DesktopOutlined, ScheduleOutlined, CommentOutlined, PlayCircleFilled, PlayCircleOutlined, GiftOutlined, ClockCircleOutlined, LayoutOutlined } from '@ant-design/icons';

// Dashboard
const dashboardNav = {
  key: 'dashboard',
  path: 'dashboard',
  title: 'Dashboard',
  icon: DashboardOutlined,
  breadcrumb: false,
  submenu: [],
  permissions: ["View Dashboard"]
};

// User Management Submenu
const userManagementSubmenu = [
  {
    key: 'users',
    path: 'users',
    title: 'Users',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View User"]
  },
  {
    key: 'organizers',
    path: 'organizers',
    title: 'Organizers',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    roles:['Admin'],
    permissions: ["View Organizers"]
  },

  {
    key: 'attendees',
    path: 'attendees',
    title: 'Attendees',
    icon: UsergroupAddOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Attendees"]
  },
  {
    key: 'login-history',
    path: 'login-history',
    title: 'Login History',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Login History"]
  }
];

// Partners & Clients Submenu
const partnersClientsSubmenu = [
  {
    key: 'corporates',
    path: 'bookings/corporate',
    title: 'Corporate',
    icon: CrownOutlined,
    breadcrumb: false,
    permissions: ["View Corporate Bookings"],
    submenu: [
      {
        key: 'corporate-manage',
        path: 'bookings/corporate',
        title: 'Manage',
        breadcrumb: false,
        permissions: ["View Corporate Bookings"]
      }
    ]
  },
  {
    key: 'sponsors',
    path: 'bookings/sponsor',
    title: 'Sponsor',
    icon: TrophyOutlined,
    breadcrumb: false,
    permissions: ["View Sponsor Bookings"],
    submenu: [
      {
        key: 'sponsor-manage',
        path: 'bookings/sponsor',
        title: 'Manage',
        breadcrumb: false,
        permissions: ["View Sponsor Bookings"]
      },
      {
        key: 'sponsor-new',
        path: 'bookings/sponsor/new',
        title: 'New',
        breadcrumb: false,
        permissions: ["Add Sponsor Booking"]
      }
    ]
  },
  {
    key: 'complimentary-booking',
    path: 'bookings/complimentary',
    title: 'Complimentary',
    icon: TrophyOutlined,
    breadcrumb: false,
    permissions: ["View Complimentary Bookings"],
    submenu: [
      {
        key: 'complimentary-manage',
        path: 'bookings/complimentary',
        title: 'Manage',
        breadcrumb: false,
        permissions: ["View Complimentary Bookings"]
      },
      {
        key: 'complimentary-new',
        path: 'bookings/complimentary/new',
        title: 'New',
        breadcrumb: false,
        permissions: ["Add Complimentary Booking"]
      }
    ]
  },
];

const partnersClientsNav = {
  key: 'partners-clients',
  path: 'partners-clients',
  title: 'Partner Bookings',
  icon: CrownOutlined,
  breadcrumb: false,
  submenu: partnersClientsSubmenu,
  permissions:["View Corporate Bookings","View Sponsor Bookings","View Complimentary Bookings"]
};

const userManagementNav = {
  key: 'user-management',
  path: 'user-management',
  title: 'User Management',
  icon: TeamOutlined,
  breadcrumb: false,
  submenu: userManagementSubmenu,
  roles: ["Admin", "Organizers"]
};

// Bookings Submenu


const bookingsSubmenu = [
  {
    key: 'online-manage',
    title: 'Online Bookings',
    breadcrumb: false,
    icon: ShoppingOutlined,
    permissions: ["View Online Bookings"],
    submenu: [
      {
        key: 'online-new',
        path: 'bookings/online',
        title: 'Confirmed',
        breadcrumb: false,
        icon: ShoppingOutlined,
        permissions: ["View Online Bookings"],
      },
      {
        key: 'pending-booking',
        path: 'bookings/pending',
        title: 'Pending',
        icon: ClockCircleOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
    ]
  },
  {
    key: 'agent-booking',
    path: 'bookings/agent',
    title: 'Agent',
    icon: IdcardOutlined,
    breadcrumb: false,
    permissions: ["View Agent Bookings"],
    submenu: [
      {
        key: 'agent-manage',
        path: 'bookings/agent',
        title: 'Manage',
        breadcrumb: false,
        permissions: ["View Agent Bookings"]
      },
      {
        key: 'agent-new',
        path: 'bookings/agent/new',
        title: 'New',
        breadcrumb: false,
        permissions: ["Add Agent Booking"]
      }
    ]
  },
  {
    key: 'pos-booking',
    path: 'bookings/pos',
    title: 'POS',
    icon: ShoppingOutlined,
    breadcrumb: false,
    permissions: ["View POS Bookings"],
    submenu: [
      {
        key: 'pos-manage',
        path: 'bookings/pos',
        title: 'Manage',
        breadcrumb: false,
        permissions: ["View POS Bookings"]
      },
      {
        key: 'pos-new',
        path: 'bookings/pos/new',
        title: 'New',
        breadcrumb: false,
        permissions: ["Create POS Bookings"]
      }
    ]
  },
  partnersClientsNav
];

const bookingsNav = {
  key: 'bookings',
  path: 'bookings',
  title: 'Bookings',
  icon: ScheduleOutlined,
  breadcrumb: false,
  submenu: bookingsSubmenu,
  roles: ["Admin", "Organizers"]
};



// Event Management Submenu
const eventManagementSubmenu = [
  {
    key: 'events',
    path: 'events',
    title: 'Events',
    icon: CalendarOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Event"]
  },
  {
    key: 'categories',
    path: 'category',
    title: 'Category',
    icon: AppstoreOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'venues',
    path: 'venues',
    title: 'Venues',
    icon: EnvironmentOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin", "Organizers"],
    permissions: ["View Venues"]
  },
  // add one more for layouts use proper icon layout
  {
    key: 'layouts',
    path: 'theatre',
    title: 'Layouts',
    icon: LayoutOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin", "Organizers"],
    permissions: ["View Layouts"]
  },
  {
    key: 'artists',
    path: 'artist',
    title: 'Artist',
    icon: CustomerServiceOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ["Admin", "Organizers"],
    permissions: ["View Artists"]
  },
  {
    key: 'content-master',
    path: 'event-content',
    title: 'Content Master',
    icon: BookOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'fields',
    path: 'fields',
    title: 'Custom Fields',
    icon: PlusSquareOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  }
];

const eventManagementNav = {
  key: 'event-management',
  path: 'event-management',
  title: 'Event Management',
  icon: CalendarOutlined,
  breadcrumb: false,
  submenu: eventManagementSubmenu,
  roles: ["Admin", "Organizers"]
};

// Scan Submenu
const scanSubmenu = [
  {
    key: 'scan-camera',
    path: 'scan/camera',
    title: 'Scan By Camera',
    icon: CameraOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["Scan By Camera"]
  },
  {
    key: 'scan-scanner',
    path: 'scan/scanner',
    title: 'Scan By Scanner',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["Scan By Scanner"]
  },
  {
    key: 'scan-history',
    path: 'scan/history',
    title: 'Scan History',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Scan History"]
  }
];
const scanNav = {
  key: 'scan',
  path: 'scan',
  title: 'Scan Ticket',
  icon: ScanOutlined,
  breadcrumb: false,
  submenu: scanSubmenu,
  roles: ["Admin", "Organizers","Scanner"]

}
// Sales & Operations Submenu
const salesOperationsSubmenu = [
  {
    key: 'box-office',
    path: 'box-office',
    title: 'Box Office',
    icon: ShopOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Box Office"]
  },
  {
    key: 'customer-inquiries',
    path: 'customer-inquiries',
    title: 'Customer Inquiries',
    icon: MailOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"],
    permissions: ["View User Inquiries"]
  }
];

const salesOperationsNav = {
  key: 'sales-operations',
  path: 'sales-operations',
  title: 'Operations & Support',
  icon: CommentOutlined,
  breadcrumb: false,
  submenu: salesOperationsSubmenu,
  roles: ["Admin", "Organizers"]
};

// Reporting Submenu
const reportingSubmenu = [
  {
    key: 'event-report',
    path: 'reports/event',
    title: 'Event Report',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Event Reports"],
  },
  {
    key: 'pos-report',
    path: 'reports/pos',
    title: 'POS Report',
    icon: DesktopOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: ["View POS Reports"],
  },
  {
    key: 'agent-report',
    path: 'reports/agent',
    title: 'Agent Report',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"],
    permissions: ["View Agent Reports"],
  }
];

const reportingNav = {
  key: 'reporting',
  path: 'reports',
  title: 'Data & Reports',
  icon: BarChartOutlined,
  breadcrumb: false,
  submenu: reportingSubmenu,
  permissions: ["View Event Reports","View POS Reports","View Agent Reports"],
};

// Financial Management Submenu
const financialManagementSubmenu = [
  {
    key: 'wallet-agents',
    path: 'wallet-agent',
    title: 'Wallet Agent',
    icon: WalletOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin","Wallet Agent"],
    permissions: ["View Wallet Agent"]
  },
  {
    key: 'payment-logs',
    path: 'payment-log',
    title: 'Payment Log',
    icon: DollarOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'promo-codes',
    path: 'promo-codes',
    title: 'Promo Codes',
    icon: ShoppingOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin","Organizers"],
    permissions: ["View Promocodes"]
  },
  {
    key: 'tax-commission',
    path: 'tax-commision',
    title: 'Tax Commission',
    icon: PercentageOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  }
];

const financialManagementNav = {
  key: 'financial-management',
  path: 'financial-management',
  title: 'Finance Management',
  icon: DollarOutlined,
  breadcrumb: false,
  submenu: financialManagementSubmenu,
  roles: ["Admin"]
};



// Settings Submenu
const settingsSubmenu = [
  {
    key: 'roles',
    path: 'role',
    title: 'Role Permission',
    icon: SafetyOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'settings-message',
    title: 'Message Settings',
    icon: MailOutlined,
    breadcrumb: false,
    submenu: [
      {
        key: 'settings-mail',
        path: 'settings/mail-config',
        title: 'Mail Config',
        icon: MailOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
      {
        key: 'settings-sms',
        path: 'settings/sms-config',
        title: 'SMS Gateway',
        icon: MessageOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
      {
        key: 'settings-whatsapp',
        path: 'settings/whatsapp-config',
        title: 'WhatsApp Config',
        icon: WhatsAppOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
    ],
    roles: ["Admin"]
  },
  
  {
    key: 'settings-admin',
    path: 'settings/admin-settings',
    title: 'Admin Settings',
    icon: SettingOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'settings-payment',
    path: 'settings/payment-gateways',
    title: 'Payment Gateways',
    icon: DollarOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'settings-footer',
    path: 'settings/footer',
    title: 'Footer Settings',
    icon: SettingOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  }
];

const settingsNav = {
  key: 'settings',
  path: 'settings',
  title: 'Settings',
  icon: SettingOutlined,
  breadcrumb: false,
  submenu: settingsSubmenu,
  roles: ["Admin"]
};

// media blogs, gallerys banners Submenu
const mediaSubmenu = [
  {
    key: 'media-banners',
    path: 'media/banners',
    title: 'Banners',
    icon: PlayCircleFilled,
    breadcrumb: false,
    submenu: [],
    permissions: ["View Banners"]
  },
  {
    key: 'media-blogs',
    path: 'media/blogs',
    title: 'Blogs',
    icon: BookOutlined,
    breadcrumb: false,
    submenu: [],
    roles:['Admin']
  }
];

const mediaNav = {
  key: 'media',
  path: 'media',
  title: 'Media',
  icon: PlayCircleOutlined,
  breadcrumb: false,
  submenu: mediaSubmenu,
  roles: ["Admin"]
};


const agreementsSubmenu = [
  {
    key: 'organizer-agreements',
    path: 'agreements/organizer',
    title: 'Organizer Agreements',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    roles:['Admin']
  },
  {
    key: 'partner-agreements',
    path: 'agreements/partner',
    title: 'Partner Agreements',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    roles:['Admin']
  }
];
const agreementsNav = {
  key: 'agreements',
  path: 'agreements',
  title: 'Agreements',
  icon: FileSearchOutlined,
  breadcrumb: false,
  submenu: agreementsSubmenu,
  roles:['Admin']
};

const promotionSubMenu = [
  {
    key: 'orgs-promotion',
    path: 'promotion/orgs',
    title: 'Promote Orgs',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    roles:['Admin']
  },
];

const promotionNav = {
  key: 'promotion',
  path: 'promotion',
  title: 'Promotions',
  icon: GiftOutlined,
  breadcrumb: false,
  submenu: promotionSubMenu,
  roles:['Admin']
};

const onboardSubmenu = [
  {
    key: 'onboard-organizer',
    path: 'onboard/organizer',
    title: 'Organizer',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  },
  {
    key: 'onboard-partner',
    path: 'onboard/partner',
    title: 'Partner',
    icon: UsergroupAddOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  }
];

const onboardNav = {
  key: 'onboard',
  path: 'onboard',
  title: 'Onboard',
  icon: IdcardOutlined,
  breadcrumb: false,
  submenu: onboardSubmenu,
  roles: ['Admin']
};


// Final Navigation Config
const navigationConfig = [
  dashboardNav,
  eventManagementNav,
  bookingsNav,
  scanNav,
  userManagementNav,
  reportingNav,
    {
    key: 'live-users',
    path: 'live-users',
    title: 'Live Users',
    icon: CustomerServiceOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  promotionNav,
  onboardNav,
  agreementsNav,
  salesOperationsNav,
  financialManagementNav,
  mediaNav,
  settingsNav
];

export default navigationConfig;