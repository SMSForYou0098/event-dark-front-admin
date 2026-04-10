import { AppstoreOutlined, MailOutlined, MessageOutlined, UserOutlined, TeamOutlined, SafetyOutlined, SettingOutlined, EnvironmentOutlined, CustomerServiceOutlined, PlusSquareOutlined, WalletOutlined, ShopOutlined, CalendarOutlined, DollarOutlined, PercentageOutlined, IdcardOutlined, ShoppingOutlined, CrownOutlined, TrophyOutlined, UsergroupAddOutlined, ScanOutlined, BookOutlined, CameraOutlined, BarcodeOutlined, DashboardOutlined, WhatsAppOutlined, BarChartOutlined, FileSearchOutlined, DesktopOutlined, ScheduleOutlined, CommentOutlined, PlayCircleFilled, PlayCircleOutlined, GiftOutlined, ClockCircleOutlined, LayoutOutlined, FileImageOutlined, CheckOutlined } from '@ant-design/icons';
import { PERMISSIONS } from 'constants/PermissionConstant';

// Dashboard

const dashboarSubmenuNav = [
  {
    key: 'dashboard-main',
    path: 'dashboard',
    title: 'Dashboard',
    icon: DashboardOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_DASHBOARD]
  }, {
    key: 'gateway',
    path: '/dashboard/gateway',
    title: 'Gateway',
    icon: DashboardOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_GATEWAY]
  }];


const dashboardNav = {
  key: 'dashboard',
  path: 'dashboard',
  title: 'Dashboard',
  icon: DashboardOutlined,
  breadcrumb: false,
  submenu: dashboarSubmenuNav,
  permissions: [PERMISSIONS.VIEW_DASHBOARD]
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
    permissions: [PERMISSIONS.VIEW_USER]
  },
  {
    key: 'system-users',
    path: 'organizers',
    title: 'System Users',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ['Admin'],
    permissions: [PERMISSIONS.VIEW_ORGANIZERS]
  },

  {
    key: 'attendees',
    path: 'attendees',
    title: 'Attendees',
    icon: UsergroupAddOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_ATTENDEES]
  },
  {
    key: 'login-history',
    path: 'login-history',
    title: 'Login History',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_LOGIN_HISTORY]
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
    permissions: [PERMISSIONS.VIEW_CORPORATE_BOOKINGS],
    submenu: [
      {
        key: 'corporate-manage',
        path: 'bookings/corporate',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_CORPORATE_BOOKINGS]
      }
    ]
  },
  {
    key: 'sponsors',
    path: 'bookings/sponsor',
    title: 'Sponsor',
    icon: TrophyOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_SPONSOR_BOOKINGS],
    submenu: [
      {
        key: 'sponsor-manage',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_SPONSOR_BOOKINGS],
        submenu: [
          {
            key: 'sponsor-paid',
            path: 'bookings/sponsor/paid',
            title: 'Paid',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SPONSOR_BOOKINGS],
            icon: DollarOutlined,
          },
          {
            key: 'sponsor-free',
            path: 'bookings/sponsor/free',
            title: 'Free',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SPONSOR_BOOKINGS],
            icon: CheckOutlined,
          }
        ]
      },
      {
        key: 'sponsor-new',
        path: 'bookings/sponsor/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_SPONSOR_BOOKING]
      }
    ]
  },
  {
    key: 'complimentary-booking',
    path: 'bookings/complimentary',
    title: 'Complimentary',
    icon: TrophyOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_COMPLIMENTARY_BOOKINGS],
    submenu: [
      {
        key: 'complimentary-manage',
        path: 'bookings/complimentary',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_COMPLIMENTARY_BOOKINGS]
      },
      {
        key: 'complimentary-new',
        path: 'bookings/complimentary/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_COMPLIMENTARY_BOOKING]
      }
    ]
  },
];

const partnersClientsNav = {
  key: 'partners-clients',
  path: 'partners-clients',
  title: 'Partner',
  icon: CrownOutlined,
  breadcrumb: false,
  submenu: partnersClientsSubmenu,
  permissions: [PERMISSIONS.VIEW_CORPORATE_BOOKINGS, PERMISSIONS.VIEW_SPONSOR_BOOKINGS, PERMISSIONS.VIEW_COMPLIMENTARY_BOOKINGS]
};

