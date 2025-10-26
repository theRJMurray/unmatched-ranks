'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserProfile {
  id: string;
  username: string;
  eloLifetime: number;
  eloSeasonal: number;
  matchesPlayed: number;
  wins: number;
  winRate: string;
  role: string;
  createdAt: string;
}

interface Match {
  id: string;
  opponent: string;
  userDeck: string;
  opponentDeck: string;
  format: string;
  result: string;
  eloChange: string;
  date: string;
}

interface ELOHistoryPoint {
  date: string;
  elo: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [eloHistory, setEloHistory] = useState<ELOHistoryPoint[]>([]);
  const [eloType, setEloType] = useState<'lifetime' | 'seasonal'>('lifetime');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setButtonLoading = (key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  };

  const isButtonLoading = (key: string) => loadingStates[key] || false;

  const username = params.username as string;

  useEffect(() => {
    if (username) {
      loadProfileData();
    }
  }, [username, eloType]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [profileRes, historyRes] = await Promise.all([
        fetch(`/api/profiles/${username}?type=${eloType}`),
        fetch(`/api/profiles/${username}/history?type=${eloType}`)
      ]);

      if (profileRes.status === 404) {
        setError('User not found');
        return;
      }

      if (!profileRes.ok || !historyRes.ok) {
        throw new Error('Failed to load profile data');
      }

      const profileData = await profileRes.json();
      const historyData = await historyRes.json();

      setProfile(profileData.user);
      setRecentMatches(profileData.recentMatches);
      setEloHistory(historyData.history);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeData, setChallengeData] = useState({
    format: 'bo1' as 'bo1' | 'bo3',
    deck: ''
  });

  const UNMATCHED_DECKS = [
    'Sherlock Holmes', 'Alice Wonderland', 'Medusa', 'Beowulf', 'Sinbad', 'Robin Hood',
    'King Arthur', 'Medea', 'Sun Wukong', 'Valhalla', 'Caesar', 'Hatshepsut',
    'Rapunzel', 'Jungle Book', 'Nijinsky', 'Hemingway', 'Tesla', 'Buffalo Bill',
    'Rosa Parks', 'Frida Kahlo', 'T.E. Lawrence', 'Grace O\'Malley', 'Cobble & Fog',
    'Bruce Lee', 'Battle of Legends'
  ];

  const handleChallenge = async () => {
    if (!profile || !currentUser || !challengeData.deck) return;

    const loadingKey = `challenge-${profile.id}`;
    if (isButtonLoading(loadingKey)) return; // Prevent double-clicking

    setButtonLoading(loadingKey, true);
    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          challengedId: profile.id,
          proposedFormat: challengeData.format,
          challengerDeck: challengeData.deck
        })
      });

      if (response.ok) {
        setShowChallengeModal(false);
        setChallengeData({ format: 'bo1', deck: '' });
        router.push('/inbox');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send challenge');
      }
    } catch (error) {
      console.error('Error sending challenge:', error);
      alert('Failed to send challenge');
    } finally {
      setButtonLoading(loadingKey, false);
    }
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user &quot;{username}&quot; does not exist.</p>
          <Link href="/leaderboard" className="text-indigo-600 hover:text-indigo-500">
            View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isOwnProfile = currentUser && currentUser.id === profile.id;
  const canChallenge = currentUser && !isOwnProfile;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/leaderboard" className="text-indigo-600 hover:text-indigo-500">
                ← Back to Leaderboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {currentUser && (
                <span className="text-gray-700">
                  {currentUser.username}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Hero Section */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-indigo-600">
                  {Math.round(eloType === 'lifetime' ? profile.eloLifetime : profile.eloSeasonal)}
                </div>
                <div className="text-sm text-gray-500">
                  {eloType === 'lifetime' ? 'Lifetime ELO' : 'Seasonal ELO'}
                </div>
              </div>
            </div>

            {/* ELO Type Selector */}
            <div className="mt-6">
              <select
                value={eloType}
                onChange={(e) => setEloType(e.target.value as 'lifetime' | 'seasonal')}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="lifetime">Lifetime</option>
                <option value="seasonal">Seasonal</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex space-x-4">
              {canChallenge && (
                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Challenge
                </button>
              )}
              {isOwnProfile && (
                <button className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Win Rate */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Win Rate</h2>
              <div className="text-3xl font-bold text-green-600">
                {profile.winRate}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {profile.wins}W {profile.matchesPlayed - profile.wins}L
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {profile.matchesPlayed} matches played
              </div>
            </div>

            {/* Recent Matches */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Matches</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Opponent</th>
                      <th className="text-left py-2">Format</th>
                      <th className="text-left py-2">Result</th>
                      <th className="text-left py-2">ELO</th>
                      <th className="text-left py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatches.map((match) => (
                      <tr key={match.id} className="border-b">
                        <td className="py-2">{match.opponent}</td>
                        <td className="py-2">{match.format}</td>
                        <td className="py-2">
                          <span className={`font-medium ${match.result === 'W' ? 'text-green-600' : 'text-red-600'}`}>
                            {match.result}
                          </span>
                        </td>
                        <td className="py-2">
                          <span className={`font-medium ${match.eloChange.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {match.eloChange}
                          </span>
                        </td>
                        <td className="py-2">{formatDate(match.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ELO History Graph */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {eloType === 'lifetime' ? 'Lifetime' : 'Seasonal'} ELO History
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={eloHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => formatDate(value)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => formatDate(value)}
                    formatter={(value) => [value, 'ELO']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="elo" 
                    stroke="#4F46E5" 
                    strokeWidth={2}
                    dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Challenge {profile.username}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="bo1"
                      checked={challengeData.format === 'bo1'}
                      onChange={(e) => setChallengeData({ ...challengeData, format: e.target.value as 'bo1' | 'bo3' })}
                      className="mr-2"
                    />
                    Best of 1
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="bo3"
                      checked={challengeData.format === 'bo3'}
                      onChange={(e) => setChallengeData({ ...challengeData, format: e.target.value as 'bo1' | 'bo3' })}
                      className="mr-2"
                    />
                    Best of 3
                  </label>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your deck:
                </label>
                <select
                  value={challengeData.deck}
                  onChange={(e) => setChallengeData({ ...challengeData, deck: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Choose a deck...</option>
                  {UNMATCHED_DECKS.map((deck) => (
                    <option key={deck} value={deck}>{deck}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowChallengeModal(false);
                    setChallengeData({ format: 'bo1', deck: '' });
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChallenge}
                  disabled={!challengeData.deck || isButtonLoading(`challenge-${profile?.id}`)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isButtonLoading(`challenge-${profile?.id}`) ? 'Sending...' : 'Send Challenge'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
