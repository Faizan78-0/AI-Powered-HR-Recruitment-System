"use strict";
import { create } from "zustand";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

/* ---------------- API URL ---------------- */

export const AUTH_URL =
  process.env.MODE === "development"
    ? "/api/auth/bx/"
    : "/api/auth/bx/";

axios.defaults.withCredentials = true;

/* ---------------- Types ---------------- */

interface User {
  role: string;
  _id?: string;
  Name: string;
  email: string;
  imageUrl?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  message: string | null;

  setIsLoading: (value: boolean) => void;

  signup: (
    email: string,
    password: string,
    Name: string,
    role: string,
    imageUrl?: string
  ) => Promise<void>;

  login: (email: string, password: string) => Promise<void>;

  logout: () => Promise<void>;

  verifyEmail: (code: string) => Promise<any>;

  userProfile: () => Promise<void>;

  forgotPassword: (email: string) => Promise<void>;

  updatePassword: (Token: string, password: string) => Promise<void>;

  uploadImage: (imageFile: File) => Promise<any>;
}

/* ---------------- Store ---------------- */

export const useAuthStore = create<AuthState>(
  (
    set: (arg0: {
      isLoading?: any;
      error?: any;
      user?: any;
      isAuthenticated?: boolean;
      isCheckingAuth?: boolean;
      message?: any;
    }) => void
  ) => ({
    user: null,
    isAuthenticated: false,
    error: null,
    isLoading: false,
    isCheckingAuth: true,
    message: null,

    setIsLoading: (value: any) => set({ isLoading: value }),

    signup: async (
      email: any,
      password: any,
      Name: any,
      imageUrl: any,
      role: any
    ) => {
      set({ isLoading: true, error: null });

      try {
        const response = await axios.post(`${AUTH_URL}/signup`, {
          Name,
          email,
          password,
          imageUrl,
          role,
        });

        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (err) {
        const error = err as AxiosError<any>;

        set({
          error: error.response?.data?.message || "Error signing up",
          isLoading: false,
        });

        throw error;
      }
    },

    login: async (email: any, password: any) => {
      set({ isLoading: true, error: null });

      try {
        const response = await axios.post(`${AUTH_URL}/login`, {
          email,
          password,
        });

        set({
          isAuthenticated: true,
          user: response.data.user,
          error: null,
          isLoading: false,
        });
      } catch (err) {
        const error = err as AxiosError<any>;

        toast.error(`User not found for using this ${email}`);

        set({
          error: error.response?.data?.message || "Error logging in",
          isLoading: false,
        });

        throw error;
      }
    },

    logout: async () => {
      set({ isLoading: true, error: null });

      try {
        await axios.post(`${AUTH_URL}/logout`);

        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      } catch (err) {
        set({ error: "Error logging out", isLoading: false });
        throw err;
      }
    },

    verifyEmail: async (code: any) => {
      set({ isLoading: true, error: null });

      try {
        const response = await axios.post(`${AUTH_URL}/verify-email`, { code });

        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
        });

        return response.data;
      } catch (err) {
        const error = err as AxiosError<any>;

        set({
          error: error.response?.data?.message || "Error verifying email",
          isLoading: false,
        });

        throw error;
      }
    },

    userProfile: async () => {
      set({ isCheckingAuth: true });
      try {
        // Use the absolute path from the root /api
        const response = await axios.get(`${AUTH_URL}/user-profile`, {
          withCredentials: true,
        });
        set({ user: response.data, isCheckingAuth: false });
      } catch (err) {
        set({ user: null, isCheckingAuth: false });
      }
    },

    forgotPassword: async (email: any) => {
      set({ isLoading: true, error: null });

      try {
        const response = await axios.post(`${AUTH_URL}/forgot-password`, {
          email,
        });

        set({
          message: response.data.message,
          isLoading: false,
        });
      } catch (error) {
        toast.error("User not found");

        set({
          isLoading: false,
        });

        throw error;
      }
    },

    updatePassword: async (token: string, password: string) => {
      set({ isLoading: true, error: null, message: null });

      try {
        // Change this: Send token in the body, not the URL
        const response = await axios.post(`${AUTH_URL}/updatePassword`, {
          token,
          password,
        });

        set({
          message: response.data.message,
          isLoading: false,
        });

        return response.data; // Return data so the component can handle success
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message || "Error resetting password";

        set({
          isLoading: false,
          error: errorMessage,
        });

        throw new Error(errorMessage); // Throw the actual message for the toast
      }
    },

    // Inside your Auth Store / API service
    // Inside useAuthStore
    uploadImage: async (imageFile) => {
      const formData = new FormData();
      formData.append("image", imageFile);
  
      try {
        const response = await axios.post(`${AUTH_URL}/upload-image`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } catch (error) {
        console.error("Error uploading image", error);
        throw error;
      }
    },
  })
);