const userManagementNav = {
  key: 'user-management',
  path: 'user-management',
  title: 'User MGT',
  icon: TeamOutlined,
  breadcrumb: false,
  submenu: userManagementSubmenu,
  roles: ["Admin", "Organizer"]
};

// Seating chart bookings (seat-based / ticket_system flow; sibling top-level group like Bookings)
const seatingChartBookingsSubmenu = [
  {
    key: 'seating-online-manage',
    title: 'Online',
    breadcrumb: false,
    icon: LayoutOutlined,
    permissions: [PERMISSIONS.VIEW_SEATING_ONLINE_BOOKINGS],
    submenu: [
      {
        key: 'seating-online-new',
        title: 'Confirmed',
        breadcrumb: false,
        icon: ShoppingOutlined,
        permissions: [PERMISSIONS.VIEW_SEATING_ONLINE_BOOKINGS],
        submenu: [
          {
            key: 'seating-online-paid',
            path: 'bookings/seating-chart/online/paid',
            title: 'Paid',
            breadcrumb: false,
            icon: DollarOutlined,
            permissions: [PERMISSIONS.VIEW_SEATING_ONLINE_BOOKINGS],
          },
          {
            key: 'seating-online-free',
            path: 'bookings/seating-chart/online/free',
            title: 'Free',
            breadcrumb: false,
            icon: CheckOutlined,
            permissions: [PERMISSIONS.VIEW_SEATING_ONLINE_BOOKINGS],
          }
        ]
      },
      {
        key: 'seating-pending-booking',
        path: 'bookings/seating-chart/pending',
        title: 'Pending',
        icon: ClockCircleOutlined,
        breadcrumb: false,
        submenu: [],
        permissions: [PERMISSIONS.VIEW_SEATING_PENDING_BOOKINGS]
      },
      {
        key: 'seating-refund-booking',
        title: 'Refund',
        icon: DollarOutlined,
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_SEATING_REFUND_REQUESTS],
        submenu: [
          {
            key: 'seating-refund-requests',
            path: 'bookings/seating-chart/refund',
            title: 'Refund Requests',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SEATING_REFUND_REQUESTS]
          }
        ]
      },
    ]
  },
  {
    key: 'seating-agent-booking',
    path: 'bookings/seating-chart/agent',
    title: 'Agent',
    icon: IdcardOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_SEATING_AGENT_BOOKINGS],
    submenu: [
      {
        key: 'seating-agent-manage',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_SEATING_AGENT_BOOKINGS],
        submenu: [
          {
            key: 'seating-agent-paid',
            path: 'bookings/seating-chart/agent/paid',
            title: 'Paid',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SEATING_AGENT_BOOKINGS],
            icon: DollarOutlined,
          },
          {
            key: 'seating-agent-free',
            path: 'bookings/seating-chart/agent/free',
            title: 'Free',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SEATING_AGENT_BOOKINGS],
            icon: CheckOutlined,
          }
        ]
      },
      {
        key: 'seating-agent-new',
        path: 'bookings/seating-chart/agent/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_SEATING_AGENT_BOOKING]
      }
    ]
  },
  {
    key: 'seating-pos-booking',
    path: 'bookings/seating-chart/pos',
    title: 'POS',
    icon: ShoppingOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_SEATING_POS_BOOKINGS],
    submenu: [
      {
        key: 'seating-pos-manage',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_SEATING_POS_BOOKINGS],
        submenu: [
          {
            key: 'seating-pos-paid',
            path: 'bookings/seating-chart/pos/paid',
            title: 'Paid',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SEATING_POS_BOOKINGS],
            icon: DollarOutlined,
          },
          {
            key: 'seating-pos-free',
            path: 'bookings/seating-chart/pos/free',
            title: 'Free',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_SEATING_POS_BOOKINGS],
            icon: CheckOutlined,
          }
        ]
      },
      {
        key: 'seating-pos-new',
        path: 'bookings/seating-chart/pos/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_SEATING_POS_BOOKING]
      }
    ]
  },
];

