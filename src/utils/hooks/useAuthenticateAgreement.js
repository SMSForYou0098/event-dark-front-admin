import { useMutation } from "@tanstack/react-query";
import api from "auth/FetchInterceptor";

const useAuthenticateAgreement = (id, options = {}) => {
  return useMutation({
    mutationFn: async (credentials) => {
      const response = await api.post(`/agreement/preview/${id}`, {
        name: credentials.name,
        password: credentials.password
      });
      return response.data;
    },
    ...options
  });
};

export default useAuthenticateAgreement;
