import { Form, Select } from "antd"
import { useMyContext } from "Context/MyContextProvider";

export const OrganisationList = () => {
    const { OrganizerList } = useMyContext();
    return (
        <Form.Item
            label="Organization"
            name="org_id"
            rules={[{ required: true, message: 'Please select organization' }]}
        >
            <Select
                showSearch
                placeholder="Select organization"
                options={OrganizerList?.map(org => ({
                    value: String(org.value),
                    label: `${org.organisation} (${org.label})`,
                }))}
                optionFilterProp="label"
            />
        </Form.Item>
    )
}