const seatingChartBookingsNav = {
  key: 'seating-chart-bookings',
  path: 'bookings/seating-chart',
  title: 'Seating chart',
  icon: LayoutOutlined,
  breadcrumb: false,
  submenu: seatingChartBookingsSubmenu,
  roles: ["Admin", "Organizer"],
  permissions: [
    PERMISSIONS.VIEW_SEATING_ONLINE_BOOKINGS,
    PERMISSIONS.VIEW_SEATING_AGENT_BOOKINGS,
    PERMISSIONS.VIEW_SEATING_POS_BOOKINGS
  ]
};

// Bookings Submenu


const bookingsSubmenu = [
  {
    key: 'online-manage',
    title: 'Online',
    breadcrumb: false,
    icon: ShoppingOutlined,
    permissions: [PERMISSIONS.VIEW_ONLINE_BOOKINGS],
    submenu: [
      {
        key: 'online-new',
        title: 'Confirmed',
        breadcrumb: false,
        icon: ShoppingOutlined,
        permissions: [PERMISSIONS.VIEW_ONLINE_BOOKINGS],
        submenu: [
          {
            key: 'online-paid',
            path: 'bookings/online/paid',
            title: 'Paid',
            breadcrumb: false,
            icon: DollarOutlined,
            permissions: [PERMISSIONS.VIEW_ONLINE_BOOKINGS],
          },
          {
            key: 'online-free',
            path: 'bookings/online/free',
            title: 'Free',
            breadcrumb: false,
            icon: CheckOutlined,
            permissions: [PERMISSIONS.VIEW_ONLINE_BOOKINGS],
          }
        ]
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
      {
        key: 'refund-booking',
        title: 'Refund',
        icon: DollarOutlined,
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_REFUND_REQUESTS],
        submenu: [
          {
            key: 'refund-requests',
            path: 'bookings/refund',
            title: 'Refund Requests',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_REFUND_REQUESTS]
          }
        ]
      },
    ]
  },
  {
    key: 'agent-booking',
    path: 'bookings/agent',
    title: 'Agent',
    icon: IdcardOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_AGENT_BOOKINGS],
    submenu: [
      {
        key: 'agent-manage',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_AGENT_BOOKINGS],
        submenu: [
          {
            key: 'agent-paid',
            path: 'bookings/agent/paid',
            title: 'Paid',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_AGENT_BOOKINGS],
            icon: DollarOutlined,
          },
          {
            key: 'agent-free',
            path: 'bookings/agent/free',
            title: 'Free',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_AGENT_BOOKINGS],
            icon: CheckOutlined,
          }
        ]
      },
      {
        key: 'agent-new',
        path: 'bookings/agent/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_AGENT_BOOKING]
      }
    ]
  },
  {
    key: 'pos-booking',
    path: 'bookings/pos',
    title: 'POS',
    icon: ShoppingOutlined,
    breadcrumb: false,
    permissions: [PERMISSIONS.VIEW_POS_BOOKINGS],
    submenu: [
      {
        key: 'pos-manage',
        title: 'Manage',
        breadcrumb: false,
        permissions: [PERMISSIONS.VIEW_POS_BOOKINGS],
        submenu: [
          {
            key: 'pos-paid',
            path: 'bookings/pos/paid',
            title: 'Paid',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_POS_BOOKINGS],
            icon: DollarOutlined,
          },
          {
            key: 'pos-free',
            path: 'bookings/pos/free',
            title: 'Free',
            breadcrumb: false,
            permissions: [PERMISSIONS.VIEW_POS_BOOKINGS],
            icon: CheckOutlined,
          }
        ]
      },
      {
        key: 'pos-new',
        path: 'bookings/pos/new',
        title: 'New',
        breadcrumb: false,
        permissions: [PERMISSIONS.ADD_POS_BOOKING]
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
  roles: ["Admin", "Organizer"]
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
    permissions: [PERMISSIONS.VIEW_EVENT]
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
    roles: ["Admin", "Organizer"],
    permissions: [PERMISSIONS.VIEW_VENUES]
  },
  // add one more for layouts use proper icon layout
  {
    key: 'layouts',
    path: 'theatre',
    title: 'Layouts',
    icon: LayoutOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin", "Organizer"],
    permissions: [PERMISSIONS.VIEW_LAYOUTS]
  },
  {
    key: 'exhibition-layout',
    path: 'exhibition-layout',
    title: 'Exhibition Layout',
    icon: LayoutOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin", "Organizer"],
    permissions: [PERMISSIONS.VIEW_STALL_LAYOUTS]
  },
  {
    key: 'artists',
    path: 'artist',
    title: 'Artist',
    icon: CustomerServiceOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ["Admin", "Organizer"],
    permissions: [PERMISSIONS.VIEW_ARTISTS]
  },
  {
    key: 'refund-policies',
    path: 'refund-policies',
    title: 'Refund Policies',
    icon: PercentageOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'content-master',
    path: 'event-content',
    title: 'Content Master',
    icon: BookOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ["Admin"]
    permissions: [PERMISSIONS.VIEW_CONTENT_MASTER],
  },
  {
    key: 'fields',
    path: 'fields',
    title: 'Custom Fields',
    icon: PlusSquareOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"]
  },
  {
    key: 'card-inventory',
    path: 'card-inventory',
    title: 'Card Inventory',
    icon: IdcardOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_CARD_INVENTORY]
  }
];

