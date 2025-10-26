'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

// Hardcoded Unmatched decks list
const UNMATCHED_DECKS = [
  'Sherlock Holmes', 'Alice Wonderland', 'Medusa', 'Beowulf', 'Sinbad', 
  'Robin Hood', 'King Arthur', 'Medea', 'Sun Wukong', 'Valhalla', 
  'Caesar', 'Hatshepsut', 'Rapunzel', 'Jungle Book', 'Nijinsky', 
  'Hemingway', 'Tesla', 'Buffalo Bill', 'Rosa Parks', 'Frida Kahlo', 
  'T.E. Lawrence', 'Grace O\'Malley', 'Cobble & Fog', 'Bruce Lee', 
  'Battle of Legends'
];

interface User {
  _id: string;
  id: string;
  username: string;
  email: string;
  role: 'user' | 'organizer' | 'admin';
  eloLifetime: number;
  eloSeasonal: number;
}

interface Match {
  _id: string;
  player1Id: { _id: string; username: string };
  player2Id: { _id: string; username: string };
  deck1: string;
  deck2: string;
  format: 'best-of-1' | 'best-of-3';
  winner: { _id: string; username: string } | null;
  status: 'Pending' | 'Completed' | 'Disputed';
  resolvedP1GamesWon: number | null;
  createdAt: string;
}

