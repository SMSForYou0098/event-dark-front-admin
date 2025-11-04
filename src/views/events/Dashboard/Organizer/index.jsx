import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    UserOutlined,
    ShopOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import SelectableCardGroup from "views/events/common/SelectableCardGroup";

const OrgDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selected, setSelected] = useState("");

    const options = [
        {
            value: "agent",
            href: "/dashboard/agent", // Fixed: added leading slash
            title: "Agent Dashboard",
            description: "Manage your agents and sales.",
            icon: <UserOutlined />,
            navigation: true
        },
        {
            value: "pos",
            href: "/dashboard/pos", // Fixed: added leading slash
            title: "POS",
            description: "Access your point of sale system.",
            icon: <ShopOutlined />,
            navigation: true
        },
        {
            value: "sponsor",
            href: "/dashboard/sponsor", // Fixed: added leading slash
            title: "Sponsor",
            description: "Manage sponsorship and promotions.",
            icon: <TeamOutlined />,
            navigation: true
        },
    ];

    // Pre-select card based on current route
    useEffect(() => {
        const currentOption = options.find((opt) => opt.href === location.pathname);
        if (currentOption) setSelected(currentOption.value);
    }, [location.pathname]);

    // Handle card change
    const handleSelection = (value) => {
        setSelected(value);
        const selectedOption = options.find((opt) => opt.value === value);
        if (selectedOption?.navigation) {
            navigate(selectedOption.href);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h3 className="mb-4">Organization Dashboard</h3>
            <SelectableCardGroup
                options={options}
                value={selected}
                onChange={handleSelection}
                columns={3}
            />
        </div>
    );
};

export default OrgDashboard;