import React from 'react';
import { Tag, Typography } from 'antd';
import { useMyContext } from '../../../../Context/MyContextProvider';

const { Text } = Typography;

const CommonPricingComp = ({ currency, isSale, price, salePrice }) => {
    const { getCurrencySymbol } = useMyContext();

    const currencySymbol = getCurrencySymbol(currency);

    return (
        <>
            {isSale === 1 ? (
                <>
                    <Text type="secondary" delete>
                        {currencySymbol}{price}
                    </Text>{' '}
                    <Tag color="blue-inverse">
                        <Text strong>
                            {currencySymbol}{salePrice}
                        </Text>
                    </Tag>
                </>
            ) : (
                <Tag color="blue-inverse">
                    <strong>{currencySymbol}{price}</strong>
                </Tag>
            )}
        </>
    );
};

export default CommonPricingComp;
