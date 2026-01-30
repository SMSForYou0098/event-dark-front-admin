import React, { useState, useEffect, useRef } from 'react';
import { Card, Collapse, Input, Grid, Button, Badge } from 'antd';
import { useMyContext } from 'Context/MyContextProvider';
import PosEventCard from './PosEventCard';
import { SearchOutlined, LeftOutlined, RightOutlined, CheckCircleFilled } from "@ant-design/icons";
import Loader from 'utils/Loader';
import { useQuery } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

const { Panel } = Collapse;

/**
 * PosEvents Component
 * @param {string} type - Type of events to fetch ('pos' default)
 * @param {function} handleButtonClick - Callback when event(s) are selected
 *   - Single mode: receives (event, tickets)
 *   - Multiple mode: receives (selectedEvents[], selectedEventIds[])
 * @param {boolean} isScanner - If true, auto-selects first event and hides UI
 * @param {boolean} multiple - If true, allows multiple event selection
 */
const PosEvents = ({ type = 'pos', handleButtonClick, isScanner, multiple = false }) => {
    const { UserData, truncateString } = useMyContext();
    const screens = Grid.useBreakpoint();
    const scrollerRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeKey, setActiveKey] = useState(['1']);
    const hasAutoSelectedRef = useRef(false);

    // State for multiple selection mode
    const [selectedEvents, setSelectedEvents] = useState([]);

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

    // Auto-select first event for scanner users (single mode only)
    useEffect(() => {
        if (isScanner && events.length > 0 && !hasAutoSelectedRef.current && !multiple) {
            hasAutoSelectedRef.current = true;
            const firstEvent = events[0];
            handleButtonClick(firstEvent, firstEvent?.tickets);
        }
    }, [isScanner, events, handleButtonClick, multiple]);

    const filteredEvent = searchTerm
        ? events.filter(event =>
            event.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : events;

    const formattedProductName = (name) => {
        const updated = name?.replace(' ', "-");
        return truncateString(updated);
    };

    // Check if an event is selected (for multiple mode)
    const isEventSelected = (eventId) => {
        return selectedEvents.some(e => e.id === eventId);
    };

    // Handle event click
    const handleEventData = (event) => {
        if (multiple) {
            // Toggle selection in multiple mode
            const isAlreadySelected = selectedEvents.some(e => e.id === event.id);
            let newSelection;
            if (isAlreadySelected) {
                // Remove from selection
                newSelection = selectedEvents.filter(e => e.id !== event.id);
            } else {
                // Add to selection
                newSelection = [...selectedEvents, event];
            }
            setSelectedEvents(newSelection);
            // Notify parent with updated selection
            const newEventIds = newSelection.map(e => e.id);
            handleButtonClick(newSelection, newEventIds);
        } else {
            // Single selection mode - original behavior
            handleButtonClick(event, event?.tickets);
            setActiveKey(null);
        }
    };

    // Clear all selections (for multiple mode)
    const handleClearSelection = () => {
        setSelectedEvents([]);
        handleButtonClick([], []);
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
    if (isScanner && !multiple) {
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
                        <div className="d-flex align-items-center gap-2">
                            <p className="mb-0 fs-14 fw-semibold">Events</p>
                            {multiple && selectedEvents.length > 0 && (
                                <Badge count={selectedEvents.length} style={{ backgroundColor: '#52c41a' }} />
                            )}
                        </div>
                        <div className='d-flex align-items-center gap-2 mr-2'>
                            {multiple && selectedEvents.length > 0 && (
                                <Button size="small" onClick={handleClearSelection}>
                                    Clear Selection
                                </Button>
                            )}
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
                            {filteredEvent.map((item) => {
                                const isSelected = multiple && isEventSelected(item.id);
                                return (
                                    <div
                                        key={item.event_key}
                                        onClick={() => handleEventData(item)}
                                        style={{
                                            flex: '0 0 auto',
                                            width: getItemWidth(),
                                            scrollSnapAlign: 'start',
                                            position: 'relative',
                                            cursor: 'pointer'
                                        }}
                                        className="px-2"
                                        data-pos-card-item="true"
                                    >
                                        {/* Selection indicator for multiple mode */}
                                        {isSelected && (
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 16,
                                                    zIndex: 2,
                                                    borderRadius: '50%',
                                                    padding: 2
                                                }}
                                            >
                                                <CheckCircleFilled style={{ color: '#fff', fontSize: 20 }} />
                                            </div>
                                        )}
                                        <div style={{
                                            border: isSelected ? '2px solid #52c41a' : '2px solid transparent',
                                            borderRadius: 8,
                                            transition: 'border-color 0.2s ease'
                                        }}>
                                            <PosEventCard
                                                productName={formattedProductName(item.name)}
                                                productImage={item?.event_media?.thumbnail || ''}
                                                id={item.event_key}
                                                productRating="3.5"
                                                statusColor="primary"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
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