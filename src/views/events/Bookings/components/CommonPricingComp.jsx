import React from 'react';
import { Typography } from 'antd';
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
                        <Text type="secondary" delete >
                            {currencySymbol}{normalPrice}
                        </Text>
                    )}
                    {' '}

                    {/* Show sale price */}
                    {discountPrice === 0 ? (
                        <strong>Free</strong>
                    ) : (
                        <Text strong style={{fontSize:'1rem'}}>
                            {currencySymbol}{discountPrice}
                        </Text>
                    )}
                </>
            ) : (
                <>
                    {/* Show normal price */}
                    {normalPrice === 0 ? (
                        <strong>Free</strong>
                    ) : (
                        <strong style={{fontSize:'1rem'}}>{currencySymbol}{normalPrice}</strong>
                    )}
                </>
            )}
        </>
    );
};

export default CommonPricingComp;