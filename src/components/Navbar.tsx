import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Menu, X, Bell, RotateCcw, MessageSquare } from 'lucide-react';
import { useAuth } from '../lib/AuthProvider';
import { signOut } from '../lib/auth';
import { useNotifications } from '../hooks/useNotifications';
import ChatNotificationBadge from './ChatNotificationBadge';

const Navbar: React.FC = () => {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { unreadCount: notificationCount } = useNotifications(user?.id, {
    fetchOnMount: true,
    subscribeToChanges: true
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      navigate('/');
    }
  };

  const closeMenu = () => setIsMenuOpen(false);

  const showProtectedNav = !loading && user && profile?.role !== 'pending';
  const isApprovedUser = profile?.role === 'dealer' || profile?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="container mx-auto h-16">
        <div className="flex justify-between items-center h-full px-4">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <div className="relative">
              <RotateCcw className="h-8 w-8 text-blue-600 transform -rotate-45" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent rounded-full animate-pulse"></div>
            </div>
            <span className="text-xl font-bold text-gray-800">StockSwap</span>
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-gray-600" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600" />
            )}
          </button>

          <div className="hidden md:flex items-center space-x-6">
            {!loading && (
              <>
                {showProtectedNav ? (
                  <div className="flex items-center space-x-6">
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center space-x-1 text-sm text-orange-700 hover:text-orange-800 h-10"
                      >
                        <Shield className="h-5 w-5" />
                        <span>Admin</span>
                      </Link>
                    )}
                    {isApprovedUser && (
                      <>
                        <Link 
                          to="/inventory" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 h-10"
                        >
                          Available Vehicles
                        </Link>
                        <Link 
                          to="/iso" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 h-10"
                        >
                          Vehicle Requests
                        </Link>
                        <Link 
                          to="/my-listings" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 h-10"
                        >
                          My Listings
                        </Link>
                        <Link 
                          to="/chat" 
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 h-10 relative"
                        >
                          <ChatNotificationBadge />
                          <span>Messages</span>
                        </Link>
                        <Link 
                          to="/notifications" 
                          className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 h-10 relative"
                        >
                          <Bell className="h-5 w-5" />
                          <span>Notifications</span>
                          {notificationCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/profile" 
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 h-10"
                    >
                      <User className="h-5 w-5" />
                      <span>{profile?.dealer_name || profile?.email || 'Profile'}</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-blue-600 h-10"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-6">
                    <Link 
                      to="/login" 
                      className="flex items-center text-sm text-gray-600 hover:text-blue-600 h-10"
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      className="flex items-center text-sm bg-blue-600 text-white px-4 h-10 rounded-lg hover:bg-blue-700"
                    >
                      Request Access
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} absolute top-16 left-0 right-0 bg-white shadow-lg`}>
          <div className="flex flex-col space-y-4 p-4">
            {!loading && (
              <>
                {showProtectedNav ? (
                  <>
                    {isAdmin && (
                      <Link 
                        to="/admin" 
                        className="flex items-center space-x-2 text-sm text-orange-700 hover:text-orange-800 p-2"
                        onClick={closeMenu}
                      >
                        <Shield className="h-5 w-5" />
                        <span>Admin</span>
                      </Link>
                    )}
                    {isApprovedUser && (
                      <>
                        <Link 
                          to="/inventory" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 p-2"
                          onClick={closeMenu}
                        >
                          Available Vehicles
                        </Link>
                        <Link 
                          to="/iso" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 p-2"
                          onClick={closeMenu}
                        >
                          Vehicle Requests
                        </Link>
                        <Link 
                          to="/my-listings" 
                          className="flex items-center text-sm text-gray-600 hover:text-blue-600 p-2"
                          onClick={closeMenu}
                        >
                          My Listings
                        </Link>
                        <Link 
                          to="/chat" 
                          className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 p-2"
                          onClick={closeMenu}
                        >
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-5 w-5" />
                            <span>Messages</span>
                          </div>
                          <ChatNotificationBadge />
                        </Link>
                        <Link 
                          to="/notifications" 
                          className="flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 p-2"
                          onClick={closeMenu}
                        >
                          <div className="flex items-center space-x-2">
                            <Bell className="h-5 w-5" />
                            <span>Notifications</span>
                          </div>
                          {notificationCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {notificationCount > 99 ? '99+' : notificationCount}
                            </span>
                          )}
                        </Link>
                      </>
                    )}
                    <Link 
                      to="/profile" 
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 p-2"
                      onClick={closeMenu}
                    >
                      <User className="h-5 w-5" />
                      <span>{profile?.dealer_name || profile?.email || 'Profile'}</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        closeMenu();
                      }}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 w-full text-left p-2"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="flex items-center text-sm text-gray-600 hover:text-blue-600 p-2"
                      onClick={closeMenu}
                    >
                      Sign In
                    </Link>
                    <Link 
                      to="/register" 
                      className="flex items-center text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mx-2"
                      onClick={closeMenu}
                    >
                      Request Access
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;