const eventManagementNav = {
  key: 'event-management',
  path: 'event-management',
  title: 'Event MGT',
  icon: CalendarOutlined,
  breadcrumb: false,
  submenu: eventManagementSubmenu,
  roles: ["Admin", "Organizer"]
};

// Stall Management Submenu
const stallManagementSubmenu = [
  {
    key: 'stall-applications',
    path: 'stall/applications',
    title: 'Applications',
    icon: ShopOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_STALL_APPLICATIONS]
  }
];

const stallManagementNav = {
  key: 'stall-management',
  path: 'stall-management',
  title: 'Stall MGT',
  icon: ShopOutlined,
  breadcrumb: false,
  submenu: stallManagementSubmenu,
  roles: ["Admin", "Organizer"]
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
    permissions: [PERMISSIONS.SCAN_BY_CAMERA]
  },
  {
    key: 'scan-scanner',
    path: 'scan/scanner',
    title: 'Scan By Scanner',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.SCAN_BY_SCANNER]
  },
  {
    key: 'scan-history',
    path: 'scan/history',
    title: 'Scan History',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_SCAN_HISTORY]
  },
  {
    key: 'scan-reports',
    path: 'reports/scanner',
    title: 'Scan Reports',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_SCAN_REPORTS],
  },
];
const scanNav = {
  key: 'scan',
  path: 'scan',
  title: 'Scan Ticket',
  icon: ScanOutlined,
  breadcrumb: false,
  submenu: scanSubmenu,
  roles: ["Admin", "Organizer", "Scanner"]

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
    permissions: [PERMISSIONS.VIEW_BOX_OFFICE]
  },
  {
    key: 'customer-inquiries',
    path: 'customer-inquiries',
    title: 'Customer Inquiries',
    icon: MailOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"],
    permissions: [PERMISSIONS.VIEW_USER_INQUIRIES]
  },
  {
    key: 'approve-reviews',
    path: 'approve-reviews',
    title: 'Approve Reviews',
    icon: CheckOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ["Admin"],
    permissions: [PERMISSIONS.VIEW_APPROVE_REVIEWS]
  },
];

const salesOperationsNav = {
  key: 'sales-operations',
  path: 'sales-operations',
  title: 'Operations & Support',
  icon: CommentOutlined,
  breadcrumb: false,
  submenu: salesOperationsSubmenu,
  roles: ["Admin", "Organizer"]
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
    permissions: [PERMISSIONS.VIEW_EVENT_REPORTS],
  },
  {
    key: 'pos-report',
    path: 'reports/pos',
    title: 'POS Report',
    icon: DesktopOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_POS_REPORTS],
  },
  {
    key: 'agent-report',
    path: 'reports/agent',
    title: 'Agent Report',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ["Admin"],
    permissions: [PERMISSIONS.VIEW_AGENT_REPORTS],
  },
  {
    key: 'organizer-report',
    path: 'reports/organizer',
    title: 'Organizer Report',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: [],
    // roles: ["Admin"],
    permissions: [PERMISSIONS.VIEW_ORGANIZER_REPORTS],
  },
  {
    key: 'scanner-report',
    path: 'reports/scanner',
    title: 'Scan Reports',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_SCAN_REPORTS],
  },
  {
    key: 'card-report',
    path: 'reports/card',
    title: 'Card Report',
    icon: IdcardOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_CARD_REPORTS],
  },
];

