import { computeRep } from '../src/rep'

describe('computeRep', () => {
  const mockUser = {
    id: '123',
    username: 'testuser',
    name: 'Test User',
    followers_count: 1000,
    following_count: 500,
    tweet_count: 100,
    verified: false,
    profile_image_url: 'https://example.com/avatar.jpg'
  }

  const mockSmartFollowers = {
    data: [
      { id: '1', username: 'follower1', followers_count: 100, verified: true },
      { id: '2', username: 'follower2', followers_count: 50, verified: false },
      { id: '3', username: 'follower3', followers_count: 200, verified: true }
    ],
    meta: { result_count: 3 }
  }

  test('should compute basic reputation score', () => {
    const result = computeRep(mockUser, mockSmartFollowers)
    
    expect(result.score).toBeGreaterThan(0)
    expect(result.qualityScore).toBe(67) // 2 out of 3 verified = 67%
    expect(result.followerCount).toBe(1000)
    expect(result.verifiedFollowers).toBe(2)
    expect(result.totalFollowers).toBe(3)
    expect(result.badges).toContain('High Quality')
  })

  test('should handle zero followers', () => {
    const zeroFollowersUser = { ...mockUser, followers_count: 0 }
    const emptyFollowers = { data: [], meta: { result_count: 0 } }
    
    const result = computeRep(zeroFollowersUser, emptyFollowers)
    
    expect(result.score).toBeGreaterThan(0) // Should still have some base score
    expect(result.qualityScore).toBe(0)
    expect(result.followerCount).toBe(0)
    expect(result.verifiedFollowers).toBe(0)
    expect(result.totalFollowers).toBe(0)
  })

  test('should handle 1 million followers', () => {
    const millionFollowersUser = { ...mockUser, followers_count: 1000000 }
    const manyFollowers = {
      data: Array.from({ length: 100 }, (_, i) => ({
        id: i.toString(),
        username: `follower${i}`,
        followers_count: 1000,
        verified: i < 30 // 30% verified
      })),
      meta: { result_count: 100 }
    }
    
    const result = computeRep(millionFollowersUser, manyFollowers)
    
    expect(result.score).toBeGreaterThan(100) // Should have high score
    expect(result.qualityScore).toBe(30)
    expect(result.followerCount).toBe(1000000)
    expect(result.badges).toContain('Influencer')
  })

  test('should handle Blue check flag', () => {
    const verifiedUser = { ...mockUser, verified: true }
    
    const result = computeRep(verifiedUser, mockSmartFollowers)
    
    expect(result.badges).toContain('Verified')
    // Should have higher score due to blue check bonus
    const unverifiedResult = computeRep(mockUser, mockSmartFollowers)
    expect(result.score).toBeGreaterThan(unverifiedResult.score)
  })

  test('should handle edge case with no smart followers data', () => {
    const emptySmartFollowers = { data: [], meta: { result_count: 0 } }
    
    const result = computeRep(mockUser, emptySmartFollowers)
    
    expect(result.qualityScore).toBe(0)
    expect(result.verifiedFollowers).toBe(0)
    expect(result.totalFollowers).toBe(0)
    expect(result.badges).not.toContain('High Quality')
    expect(result.badges).not.toContain('Elite')
  })

  test('should generate appropriate description', () => {
    const result = computeRep(mockUser, mockSmartFollowers)
    
    expect(result.description).toContain('1,000 followers')
    expect(result.description).toContain('67% verified followers')
    expect(result.description).toContain('high quality follower base')
  })

  test('should handle elite status (50%+ verified)', () => {
    const eliteFollowers = {
      data: [
        { id: '1', username: 'follower1', followers_count: 100, verified: true },
        { id: '2', username: 'follower2', followers_count: 50, verified: true },
        { id: '3', username: 'follower3', followers_count: 200, verified: false }
      ],
      meta: { result_count: 3 }
    }
    
    const result = computeRep(mockUser, eliteFollowers)
    
    expect(result.badges).toContain('Elite')
    expect(result.qualityScore).toBe(67)
  })
}) 