require('mocha');
const {expect} = require('chai');
const {createSystem} = require('../../../dist/engine/internal/system');

describe('engine/internal/system', () => {

  describe('createSystem', () => {
    it('should create a system with the given name', () => {
      const expected = 'foo';
      const system = createSystem({name: expected});
      const actual = system.name();
      expect(actual).to.equal(expected);
      expect(system.systemRoot()).to.exist;
      expect(system.userRoot()).to.exist;
      expect(system.deadLetter()).to.exist;
    });
  });

});
