import React, { memo, useState, useMemo, useEffect, useRef } from "react";
import axios from "axios";
import { Code } from "lucide-react";
import { Button, Modal, Tooltip, Alert, Input } from "antd";
import { useMyContext } from "Context/MyContextProvider";
import usePermission from "utils/hooks/usePermission";
import DataTable from "../common/DataTable";
import { useQuery } from "@tanstack/react-query";
import { SearchOutlined } from '@ant-design/icons';
const PaymentLogs = memo(() => {
    const {
        api,
        authToken,
        formatDateRange,
        ErrorAlert,
    } = useMyContext();
    const [dateRange, setDateRange] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalSearchText, setModalSearchText] = useState("");
    const preRef = useRef(null);
    const [selectedParams, setSelectedParams] = useState(null);
    const [searchText, setSearchText] = useState("");

    // Optimize GetBookings with better error handling and loading state
    const { data = [], loading, refetch, error } = useQuery({
        queryKey: ["paymentLogs", dateRange],
        queryFn: async () => {
            const queryParams = dateRange ? `?date=${dateRange}` : "";
            const url = `${api}payment-log/${queryParams}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (response.data.status) {
                return response.data.PaymentLog;
            }
            return [];
        },
        enabled: !!authToken, // Only run query if authToken exists
        staleTime: 5 * 60 * 1000, // 5 minutes
        onError: (error) => {
            ErrorAlert("Failed to fetch logs");
        },
    });

    // Handle date range change
    const handleDateRangeChange = (dates) => {
        if (dates && dates.length === 2) {
            const startDate = dates[0].format("YYYY-MM-DD");
            const endDate = dates[1].format("YYYY-MM-DD");
            setDateRange(`${startDate},${endDate}`);
        } else {
            setDateRange("");
        }
    };

    const handleShowModal = (params) => {
        setSelectedParams(params);
        setShowModal(true);
    };


    const columns = useMemo(() => {
        return [
            {
                title: "#",
                dataIndex: "id",
                key: "id",
                render: (text, record, index) => index + 1,
                width: 60,
                align: "center",
            },
            {
                title: "Amount",
                dataIndex: "amount",
                key: "amount",
                align: "center",
                sorter: (a, b) => parseFloat(a.amount) - parseFloat(b.amount),
            },
            {
                title: "Payment ID",
                dataIndex: "payment_id",
                key: "payment_id",
                render: (text) => formatDateRange(text),
                align: "center",
            },
            {
                title: "Session ID",
                dataIndex: "session_id",
                key: "session_id",
                align: "center",
                ellipsis: true,
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                align: "center",
                sorter: (a, b) => a.status.localeCompare(b.status),
            },
            {
                title: "Transaction ID",
                dataIndex: "txnid",
                key: "txnid",
                align: "center",
                ellipsis: true,
            },
            {
                title: "Action",
                key: "action",
                render: (text, row) => {
                    const isDisabled = row?.is_deleted === true || row?.status === "1";

                    return (
                        <div className="">
                            <Tooltip title="See Full Object">
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<Code size={16} />}
                                    onClick={() => handleShowModal(row)}
                                    disabled={isDisabled}
                                />
                            </Tooltip>
                        </div>
                    );
                },
                width: 100,
                align: "center",
            },
        ];
    }, [formatDateRange]);

    // Add this function to highlight matched text

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedParams(null);
        setModalSearchText(""); // Clear search on close
    };

    // Render JSON with search highlighting
    // Render JSON with search highlighting and unique IDs
    const renderHighlightedJSON = () => {
        if (!selectedParams) return "No parameters available";

        const jsonString = JSON.stringify(selectedParams, null, 2);

        if (!modalSearchText) return jsonString;

        // Escape special regex characters
        const escapedSearch = modalSearchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedSearch})`, 'gi');

        let matchIndex = 0;
        const highlighted = jsonString.replace(
            regex,
            (match) => {
                const id = matchIndex === 0 ? 'first-match' : `match-${matchIndex}`;
                matchIndex++;
                return `<mark id="${id}" style="background-color: var(--primary-color); color:var(--text-white);  padding: 0 2px; font-weight: 600;">${match}</mark>`;
            }
        );

        return highlighted;
    };

    // Scroll to first match when search changes
    useEffect(() => {
        if (modalSearchText && preRef.current) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                const firstMatch = document.getElementById('first-match');
                if (firstMatch) {
                    firstMatch.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            }, 100);
        }
    }, [modalSearchText]);
    return (
        <>
            <Modal
                centered
                title="Payment Details"
                open={showModal}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Close
                    </Button>
                ]}
                width={1000}
            >
                <div className="mb-3 text-right">
                    {selectedParams && (
                        <Input
                            placeholder="Search in parameters..."
                            prefix={<SearchOutlined />}
                            value={modalSearchText}
                            onChange={(e) => setModalSearchText(e.target.value)}
                            style={{ width: 300 }}
                            allowClear
                            size="small"
                        />
                    )}
                </div>
                <div ref={preRef} style={{ maxHeight: "60vh", overflowY: "auto" }}>
                    {selectedParams ? (
                        <Alert
                            description={
                                <pre
                                    className="mb-0"
                                    style={{ fontSize: "0.9rem" }}
                                    dangerouslySetInnerHTML={{
                                        __html: renderHighlightedJSON()
                                    }}
                                />
                            }
                            type="info"
                        />
                    ) : (
                        <Alert
                            message="No parameters available"
                            type="warning"
                            showIcon
                        />
                    )}
                </div>
            </Modal>
            <DataTable
                title="Payment Logs"
                data={data}
                columns={columns}
                // Display controls
                showDateRange={true}
                showRefresh={true}
                showTotal={true}
                showAddButton={false} // hide default
                addButtonProps={null}
                // Date range
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                // Export functionality
                enableExport={true}
                exportRoute={"export-users"}
                ExportPermission={usePermission("View Payment Logs")}
                // Loading states
                loading={loading}
                error={error}
                // Refresh handler
                // Table customization
                tableProps={{
                    scroll: { x: 1500 },
                    size: "middle",
                }}
            />
        </>
    );
});

PaymentLogs.displayName = "PaymentLogs";
export default PaymentLogs;