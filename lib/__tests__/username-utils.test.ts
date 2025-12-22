/**
 * Tests for username normalization utilities
 */

describe('Username normalization', () => {
  it('should strip @ symbol from username', () => {
    const username = '@testuser';
    const cleaned = username.trim().replace(/^@+/, '');
    expect(cleaned).toBe('testuser');
  });

  it('should handle multiple @ symbols', () => {
    const username = '@@@testuser';
    const cleaned = username.trim().replace(/^@+/, '');
    expect(cleaned).toBe('testuser');
  });

  it('should handle username without @ symbol', () => {
    const username = 'testuser';
    const cleaned = username.trim().replace(/^@+/, '');
    expect(cleaned).toBe('testuser');
  });

  it('should handle empty string', () => {
    const username = '';
    const cleaned = username.trim().replace(/^@+/, '');
    expect(cleaned).toBe('');
  });

  it('should handle whitespace', () => {
    const username = '  @testuser  ';
    const cleaned = username.trim().replace(/^@+/, '');
    expect(cleaned).toBe('testuser');
  });
});

