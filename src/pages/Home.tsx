import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthProvider';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ShieldCheck, Search, RefreshCw, MessageSquare } from 'lucide-react';

const Home = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl text-white">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          OEM Powersports Dealer Network
        </h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          For verified OEM powersports dealers to share and view inventory for potential transfers.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <>
              <Link
                to="/inventory"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                View Inventory
              </Link>
              <Link
                to="/iso"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
              >
                Search Inventory
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
              >
                Request Access
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <Search className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Inventory Search</h3>
            <p className="text-gray-600">
              Search available inventory across the dealer network to find the vehicles you need.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Transfer Coordination</h3>
            <p className="text-gray-600">
              Coordinate inventory transfers efficiently between authorized dealers.
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-3">Secure Communication</h3>
            <p className="text-gray-600">
              Communicate directly with other dealers through our secure messaging system.
            </p>
          </div>
        </div>
      </section>

      {/* Access Section */}
      <section className="text-center p-6 bg-white rounded-lg shadow-md">
        <ShieldCheck className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-3">Authorized Access Only</h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Our platform is exclusively available to verified OEM powersports dealers.
          All users must be verified before accessing the dealer network.
        </p>
        {!user && (
          <Link
            to="/register"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Request Dealer Access
          </Link>
        )}
      </section>
    </div>
  );
};

export default Home;