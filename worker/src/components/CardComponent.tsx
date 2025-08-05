import React from 'react'

interface CardProps {
  repData: {
    score: number
    qualityScore: number
    followerCount: number
    badges: string[]
    description: string
    // Out-of-crypto data
    audienceInterests?: string[]
    expertLists?: number
    fakeRatio?: number
    nonCryptoBonus?: number
    topSegments?: string[]
  }
  user: {
    username: string
    name: string
    verified: boolean
    profile_image_url?: string
  }
}

export function CardComponent({ repData, user }: CardProps) {
  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Twitter Arc - @{user.username}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>{`
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        `}</style>
      </head>
      <body className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">@{user.username}</h1>
                    <p className="text-blue-100">Reputation Score</p>
                  </div>
                </div>
              </div>
              
              {/* Score Section */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-gray-800 mb-2">{repData.score}</div>
                  <div className="text-lg text-gray-600">Reputation Score</div>
                  <div className="flex items-center justify-center mt-2">
                    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                        style={{ width: `${Math.min(repData.score / 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">
                      {repData.followerCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Followers</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">{repData.qualityScore}%</div>
                    <div className="text-sm text-gray-600">Quality Score</div>
                  </div>
                </div>

                {/* Out-of-Crypto Circle Data */}
                {(repData.audienceInterests?.length || repData.expertLists || repData.fakeRatio) && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Out-of-Crypto Circle Analysis</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {repData.audienceInterests?.length && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Audience Interests</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {repData.audienceInterests.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      )}
                      
                      {repData.expertLists && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Expert Lists</div>
                          <div className="text-lg font-bold text-green-600">{repData.expertLists}</div>
                        </div>
                      )}
                      
                      {repData.fakeRatio !== undefined && (
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-600">Audience Quality</div>
                          <div className="text-lg font-bold text-blue-600">{100 - repData.fakeRatio}%</div>
                        </div>
                      )}
                    </div>

                    {repData.nonCryptoBonus && (
                      <div className="mt-3 text-center">
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          +{repData.nonCryptoBonus} REP Non-Crypto Bonus
                        </span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {repData.badges.map((badge, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {badge}
                    </span>
                  ))}
                </div>
                
                {/* Description */}
                <div className="text-gray-600 text-sm leading-relaxed">
                  {repData.description}
                </div>
              </div>
              
              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Generated by Twitter Arc</span>
                  <span>@rep_hq</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
} 