import React from 'react';
import { Button } from 'antd';
import Flex from 'components/shared-components/Flex';

/**
 * Reusable Form Action Buttons Component
 * Eliminates duplicate Discard/Submit button patterns
 */
const FormActionButtons = ({
    mode = 'create',
    isSubmitting = false,
    onDiscard,
    submitText,
    discardText = 'Discard',
}) => {
    const defaultSubmitText = mode === 'create' ? 'Create' : 'Update';

    return (
        <Flex justifyContent="end">
            <Button className="mr-2" onClick={onDiscard}>
                {discardText}
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
                {submitText || defaultSubmitText}
            </Button>
        </Flex>
    );
};

export default FormActionButtons;
