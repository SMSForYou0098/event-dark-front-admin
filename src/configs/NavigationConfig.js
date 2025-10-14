import { AppstoreOutlined, MailOutlined, MessageOutlined, UserOutlined, TeamOutlined, SafetyOutlined, SettingOutlined, EnvironmentOutlined, CustomerServiceOutlined, PlusSquareOutlined, WalletOutlined, ShopOutlined, CalendarOutlined, DollarOutlined, PercentageOutlined, IdcardOutlined, ShoppingOutlined, CrownOutlined, TrophyOutlined, UsergroupAddOutlined, ScanOutlined, CameraOutlined, BarcodeOutlined, DashboardOutlined, WhatsAppOutlined, BarChartOutlined, FileSearchOutlined, DesktopOutlined } from '@ant-design/icons';

// Dashboard
const dashboardNav = {
  key: 'dashboard',
  path: 'dashboard',
  title: 'Dashboard',
  icon: DashboardOutlined,
  breadcrumb: false,
  submenu: []
};

// User Management Submenu
const userManagementSubmenu = [
  {
    key: 'users',
    path: 'users',
    title: 'Users',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'organizers',
    path: 'organizers',
    title: 'Organizers',
    icon: TeamOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'agents',
    path: 'agents',
    title: 'Agents',
    icon: IdcardOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'attendees',
    path: 'attendees',
    title: 'Attendees',
    icon: UsergroupAddOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const userManagementNav = {
  key: 'user-management',
  path: 'user-management',
  title: 'User Management',
  icon: TeamOutlined,
  breadcrumb: false,
  submenu: userManagementSubmenu
};

// Bookings Submenu
const bookingsSubmenu = [
  {
    key: 'agent-booking',
    path: 'bookings/agent',
    title: 'Agent Booking',
    icon: IdcardOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'online-booking',
    path: 'bookings/online',
    title: 'Online Booking',
    icon: ShoppingOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'complimentary-booking',
    path: 'bookings/complimentary',
    title: 'Complimentary Booking',
    icon: TrophyOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const bookingsNav = {
  key: 'bookings',
  path: 'bookings',
  title: 'Bookings',
  icon: ShoppingOutlined,
  breadcrumb: false,
  submenu: bookingsSubmenu
};

// Event Management Submenu
const eventManagementSubmenu = [
  {
    key: 'events',
    path: 'events',
    title: 'Events',
    icon: CalendarOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'categories',
    path: 'category',
    title: 'Category',
    icon: AppstoreOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'venues',
    path: 'venues',
    title: 'Venues',
    icon: EnvironmentOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'artists',
    path: 'artist',
    title: 'Artist',
    icon: CustomerServiceOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'fields',
    path: 'fields',
    title: 'Fields',
    icon: PlusSquareOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const eventManagementNav = {
  key: 'event-management',
  path: 'event-management',
  title: 'Event Management',
  icon: CalendarOutlined,
  breadcrumb: false,
  submenu: eventManagementSubmenu
};

// Scan Submenu
const scanSubmenu = [
  {
    key: 'scan-camera',
    path: 'scan/camera',
    title: 'Scan By Camera',
    icon: CameraOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'scan-scanner',
    path: 'scan/scanner',
    title: 'Scan By Scanner',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'scan-history',
    path: 'scan/history',
    title: 'Scan History',
    icon: BarcodeOutlined,
    breadcrumb: false,
    submenu: []
  }
];

// Sales & Operations Submenu
const salesOperationsSubmenu = [
  {
    key: 'box-office',
    path: 'box-office',
    title: 'Box Office',
    icon: ShopOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'pos',
    path: 'pos',
    title: 'POS',
    icon: ShoppingOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'scan',
    path: 'scan',
    title: 'Scan',
    icon: ScanOutlined,
    breadcrumb: false,
    submenu: scanSubmenu
  }
];

const salesOperationsNav = {
  key: 'sales-operations',
  path: 'sales-operations',
  title: 'Sales & Operations',
  icon: ShoppingOutlined,
  breadcrumb: false,
  submenu: salesOperationsSubmenu
};

// Reporting Submenu
const reportingSubmenu = [
  {
    key: 'event-report',
    path: 'reports/event',
    title: 'Event Report',
    icon: FileSearchOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'pos-report',
    path: 'reports/pos',
    title: 'POS Report',
    icon: DesktopOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'agent-report',
    path: 'reports/agent',
    title: 'Agent Report',
    icon: UserOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const reportingNav = {
  key: 'reporting',
  path: 'reports',
  title: 'Reporting',
  icon: BarChartOutlined,
  breadcrumb: false,
  submenu: reportingSubmenu
};

// Financial Management Submenu
const financialManagementSubmenu = [
  {
    key: 'wallet-agents',
    path: 'wallet-agent',
    title: 'Wallet Agent',
    icon: WalletOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'payment-logs',
    path: 'payment-log',
    title: 'Payment Log',
    icon: DollarOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'promo-codes',
    path: 'promo-codes',
    title: 'Promo Codes',
    icon: ShoppingOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'tax-commission',
    path: 'tax-commision',
    title: 'Tax Commission',
    icon: PercentageOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const financialManagementNav = {
  key: 'financial-management',
  path: 'financial-management',
  title: 'Financial Management',
  icon: DollarOutlined,
  breadcrumb: false,
  submenu: financialManagementSubmenu
};

// Partners & Clients Submenu
const partnersClientsSubmenu = [
  {
    key: 'corporates',
    path: 'corporate',
    title: 'Corporate',
    icon: CrownOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'sponsors',
    path: 'sponsors',
    title: 'Sponsors',
    icon: TrophyOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const partnersClientsNav = {
  key: 'partners-clients',
  path: 'partners-clients',
  title: 'Partners & Clients',
  icon: CrownOutlined,
  breadcrumb: false,
  submenu: partnersClientsSubmenu
};

// Settings Submenu
const settingsSubmenu = [
  {
    key: 'roles',
    path: 'role',
    title: 'Role Permission',
    icon: SafetyOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-mail',
    path: 'settings/mail-config',
    title: 'Mail Config',
    icon: MailOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-sms',
    path: 'settings/sms-config',
    title: 'SMS Gateway',
    icon: MessageOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-whatsapp',
    path: 'settings/whatsapp-config',
    title: 'WhatsApp Config',
    icon: WhatsAppOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-banners',
    path: 'settings/banners',
    title: 'Banners',
    icon: AppstoreOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-admin',
    path: 'settings/admin-settings',
    title: 'Admin Settings',
    icon: SettingOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-payment',
    path: 'settings/payment-gateways',
    title: 'Payment Gateways',
    icon: DollarOutlined,
    breadcrumb: false,
    submenu: []
  },
  {
    key: 'settings-footer',
    path: 'settings/footer',
    title: 'Footer Settings',
    icon: SettingOutlined,
    breadcrumb: false,
    submenu: []
  }
];

const settingsNav = {
  key: 'settings',
  path: 'settings',
  title: 'Settings',
  icon: SettingOutlined,
  breadcrumb: false,
  submenu: settingsSubmenu
};

// Final Navigation Config
const navigationConfig = [
  dashboardNav,
  userManagementNav,
  bookingsNav,
  eventManagementNav,
  salesOperationsNav,
  reportingNav,
  financialManagementNav,
  partnersClientsNav,
  settingsNav
];

export default navigationConfig;