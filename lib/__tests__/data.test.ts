import { 
  getUserRecommendationContext, 
  getTrendingProducts,
  getUserSearchHistory,
  getUserPurchaseHistory 
} from '../data';

describe('User Recommendation Data Functions', () => {
  describe('getUserRecommendationContext', () => {
    it('should return valid context structure with array properties', async () => {
      // Using a realistic user ID from demo user
      const userId = 'demo-user-id-placeholder';
      
      const result = await getUserRecommendationContext(userId);

      // Validate structure - arrays may be empty or populated
      expect(result).toHaveProperty('recentViews');
      expect(result).toHaveProperty('searchHistory');
      expect(result).toHaveProperty('purchaseHistory');
      expect(Array.isArray(result.recentViews)).toBe(true);
      expect(Array.isArray(result.searchHistory)).toBe(true);
      expect(Array.isArray(result.purchaseHistory)).toBe(true);
    });

    it('should handle empty userId gracefully', async () => {
      const result = await getUserRecommendationContext('');

      expect(result).toEqual({
        recentViews: [],
        searchHistory: [],
        purchaseHistory: [],
      });
    });

    it('should handle non-existent userId gracefully', async () => {
      const result = await getUserRecommendationContext('non-existent-user-123');

      // Should not throw, should return empty arrays
      expect(result).toHaveProperty('recentViews');
      expect(result).toHaveProperty('searchHistory');
      expect(result).toHaveProperty('purchaseHistory');
    });
  });

  describe('getTrendingProducts', () => {
    it('should return array of products', async () => {
      const result = await getTrendingProducts(3);

      expect(Array.isArray(result)).toBe(true);
      // May be empty if no product views in last 7 days
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('slug');
      }
    });

    it('should respect limit parameter', async () => {
      const result = await getTrendingProducts(2);

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should use default limit of 6 if not specified', async () => {
      const result = await getTrendingProducts();

      expect(result.length).toBeLessThanOrEqual(6);
    });
  });

  describe('getUserSearchHistory', () => {
    it('should return array of strings', async () => {
      const userId = 'demo-user-id-placeholder';
      
      const result = await getUserSearchHistory(userId, 10);

      expect(Array.isArray(result)).toBe(true);
      // May be empty if user has no search history
      if (result.length > 0) {
        expect(typeof result[0]).toBe('string');
      }
    });

    it('should return empty array for empty userId', async () => {
      const result = await getUserSearchHistory('', 10);

      expect(result).toEqual([]);
    });

    it('should handle non-existent user gracefully', async () => {
      const result = await getUserSearchHistory('non-existent-user-456', 10);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserPurchaseHistory', () => {
    it('should return array of products', async () => {
      const userId = 'demo-user-id-placeholder';
      
      const result = await getUserPurchaseHistory(userId);

      expect(Array.isArray(result)).toBe(true);
      // May be empty if user has no purchases
      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
      }
    });

    it('should return empty array for empty userId', async () => {
      const result = await getUserPurchaseHistory('');

      expect(result).toEqual([]);
    });

    it('should handle non-existent user gracefully', async () => {
      const result = await getUserPurchaseHistory('non-existent-user-789');

      expect(Array.isArray(result)).toBe(true);
    });
  });
});
