import React, { useState, useEffect, useRef } from 'react';
import { Card, Collapse, Input, Grid, Button } from 'antd';
import { useMyContext } from 'Context/MyContextProvider';
import PosEventCard from './PosEventCard';
import { SearchOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import Loader from 'utils/Loader';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

const { Panel } = Collapse;
const PosEvents = ({ type = 'pos', handleButtonClick, isScanner }) => {
    const { UserData, truncateString } = useMyContext();
    const screens = Grid.useBreakpoint();
    const scrollerRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeKey, setActiveKey] = useState(['1']);
    const hasAutoSelectedRef = useRef(false);

    // Fetch events using TanStack Query
    const { data: events = [], isLoading, isError } = useQuery({
        queryKey: ['pos-events', UserData?.id, type],
        queryFn: async () => {
            if (!UserData?.id) return [];
            const res = await api.get(`pos-events/${UserData?.id}?type=${type}`);
            return res.events || [];
        },
        enabled: !!UserData?.id,
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
    });

    // Auto-select first event for scanner users
    useEffect(() => {
        if (isScanner && events.length > 0 && !hasAutoSelectedRef.current) {
            hasAutoSelectedRef.current = true;
            const firstEvent = events[0];
            handleButtonClick(firstEvent, firstEvent?.tickets);
        }
    }, [isScanner, events, handleButtonClick]);
    const filteredEvent = searchTerm
        ? events.filter(event =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : events;

    const formattedProductName = (name) => {
        const updated = name?.replace(' ', "-");
        return truncateString(updated);
    };

    const handleEventData = (event) => {
        handleButtonClick(event, event?.tickets);
        setActiveKey(null);
    };

    // Responsive widths for horizontally scrollable items
    const getItemWidth = () => {
        if (screens.xxl || screens.xl) return '12.5%'; // ~6 items
        if (screens.lg) return '25%'; // ~4 items
        if (screens.md) return '33.33%'; // ~3 items
        if (screens.sm) return '50%'; // ~2 items
        return '50%'; // ~1-1.2 items on very small screens
    };

    const scrollByCards = (direction = 1) => {
        const container = scrollerRef.current;
        if (!container) return;
        const firstItem = container.querySelector('[data-pos-card-item="true"]');
        const itemWidth = firstItem ? firstItem.getBoundingClientRect().width + 16 : container.clientWidth * 0.9; // 16 = gap
        container.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    };

    if (isError) {
        return <div className="text-danger text-center">Failed to load events.</div>;
    }
    if (isLoading) {
        return <Loader />
    }
    if (isScanner) {
        return null;
    }
    return (
        <Card bordered={false} style={{ minWidth: "120px" }} bodyStyle={{ paddingTop: 0 }}>
            <Collapse
                activeKey={activeKey}
                onChange={setActiveKey}
                ghost
            >
                <Panel header={
                    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                        <p className="mb-0 fs-14  fw-semibold">Events</p>
                        <div className='mr-2'>
                            <Input
                                style={{ maxWidth: 250 }}
                                placeholder="Search Your Event..."
                                prefix={<SearchOutlined />}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                allowClear
                            />
                        </div>
                    </div>

                } key="1">

                    <div className="px-4" style={{ position: 'relative' }}>
                        <div
                            style={{
                                display: 'flex',
                                overflowX: 'auto',
                                gap: 16,
                                paddingBottom: 8,
                                WebkitOverflowScrolling: 'touch',
                                scrollSnapType: 'x mandatory'
                            }}
                            ref={scrollerRef}
                        >
                            {filteredEvent.map((item) => (
                                <div
                                    key={item.event_key}
                                    onClick={() => handleEventData(item)}
                                    style={{
                                        flex: '0 0 auto',
                                        width: getItemWidth(),
                                        scrollSnapAlign: 'start'
                                    }}
                                    className="px-2"
                                    data-pos-card-item="true"
                                >
                                    <PosEventCard
                                        productName={formattedProductName(item.name)}
                                        productImage={item?.event_media?.thumbnail || ''}
                                        id={item.event_key}
                                        productRating="3.5"
                                        statusColor="primary"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Navigation buttons */}
                        <Button
                            type="default"
                            // shape="circle"
                            icon={<LeftOutlined />}
                            onClick={() => scrollByCards(-1)}
                            className="border-0"
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: '50%',
                                border: 'none',
                                transform: 'translate(0%, -50%)',
                                zIndex: 1
                            }}
                        />
                        <Button
                            type="default"
                            // shape="circle"
                            icon={<RightOutlined />}
                            onClick={() => scrollByCards(1)}
                            className='border-0'
                            style={{
                                position: 'absolute',
                                right: 0,
                                border: 'none',
                                top: '50%',
                                transform: 'translate(0%, -50%)',
                                zIndex: 1
                            }}
                        />
                    </div>
                </Panel>
            </Collapse>
        </Card>
    );
};

export default PosEvents;