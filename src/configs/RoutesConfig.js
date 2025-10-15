import React from 'react'
import { AUTH_PREFIX_PATH } from 'configs/AppConfig'
import BookingList from 'views/events/Bookings/BookingList'
import EventStepperForm from 'views/events/event/EventStepperForm'
import ManageUser from 'views/events/users/Manage'
import PosBooking from 'views/events/Bookings/pos/Bookings'
import POS from 'views/events/Bookings/pos/NewPosBooking'
import TicketVerification from 'views/events/Scan/TicketVerification'

// ==================== PUBLIC ROUTES ====================
export const publicRoutes = [
    // Authentication Routes
    {
        key: 'login',
        path: `${AUTH_PREFIX_PATH}/login`,
        component: React.lazy(() => import('views/auth-views/authentication/login')),
    },
    {
        key: 'two-factor',
        path: `${AUTH_PREFIX_PATH}/two-factor`,
        component: React.lazy(() => import('views/auth-views/authentication/two-factor')),
    },
    {
        key: 'verify-password',
        path: `${AUTH_PREFIX_PATH}/verify-password`,
        component: React.lazy(() => import('views/auth-views/authentication/verify-password')),
    },
    {
        key: 'register-1',
        path: `${AUTH_PREFIX_PATH}/register-1`,
        component: React.lazy(() => import('views/auth-views/authentication/register-1')),
    },
    {
        key: 'forgot-password',
        path: `${AUTH_PREFIX_PATH}/forgot-password`,
        component: React.lazy(() => import('views/auth-views/authentication/forgot-password')),
    },

    // Error Pages
    {
        key: 'error-page-1',
        path: `${AUTH_PREFIX_PATH}/error-page-1`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-1')),
    },
    {
        key: 'error-page-2',
        path: `${AUTH_PREFIX_PATH}/error-page-2`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-2')),
    },
]

