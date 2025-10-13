import {
  AppstoreOutlined,
  SafetyOutlined,
  MailOutlined,
  MessageOutlined,
  CalendarOutlined,
  BulbOutlined,
  ShoppingCartOutlined,
  AimOutlined,
  MonitorOutlined,
  SettingOutlined,
  PlusSquareOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { APP_PREFIX_PATH } from 'configs/AppConfig'


const appsNavTree = [{
  key: 'apps',
  path: `${APP_PREFIX_PATH}/apps`,
  title: 'sidenav.apps',
  icon: AppstoreOutlined,
  breadcrumb: false,
  isGroupTitle: true,
  submenu: [
    {
      key: 'apps-mail',
      path: `${APP_PREFIX_PATH}/apps/mail/inbox`,
      title: 'sidenav.apps.mail',
      icon: MailOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-chat',
      path: `${APP_PREFIX_PATH}/apps/chat`,
      title: 'sidenav.apps.chat',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-users',
      path: `${APP_PREFIX_PATH}/apps/users`,
      title: 'sidenav.apps.users',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-organizers',
      path: `${APP_PREFIX_PATH}/apps/organizers`,
      title: 'sidenav.apps.organizers',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-role',
      path: `${APP_PREFIX_PATH}/apps/role`,
      title: 'Role',
      icon: SafetyOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-category',
      path: `${APP_PREFIX_PATH}/apps/category`,
      title: 'Category',
      icon: SettingOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-venues',
      path: `${APP_PREFIX_PATH}/apps/venues`,
      title: 'Venues',
      icon: AimOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-artist',
      path: `${APP_PREFIX_PATH}/apps/artist`,
      title: 'Artist',
      icon: MonitorOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-fields',
      path: `${APP_PREFIX_PATH}/apps/fields`,
      title: 'Fields',
      icon: PlusSquareOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-wallet-agent',
      path: `${APP_PREFIX_PATH}/apps/wallet-agent`,
      title: 'Wallet Agent',
      icon: PlusSquareOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-box-office',
      path: `${APP_PREFIX_PATH}/apps/box-office`,
      title: 'Box Office',
      icon: HolderOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-events',
      path: `${APP_PREFIX_PATH}/apps/events`,
      title: 'Events',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-payment-log',
      path: `${APP_PREFIX_PATH}/apps/payment-log`,
      title: 'Payment Log',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-tax-commision',
      path: `${APP_PREFIX_PATH}/apps/tax-commision`,
      title: 'Tax Commision',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-agents',
      path: `${APP_PREFIX_PATH}/apps/agents`,
      title: 'sidenav.apps.agents',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-pos',
      path: `${APP_PREFIX_PATH}/apps/pos`,
      title: 'sidenav.apps.pos',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-corporate',
      path: `${APP_PREFIX_PATH}/apps/corporate`,
      title: 'sidenav.apps.corporate',
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-sponsors',
      path: `${APP_PREFIX_PATH}/apps/sponsors`,
      title: 'sidenav.apps.sponsors', // <-- correct spelling
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-attendees',
      path: `${APP_PREFIX_PATH}/apps/attendees`,
      title: 'sidenav.apps.attendees', // <-- correct spelling
      icon: MessageOutlined,
      breadcrumb: false,
      submenu: []
    },
    {
      key: 'apps-settings',
      path: `${APP_PREFIX_PATH}/apps/settings`,
      title: 'sidenav.apps.settings',
      icon: SettingOutlined,
      breadcrumb: true,
      submenu: [
        {
          key: 'apps-settings-mail_config',
          path: `${APP_PREFIX_PATH}/apps/settings/mail-config`,
          title: 'sidenav.apps.settings.mail_config',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-sms_gateway',
          path: `${APP_PREFIX_PATH}/apps/settings/sms-config`,
          title: 'sidenav.apps.settings.sms_gateway',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-whats_config',
          path: `${APP_PREFIX_PATH}/apps/settings/whatsapp-config`,
          title: 'sidenav.apps.settings.whats_config',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-banners',
          path: `${APP_PREFIX_PATH}/apps/settings/banners`,
          title: 'sidenav.apps.settings.banners',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-admin-settings',
          path: `${APP_PREFIX_PATH}/apps/settings/admin-settings`,
          title: 'sidenav.apps.settings.admin-settings',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-payment-gateways',
          path: `${APP_PREFIX_PATH}/apps/settings/payment-gateways`,
          title: 'sidenav.apps.settings.payment-gateways',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-settings-footer-settings',
          path: `${APP_PREFIX_PATH}/apps/settings/footer`,
          title: 'sidenav.apps.settings.footer-settings',
          icon: '',
          breadcrumb: false,
          submenu: []
        }
      ]
    },
    {
      key: 'apps-scan',
      path: `${APP_PREFIX_PATH}/apps/scan`,
      title: 'Scan',
      icon: SettingOutlined,
      breadcrumb: true,
      submenu: [
        {
          key: 'apps-camera-scan',
          path: `${APP_PREFIX_PATH}/apps/scan/camera`,
          title: 'Scan By Camera ',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
        {
          key: 'apps-scanner-scan',
          path: `${APP_PREFIX_PATH}/apps/scan/scanner`,
          title: 'Scan By Scanner ',
          icon: '',
          breadcrumb: false,
          submenu: []
        },
      ]
    },
  ]
}]


const navigationConfig = [
  ...appsNavTree,
]

export default navigationConfig;
