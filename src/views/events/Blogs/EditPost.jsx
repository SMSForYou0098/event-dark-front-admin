import axios from 'axios';
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMyContext } from '../../../Context/MyContextProvider';
import { Spin, Alert, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import usePermission from 'utils/hooks/usePermission';
import BlogPostEditor from './Components/BlogPostEditor';
import api from 'auth/FetchInterceptor';
import Utils from 'utils';

const EditPost = () => {
  const { id } = useParams();
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

  const canView = usePermission('View Blog Post');

  // Fetch blog post data
  const { data: postData, isLoading, error, refetch } = useQuery({
    queryKey: ['blogPost', id],
    queryFn: async () => {
      const response = await api.get(`blog-show/${id}`);
      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to fetch blog post'));
      }
      if (response?.data) {
        const metaPayload = {
          metaTitle: response.data.meta_title || '',
          canonicalUrl: response.data.canonical_url || '',
          metaDescription: response.data.meta_description || '',
          metaKeywords: response.data.meta_keyword || '',
          metaRobots: response.data.meta_robots || '',
          ogTitle: response.data.og_title || '',
          ogDescription: response.data.og_description || '',
          ogImage: response.data.og_image || null,
          categories: response.categories || [],
          tags: response.data.tags || [],
        };
        setMeta(metaPayload);
        return response.data;
      }
      return null;
    },
    enabled: canView && !!id,
    onError: (err) => {
      message.error(Utils.getErrorMessage(err, 'Failed to fetch blog post.'));
    },
  });

  // Update blog post mutation
  const updateMutation = useMutation({
    mutationFn: async ({ title, content, thumbnail, status }) => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('status', status);

      const normalizedMeta = { ...meta };

      if (Array.isArray(normalizedMeta.categories)) {
        normalizedMeta.categories = normalizedMeta.categories.map((cat) =>
          typeof cat === 'object' && cat.id ? cat.id : cat
        );
      }

      Object.entries(normalizedMeta).forEach(([key, value]) => {
        if (
          value !== null &&
          value !== undefined &&
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else if (key === 'ogImage' && typeof value === 'object') {
            formData.append(key, value);
          } else {
            formData.append(key, value);
          }
        }
      });

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      const response = await api.post(`blog-update/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response?.status === false) {
        throw new Error(Utils.getErrorMessage(response, 'Failed to update post'));
      }

      return response;
    },
    onSuccess: (data) => {
      message.success(data.message || 'Blog updated successfully');
      navigate(-1);
      refetch();
    },
    onError: (error) => {
      console.error('❌ Error updating blog post:', error);
      message.error(Utils.getErrorMessage(error, 'Failed to update post'));
    },
  });

  const handleSave = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" tip="Loading blog post..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={Utils.getErrorMessage(error, 'Failed to fetch blog post.')}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div>
      <BlogPostEditor
        initialTitle={postData?.title}
        initialStatus={postData?.status}
        initialContent={postData?.content}
        initialFeaturedImage={postData?.thumbnail}
        isEditing={true}
        onSave={handleSave}
        onCancel={() => navigate(-1)}
        metaFields={meta}
        setMetaFields={setMeta}
      />
    </div>
  );
};

export default EditPost;
