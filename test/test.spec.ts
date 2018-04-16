import { describe, it } from 'mocha';
import { expect } from 'chai';

describe('Hello function', () => {
    it('should return hello world', () => {
        const result = 'hi';
        expect(result).to.equal('Hello World!');
    });
});
