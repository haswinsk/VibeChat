import React from 'react';
import { Toaster, toast } from 'react-hot-toast';

// Helper functions for easy toast usage throughout the app
export const toastSuccess = (msg) => toast.success(msg);
export const toastError = (msg) => toast.error(msg);
export const toastInfo = (msg) => toast(msg);

// Global provider – place near the root of the component tree.
export const ToastProvider = ({ children }) => (
  <>
    {children}
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a202c',
          color: '#fff',
        },
      }}
    />
  </>
);
