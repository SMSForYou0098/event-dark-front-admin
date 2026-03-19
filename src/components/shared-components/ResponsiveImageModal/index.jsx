import React from 'react';
import { Modal, Drawer } from 'antd';
import { useMyContext } from 'Context/MyContextProvider';

const ResponsiveImageModal = ({ isOpen, onClose, imageUrl, width = 450, alwaysModal = false }) => {
    const { isMobile } = useMyContext();

    const imgContent = (
        <div style={{ padding: 0, overflow: 'hidden', borderRadius: isMobile ? '16px 16px 0 0' : '8px' }}>
            <img
                src={imageUrl}
                alt="Notification"
                style={{ width: '100%', height: 'auto', display: 'block' }}
            />
        </div>
    );

    if (isMobile && !alwaysModal) {
        return (
            <Drawer
                placement="bottom"
                open={isOpen}
                onClose={onClose}
                closable={false}
                height="auto"
                bodyStyle={{ padding: 0 }}
                zIndex={2000}
            >
                {imgContent}
            </Drawer>
        );
    }

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            closable={false}
            width={width}
            centered
            bodyStyle={{ padding: 0 }}
            zIndex={2000}
        >
            {imgContent}
        </Modal>
    );
};

export default ResponsiveImageModal;
