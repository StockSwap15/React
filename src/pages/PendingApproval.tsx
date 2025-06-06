import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { signOut } from '../lib/auth';

export default function PendingApproval() {
  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
      <div className="text-center">
        <Clock className="w-16 h-16 text-blue-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Pending Approval</h2>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <p className="text-blue-800 mb-4">
            Thank you for registering! Your account is currently pending approval from an administrator.
          </p>
          <p className="text-blue-700">
            You will receive an email notification once your account has been approved.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200"
        >
          <LogOut className="h-5 w-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}