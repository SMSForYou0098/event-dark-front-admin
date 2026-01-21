import React from 'react'
import { AUTH_PREFIX_PATH } from 'configs/AppConfig'
import BookingList from 'views/events/Bookings/BookingList'
import EventStepperForm from 'views/events/event/EventStepperForm'
import ManageUser from 'views/events/users/Manage'
import PosBooking from 'views/events/Bookings/pos/PosBookings'
import POS from 'views/events/Bookings/pos/NewPosBooking'
import TicketVerification from 'views/events/Scan/TicketVerification'
import NewBooking from 'views/events/Bookings/agent/NewAgentBooking'
import AgentPOSDashboardLayout from 'views/events/Dashboard/components/AgentPOSDashboardLayout'
import UserEditGuard from 'routes/UserEditGuard'
import EventList from 'views/events/event/list'

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
        key: 'register',
        path: `${AUTH_PREFIX_PATH}/register`,
        component: React.lazy(() => import('views/auth-views/authentication/register-1')),
    },
    {
        key: 'forgot-password',
        path: `${AUTH_PREFIX_PATH}/forgot-password`,
        component: React.lazy(() => import('views/auth-views/authentication/forgot-password')),
    },
    {
        key: 'reset-password',
        path: `${AUTH_PREFIX_PATH}/reset-password`,
        component: React.lazy(() => import('views/auth-views/authentication/forgot-password/reset-password')),

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
        key: 'forbidden',
        path: `/forbidden`,
        component: React.lazy(() => import('views/auth-views/errors/error-page-1/index')),
    },
    // {
    //     key: 'dashboard',
    //     path: `/dashboard`,
    //     component: React.lazy(() => import('views/events/Dashboard/index')),
    //     meta:{
    //         // roles: ['admin', 'organizer', 'agent', 'sponsor'],
    //         permissions: ['View Dashboard'],
    //     }
    // },
    {
        key: 'dashboard',
        path: `/dashboard`,
        component: React.lazy(() => import('views/events/Dashboard/index')),
        meta: {
            permissions: ['View Dashboard'],
        }
    },
    {
        key: 'agreement/preview/:id',
        path: `/agreement/preview/:id`,
        component: React.lazy(() => import('views/events/Agreement/PreviewAgreement')),
    },
    {
        key: 'agreement/preview/:id/:user_id',
        path: `/agreement/preview/:id/:user_id`,
        component: React.lazy(() => import('views/events/Agreement/PreviewAgreement')),
    },
    {
        key: 'stadium',
        path: `/stadium`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/StadiumBuilderAdmin')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'stadium-id',
        path: `/stadium/:id`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/StadiumBuilderAdmin')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'stadium-canvas',
        path: `/stadium-canvas`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/Canvas_Based/StadiumCanvasLayout')),
        meta: {}
    },
    {
        key: 'stadium-canvas-id',
        path: `/stadium-canvas/:id`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/Canvas_Based/StadiumCanvasLayout')),
        meta: {}
    },
    {
        key: 'user-booking-canvas',
        path: `/user-booking/canvas/:id`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/Canvas_Based/StadiumCanvasUser')),
        meta: {}
    },
    {
        key: 'user-booking-canvas-base',
        path: `/user-booking/canvas`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/Canvas_Based/StadiumCanvasUser')),
        meta: {}
    },
    {
        key: 'canvas-performance-demo',
        path: `/stadium/canvas-demo`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/Canvas_Based/CanvasSeats/CanvasStadiumDemo')),
        meta: {}
    },
    // StadiumV2 - Fresh Build
    {
        key: 'stadium-v2-admin',
        path: `/stadium-v2`,
        component: React.lazy(() => import('views/events/seating_module/StadiumV2/StadiumAdmin')),
        meta: {}
    },

    // ==================== STADIUM V2 - NEW SEPARATED ROUTES ====================
    // Layout Builder Only (Admin) - No ticket assignment
    {
        key: 'layout-list',
        path: `/layouts`,
        component: React.lazy(() => import('views/events/seating_module/StadiumV2/pages/LayoutBuilder')),
        meta: {
            // permissions: ['Manage Layouts'],
        }
    },
    {
        key: 'layout-create',
        path: `/layouts/new`,
        component: React.lazy(() => import('views/events/seating_module/StadiumV2/pages/LayoutBuilder')),
        meta: {
            // permissions: ['Create Layout'],
        }
    },
    {
        key: 'layout-edit',
        path: `/layouts/:layoutId`,
        component: React.lazy(() => import('views/events/seating_module/StadiumV2/pages/LayoutBuilder')),
        meta: {
            // permissions: ['Edit Layout'],
        }
    },
    // Event Seating Manager (Organizer) - Select layout + assign tickets
    {
        key: 'event-seating',
        path: `/events/:eventId/seating`,
        component: React.lazy(() => import('views/events/seating_module/StadiumV2/pages/EventSeatingManager')),
        meta: {
            // permissions: ['Manage Event Seating'],
        }
    },
    {
        key: 'user-booking',
        path: `/user-booking`,
        component: React.lazy(() => import('views/events/seating_module/Stadium_layout/UsersBooking')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'theatre',
        path: `/theatre`,
        component: React.lazy(() => import('views/events/seating_module/theatre_layout/index')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'theatre',
        path: `/theatre/new`,
        component: React.lazy(() => import('views/events/seating_module/theatre_layout/TheatreLayout')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'theatre-edit',
        path: `/theatre/:id`,
        component: React.lazy(() => import('views/events/seating_module/theatre_layout/TheatreLayout')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'theatre-edit',
        // path: `/theatre/:id`,
        path: `/theatre/event/:eventId/layout/:id`,
        component: React.lazy(() => import('views/events/seating_module/theatre_layout/TheatreLayout')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'theatre',
        path: `/theatre/book`,
        component: React.lazy(() => import('views/events/seating_module/theatre_layout/Auditoriumticketbooking')),
        meta: {
            // permissions: ['View Dashboard'],
        }
    },
    {
        key: 'dashboard-org',
        path: `/dashboard/org`,
        component: React.lazy(() => import('views/events/Dashboard/Organizer/dashabord')),
        meta: {
            // roles: ['admin', 'organizer', 'agent', 'sponsor'],
            permissions: ['View Dashboard'],
        }
    },
    {
        key: 'dashboard-agent',
        path: `/dashboard/agent`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <AgentPOSDashboardLayout type="agent" />
            </React.Suspense>
        ),
        meta: {
            // roles: ['admin', 'organizer', 'agent', 'sponsor'],
            permissions: ['View Dashboard'],
        }
    },
    {
        key: 'dashboard-pos',
        path: `/dashboard/pos`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <AgentPOSDashboardLayout type="pos" />
            </React.Suspense>
        ),
        meta: {
            // roles: ['admin', 'organizer', 'agent', 'sponsor'],
            permissions: ['View Dashboard'],
        }
    },
    {
        key: 'dashboard-sponsor',
        path: `/dashboard/sponsor`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <AgentPOSDashboardLayout type="sponsor" />
            </React.Suspense>
        ),
        meta: {
            // roles: ['admin', 'organizer', 'agent', 'sponsor'],
            permissions: ['View Dashboard'],
        }
    },

    // ==================== USER MANAGEMENT ====================
    {
        key: 'users',
        path: `/users`,
        component: React.lazy(() => import('views/events/users/Users')),
        meta: {
            //roles: ['admin', 'organizer'],
            permissions: ['View User'],
        }
    },
    {
        key: 'new-user',
        path: `/users/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <ManageUser mode="create" />
            </React.Suspense>
        ),
        meta: {
            permissions: ['Add User'],
        }
    },
    {
        key: 'edit-user',
        path: `/users/edit/:id`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <UserEditGuard>
                    <ManageUser mode="edit" />
                </UserEditGuard>
            </React.Suspense>
        ),
        meta: {
            permissions: ['Edit User', 'Edit Profile'],
        }
    },
    {
        key: 'organizers',
        path: `/organizers`,
        component: React.lazy(() => import('views/events/users/Organizers')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'login-history',
        path: `/login-history`,
        component: React.lazy(() => import('views/events/users/LoginHistory')),
        meta: {
            excludeRoles: ['user'],
        }
    },

    // ==================== ROLE & PERMISSIONS ====================
    {
        key: 'role',
        path: `/role`,
        component: React.lazy(() => import('views/events/RolePermission/Role/index')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'role-permission',
        path: `/role/:id/:name/permission`,
        component: React.lazy(() => import('views/events/RolePermission/Permisson')),
        meta: {
            roles: ['admin'],
        }
    },

    // ==================== EVENTS MANAGEMENT ====================
    {
        key: 'events',
        path: `/events`,
        component: React.lazy(() => import('views/events/event/list')),
        meta: {
            permissions: ['View Event'],
            //roles: ['admin', 'organizer'],
        }
    },
    {
        key: 'events-create',
        path: `/events/create`,
        component: React.lazy(() => import('views/events/event/EventStepperForm')),
        meta: {
            permissions: ['View Event'],
        }
    },
    {
        key: 'events-junk',
        path: `/events/junk`,
        component: (props) => (
            <EventList isJunk={true} />
        ),
        meta: {
            permissions: ['View Junk Events'],
        }
    },
    {
        key: 'events-update',
        path: `/events/update/:id`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <EventStepperForm />
            </React.Suspense>
        ),
        meta: {
            permissions: ['Edit Event'],
        }
    },
    {
        key: 'events-ticket',
        path: `/events/ticket/:id/:name`,
        component: React.lazy(() => import('views/events/Tickets/TicketManager/TicketComponent')),
        meta: {
            //roles: ['admin', 'organizer'],

        }
    },
    {
        key: 'attendees',
        path: `/attendees`,
        component: React.lazy(() => import('views/events/event/Attendees')),
        meta: {
            permissions: ['View Attendees'],
            //roles: ['admin', 'organizer'],
        }
    },

    // ==================== BOOKINGS MANAGEMENT ====================
    // Online Bookings
    {
        key: 'online-bookings',
        path: `/bookings/online`,
        component: React.lazy(() => import('views/events/Bookings/Online_Bookings/OnlineBookings')),
        meta: {
            permissions: ['View Online Bookings'],
            //roles: ['admin', 'organizer'],
        }
    },
    // Pending Bookings
    {
        key: 'pending-bookings',
        path: `/bookings/pending`,
        component: React.lazy(() => import('views/events/Bookings/Pending_Bookings/index')),
        meta: {
            roles: ['admin'],
        }
    },
    // Refund Bookings
    {
        key: 'refund-bookings',
        path: `/bookings/refund`,
        component: React.lazy(() => import('views/events/Bookings/Refund_Bookings/index')),
        meta: {
            roles: ['admin'],
        }
    },
    // Agent Bookings
    {
        key: 'agent-bookings',
        path: `/bookings/agent`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} type="agent" />
            </React.Suspense>
        ),
        meta: {
            permissions: ['View Agent Bookings'],
            //roles: ['admin', 'organizer', 'agent'],
        }
    },
    // Sponsor Bookings
    {
        key: 'sponsor-bookings',
        path: `/bookings/sponsor`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} type="sponsor" />
            </React.Suspense>
        ),
        meta: {
            permissions: ['View Sponsor Bookings'],
            //roles: ['admin', 'organizer', 'sponsor'],
        }
    },
    // Complimentary Bookings
    {
        key: 'complimentary-bookings',
        path: `/bookings/complimentary`,
        component: React.lazy(() => import('views/events/Bookings/ComplimentaryBooking')),
        meta: {
            //roles: ['admin', 'organizer'],
            permissions: ['View Complimentary Bookings'],
        }
    },
    {
        key: 'complimentary-bookings-new',
        path: `/bookings/complimentary/new`,
        component: React.lazy(() => import('views/events/Bookings/ComplimentaryBooking/ComplimentaryBookings')),
        meta: {
            permissions: ['Add Complimentary Booking'],
        }
    },

    // blogs routes
    {
        key: 'blogs-new',
        path: `/media/blogs/new`,
        component: React.lazy(() => import('views/events/Blogs/NewPost')),
        meta: {
            roles: ['admin'],
            // permissions: ['Create Blog Post'],
        }
    },
    {
        key: 'blogs-new',
        path: `/media/blogs/update/:id`,
        component: React.lazy(() => import('views/events/Blogs/EditPost')),
        meta: {
            roles: ['admin'],
            permissions: ['Edit Blog Post'],
        }
    },
    {
        key: 'blogs',
        path: `/media/blogs`,
        component: React.lazy(() => import('views/events/Blogs/Posts')),
        meta: {
            roles: ['admin'],
        }
    },

    // Corporate Bookings
    {
        key: 'corporate-bookings',
        path: `/corporate`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} type="corporate" />
            </React.Suspense>
        ),
        meta: {
            //roles: ['admin', 'organizer', 'corporate'],
            permissions: ['View Corporate Bookings'],
        }
    },
    // Accreditation Bookings
    {
        key: 'accreditation-bookings',
        path: `/bookings/accreditation`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <BookingList {...props} type="accreditation" />
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
        meta: {
            //roles: ['admin', 'organizer', 'pos'],
            permissions: ['View POS Bookings'],
        }
    },
    {
        key: 'pos-new',
        path: `/bookings/pos/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <POS {...props} isPos={true} />
            </React.Suspense>
        ),
        meta: {
            //roles: ['admin', 'organizer', 'pos'],
            permissions: ['Add POS Booking'],
        }
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
        meta: {
            // roles: ['admin', 'organizer', 'scanner'],
            permissions: ['Scan By Camera'],
        }
    },
    {
        key: 'scan-scanner',
        path: `/scan/scanner`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <TicketVerification scanMode="manual" />
            </React.Suspense>
        ),
        meta: {
            //roles: ['admin', 'organizer', 'scanner'],
            permissions: ['Scan By Scanner'],
        }
    },
    {
        key: 'scan-history',
        path: `/scan/history`,
        component: React.lazy(() => import('views/events/Scan/ScanHistory')),
        meta: {
            //roles: ['admin', 'organizer', 'scanner'],
            permissions: ['View Scan History'],
        }
    },

    // ==================== PROMO CODES ====================
    {
        key: 'promo-codes',
        path: `/promo-codes`,
        component: React.lazy(() => import('views/events/PromoCodes/index')),
        meta: {
            // roles: ['admin', 'organizer'],
            permissions: ['View Promo Codes'],
        }
    },
    // promotions
    {
        key: 'orgs-promotion',
        path: 'promotion/orgs',
        component: React.lazy(() => import('views/events/Promotion/PromoteOrgs/PromoteOrgs')),
        meta: {
            roles: ['admin'],
        }
    },
    // ==================== BOX OFFICE & WALLET ====================
    {
        key: 'box-office',
        path: `/box-office`,
        component: React.lazy(() => import('views/events/BoxOffice/index')),
        meta: {
            //roles: ['admin', 'organizer', 'Box Office Manager'],
            permissions: ['View Box Office'],
        }
    },
    {
        key: 'wallet-agent',
        path: `/wallet-agent`,
        component: React.lazy(() => import('views/events/WalletAgent/index')),
        meta: {
            //roles: ['admin', 'organizer', 'Wallet Agent'],
            permissions: ['View Agent Wallet'],
        }
    },

    // ==================== SUPPORT AND CUSTOMER INQUIERIES ====================
    {
        key: 'contact-us-applications',
        path: `/customer-inquiries`,
        component: React.lazy(() => import('views/events/Support/ContactUsApplications')),
        meta: {
            roles: ['admin'],
            permissions: ['View User Inquiries'],
        }
    },

    // ==================== VENUES & ARTISTS ====================
    {
        key: 'venues',
        path: `/venues`,
        component: React.lazy(() => import('views/events/Venues/index')),
        meta: {
            permissions: ['View Venues'],
        }
    },
    {
        key: 'artist',
        path: `/artist`,
        component: React.lazy(() => import('views/events/Artist/index')),
        meta: {
            //roles: ['admin', 'organizer'],
            permissions: ['View Artists'],
        }
    },
    // Refund Policies
    {
        key: 'refund-policies',
        path: `/refund-policies`,
        component: React.lazy(() => import('views/events/Refund_policies/index')),
        meta: {
            roles: ['admin'],
        }
    },

    // ==================== PAYMENT & TAX ====================
    {
        key: 'payment-log',
        path: `/payment-log`,
        component: React.lazy(() => import('views/events/PaymentLog/index')),
        meta: {
            roles: ['admin'],
            // permissions: ['View Payment Log'],
        }
    },
    {
        key: 'tax-commission',
        path: `/tax-commision`,
        component: React.lazy(() => import('views/events/TaxComission/index')),
        meta: {
            roles: ['admin',],
        }
    },

    // ==================== SETTINGS ====================
    // Admin Settings
    {
        key: 'admin-settings',
        path: `/settings/admin-settings`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/AdminSetting')),
        meta: {
            roles: ['admin'],
        }
    },
    // Payment Gateway Settings
    {
        key: 'payment-gateways',
        path: `/settings/payment-gateways`,
        component: React.lazy(() => import('views/events/Settings/Payment_Gateway/PaymentGateway')),
        meta: {
            roles: ['admin'],
        }
    },
    // Footer Settings
    {
        key: 'footer-settings',
        path: `/settings/footer`,
        component: React.lazy(() => import('views/events/Settings/Admin_Settings/Footer_settings/FooterData')),
        meta: {
            roles: ['admin'],
        }
    },
    // Mail Config
    {
        key: 'mail-config',
        path: `/settings/mail-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/MailSettings')),
        meta: {
            roles: ['admin'],
            permissions: ['View Mail Config Setting'],
        }
    },
    // WhatsApp Config
    {
        key: 'whatsapp-config',
        path: `/settings/whatsapp-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/WhatsAppConfig')),
        meta: {
            roles: ['admin'],
            permissions: ['View WhatsApp Config Setting'],
        }
    },
    // SMS Config
    {
        key: 'sms-config',
        path: `/settings/sms-config`,
        component: React.lazy(() => import('views/events/Settings/Admin_configs/SmsSetting')),
        meta: {
            roles: ['admin'],
            permissions: ['View SMS Config Setting'],
        }
    },
    // Banners
    {
        key: 'media-banners',
        path: `/media/banners`,
        component: React.lazy(() => import('views/events/Settings/Banner/BannerConfig')),
        meta: {
            permissions: ['View Banners'],
        }
    },
    {
        key: 'media-category',
        path: `/media/tickets`,
        component: React.lazy(() => import('views/events/Settings/Category/Tickets/index')),
        meta: {
            permissions: ['View Category Tickets'],
        }
    },
    {
        key: 'media-gallery',
        path: `/media/gallery`,
        component: React.lazy(() => import('views/events/media/index')),
        meta: {
            permissions: ['View Category Tickets'],
        }
    },
    // Category Settings
    {
        key: 'category',
        path: `/category`,
        component: React.lazy(() => import('views/events/Settings/Category/Category')),
        meta: {
            roles: ['admin'],
        }
    },
    // Custom Fields
    {
        key: 'fields',
        path: `/fields`,
        component: React.lazy(() => import('views/events/Settings/Fields/index')),
        meta: {
            roles: ['admin'],
            // permissions: ['View Custom Fields'],
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
    {
        key: 'organizer-reports',
        path: `/reports/organizer`,
        component: React.lazy(() => import('views/events/Reports/OrganizerReport')),
    },

    // ==================== New Booking Page ====================
    {
        key: 'new-booking-agent',
        path: `/bookings/agent/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <NewBooking {...props} type="agent" />
            </React.Suspense>
        ),
        meta: {
            roles: ['admin', 'organizer', 'agent'],
            permissions: ['Add Agent Booking'],
        }
    },
    // ==================== New Booking Page ====================
    {
        key: 'new-booking-sponsor',
        path: `/bookings/sponsor/new`,
        component: (props) => (
            <React.Suspense fallback={<div>Loading...</div>}>
                <NewBooking {...props} type="sponsor" />
            </React.Suspense>
        ),
        meta: {
            permissions: ['Add Sponsor Booking'],
        }
    },
    // ==================== Agreement ====================
    // add routes for onboarding
    {
        key: 'onboarding-agreement',
        path: `onboard/organizer`,
        component: React.lazy(() => import('views/events/Onboarding/Organizer/index')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'approve-organizers',
        path: `approve-organizers`,
        component: React.lazy(() => import('views/events/Onboarding/ApproveOrganizers/index')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'organizer-agreement',
        path: `/agreements/organizer`,
        component: React.lazy(() => import('views/events/Agreement/Organizer/index')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'live-users',
        path: `/live-users`,
        component: React.lazy(() => import('views/events/other/LiveUsers')),
        meta: {
            roles: ['admin'],
            permissions: ['View Live Users'],
        }
    },
    {
        key: 'content-master',
        path: `/event-content`,
        component: React.lazy(() => import('views/events/EventContent/index')),
        meta: {
            // roles: ['admin'],
            permissions: ['View Content Master'],
        }
    },
    {
        key: 'label-printing',
        path: `/label-printing`,
        component: React.lazy(() => import('views/events/label_printing/LabelPrinting')),
        meta: {
            roles: ['admin'],
        }
    },
    {
        key: 'intimation',
        path: `/intimation`,
        component: React.lazy(() => import('views/events/Intimations/index')),
        meta: {
            roles: ['admin'],
        }
    },
]
