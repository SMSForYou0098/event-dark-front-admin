import React from 'react';
import { Tag, Typography } from 'antd';
import { useMyContext } from '../../../../Context/MyContextProvider';

const { Text } = Typography;

const CommonPricingComp = ({ currency, isSale, price, salePrice }) => {
    const { getCurrencySymbol } = useMyContext();

    const currencySymbol = getCurrencySymbol(currency);

    // Check if price is free (0 or '0' or null/undefined)
    const normalPrice = Number(price) || 0;
    const discountPrice = Number(salePrice) || 0;

    return (
        <>
            {isSale === 1 ? (
                <>
                    {/* Show original price (could be free or paid) */}
                    {normalPrice === 0 ? (
                        <Text type="secondary" delete>
                            Free
                        </Text>
                    ) : (
                        <Text type="secondary" delete>
                            {currencySymbol}{normalPrice}
                        </Text>
                    )}
                    {' '}
                    
                    {/* Show sale price */}
                    {discountPrice === 0 ? (
                        <Tag color="green">
                             <strong>Free</strong>
                        </Tag>
                    ) : (
                        <Tag color="blue-inverse">
                            <Text strong>
                                {currencySymbol}{discountPrice}
                            </Text>
                        </Tag>
                    )}
                </>
            ) : (
                <>
                    {/* Show normal price */}
                    {normalPrice === 0 ? (
                        <Tag color="green">
                            <strong>Free</strong>
                        </Tag>
                    ) : (
                        <Tag color="blue-inverse">
                            <strong>{currencySymbol}{normalPrice}</strong>
                        </Tag>
                    )}
                </>
            )}
        </>
    );
};

export default CommonPricingComp;