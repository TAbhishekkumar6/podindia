import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FileText, Settings, LogOut, User, Package, AlertTriangle } from 'lucide-react';
import { supabase } from './lib/supabase';
import SubmissionForm from './components/SubmissionForm';
import AdminDashboard from './components/AdminDashboard';
import BulkTrackingUpdate from './components/BulkTrackingUpdate';
import WhatsAppSupport from './components/WhatsAppSupport';
import OrderTracking from './components/OrderTracking';
import Footer from './components/Footer';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      setLoginError('');
      const email = prompt('Email:');
      if (!email) return;
      
      const password = prompt('Password:');
      if (!password) return;

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        setLoginError(error.message);
        throw error;
      }

      if (!data.user) {
        setLoginError('No user data returned');
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Error:', error);
      setLoginError('Error signing in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Warning Banner */}
        <div className="bg-red-50 border-b border-red-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Providing false information or fake payment screenshots will result in strict legal action.
              </p>
            </div>
          </div>
        </div>

        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-2 py-2 text-gray-900">
                  <FileText className="h-6 w-6 mr-2" />
                  <span className="font-semibold">DehaPrintOnDemand</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/my-orders"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Package className="h-4 w-4 mr-2" />
                  My Orders
                </Link>
                <Link
                  to="/track"
                  className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  Track Order
                </Link>
                
                {/* Admin Controls */}
                <div className="flex items-center space-x-2">
                  {!user ? (
                    <button
                      onClick={handleSignIn}
                      className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Admin Login
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors duration-200"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {loginError && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{loginError}</span>
            </div>
          </div>
        )}

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<SubmissionForm />} />
            <Route path="/track" element={<OrderTracking />} />
            <Route path="/track/:orderId" element={<OrderTracking />} />
            <Route path="/my-orders" element={<OrderTracking showMyOrders={true} />} />
            <Route
              path="/admin/*"
              element={
                isLoading ? (
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : user ? (
                  <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/bulk-tracking" element={<BulkTrackingUpdate />} />
                  </Routes>
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
      <WhatsAppSupport />
    </BrowserRouter>
  );
}

export default App;