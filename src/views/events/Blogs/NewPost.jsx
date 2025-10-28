import React, { useState } from 'react';
import axios from 'axios';
import { useMyContext } from '../../../Context/MyContextProvider';
import BlogPostEditor from './Components/BlogPostEditor';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from 'auth/FetchInterceptor';

const NewPost = () => {
  const navigate = useNavigate();
  const [meta, setMeta] = useState({
    metaTitle: '',
    canonicalUrl: '',
    metaDescription: '',
    metaKeywords: '',
    metaRobots: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: null,
    categories: [],
    tags: [],
  });

  // Create blog post mutation
  const createMutation = useMutation({
    mutationFn: async ({ title, content, thumbnail, status }) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('status', status);

      // Normalize meta before appending
      const normalizedMeta = { ...meta };
      
      // ✅ Ensure categories contains only IDs
      if (Array.isArray(normalizedMeta.categories)) {
        normalizedMeta.categories = normalizedMeta.categories.map(cat =>
          typeof cat === 'object' && cat.id ? cat.id : cat
        );
      }

      // ✅ Append meta fields to formData
      Object.entries(normalizedMeta).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value)); // Store arrays as JSON
          } else if (key === 'ogImage' && typeof value === 'object') {
            formData.append(key, value); // File or Blob
          } else {
            formData.append(key, value); // String, number, etc.
          }
        }
      });

      // ✅ Append thumbnail if available
      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const response = await api.post(`blog-store`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response;
    },
    onSuccess: (data) => {
      message.success(data?.message || 'Blog saved successfully!');
      navigate(-1);
    },
    onError: (error) => {
      console.error('❌ Error saving blog post:', error);
      message.error(error.response?.data?.message || 'Failed to save blog post');
    },
  });

  const handleSave = (data) => {
    createMutation.mutate(data);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div>
      <BlogPostEditor
        initialTitle=""
        initialContent=""
        initialFeaturedImage={null}
        initialStatus={false}
        isEditing={false}
        onSave={handleSave}
        onCancel={handleCancel}
        metaFields={meta}
        setMetaFields={setMeta}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

export default NewPost;