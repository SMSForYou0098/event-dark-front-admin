import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import { Spin } from 'antd';
import axios from 'axios';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useMyContext } from 'Context/MyContextProvider';
import PosEventCard from './PosEventCard';

const PosEvents = ({ handleButtonClick, searchTerm }) => {
    const { api, authToken, UserData, truncateString } = useMyContext();
    
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            if (!UserData?.id) return;
            
            setIsLoading(true);
            setIsError(false);
            
            try {
                const res = await axios.get(`${api}pos-events/${UserData?.id}`, {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                });
                setEvents(res.data.events || []);
            } catch (error) {
                console.error('Error fetching events:', error);
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEvents();
    }, [api, authToken, UserData?.id]);

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
        handleButtonClick(event?.tickets);
    };

    const settings = {
        dots: false,
        infinite: false,
        draggable: false,
        speed: 500,
        slidesToShow: 6,
        slidesToScroll: 3,
        arrows: true,
        responsive: [
            {
                breakpoint: 1200,
                settings: { slidesToShow: 3, slidesToScroll: 3 },
            },
            {
                breakpoint: 768,
                settings: { slidesToShow: 2, slidesToScroll: 2 },
            },
            {
                breakpoint: 576,
                settings: { slidesToShow: 1, slidesToScroll: 1 },
            },
        ],
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '10vh' }}>
                <Spin tip="Loading events..." size="large" />
            </div>
        );
    }

    if (isError) {
        return <div className="text-danger text-center">Failed to load events.</div>;
    }

    return (
        <div className="slider-circle-btn px-4">
            <Slider {...settings} key={filteredEvent.length}>
                {filteredEvent.map(item => (
                    <div key={item.event_key}>
                        <div className="px-2" onClick={() => handleEventData(item)}>
                            <PosEventCard
                                productName={formattedProductName(item.name)}
                                productImage={item?.thumbnail || ''}
                                id={item.event_key}
                                productRating="3.5"
                                statusColor="primary"
                            />
                        </div>
                    </div>
                ))}
            </Slider>
        </div>
    );
};

export default PosEvents;