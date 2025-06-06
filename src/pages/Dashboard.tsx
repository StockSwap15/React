import React from 'react';
import { LayoutDashboard, Package, Users, CreditCard } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <Package className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold">856</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <CreditCard className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-gray-600">Revenue</p>
              <p className="text-2xl font-semibold">$45,678</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <LayoutDashboard className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-gray-600">Categories</p>
              <p className="text-2xl font-semibold">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[
              { action: "New product added", time: "2 hours ago", status: "success" },
              { action: "Inventory updated", time: "4 hours ago", status: "info" },
              { action: "User registration", time: "6 hours ago", status: "success" },
              { action: "System maintenance", time: "1 day ago", status: "warning" }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.action}</p>
                  <p className="text-sm text-gray-500">{item.time}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  item.status === 'success' ? 'bg-green-100 text-green-800' :
                  item.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}