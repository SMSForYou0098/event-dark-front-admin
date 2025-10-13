import { Empty, Select, Typography } from 'antd'
import { useMyContext } from 'Context/MyContextProvider';
import React, { useMemo, useState } from 'react'
const { Text } = Typography;
const UsersWithoutOption = ({selectedUserId , setSelectedUserId}) => {
     const {UserList} = useMyContext()
      const [searchValue, setSearchValue] = useState('');
      
        // Get selected user details
        const selectedUser = useMemo(() => {
            return userOptions.find(user => user.value === selectedUserId);
        }, [userOptions, selectedUserId]);
        // Transform UserList to options
    const userOptions = useMemo(() => {
        if (!UserList) return [];
        return UserList.map((user) => ({
            value: user.value,
            label: user.label,
            email: user.email,
            number: user.number,
        }));
    }, [UserList]);

    // Filter options based on search
    const filterOption = (input, option) => {
        if (!input) return true;
        const searchLower = input.toLowerCase();
        const label = option?.label?.toLowerCase() || '';
        const email = option?.email?.toLowerCase() || '';
        const number = option?.number?.toString().toLowerCase() || '';

        return (
            label.includes(searchLower) ||
            email.includes(searchLower) ||
            number.includes(searchLower)
        );
    };

    const filteredOptions = useMemo(() => {
        if (!searchValue || searchValue.length === 0) return [];
        return userOptions.filter((option) => filterOption(searchValue, option));
    }, [userOptions, searchValue]);
    return (
        <div>
            <Select
                showSearch
                size="large"
                className="w-100 mb-2"
                placeholder="Search by name, email, or mobile number"
                options={filteredOptions}
                onSearch={setSearchValue}
                onChange={setSelectedUserId}
                value={selectedUserId}
                filterOption={false}
                notFoundContent={
                    searchValue ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description="No user found"
                        />
                    ) : (
                        <div className="text-center text-muted p-3">
                            Start typing to search users
                        </div>
                    )
                }
                allowClear
            />
            <Text type="secondary" className="d-block">
                User can search via name, mobile number or email
            </Text>
        </div>
    )
}

export default UsersWithoutOption
