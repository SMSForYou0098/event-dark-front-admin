import React from 'react'
import { AUTH_PREFIX_PATH } from 'configs/AppConfig'
import BookingList from 'views/events/Bookings/BookingList'
import EventStepperForm from 'views/events/event/EventStepperForm'
import ManageUser from 'views/events/users/Manage'
import PosBooking from 'views/events/Bookings/pos/Bookings'
import POS from 'views/events/Bookings/pos/NewPosBooking'
import TicketVerification from 'views/events/Scan/TicketVerification'

export const publicRoutes = [
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

export const protectedRoutes = [

    {
        key: 'users',
        path: `/users`,
        component: React.lazy(() => import('views/events/users/Users')),
    },
    {
        key: 'organizers',
        path: `/organizers`,
        component: React.lazy(() => import('views/events/users/Organizers')),
    },
    {
        key: 'role',
        path: `/role`,
        component: React.lazy(() => import('views/events/RolePermission/Role/index')),
    },
    {
        key: 'category',
        path: `/category`,
        component: React.lazy(() => import('views/events/Settings/Category/Category')),
    },
    {
        key: 'role',
        path: `/role/:id/:name/permission`,
        component: React.lazy(() => import('views/events/RolePermission/Permisson')),
    },
    {
        key: 'events',
        path: `/events`,
        component: React.lazy(() => import('views/events/event/list')),
    },
    {
        key: 'fields',
        path: `/fields`,
        component: React.lazy(() => import('views/events/Settings/Fields/index')),
    },
    {
        key: 'dashboard',
        path: `/dashboard`,
        component: React.lazy(() => import('views/events/Dashboard/index')),
    },
        {
        key: 'events.create',
        path: `/events/update/:id`,
         component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <EventStepperForm  />
            </React.Suspense>
        ),
    },
    {
        key: 'events',
        path: `/events/ticket/:id/:name`,
        component: React.lazy(() => import('views/events/Tickets/TicketManager/TicketComponent')),
    },
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
    {
        key: 'venues',
        path: `/venues`,
        component: React.lazy(() => import('views/events/Venues/index')),
    },
    {
        key : 'artist',
         path: `/artist`,
        component: React.lazy(() => import('views/events/Artist/index')),
    },
    {
        key: 'events.create',
        path: `/events/create`,
        component: React.lazy(() => import('views/events/event/EventStepperForm')),
    },
    {
        key: 'agents',
        path: `/agents`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} />
            </React.Suspense>
        ),
    },
    {
        key: 'sponsors',
        path: `/sponsors`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isSponser={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'pos',
        path: `/pos`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <PosBooking {...props} isPos={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'pos',
        path: `/pos/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <POS {...props} isPos={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'corporate',
        path: `/corporate`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isCorporate={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'complimentary',
        path: `/complimentary`,
        component: React.lazy(() => import('views/events/ComplimentaryBooking')),
    },
    /// attendess
    {
        key: 'attendees',
        path: `/attendees`,
        component: React.lazy(() => import('views/events/event/Attendees')),
    },
    {
        key: 'admin-settings',
        path: `/settings/admin-settings`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/AdminSetting')),
    },

    /// payment routes
    {
        key: 'payment-gateways',
        path: `/settings/payment-gateways`,
        component: React.lazy(() => import('views/events/Settings/Payment_Gateway/PaymentGateway')),
    },

    // footer settings
    {
        key: 'footer-settings',
        path: `/settings/footer`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/Footer_settings/FooterData')),
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
                {/* <UserForm mode="edit" /> */}
                <ManageUser mode="edit" />
            </React.Suspense>
        ),
    },
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
   
    // settings configs
    {
        key: 'settings.mail_config',
        path: `/settings/mail-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/MailSettings')),
    },
    {
        key: 'settings.whats_config',
        path: `/settings/whatsapp-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/WhatsAppConfig')),
    },
    {
        key: 'settings.sms_config',
        path: `/settings/sms-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/SmsSetting')),
    },
    {
        key: 'settings.banners',
        path: `/settings/banners`,
        component: React.lazy(() => import('views/events/Settings/Banner/BannerConfig')),
    },
    // payment logs
    {
        key: 'payment-log',
        path: `/payment-log`,
        component: React.lazy(() => import('views/events/PaymentLog/index')),
    },
    // tax config
    {
        key: 'tax-commision',
        path: `/tax-commision`,
        component: React.lazy(() => import('views/events/TaxComission/index')),
    },


    //scan and check in
    {
        key: 'scan.camera',
        path: `/scan/camera`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                {/* <UserForm mode="edit" /> */}
                <TicketVerification scanMode="camera" />
            </React.Suspense>
        ),
    },
    {
        key: 'scan.scanner',
        path: `/scan/scanner`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                {/* <UserForm mode="edit" /> */}
                <TicketVerification scanMode="manual" />
            </React.Suspense>
        ),
    },
    {
        key: 'scan.history',
        path: `/scan/history`,
        component: React.lazy(() => import('views/events/Scan/ScanHistory')),
    },
]