type ActiveTab = 'users' | 'matches' | 'tournaments';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMatchModal, setShowCreateMatchModal] = useState(false);
  const [createMatchData, setCreateMatchData] = useState({
    player1Id: '',
    player2Id: '',
    deck1: '',
    deck2: '',
    format: 'best-of-1' as 'best-of-1' | 'best-of-3'
  });
  const [matchFilter, setMatchFilter] = useState<'All' | 'Pending' | 'Disputed' | 'Completed'>('All');
  const [showResolveModal, setShowResolveModal] = useState<Match | null>(null);
  const [resolveData, setResolveData] = useState({
    p1GamesWon: 1,
    p2GamesWon: 0
  });

  useEffect(() => {
    console.log('Admin page - Current user:', user);
    if (!user) {
      console.log('No user found, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
    if (user.role !== 'admin') {
      console.log('User role is not admin:', user.role, 'redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
    console.log('User is admin, loading data');
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersRes, matchesRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/matches')
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData.matches);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        loadData(); // Reload data
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleCreateMatch = async () => {
    try {
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createMatchData)
      });

      if (response.ok) {
        setShowCreateMatchModal(false);
        setCreateMatchData({
          player1Id: '',
          player2Id: '',
          deck1: '',
          deck2: '',
          format: 'best-of-1'
        });
        loadData(); // Reload matches
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create match');
      }
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Failed to create match');
    }
  };

  const handleResolveDispute = async () => {
    if (!showResolveModal) return;

    try {
      // Determine winner based on games won
      const winnerId = resolveData.p1GamesWon > resolveData.p2GamesWon 
        ? showResolveModal.player1Id._id 
        : showResolveModal.player2Id._id;

      const response = await fetch(`/api/matches/${showResolveModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId: winnerId,
          resolvedP1GamesWon: resolveData.p1GamesWon,
          status: 'Completed'
        })
      });

      if (response.ok) {
        setShowResolveModal(null);
        setResolveData({ p1GamesWon: 1, p2GamesWon: 0 });
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to resolve dispute');
      }
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Admin Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Welcome, {user.username}
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
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'users'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Users
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('matches')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'matches'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Matches
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('tournaments')}
                  className={`w-full text-left px-3 py-2 rounded-md ${
                    activeTab === 'tournaments'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Tournaments
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading...</div>
            </div>
          ) : (
            <>
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Username
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Lifetime ELO
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Seasonal ELO
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user._id || user.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.username}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'organizer' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.round(user.eloLifetime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {Math.round(user.eloSeasonal)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user._id || user.id, e.target.value)}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                                disabled={user._id === user._id} // Can't change own role
                              >
                                <option value="user">User</option>
                                <option value="organizer">Organizer</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'matches' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Matches</h2>
                    <div className="flex space-x-4">
                      <select
                        value={matchFilter}
                        onChange={(e) => setMatchFilter(e.target.value as 'All' | 'Pending' | 'Disputed' | 'Completed')}
                        className="border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Disputed">Disputed</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        onClick={() => setShowCreateMatchModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                      >
                        Create Match
                      </button>
                    </div>
                  </div>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Player 1
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Player 2
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Format
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Winner
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matches
                          .filter(match => matchFilter === 'All' || match.status === matchFilter)
                          .map((match) => (
                          <tr key={match._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(match.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {match.player1Id.username} ({match.deck1})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {match.player2Id.username} ({match.deck2})
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {match.format}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {match.winner ? match.winner.username : 'Pending'}
                              {match.status === 'Completed' && match.resolvedP1GamesWon !== null && (
                                <div className="text-xs text-gray-400">
                                  {match.resolvedP1GamesWon}-{match.format === 'best-of-1' ? 1 - match.resolvedP1GamesWon : 2 - match.resolvedP1GamesWon}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  match.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                  match.status === 'Disputed' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {match.status}
                                </span>
                                {match.status === 'Disputed' && (
                                  <button
                                    onClick={() => {
                                      setShowResolveModal(match);
                                      setResolveData({ 
                                        p1GamesWon: match.format === 'best-of-1' ? 1 : 2,
                                        p2GamesWon: 0
                                      });
                                    }}
                                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                                  >
                                    Resolve
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'tournaments' && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Tournaments</h2>
                  <div className="bg-white shadow rounded-md p-6">
                    <p className="text-gray-500">Tournament management coming soon...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Create Match Modal */}
      {showCreateMatchModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Match</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Player 1</label>
                  <select
                    value={createMatchData.player1Id}
                    onChange={(e) => setCreateMatchData({...createMatchData, player1Id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Player 1</option>
                    {users.map((user) => (
                      <option key={user._id || user.id} value={user._id || user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Player 1 Deck</label>
                  <select
                    value={createMatchData.deck1}
                    onChange={(e) => setCreateMatchData({...createMatchData, deck1: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Deck</option>
                    {UNMATCHED_DECKS.map((deck) => (
                      <option key={deck} value={deck}>{deck}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Player 2</label>
                  <select
                    value={createMatchData.player2Id}
                    onChange={(e) => setCreateMatchData({...createMatchData, player2Id: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Player 2</option>
                    {users.filter(u => (u._id || u.id) !== createMatchData.player1Id).map((user) => (
                      <option key={user._id || user.id} value={user._id || user.id}>{user.username}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Player 2 Deck</label>
                  <select
                    value={createMatchData.deck2}
                    onChange={(e) => setCreateMatchData({...createMatchData, deck2: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select Deck</option>
                    {UNMATCHED_DECKS.map((deck) => (
                      <option key={deck} value={deck}>{deck}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Format</label>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="best-of-1"
                        checked={createMatchData.format === 'best-of-1'}
                        onChange={(e) => setCreateMatchData({...createMatchData, format: e.target.value as 'best-of-1' | 'best-of-3'})}
                        className="mr-2"
                      />
                      Best of 1
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="best-of-3"
                        checked={createMatchData.format === 'best-of-3'}
                        onChange={(e) => setCreateMatchData({...createMatchData, format: e.target.value as 'best-of-1' | 'best-of-3'})}
                        className="mr-2"
                      />
                      Best of 3
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateMatchModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateMatch}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create Match
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Dispute Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Resolve Dispute
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {showResolveModal.player1Id.username} vs {showResolveModal.player2Id.username}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games Won:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {showResolveModal.player1Id.username}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={showResolveModal.format === 'best-of-1' ? 1 : 2}
                      value={resolveData.p1GamesWon}
                      onChange={(e) => setResolveData({ ...resolveData, p1GamesWon: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {showResolveModal.player2Id.username}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={showResolveModal.format === 'best-of-1' ? 1 : 2}
                      value={resolveData.p2GamesWon}
                      onChange={(e) => setResolveData({ ...resolveData, p2GamesWon: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {showResolveModal.format === 'best-of-1' 
                    ? 'Winner needs 1 game' 
                    : 'Winner needs 2 games (best of 3)'
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Result: {resolveData.p1GamesWon}-{resolveData.p2GamesWon}
                  {resolveData.p1GamesWon > resolveData.p2GamesWon ? ` (${showResolveModal.player1Id.username} wins)` : 
                   resolveData.p2GamesWon > resolveData.p1GamesWon ? ` (${showResolveModal.player2Id.username} wins)` : 
                   ' (Tie - invalid)'}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowResolveModal(null);
                    setResolveData({ p1GamesWon: showResolveModal?.format === 'best-of-1' ? 1 : 2, p2GamesWon: 0 });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolveDispute}
                  disabled={resolveData.p1GamesWon === resolveData.p2GamesWon}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-gray-300"
                >
                  Resolve Dispute
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
