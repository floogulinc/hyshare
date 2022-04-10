import { getNamespace, getTagValue } from './tag-utils';

describe('Tag Utils', () => {
  describe('getTagValue', () => {
    it('returns the correct tag value', () => {
      expect(getTagValue('demo:test')).toBe('test');
      expect(getTagValue('test:')).toBe('');
      expect(getTagValue('test')).toBe('test');
      expect(getTagValue(':test')).toBe('test');
      expect(getTagValue('test:test:asd')).toBe('test:asd');
      expect(getTagValue('demo::test')).toBe(':test');
      expect(getTagValue('test')).toBe('test');
      expect(getTagValue('demo:test:')).toBe('test:');
    });
  });

  describe('getNamespace', () => {
    it('returns the correct tag namespace', () => {
      expect(getNamespace('demo:test')).toBe('demo');
      expect(getNamespace('test:')).toBe('test');
      expect(getNamespace('test')).toBe('');
      expect(getNamespace(':test')).toBe('');
      expect(getNamespace('test:test:asd')).toBe('test');
      expect(getNamespace('demo::test')).toBe('demo');
      expect(getNamespace('test')).toBe('');
    });
  });
});
