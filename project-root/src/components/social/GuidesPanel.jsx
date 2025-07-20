// src/components/social/GuidesPanel.jsx
import React, { useState } from 'react';
import { useSocialContext } from '../../contexts/SocialContext';

const GuidesPanel = () => {
  const { guideBets } = useSocialContext();
  const [activeTab, setActiveTab] = useState('bets');

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="border-b border-gray-700 flex">
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'bets' ? 'bg-gray-700 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('bets')}
        >
          Guide Bets
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'following' ? 'bg-gray-700 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
        <button 
          className={`flex-1 py-3 px-4 text-center font-medium ${activeTab === 'followers' ? 'bg-gray-700 text-blue-400' : 'text-gray-400'}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers
        </button>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {activeTab === 'bets' && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Recent Guide Bets</h3>
            {guideBets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No bets from your guides yet</p>
            ) : (
              <div className="space-y-3">
                {guideBets.map((bet, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-700 rounded-lg">
                    <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                      <span className="text-lg">👤</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{bet.guideName}</div>
                      <div className="text-sm text-gray-300">
                        Bet {bet.amount} on {bet.ball}
                      </div>
                    </div>
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-xs">
                      {bet.ball}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <FollowingList />
        )}

        {activeTab === 'followers' && (
          <FollowersList />
        )}
      </div>
    </div>
  );
};

const FollowingList = () => {
  const { following, unfollowUser } = useSocialContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Your Guides ({following.length})</h3>
      {following.length === 0 ? (
        <p className="text-gray-500 text-center py-4">You're not following anyone yet</p>
      ) : (
        <div className="space-y-3">
          {following.map(user => (
            <div key={user._id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <div className="font-medium">{user.nickname}</div>
                  <div className="text-xs text-gray-400">{user.country}</div>
                </div>
              </div>
              <button 
                onClick={() => unfollowUser(user._id)}
                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
              >
                Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FollowersList = () => {
  const { followers } = useSocialContext();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Your Followers ({followers.length})</h3>
      {followers.length === 0 ? (
        <p className="text-gray-500 text-center py-4">You don't have any followers yet</p>
      ) : (
        <div className="space-y-3">
          {followers.map(user => (
            <div key={user._id} className="flex items-center p-3 bg-gray-700 rounded-lg">
              <div className="bg-gray-600 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                <span className="text-lg">👤</span>
              </div>
              <div>
                <div className="font-medium">{user.nickname}</div>
                <div className="text-xs text-gray-400">{user.country}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuidesPanel;