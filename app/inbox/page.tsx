'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Challenge {
  _id: string;
  challengerId: {
    _id: string;
    username: string;
  };
  challengedId: {
    _id: string;
    username: string;
  };
  proposedFormat: 'bo1' | 'bo3';
  challengerDeck: string;
  challengedDeck: string | null;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Locked' | 'Expired';
  createdAt: string;
}

interface Match {
  _id: string;
  player1Id: {
    _id: string;
    username: string;
  };
  player2Id: {
    _id: string;
    username: string;
  };
  deck1: string;
  deck2: string;
  format: 'best-of-1' | 'best-of-3';
  status: 'Pending' | 'Completed' | 'Disputed';
  resolvedP1GamesWon: number | null;
  reports: Array<{
    reporterId: string;
    reportedWinnerId: string;
    reportedP1GamesWon: number;
    reportedAt: string;
  }>;
  createdAt: string;
}

const UNMATCHED_DECKS = [
  'Sherlock Holmes', 'Alice Wonderland', 'Medusa', 'Beowulf', 'Sinbad', 'Robin Hood',
  'King Arthur', 'Medea', 'Sun Wukong', 'Valhalla', 'Caesar', 'Hatshepsut',
  'Rapunzel', 'Jungle Book', 'Nijinsky', 'Hemingway', 'Tesla', 'Buffalo Bill',
  'Rosa Parks', 'Frida Kahlo', 'T.E. Lawrence', 'Grace O\'Malley', 'Cobble & Fog',
  'Bruce Lee', 'Battle of Legends'
];

export default function InboxPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'challenges' | 'matches'>('challenges');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAcceptModal, setShowAcceptModal] = useState<Challenge | null>(null);
  const [selectedDeck, setSelectedDeck] = useState('');
  const [showReportModal, setShowReportModal] = useState<Match | null>(null);
  const [reportData, setReportData] = useState({
    myGamesWon: 2, // Games won by the reporting player
    opponentGamesWon: 0 // Games won by the opponent
  });
  const [isEditingReport, setIsEditingReport] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
      // Set up polling every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'challenges') {
        const response = await fetch('/api/challenges');
        if (response.ok) {
          const data = await response.json();
          setChallenges(data.challenges);
        }
      } else {
        const response = await fetch('/api/matches?userId=me');
        if (response.ok) {
          const data = await response.json();
          setMatches(data.matches);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async () => {
    if (!showAcceptModal || !selectedDeck) return;

    try {
      const response = await fetch(`/api/challenges/${showAcceptModal._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          challengedDeck: selectedDeck
        })
      });

      if (response.ok) {
        setShowAcceptModal(null);
        setSelectedDeck('');
        loadData();
        // Switch to matches tab to show the new match
        setActiveTab('matches');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to accept challenge');
      }
    } catch (error) {
      console.error('Error accepting challenge:', error);
      alert('Failed to accept challenge');
    }
  };

  const handleDeclineChallenge = async (challengeId: string) => {
    try {
      const response = await fetch(`/api/challenges/${challengeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline' })
      });

      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to decline challenge');
      }
    } catch (error) {
      console.error('Error declining challenge:', error);
      alert('Failed to decline challenge');
    }
  };

  const handleReportMatch = async () => {
    if (!showReportModal || !currentUser) return;

    try {
      const match = showReportModal;
      const isPlayer1 = match.player1Id._id === currentUser.id;
      const opponentId = isPlayer1 ? match.player2Id._id : match.player1Id._id;
      
      // Determine winner based on games won
      const myGamesWon = reportData.myGamesWon;
      const opponentGamesWon = reportData.opponentGamesWon;
      const reportedWinnerId = myGamesWon > opponentGamesWon ? currentUser.id : opponentId;
      
      // Calculate reportedP1GamesWon - always from player 1's perspective
      const reportedP1GamesWon = isPlayer1 ? myGamesWon : opponentGamesWon;

      const response = await fetch(`/api/matches/${match._id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedWinnerId,
          reportedP1GamesWon
        })
      });

      if (response.ok) {
        setShowReportModal(null);
        setReportData({ myGamesWon: 2, opponentGamesWon: 0 });
        setIsEditingReport(false);
        loadData();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to report match');
      }
    } catch (error) {
      console.error('Error reporting match:', error);
      alert('Failed to report match');
    }
  };

  const hasUserReported = (match: Match) => {
    return match.reports.some(report => report.reporterId === currentUser?.id);
  };

  const loadCurrentReport = async (match: Match) => {
    try {
      const response = await fetch(`/api/matches/${match._id}/report`);
      if (response.ok) {
        const data = await response.json();
        const isPlayer1 = match.player1Id._id === currentUser?.id;
        const myGamesWon = isPlayer1 ? data.report.reportedP1GamesWon : (match.format === 'best-of-1' ? 1 - data.report.reportedP1GamesWon : 2 - data.report.reportedP1GamesWon);
        const opponentGamesWon = isPlayer1 ? (match.format === 'best-of-1' ? 1 - data.report.reportedP1GamesWon : 2 - data.report.reportedP1GamesWon) : data.report.reportedP1GamesWon;
        
        setReportData({ myGamesWon, opponentGamesWon });
        setIsEditingReport(true);
      }
    } catch (error) {
      console.error('Error loading current report:', error);
    }
  };

  const getOpponent = (match: Match) => {
    if (!currentUser) return null;
    return match.player1Id._id === currentUser.id ? match.player2Id : match.player1Id;
  };

  const getUserDeck = (match: Match) => {
    if (!currentUser) return '';
    return match.player1Id._id === currentUser.id ? match.deck1 : match.deck2;
  };

  const getOpponentDeck = (match: Match) => {
    if (!currentUser) return '';
    return match.player1Id._id === currentUser.id ? match.deck2 : match.deck1;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <Link href="/login" className="text-indigo-600 hover:text-indigo-500">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{currentUser.username}</span>
              <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-500">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('challenges')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'challenges'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Challenges
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'matches'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Matches
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-lg">Loading...</div>
            </div>
          ) : (
            <>
              {/* Challenges Tab */}
              {activeTab === 'challenges' && (
                <div className="space-y-4">
                  {challenges.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No challenges found.</p>
                    </div>
                  ) : (
                    challenges.map((challenge) => {
                      const isReceived = challenge.challengedId._id === currentUser.id;
                      const otherUser = isReceived ? challenge.challengerId : challenge.challengedId;
                      const isPending = challenge.status === 'Pending';

                      return (
                        <div
                          key={challenge._id}
                          className={`bg-white shadow rounded-lg p-6 ${
                            isReceived && isPending ? 'ring-2 ring-indigo-500' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {isReceived ? 'Challenged by' : 'Challenge to'} {otherUser.username}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {challenge.proposedFormat === 'bo1' ? 'Best of 1' : 'Best of 3'} • 
                                {isReceived ? ` They're using ${challenge.challengerDeck}` : ` You're using ${challenge.challengerDeck}`}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(challenge.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex space-x-2">
                              {isReceived && isPending && (
                                <>
                                  <button
                                    onClick={() => setShowAcceptModal(challenge)}
                                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineChallenge(challenge._id)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
                                  >
                                    Decline
                                  </button>
                                </>
                              )}
                              {!isReceived && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  challenge.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  challenge.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                                  challenge.status === 'Declined' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {challenge.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Matches Tab */}
              {activeTab === 'matches' && (
                <div className="space-y-4">
                  {matches.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No matches found.</p>
                    </div>
                  ) : (
                    matches.map((match) => {
                      const opponent = getOpponent(match);
                      const userDeck = getUserDeck(match);
                      const opponentDeck = getOpponentDeck(match);
                      const hasReported = hasUserReported(match);

                      return (
                        <div key={match._id} className="bg-white shadow rounded-lg p-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                vs {opponent?.username}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {match.format === 'best-of-1' ? 'Best of 1' : 'Best of 3'} • 
                                You: {userDeck} • {opponent?.username}: {opponentDeck}
                                {match.status === 'Completed' && match.resolvedP1GamesWon !== null && (
                                  <span className="ml-2 font-semibold">
                                    {match.resolvedP1GamesWon}-{match.format === 'best-of-1' ? 1 - match.resolvedP1GamesWon : 2 - match.resolvedP1GamesWon}
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(match.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                match.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                match.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {match.status}
                              </span>
                              {match.status === 'Pending' && !hasReported && (
                                <button
                                  onClick={() => {
                                    setShowReportModal(match);
                                    setReportData({ 
                                      myGamesWon: match.format === 'best-of-1' ? 1 : 2,
                                      opponentGamesWon: 0
                                    });
                                    setIsEditingReport(false);
                                  }}
                                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
                                >
                                  Report
                                </button>
                              )}
                              {hasReported && match.status === 'Pending' && (
                                <div className="flex space-x-2">
                                  <span className="text-sm text-green-600">Reported</span>
                                  <button
                                    onClick={() => {
                                      setShowReportModal(match);
                                      loadCurrentReport(match);
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {hasReported && match.status === 'Disputed' && (
                                <div className="flex space-x-2">
                                  <span className="text-sm text-red-600">Disputed</span>
                                  <button
                                    onClick={() => {
                                      setShowReportModal(match);
                                      loadCurrentReport(match);
                                    }}
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                              {hasReported && match.status === 'Completed' && (
                                <span className="text-sm text-green-600">Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Accept Challenge Modal */}
      {showAcceptModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Accept Challenge from {showAcceptModal.challengerId.username}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {showAcceptModal.proposedFormat === 'bo1' ? 'Best of 1' : 'Best of 3'} • 
                They&apos;re using {showAcceptModal.challengerDeck}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your deck:
                </label>
                <select
                  value={selectedDeck}
                  onChange={(e) => setSelectedDeck(e.target.value)}
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
                    setShowAcceptModal(null);
                    setSelectedDeck('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAcceptChallenge}
                  disabled={!selectedDeck}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-300"
                >
                  Accept Challenge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Match Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {isEditingReport ? 'Edit Match Report' : 'Report Match Result'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {showReportModal.format === 'best-of-1' ? 'Best of 1' : 'Best of 3'} vs {getOpponent(showReportModal)?.username}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Games Won:
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {currentUser?.username}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={showReportModal.format === 'best-of-1' ? 1 : 2}
                      value={reportData.myGamesWon}
                      onChange={(e) => setReportData({ ...reportData, myGamesWon: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      {getOpponent(showReportModal)?.username}:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={showReportModal.format === 'best-of-1' ? 1 : 2}
                      value={reportData.opponentGamesWon}
                      onChange={(e) => setReportData({ ...reportData, opponentGamesWon: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {showReportModal.format === 'best-of-1' 
                    ? 'Winner needs 1 game' 
                    : 'Winner needs 2 games (best of 3)'
                  }
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Result: {reportData.myGamesWon}-{reportData.opponentGamesWon}
                  {reportData.myGamesWon > reportData.opponentGamesWon ? ` (${currentUser?.username} wins)` : 
                   reportData.opponentGamesWon > reportData.myGamesWon ? ` (${getOpponent(showReportModal)?.username} wins)` : 
                   ' (Tie - invalid)'}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReportModal(null);
                    setReportData({ myGamesWon: showReportModal?.format === 'best-of-1' ? 1 : 2, opponentGamesWon: 0 });
                    setIsEditingReport(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportMatch}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                >
                  {isEditingReport ? 'Update Report' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
