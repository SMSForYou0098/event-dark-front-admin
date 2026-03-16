// Impersonate.jsx
import React from 'react';
import { Button, message } from 'antd'; // <-- use message instead of notification
import { useDispatch, useSelector } from 'react-redux';
import { authenticated, logout, updateUser } from 'store/slices/authSlice';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { UserDeleteOutlined } from "@ant-design/icons";
import api from 'auth/FetchInterceptor';
/**
 * Helpers
 */
const extractBody = (res) => {
  if (!res) return null;
  return (typeof res === 'object' && 'data' in res) ? res.data : res;
};


const Impersonate = () => {
  const navigate = useNavigate()
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const { session_id, auth_session } = auth;

  // ✅ FIXED: React Query v5 syntax - pass object with mutationFn
  const revertMutation = useMutation({
    mutationFn: async () => {
      // Validate session before calling
      if (!session_id || !auth_session) {
        const err = new Error('Session expired. Please login again.');
        throw err;
      }

      // call API - note: api interceptor may return body or full response
      const res = await api.post('/revert-impersonation', { session_id });
      const body = extractBody(res) ?? {};

      // If your backend returns status:false on failure, check and throw
      if (typeof body.status !== 'undefined' && !body.status) {
        throw new Error(body.message || body.error || 'Failed to revert impersonation');
      }

      // expected to return token/user etc on success
      return body;
    },
    onSuccess: (data) => {
      // Normalize data and update auth
      dispatch(
        authenticated({
          token: data.token,
          user: data.user,
          session_id: data.session_id ?? session_id,
          auth_session: data.auth_session ?? auth_session,
          isImpersonating: false,
        })
      );
      dispatch(updateUser(data.user));
      message.success('Reverted back to original user');

      // refresh relevant queries so UI reflects original user
      queryClient.invalidateQueries(); // or narrow to specific queries

      // navigate to desired page
      navigate('/dashboard/organizers');
    },
    onError: () => {
      // If session expired, force logout and redirect
      dispatch(logout());

      // Show error to user
      message.error('Session expired. Please login again.');
    },
  });

  const handleRevert = () => {
    // Optionally ask for confirmation here
    // if (!window.confirm('Revert to original admin user?')) return;
    revertMutation.mutate();
  };

  return (
    <div>
      {auth?.isImpersonating && (
        <Button
          className=""
          onClick={handleRevert}
          icon={<UserDeleteOutlined />}
          disabled={revertMutation.isPending} // ✅ Changed from isLoading to isPending
        >
          {revertMutation.isPending ? 'Reverting...' : 'Revert to Admin'}
        </Button>
      )}
    </div>
  );
};

export default Impersonate;