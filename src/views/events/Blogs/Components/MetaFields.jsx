import React, { useEffect, useState } from "react";
import { Form, Input, Select, Button, Tag, Space, Card, Typography, Divider } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import { useMyContext } from "Context/MyContextProvider";


const { TextArea } = Input;
const { Title } = Typography;


const MetaFields = ({ meta, onChange }) => {
  const { authToken, api } = useMyContext();
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategoryOptions, setSelectedCategoryOptions] = useState([]);
  const [tagInput, setTagInput] = useState("");


  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !meta.tags.includes(newTag)) {
      const updatedTags = [...meta.tags, newTag];
      onChange("tags", updatedTags);
    }
    setTagInput("");
  };


  const getCategories = async () => {
    try {
      const response = await axios.get(`${api}category`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });


      if (!response.data.status) {
        throw new Error(response.data.message || "Failed to fetch categories");
      }


      const fetchedOptions = response.data.categoryData.map((cat) => ({
        label: cat.title,
        value: cat.id,
      }));


      setCategoryOptions(fetchedOptions);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };


  useEffect(() => {
    getCategories();
  }, []);


  // ✅ Sync meta.categories with selectedCategoryOptions
  useEffect(() => {
    if (categoryOptions.length > 0 && meta?.categories?.length > 0) {
      // ✅ Extract IDs from meta.categories (handle both object and number formats)
      const categoryIds = meta.categories.map(cat => {
        // If it's an object with id property, extract the id
        if (typeof cat === 'object' && cat !== null && 'id' in cat) {
          return cat.id;
        }
        // If it's already a number, return it as is
        return cat;
      });

      const areEqual = JSON.stringify(categoryIds.sort()) === JSON.stringify(selectedCategoryOptions.sort());

      if (!areEqual) {
        setSelectedCategoryOptions(categoryIds);
      }
    } else if (meta?.categories?.length === 0 && selectedCategoryOptions.length > 0) {
      setSelectedCategoryOptions([]);
    }
  }, [meta?.categories, categoryOptions]);


  const removeTag = (tagToRemove) => {
    const newTags = meta.tags.filter((tag) => tag !== tagToRemove);
    onChange("tags", newTags);
  };


  return (
    <>
      <Form.Item label="Select Categories">
        <Select
          mode="multiple"
          options={categoryOptions}
          value={selectedCategoryOptions}
          onChange={(selectedValues) => {
            setSelectedCategoryOptions(selectedValues);
            onChange("categories", selectedValues);
          }}
          placeholder="Choose categories..."
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>

      <div className="mb-3 border rounded-5 p-3">
        <Title level={5} style={{ color: '#1890ff', marginBottom: 16 }}>
          SEO Meta Fields
        </Title>


        <Form.Item label="Meta Title">
          <Input
            value={meta?.metaTitle || ""}
            onChange={(e) => onChange("metaTitle", e.target.value)}
            placeholder="Enter Meta Title"
          />
        </Form.Item>


        <Form.Item label="Meta Description">
          <TextArea
            rows={2}
            value={meta?.metaDescription || ""}
            onChange={(e) => onChange("metaDescription", e.target.value)}
            placeholder="Enter meta description for SEO"
          />
        </Form.Item>


        <Form.Item label="Meta Keywords (comma separated)">
          <Input
            value={meta?.metaKeywords || ""}
            onChange={(e) => onChange("metaKeywords", e.target.value)}
            placeholder="blog, react, seo, nextjs"
          />
        </Form.Item>


        <Divider />


        <Form.Item label="Tags">
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="Enter tag and press Add"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onPressEnter={(e) => {
                e.preventDefault();
                handleAddTag();
              }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddTag}
            >
              Add
            </Button>
          </Space.Compact>


          <div style={{ marginTop: 8 }}>
            {meta?.tags?.map((tag, index) => (
              <Tag
                key={index}
                closable
                onClose={() => removeTag(tag)}
                style={{ marginBottom: 8 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        </Form.Item>
      </div>
    </>
  );
};


export default MetaFields;
