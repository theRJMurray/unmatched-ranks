'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Unmatched Ranks
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/inbox" className="text-indigo-600 hover:text-indigo-500">
                Inbox
              </Link>
              <Link href="/leaderboard" className="text-indigo-600 hover:text-indigo-500">
                Leaderboard
              </Link>
              <span className="text-gray-700">
                Welcome, {user.username}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Lifetime ELO
                  </h3>
                  <p className="text-3xl font-bold text-indigo-600">
                    {Math.round(user.eloLifetime)}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Seasonal ELO
                  </h3>
                  <p className="text-3xl font-bold text-green-600">
                    {Math.round(user.eloSeasonal)}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Role
                  </h3>
                  <p className="text-lg font-semibold text-gray-700 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
              
              <div className="mt-8">
                <p className="text-gray-600 mb-4">
                  More features coming soon! This is a protected route that requires authentication.
                </p>
                {user.role === 'admin' && (
                  <div>
                    <Link
                      href="/admin"
                      className="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700"
                    >
                      Admin Dashboard
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
