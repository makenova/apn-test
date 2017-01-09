'use strict';

var assert = require('assert');
var proxyquire =  require('proxyquire');
var _ = require('lodash');
var randomStrings = require('random-strings');

var apnStub = {};
var apnTest = proxyquire('./', { apn: apnStub });

describe('validation errors', function() {
  it('throw error on missing token', function() {
    var options = { };

    assert.throws(function() {
      return apnTest(null, options);
    }, /required/);
  });

  it('throw error on wrong token length', function() {
    var options = {
      token: 'test1234'
    };

    assert.throws(function() {
      return apnTest(null, options);
    }, /64 characters/);
  });
});

describe('call node-apn with correct properties', function() {
  beforeEach(function() {
    apnStub.Connection = function() {
      return {
        pushNotification: _.noop
      };
    };
    apnStub.Device = _.noop;
  });

  var options = {
    token: randomStrings.alphaNumLower(64)
  };

  describe('apn.Connection', function() {
    it('call `apn.Connection` with correct options', function(done) {
      apnStub.Connection = function(opts) {
        assert.equal(opts, options);
        done();

        return {
          pushNotification: _.noop
        };
      };

      apnTest(null, options);
    });

    it('no key or cert properties if only pfx is provided', function(done) {
      var localOptions = {
        pfx: './cert.p12',
        token: options.token
      }

      apnStub.Connection = function(opts) {
        assert.strictEqual(opts.key, undefined)
        assert.strictEqual(opts.cert, undefined)

        done()

        return {
          pushNotification: _.noop
        };
      }

      apnTest(null, localOptions)
    })

    it('should have key and cert props if provided with pfx', function(done) {
      var localOptions = {
        pfx: './cert.p12',
        key: './myKey.pem',
        cert: './mycert.pem',
        token: options.token
      }

      apnStub.Connection = function(opts) {
        assert.strictEqual(opts.key, localOptions.key)
        assert.strictEqual(opts.cert, localOptions.cert)

        done()

        return {
          pushNotification: _.noop
        };
      }

      apnTest(null, localOptions)
    })
  });

  describe('apn.Device', function() {
    it('call `apn.Device` with correct token', function(done) {
      apnStub.Device = function(token) {
        assert.equal(token, options.token);
        done();
      };

      apnTest(null, options);
    });
  });

  describe('apn.Notification', function() {
    var options = {
      token: randomStrings.alphaNumLower(64),
      badge: 1337,
      sound: 'test.aiff',
      expiry: Math.floor(Date.now() / 1000)
    };

    it('call `apn.Notification` with correct properties', function(done) {
      apnStub.Connection = function() {
        return {
          pushNotification: function(notification) {
            assert.equal(notification.alert, 'test');
            assert.equal(notification.badge, options.badge);
            assert.equal(notification.sound, options.sound);
            assert.equal(notification.expiry, options.expiry);
            done();
          }
        };
      };

      apnTest('test', options);
    });

    it('call `apn.Notification` with an empty object property if none passed', function(done) {
      apnStub.Connection = function() {
        return {
          pushNotification: function(notification) {
            assert.equal(notification.alert, 'test');
            assert.equal(notification.badge, options.badge);
            assert.equal(notification.sound, options.sound);
            assert.equal(notification.expiry, options.expiry);

            done();
          }
        };
      };

      apnTest('test', options);
    });

    describe('call for multiple devices', function() {
      options.token = [
        randomStrings.alphaNumLower(64),
        randomStrings.alphaNumLower(64)
      ];

      it('call `apn.Notification` with multiple devices', function(done) {
        apnStub.Connection = function() {
          return {
            pushNotification: function(notification, devices) {
              assert.equal(devices.length, options.token.length);
              done();
            }
          };
        };

        apnTest('test', options);
      });
    });
  });

  it('should return connection object in callback', function(done) {
    apnTest(null, options, function(connection) {
      assert(connection);
      assert.equal(typeof connection, 'object');
      done();
    });
  });
});