// ==================== PROTECTED ROUTES ====================
export const protectedRoutes = [
    
    // ==================== DASHBOARD ====================
    {
        key: 'dashboard',
        path: `/dashboard`,
        component: React.lazy(() => import('views/events/Dashboard/index')),
    },

    // ==================== USER MANAGEMENT ====================
    {
        key: 'users',
        path: `/users`,
        component: React.lazy(() => import('views/events/users/Users')),
    },
    {
        key: 'new-user',
        path: `/users/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <ManageUser mode="create" />
            </React.Suspense>
        ),
    },
    {
        key: 'edit-user',
        path: `/users/edit/:id`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <ManageUser mode="edit" />
            </React.Suspense>
        ),
    },
    {
        key: 'organizers',
        path: `/organizers`,
        component: React.lazy(() => import('views/events/users/Organizers')),
    },
    {
        key: 'login-history',
        path: `/login-history`,
        component: React.lazy(() => import('views/events/users/LoginHistory')),
    },

    // ==================== ROLE & PERMISSIONS ====================
    {
        key: 'role',
        path: `/role`,
        component: React.lazy(() => import('views/events/RolePermission/Role/index')),
    },
    {
        key: 'role-permission',
        path: `/role/:id/:name/permission`,
        component: React.lazy(() => import('views/events/RolePermission/Permisson')),
    },

    // ==================== EVENTS MANAGEMENT ====================
    {
        key: 'events',
        path: `/events`,
        component: React.lazy(() => import('views/events/event/list')),
    },
    {
        key: 'events-create',
        path: `/events/create`,
        component: React.lazy(() => import('views/events/event/EventStepperForm')),
    },
    {
        key: 'events-update',
        path: `/events/update/:id`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <EventStepperForm />
            </React.Suspense>
        ),
    },
    {
        key: 'events-ticket',
        path: `/events/ticket/:id/:name`,
        component: React.lazy(() => import('views/events/Tickets/TicketManager/TicketComponent')),
    },
    {
        key: 'attendees',
        path: `/attendees`,
        component: React.lazy(() => import('views/events/event/Attendees')),
    },

    // ==================== BOOKINGS MANAGEMENT ====================
    // Online Bookings
    {
        key: 'online-bookings',
        path: `/bookings/online`,
        component: React.lazy(() => import('views/events/Bookings/Online_Bookings/OnlineBookings')),
    },
    // Pending Bookings
    {
        key: 'pending-bookings',
        path: `/bookings/pending`,
        component: React.lazy(() => import('views/events/Bookings/Pending_Bookings/index')),
    },
    // Agent Bookings
    {
        key: 'agent-bookings',
        path: `/bookings/agent`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} />
            </React.Suspense>
        ),
    },
    // Sponsor Bookings
    {
        key: 'sponsor-bookings',
        path: `/sponsors`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isSponser={true} />
            </React.Suspense>
        ),
    },
    // Complimentary Bookings
    {
        key: 'complimentary-bookings',
        path: `/bookings/complimentary`,
        component: React.lazy(() => import('views/events/ComplimentaryBooking')),
    },
    // Corporate Bookings
    {
        key: 'corporate-bookings',
        path: `/corporate`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isCorporate={true} />
            </React.Suspense>
        ),
    },

    // ==================== POS (Point of Sale) ====================
    {
        key: 'pos-bookings',
        path: `/bookings/pos`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <PosBooking {...props} isPos={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'pos-new',
        path: `/pos/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <POS {...props} isPos={true} />
            </React.Suspense>
        ),
    },

    // ==================== SCAN & CHECK-IN ====================
    {
        key: 'scan-camera',
        path: `/scan/camera`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <TicketVerification scanMode="camera" />
            </React.Suspense>
        ),
    },
    {
        key: 'scan-scanner',
        path: `/scan/scanner`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <TicketVerification scanMode="manual" />
            </React.Suspense>
        ),
    },
    {
        key: 'scan-history',
        path: `/scan/history`,
        component: React.lazy(() => import('views/events/Scan/ScanHistory')),
    },

    // ==================== PROMO CODES ====================
    {
        key: 'promo-codes',
        path: `/promo-codes`,
        component: React.lazy(() => import('views/events/PromoCodes/index')),
    },

    // ==================== BOX OFFICE & WALLET ====================
    {
        key: 'box-office',
        path: `/box-office`,
        component: React.lazy(() => import('views/events/BoxOffice/index')),
    },
    {
        key: 'wallet-agent',
        path: `/wallet-agent`,
        component: React.lazy(() => import('views/events/WalletAgent/index')),
    },

    // ==================== SUPPORT AND CUSTOMER INQUIERIES ====================
    {
        key:'contact-us-applications',
        path: `/customer-inquiries`,
        component: React.lazy(() => import('views/events/Support/ContactUsApplications')),
    },

    // ==================== VENUES & ARTISTS ====================
    {
        key: 'venues',
        path: `/venues`,
        component: React.lazy(() => import('views/events/Venues/index')),
    },
    {
        key: 'artist',
        path: `/artist`,
        component: React.lazy(() => import('views/events/Artist/index')),
    },

    // ==================== PAYMENT & TAX ====================
    {
        key: 'payment-log',
        path: `/payment-log`,
        component: React.lazy(() => import('views/events/PaymentLog/index')),
    },
    {
        key: 'tax-commission',
        path: `/tax-commision`,
        component: React.lazy(() => import('views/events/TaxComission/index')),
    },

    // ==================== SETTINGS ====================
    // Admin Settings
    {
        key: 'admin-settings',
        path: `/settings/admin-settings`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/AdminSetting')),
    },
    // Payment Gateway Settings
    {
        key: 'payment-gateways',
        path: `/settings/payment-gateways`,
        component: React.lazy(() => import('views/events/Settings/Payment_Gateway/PaymentGateway')),
    },
    // Footer Settings
    {
        key: 'footer-settings',
        path: `/settings/footer`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/Footer_settings/FooterData')),
    },
    // Mail Config
    {
        key: 'mail-config',
        path: `/settings/mail-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/MailSettings')),
    },
    // WhatsApp Config
    {
        key: 'whatsapp-config',
        path: `/settings/whatsapp-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/WhatsAppConfig')),
    },
    // SMS Config
    {
        key: 'sms-config',
        path: `/settings/sms-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/SmsSetting')),
    },
    // Banners
    {
        key: 'banners',
        path: `/settings/banners`,
        component: React.lazy(() => import('views/events/Settings/Banner/BannerConfig')),
    },
    // Category Settings
    {
        key: 'category',
        path: `/category`,
        component: React.lazy(() => import('views/events/Settings/Category/Category')),
    },
    // Custom Fields
    {
        key: 'fields',
        path: `/fields`,
        component: React.lazy(() => import('views/events/Settings/Fields/index')),
    },

    // ==================== AUTHENTICATION (Blank Layout) ====================
    {
        key: 'login-1',
        path: `/login-1`,
        component: React.lazy(() => import('views/auth-views/authentication/login-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'register-1',
        path: `/register-1`,
        component: React.lazy(() => import('views/auth-views/authentication/register-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'forgot-password',
        path: `/forgot-password`,
        component: React.lazy(() => import('views/auth-views/authentication/forgot-password')),
        meta: {
            blankLayout: true
        }
    },

    // ==================== Reports ====================
    {
        key: 'event-reports',
        path: `/reports/event`,
        component: React.lazy(() => import('views/events/Reports/EventsReport')),
    },
    {
        key: 'pos-reports',
        path: `/reports/pos`,
        component: React.lazy(() => import('views/events/Reports/PosReport')),
    },
    {
        key: 'agent-reports',
        path: `/reports/agent`,
        component: React.lazy(() => import('views/events/Reports/AgentReport')),
    },

    // ==================== ERROR PAGES (Blank Layout) ====================
    {
        key: 'error-page-1',
        path: `/error-page-1`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'error-page-2',
        path: `/error-page-2`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-2')),
        meta: {
            blankLayout: true
        }
    },
]