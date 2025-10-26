'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  elo: number;
  matchesPlayed: number;
  wins: number;
  winRate: string;
  role: string;
}

interface Season {
  seasonNum: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [eloType, setEloType] = useState<'lifetime' | 'seasonal'>('lifetime');
  const [currentSeason, setCurrentSeason] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [eloType, currentSeason]);

  const loadSeasons = async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.seasons);
        const activeSeason = data.seasons.find((s: Season) => s.isActive);
        if (activeSeason) {
          setCurrentSeason(activeSeason.seasonNum);
        }
      }
    } catch (error) {
      console.error('Error loading seasons:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: eloType,
        limit: '50'
      });
      
      if (eloType === 'seasonal') {
        params.append('season', currentSeason.toString());
      }

      const response = await fetch(`/api/leaderboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };


  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-50 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-2 sm:space-y-0">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Leaderboard
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              {currentUser && (
                <span className="text-gray-700 text-sm sm:text-base">
                  {currentUser.username}
                </span>
              )}
              <Link
                href="/dashboard"
                className="text-indigo-600 hover:text-indigo-500 text-sm sm:text-base"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ELO Type
                </label>
                <select
                  value={eloType}
                  onChange={(e) => setEloType(e.target.value as 'lifetime' | 'seasonal')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="lifetime">Lifetime</option>
                  <option value="seasonal">Seasonal</option>
                </select>
              </div>

              {eloType === 'seasonal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Season
                  </label>
                  <select
                    value={currentSeason}
                    onChange={(e) => setCurrentSeason(parseInt(e.target.value))}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {seasons.map((season) => (
                      <option key={season.seasonNum} value={season.seasonNum}>
                        Season {season.seasonNum}
                        {season.isActive && ' (Current)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            {loading ? (
              <div className="p-6 text-center">
                <div className="text-lg">Loading leaderboard...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ELO
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matches
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaderboard.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRankBadgeColor(entry.rank)}`}>
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/${entry.username}`}
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          {entry.username}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {Math.round(entry.elo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.winRate}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {entry.matchesPlayed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          {!loading && leaderboard.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No players found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
