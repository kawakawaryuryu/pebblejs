var Vector2 = require('vector2');
var Platform = require('platform');

var Feature = module.exports;

Feature.platform = function(map, yes, no) {
  var v = map[Platform.version()] || map.unknown;
  var rv;
  if (v && yes !== undefined) {
    rv = typeof yes === 'function' ? yes(v) : yes;
  } else if (!v && no !== undefined) {
    rv = typeof no === 'function' ? no(v) : no;
  }
  return rv !== undefined ? rv : v;
};

Feature.makePlatformTest = function(map) {
  return function(yes, no) {
    return Feature.platform(map, yes, no);
  };
};

Feature.blackAndWhite = Feature.makePlatformTest({
  aplite: true,
  basalt: false,
  chalk: false,
  diorite: true,
});

Feature.color = Feature.makePlatformTest({
  aplite: false,
  basalt: true,
  chalk: true,
  diorite: false,
});

Feature.rectangle = Feature.makePlatformTest({
  aplite: true,
  basalt: true,
  chalk: false,
  diorite: true,
});

Feature.round = Feature.makePlatformTest({
  aplite: false,
  basalt: false,
  chalk: true,
  diorite: false,
});

Feature.microphone = Feature.makePlatformTest({
  aplite: false,
  basalt: true,
  chalk: true,
  diorite: true,
});

Feature.resolution = Feature.makePlatformTest({
  aplite: new Vector2(144, 168),
  basalt: new Vector2(144, 168),
  chalk: new Vector2(180, 180),
  diorite: new Vector2(144, 168),
});

Feature.actionBarWidth = function() {
  return Feature.rectangle(30, 40);
};

Feature.statusBarHeight = function() {
  return 16;
};