const reportingNav = {
  key: 'reporting',
  path: 'reports',
  title: 'Data & Reports',
  icon: BarChartOutlined,
  breadcrumb: false,
  submenu: reportingSubmenu,
  permissions: [
    PERMISSIONS.VIEW_EVENT_REPORTS,
    PERMISSIONS.VIEW_POS_REPORTS,
    PERMISSIONS.VIEW_AGENT_REPORTS,
    PERMISSIONS.VIEW_ORGANIZER_REPORTS,
    PERMISSIONS.VIEW_SCAN_REPORTS,
    PERMISSIONS.VIEW_CARD_REPORTS,
  ],
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
    roles: ["Admin", "Wallet Agent"],
    permissions: [PERMISSIONS.VIEW_WALLET_AGENT]
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
    roles: ["Admin", "Organizer"],
    permissions: [PERMISSIONS.VIEW_PROMOCODES]
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
  title: 'Finance MGT',
  icon: DollarOutlined,
  breadcrumb: false,
  submenu: financialManagementSubmenu,
  roles: ["Admin"]
};



// Settings Submenu
const settingsSubmenu = [
  {
    key: 'label-management',
    title: 'Label MGT',
    icon: SafetyOutlined,
    breadcrumb: false,
    submenu: [
      {
        key: 'label-printing',
        path: 'label-printing',
        title: 'Label Printing',
        icon: SafetyOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
      {
        key: 'label-forge',
        path: 'label-forge',
        title: 'Label Forge',
        icon: SafetyOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
      // {
      //   key: 'dynamic-label-print',
      //   path: 'dynamic-label-print',
      //   title: 'Dynamic Label Print',
      //   icon: SafetyOutlined,
      //   breadcrumb: false,
      //   submenu: [],
      //   roles: ["Admin"]
      // },
      {
        key: 'label-designer',
        path: 'label-designer',
        title: 'Label Designer',
        icon: SafetyOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
      {
        key: 'printer-testing',
        path: 'printer-testing',
        title: 'Printer Testing',
        icon: SafetyOutlined,
        breadcrumb: false,
        submenu: [],
        roles: ["Admin"]
      },
    ],
    roles: ["Admin"]
  },
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
  },
  {
    key: 'settings-server-logs',
    path: 'settings/server-logs',
    title: 'Server Logs',
    icon: SafetyOutlined, // Using SafetyOutlined as a placeholder, can change if needed
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
    icon: BookOutlined,
    breadcrumb: false,
    submenu: [],
    permissions: [PERMISSIONS.VIEW_BANNERS]
  },
  {
    key: 'media-blogs',
    path: 'media/blogs',
    title: 'Blogs',
    icon: BookOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  },
  {
    key: 'media-gallery',
    path: 'media/gallery',
    title: 'Gallery',
    icon: PlayCircleFilled,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  },
  {
    key: 'tickets',
    path: 'media/tickets',
    title: 'Tickets',
    icon: FileImageOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
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
    roles: ['Admin']
  },
  {
    key: 'partner-agreements',
    path: 'agreements/partner',
    title: 'Partner Agreements',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  }
];
const agreementsNav = {
  key: 'agreements',
  path: 'agreements',
  title: 'Agreements',
  icon: FileSearchOutlined,
  breadcrumb: false,
  submenu: agreementsSubmenu,
  roles: ['Admin']
};

const promotionSubMenu = [
  {
    key: 'orgs-promotion',
    path: 'promotion/orgs',
    title: 'Promote Orgs',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  },
  {
    key: 'events-intimations',
    path: '/intimation',
    title: 'Events Intimations',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: [],
    roles: ['Admin']
  },
];

const promotionNav = {
  key: 'promotion',
  path: 'promotion',
  title: 'Promotions',
  icon: GiftOutlined,
  breadcrumb: false,
  submenu: promotionSubMenu,
  roles: ['Admin']
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
    key: 'approve-organizers',
    path: 'approve-organizers',
    title: 'Approve Organizers',
    icon: CheckOutlined,
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
  userManagementNav,
  eventManagementNav,
  stallManagementNav,
  bookingsNav,
  seatingChartBookingsNav,
  scanNav,
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