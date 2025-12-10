import React from 'react';
import { Alert, Drawer } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';

/**
 * Reusable Error Drawer Component
 * Displays error messages in a bottom drawer with auto-close functionality
 */
const ErrorDrawer = ({
    visible,
    message,
    onClose,
    autoCloseDuration = 3000,
    icon = '⚠️',
    backgroundColor = '#b51515',
    textColor = '#fff'
}) => {
    // Auto-close effect
    React.useEffect(() => {
        if (visible && autoCloseDuration > 0) {
            const timer = setTimeout(() => {
                onClose?.();
            }, autoCloseDuration);

            return () => clearTimeout(timer);
        }
    }, [visible, autoCloseDuration, onClose]);

    return (
        <Drawer
            placement="bottom"
            open={visible}
            onClose={onClose}
            closable={true}
            // closeIcon={<CloseCircleOutlined style={{ color: textColor, fontSize: '18px' }} />}
            height="auto"

            maskClosable={true}
        >
            <Alert
                description={
                    <>
                        {icon && <span style={{ fontSize: '20px' }}>{icon}</span>}
                        {message}</>
                }
                type="warning"
            />

        </Drawer>
    );
};

ErrorDrawer.propTypes = {
    visible: PropTypes.bool.isRequired,
    message: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    autoCloseDuration: PropTypes.number,
    icon: PropTypes.string,
    backgroundColor: PropTypes.string,
    textColor: PropTypes.string
};

export default ErrorDrawer;
