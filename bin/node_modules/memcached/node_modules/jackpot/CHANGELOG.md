#### v0.0.6
- Remove the `timeout` listener, could cause double connect events / fn calls.
  See #10

#### v0.0.5
- Adding missing `timeout` listener. See #9

#### v0.0.4
- Added support for configurable options.
- Fixed a bug where broken connections were briefly added to the pool

#### v0.0.3
- Changed the way how we inherit from the `EventEmitter` prototype to combat
  potential memory leaks. See #5

#### v0.0.2
- Fixed a socket leak that was caused by incorrectly splicing an array. It
  removed the first item from the pool instead of item that was found using
  indexOf. See #2

#### v0.0.1
- Small fix for the isAvailable method, returns a larger availability. See #1

#### v0.0.0
- Initial release
