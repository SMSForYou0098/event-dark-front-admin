import React, { useState, useEffect } from 'react';
import Loading from './index';

/**
 * A loading indicator that only appears after a delay.
 * This prevents the "flash of loading" when route chunks load quickly (< delay ms).
 * If the Suspense resolves before the delay, the user never sees a spinner.
 */
const DelayedLoading = ({ delay = 400, cover = 'content' }) => {
    const [showLoading, setShowLoading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setShowLoading(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!showLoading) return null;

    return <Loading cover={cover} />;
};

export default DelayedLoading;
