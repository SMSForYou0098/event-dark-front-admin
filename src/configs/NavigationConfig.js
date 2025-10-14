import {
  AppstoreOutlined,
  MailOutlined,
  MessageOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  SettingOutlined,
  EnvironmentOutlined,
  CustomerServiceOutlined,
  PlusSquareOutlined,
  WalletOutlined,
  ShopOutlined,
  CalendarOutlined,
  DollarOutlined,
  PercentageOutlined,
  IdcardOutlined,
  ShoppingOutlined,
  CrownOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  ScanOutlined,
  CameraOutlined,
  BarcodeOutlined,
  DashboardOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';

const appsNavTree = [
  // Dashboard
  {
    key: 'dashboard', // ✅ Fixed typo
    path: `dashboard`,
    title: 'Dashboard', // ✅ Fixed typo
    icon: DashboardOutlined,
    breadcrumb: false,
    submenu: []
  },

  // User Management Group
  {
    key: 'user-management-group', // ✅ Added -group suffix
    path: `user-management`,
    title: 'User Management',
    icon: TeamOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'users',
        path: `users`,
        title: 'Users',
        icon: UserOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'organizers',
        path: `organizers`,
        title: 'Organizers',
        icon: TeamOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'roles', // ✅ Made plural for consistency
        path: `role`,
        title: 'Role Permission',
        icon: SafetyOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'agents',
        path: `agents`,
        title: 'Agents',
        icon: IdcardOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'complimentary-booking',
        path: `complimentary`,
        title: 'Complimentary Booking',
        icon: IdcardOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'attendees',
        path: `attendees`,
        title: 'Attendees',
        icon: UsergroupAddOutlined,
        breadcrumb: false,
        submenu: []
      }
    ]
  },

  // Event Management Group
  {
    key: 'event-management-group', // ✅ Added -group suffix
    path: `event-management`,
    title: 'Event Management',
    icon: CalendarOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'events',
        path: `events`,
        title: 'Events',
        icon: CalendarOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'categories', // ✅ Made plural for consistency
        path: `category`,
        title: 'Category',
        icon: AppstoreOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'venues',
        path: `venues`,
        title: 'Venues',
        icon: EnvironmentOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'artists', // ✅ Made plural for consistency
        path: `artist`,
        title: 'Artist',
        icon: CustomerServiceOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'fields',
        path: `fields`,
        title: 'Fields',
        icon: PlusSquareOutlined,
        breadcrumb: false,
        submenu: []
      }
    ]
  },

  // Sales & Operations Group
  {
    key: 'sales-operations-group', // ✅ Added -group suffix
    path: `sales-operations`,
    title: 'Sales & Operations',
    icon: ShoppingOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'box-office',
        path: `box-office`,
        title: 'Box Office',
        icon: ShopOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'pos',
        path: `pos`,
        title: 'POS',
        icon: ShoppingOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'promo_codes', // ✅ Made plural for consistency
        path: `promo-codes`,
        title: 'Promo Codes',
        icon: ShoppingOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'scan',
        path: `scan`,
        title: 'Scan',
        icon: ScanOutlined,
        breadcrumb: true,
        submenu: [
          {
            key: 'scan-camera',
            path: `scan/camera`,
            title: 'Scan By Camera',
            icon: CameraOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'scan-scanner',
            path: `scan/scanner`,
            title: 'Scan By Scanner',
            icon: BarcodeOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'scan-history',
            path: `scan/history`,
            title: 'Scan History',
            icon: BarcodeOutlined,
            breadcrumb: false,
            submenu: []
          },
        ]
      }
    ]
  },

  // Financial Management Group
  {
    key: 'financial-management-group', // ✅ Added -group suffix
    path: `financial-management`,
    title: 'Financial Management',
    icon: DollarOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'wallet-agents', // ✅ Made plural for consistency
        path: `wallet-agent`,
        title: 'Wallet Agent',
        icon: WalletOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'payment-logs', // ✅ Made plural for consistency
        path: `payment-log`,
        title: 'Payment Log',
        icon: DollarOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'tax-commission', // ✅ Fixed typo: "commision" → "commission"
        path: `tax-commision`,
        title: 'Tax Commission',
        icon: PercentageOutlined,
        breadcrumb: false,
        submenu: []
      }
    ]
  },

  // Partners & Clients Group
  {
    key: 'partners-clients-group', // ✅ Added -group suffix
    path: `partners-clients`,
    title: 'Partners & Clients',
    icon: CrownOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'corporates', // ✅ Made plural for consistency
        path: `corporate`,
        title: 'Corporate',
        icon: CrownOutlined,
        breadcrumb: false,
        submenu: []
      },
      {
        key: 'sponsors',
        path: `sponsors`,
        title: 'Sponsors',
        icon: TrophyOutlined,
        breadcrumb: false,
        submenu: []
      }
    ]
  },

  // System Settings Group
  {
    key: 'system-settings-group', // ✅ Added -group suffix
    path: `system-settings`,
    title: 'System Settings',
    icon: SettingOutlined,
    breadcrumb: false,
    isGroupTitle: true,
    submenu: [
      {
        key: 'settings',
        path: `settings`,
        title: 'Settings',
        icon: SettingOutlined,
        breadcrumb: false,
        submenu: [
          {
            key: 'settings-mail',
            path: `settings/mail-config`,
            title: 'Mail Config',
            icon: MailOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-sms',
            path: `settings/sms-config`,
            title: 'SMS Gateway',
            icon: MessageOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-whatsapp',
            path: `settings/whatsapp-config`,
            title: 'WhatsApp Config',
            icon: WhatsAppOutlined, // ✅ Better icon
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-banners',
            path: `settings/banners`,
            title: 'Banners',
            icon: AppstoreOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-admin', // ✅ Removed redundant "settings"
            path: `settings/admin-settings`,
            title: 'Admin Settings',
            icon: SettingOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-payment', // ✅ Shorter key
            path: `settings/payment-gateways`,
            title: 'Payment Gateways',
            icon: DollarOutlined,
            breadcrumb: false,
            submenu: []
          },
          {
            key: 'settings-footer',
            path: `settings/footer`,
            title: 'Footer Settings',
            icon: SettingOutlined,
            breadcrumb: false,
            submenu: []
          }
        ]
      }
    ]
  }
];

const navigationConfig = [...appsNavTree];

export default navigationConfig;
