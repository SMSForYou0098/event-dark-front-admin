import React from 'react'
import { AUTH_PREFIX_PATH, APP_PREFIX_PATH } from 'configs/AppConfig'
import BookingList from 'views/events/Bookings/BookingList'
import EventStepperForm from 'views/events/event/EventStepperForm'
import ManageUser from 'views/events/users/Manage'
import PosBooking from 'views/events/Bookings/pos/Bookings'
import POS from 'views/events/Bookings/pos/NewPosBooking'

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
        key: 'apps.users',
        path: `/users`,
        component: React.lazy(() => import('views/events/users/Users')),
    },
    {
        key: 'apps.organizers',
        path: `/organizers`,
        component: React.lazy(() => import('views/events/users/Organizers')),
    },
    {
        key: 'apps.role',
        path: `${APP_PREFIX_PATH}/apps/role`,
        component: React.lazy(() => import('views/events/RolePermission/Role/index')),
    },
    {
        key: 'apps.category',
        path: `/category`,
        component: React.lazy(() => import('views/events/Settings/Category/Category')),
    },
    {
        key: 'apps.role',
        path: `/role/:id/:name/permission`,
        component: React.lazy(() => import('views/events/RolePermission/Permisson')),
    },
    {
        key: 'apps.events',
        path: `/events`,
        component: React.lazy(() => import('views/events/event/list')),
    },
    {
        key: 'apps.fields',
        path: `/fields`,
        component: React.lazy(() => import('views/events/Settings/Fields/index')),
    },
    {
        key: 'dashboard',
        path: `/dashboard`,
        component: React.lazy(() => import('views/events/Dashboard/index')),
    },
        {
        key: 'apps.events.create',
        path: `/events/update/:id`,
         component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <EventStepperForm  />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.events',
        path: `${APP_PREFIX_PATH}/apps/events/ticket/:id/:name`,
        component: React.lazy(() => import('views/events/Tickets/TicketManager/TicketComponent')),
    },
    {
        key: 'apps.box-office',
        path: `${APP_PREFIX_PATH}/apps/box-office`,
        component: React.lazy(() => import('views/events/BoxOffice/index')),
    },
    {
        key: 'apps.wallet-agent',
        path: `${APP_PREFIX_PATH}/apps/wallet-agent`,
        component: React.lazy(() => import('views/events/WalletAgent/index')),
    },
    {
        key: 'apps.venues',
        path: `${APP_PREFIX_PATH}/apps/venues`,
        component: React.lazy(() => import('views/events/Venues/index')),
    },
    {
        key : 'apps-artist',
         path: `${APP_PREFIX_PATH}/apps/artist`,
        component: React.lazy(() => import('views/events/Artist/index')),
    },
    {
        key: 'apps.events.create',
        path: `${APP_PREFIX_PATH}/apps/events/create`,
        component: React.lazy(() => import('views/events/event/EventStepperForm')),
    },
    {
        key: 'apps.agents',
        path: `${APP_PREFIX_PATH}/apps/agents`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.sponsors',
        path: `${APP_PREFIX_PATH}/apps/sponsors`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isSponser={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.pos',
        path: `${APP_PREFIX_PATH}/apps/pos`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <PosBooking {...props} isPos={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.pos',
        path: `${APP_PREFIX_PATH}/apps/pos/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <POS {...props} isPos={true} />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.corporate',
        path: `${APP_PREFIX_PATH}/apps/corporate`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} isCorporate={true} />
            </React.Suspense>
        ),
    },
    /// attendess
    {
        key: 'apps.attendees',
        path: `${APP_PREFIX_PATH}/apps/attendees`,
        component: React.lazy(() => import('views/events/event/Attendees')),
    },
    {
        key: 'apps.admin-settings',
        path: `${APP_PREFIX_PATH}/apps/settings/admin-settings`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/AdminSetting')),
    },

    /// payment routes
    {
        key: 'apps.payment-gateways',
        path: `${APP_PREFIX_PATH}/apps/settings/payment-gateways`,
        component: React.lazy(() => import('views/events/Settings/Payment_Gateway/PaymentGateway')),
    },

    // footer settings
    {
        key: 'apps.footer-settings',
        path: `${APP_PREFIX_PATH}/apps/settings/footer`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/Footer_settings/FooterData')),
    },
    {
        key: 'apps.new-user',
        path: `${APP_PREFIX_PATH}/apps/users/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <ManageUser mode="create" />
            </React.Suspense>
        ),
    },
    {
        key: 'apps.edit-user',
        path: `${APP_PREFIX_PATH}/apps/users/edit/:id`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                {/* <UserForm mode="edit" /> */}
                <ManageUser mode="edit" />
            </React.Suspense>
        ),
    },


    

   
   
 
    {
        key: 'login-1',
        path: `${APP_PREFIX_PATH}/login-1`,
        component: React.lazy(() => import('views/auth-views/authentication/login-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'register-1',
        path: `${APP_PREFIX_PATH}/register-1`,
        component: React.lazy(() => import('views/auth-views/authentication/register-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'forgot-password',
        path: `${APP_PREFIX_PATH}/forgot-password`,
        component: React.lazy(() => import('views/auth-views/authentication/forgot-password')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'error-page-1',
        path: `${APP_PREFIX_PATH}/error-page-1`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-1')),
        meta: {
            blankLayout: true
        }
    },
    {
        key: 'error-page-2',
        path: `${APP_PREFIX_PATH}/error-page-2`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-2')),
        meta: {
            blankLayout: true
        }
    },
   
    // settings configs
    {
        key: 'apps.settings.mail_config',
        path: `${APP_PREFIX_PATH}/apps/settings/mail-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/MailSettings')),
    },
    {
        key: 'apps.settings.whats_config',
        path: `${APP_PREFIX_PATH}/apps/settings/whatsapp-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/WhatsAppConfig')),
    },
    {
        key: 'apps.settings.sms_config',
        path: `${APP_PREFIX_PATH}/apps/settings/sms-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/SmsSetting')),
    },
    {
        key: 'apps.settings.banners',
        path: `${APP_PREFIX_PATH}/apps/settings/banners`,
        component: React.lazy(() => import('views/events/Settings/Banner/BannerConfig')),
    },
]