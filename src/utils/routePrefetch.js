/**
 * Route Prefetcher
 * 
 * Preloads route chunks on sidebar hover so that by the time the user clicks,
 * the JS chunk is already downloaded and React.lazy() resolves instantly.
 * This eliminates the loading spinner flash between page navigations.
 */

// Map of navigation paths to their dynamic import functions.
// These must match the import paths used in RoutesConfig.js
const routeImportMap = {
    // Dashboard
    'dashboard': () => import('views/events/Dashboard/index'),
    'dashboard/gateway': () => import('views/events/Dashboard/Gateway/GatewayReport'),
    'dashboard/org': () => import('views/events/Dashboard/Organizer/dashabord'),

    // User Management
    'users': () => import('views/events/users/Users'),
    'organizers': () => import('views/events/users/Organizers'),
    'attendees': () => import('views/events/event/Attendees'),
    'login-history': () => import('views/events/users/LoginHistory'),

    // Events
    'events': () => import('views/events/event/list'),
    'category': () => import('views/events/Settings/Category/Category'),
    'venues': () => import('views/events/Venues/index'),
    'artist': () => import('views/events/Artist/index'),
    'refund-policies': () => import('views/events/Refund_policies/index'),
    'event-content': () => import('views/events/EventContent/index'),
    'fields': () => import('views/events/Settings/Fields/index'),
    'card-inventory': () => import('views/events/CardInventory/index'),

    // Theatre / Layouts
    'theatre': () => import('views/events/seating_module/theatre_layout/index'),

    // Bookings
    'bookings/online': () => import('views/events/Bookings/Online_Bookings/OnlineBookings'),
    'bookings/pending': () => import('views/events/Bookings/Pending_Bookings/index'),
    'bookings/refund': () => import('views/events/Bookings/Refund_Bookings/index'),
    'bookings/complimentary': () => import('views/events/Bookings/ComplimentaryBooking'),
    'bookings/complimentary/new': () => import('views/events/Bookings/ComplimentaryBooking/ComplimentaryBookings'),

    // Scan
    'scan/history': () => import('views/events/Scan/ScanHistory'),

    // Operations & Support
    'box-office': () => import('views/events/BoxOffice/index'),
    'customer-inquiries': () => import('views/events/Support/ContactUsApplications'),
    'wallet-agent': () => import('views/events/WalletAgent/index'),

    // Finance
    'payment-log': () => import('views/events/PaymentLog/index'),
    'promo-codes': () => import('views/events/PromoCodes/index'),
    'tax-commision': () => import('views/events/TaxComission/index'),

    // Reports
    'reports/event': () => import('views/events/Reports/EventsReport'),
    'reports/pos': () => import('views/events/Reports/PosReport'),
    'reports/agent': () => import('views/events/Reports/AgentReport'),
    'reports/organizer': () => import('views/events/Reports/OrganizerReport'),
    'reports/scanner': () => import('views/events/Reports/ScannerReport'),

    // Settings
    'role': () => import('views/events/RolePermission/Role/index'),
    'settings/mail-config': () => import('views/events/Settings/Admin_configs/MailSettings'),
    'settings/sms-config': () => import('views/events/Settings/Admin_configs/SmsSetting'),
    'settings/whatsapp-config': () => import('views/events/Settings/Admin_configs/WhatsAppConfig'),
    'settings/admin-settings': () => import('views/events/Settings/Admin_Settings/AdminSetting'),
    'settings/payment-gateways': () => import('views/events/Settings/Payment_Gateway/PaymentGateway'),
    'settings/footer': () => import('views/events/Settings/Admin_Settings/Footer_settings/FooterData'),

    // Media
    'media/banners': () => import('views/events/Settings/Banner/BannerConfig'),
    'media/blogs': () => import('views/events/Blogs/Posts'),
    'media/gallery': () => import('views/events/media/index'),
    'media/tickets': () => import('views/events/Settings/Category/Tickets/index'),

    // Agreements & Onboarding
    'agreements/organizer': () => import('views/events/Agreement/Organizer/index'),
    'onboard/organizer': () => import('views/events/Onboarding/Organizer/index'),
    'approve-organizers': () => import('views/events/Onboarding/ApproveOrganizers/index'),

    // Promotions
    'promotion/orgs': () => import('views/events/Promotion/PromoteOrgs/PromoteOrgs'),
    'intimation': () => import('views/events/Intimations/index'),

    // Live Users
    'live-users': () => import('views/events/other/LiveUsers'),

    // Label Printing & Forge
    'label-printing': () => import('views/events/label_printing/LabelPrinting'),
    'label-forge': () => import('views/events/label_forge/LabelForge'),
    'dynamic-label-print': () => import('views/events/label_printing/DynamicLabelPrint'),
    'label-designer': () => import('views/events/label_printing/LabelDesigner'),
    'printer-testing': () => import('views/events/Settings/PrinterTesting/index'),
};

// Track which routes have already been prefetched
const prefetchedRoutes = new Set();

/**
 * Prefetch a route's JS chunk by its navigation path.
 * Safe to call multiple times — duplicate calls are ignored.
 */
export const prefetchRoute = (path) => {
    if (!path) return;

    // Normalize: strip leading slash, trim
    const normalizedPath = path.replace(/^\/+/, '').trim();

    if (prefetchedRoutes.has(normalizedPath)) return;

    const importFn = routeImportMap[normalizedPath];
    if (importFn) {
        prefetchedRoutes.add(normalizedPath);
        // Trigger the dynamic import — webpack will cache the chunk
        importFn().catch(() => {
            // If prefetch fails (e.g., offline), allow retry next time
            prefetchedRoutes.delete(normalizedPath);
        });
    }
};

/**
 * Recursively prefetch all leaf paths from a navigation subtree.
 * Useful for prefetching when hovering a parent menu item.
 */
export const prefetchNavTree = (navItem) => {
    if (!navItem) return;

    if (navItem.path) {
        prefetchRoute(navItem.path);
    }

    if (navItem.submenu && navItem.submenu.length > 0) {
        navItem.submenu.forEach(prefetchNavTree);
    }
};

/**
 * Preload critical/frequently visited routes during browser idle time.
 * Call this once after the app mounts.
 */
export const prefetchCriticalRoutes = () => {
    const criticalPaths = ['dashboard', 'events', 'users', 'bookings/online'];

    const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 2000));

    idleCallback(() => {
        criticalPaths.forEach(prefetchRoute);
    });
};
