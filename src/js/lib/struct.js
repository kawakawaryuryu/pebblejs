/**
 * struct.js - chainable ArrayBuffer DataView wrapper
 *
 * @author Meiguro / http://meiguro.com/
 * @license MIT
 */

var capitalize = function(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
};

var struct = function(def) {
  this._littleEndian = true;
  this._offset = 0;
  this._cursor = 0;
  this._makeAccessors(def);
  this._view = new DataView(new ArrayBuffer(this.size));
  this._def = def;
};

struct.types = {
  int8: { size: 1 },
  uint8: { size: 1 },
  int16: { size: 2 },
  uint16: { size: 2 },
  int32: { size: 4 },
  uint32: { size: 4 },
  int64: { size: 8 },
  uint64: { size: 8 },
  float32: { size: 2 },
  float64: { size: 4 },
  cstring: { size: 1, dynamic: true },
};

var makeDataViewAccessor = function(type, typeName) {
  var getName = 'get' + capitalize(typeName);
  var setName = 'set' + capitalize(typeName);
  type.get = function(offset, little) {
    this._advance = type.size;
    return this._view[getName](offset, little);
  };
  type.set = function(offset, value, little) {
    this._advance = type.size;
    this._view[setName](offset, value, little);
  };
};

for (var k in struct.types) {
  var type = struct.types[k];
  makeDataViewAccessor(type, k);
}

struct.types.bool = struct.types.uint8;

struct.types.cstring.get = function(offset) {
  var chars = [];
  var buffer = this._view.buffer;
  for (var i = offset, ii = buffer.byteLength, j = 0; i < ii && buffer[i] !== 0; ++i, ++j) {
    chars[j] = String.fromCharCode(buffer[i]);
  }
  this._advance = chars.length + 1;
  return chars.join('');
};

struct.types.cstring.set = function(offset, value) {
  this._grow(offset + value.length);
  var i = offset;
  var buffer = this._view.buffer;
  for (var j = 0, jj = value.length; j < jj && value[i] !== 0; ++i, ++j) {
    buffer[i] = value.charCodeAt(j);
  }
  buffer[i + 1] = '\0';
  this._advance = value.length + 1;
};

struct.prototype._grow = function(target) {
  var buffer = this._view.buffer;
  var size = buffer.byteLength;
  if (target <= size) { return; }
  while (size < target) { size *= 2; }
  var copy = new ArrayBuffer(size);
  for (var i = 0; i < buffer.byteLength; ++i) {
    copy[i] = buffer[i];
  }
  this._view = new DataView(copy);
};

struct.prototype._makeAccessor = function(field) {
  this[field.name] = function(value) {
    var type = field.type;
    if (field.dynamic) {
      var fieldIndex = this._fields.indexOf(field);
      var prevField = this._fields[fieldIndex - 1];
      if (fieldIndex === 0) {
        this._cursor = 0;
      } else if (this._access === field) {
        this._cursor -= this._advance;
      } else if (this._access !== prevField) {
        throw new Error('dynamic field requires sequential access');
      }
    } else {
      this._cursor = this._offset + field.index;
    }
    this._access = field;
    var result = this;
    if (arguments.length === 0) {
      result = type.get.call(this, this._cursor, this._littleEndian);
    } else {
      if (field.transform) {
        value = field.transform(value);
      }
      type.set.call(this, this._cursor, value, this._littleEndian);
    }
    this._cursor += this._advance;
    return result;
  };
  return this;
};

struct.prototype._makeAccessors = function(def, index, fields, prefix) {
  index = index || 0;
  this._fields = ( fields = fields || [] );
  var prevField = fields[fields.length];
  for (var i = 0, ii = def.length; i < ii; ++i) {
    var member = def[i];
    var type = member[0];
    if (typeof type === 'string') {
      type = struct.types[type];
    }
    var name = member[1];
    if (prefix) {
      name = prefix + capitalize(name);
    }
    if (type instanceof struct) {
      this._makeAccessors(type._def, index, fields, name);
      index = this.size;
      continue;
    }
    var transform = member[2];
    var field = {
      index: index,
      type: type,
      name: name,
      transform: transform,
      dynamic: type.dynamic || prevField && prevField.dynamic,
    };
    this._makeAccessor(field);
    fields.push(field);
    index += type.size;
    prevField = field;
  }
  this.size = index;
  return this;
};

struct.prototype.prop = function(def) {
  if (arguments.length === 0) {
    var obj = {};
    var fields = this._fields;
    for (var i = 0, ii = fields.length; i < ii; ++i) {
      var name = fields[i].name;
      obj[name] = this[name]();
    }
    return obj;
  }
  for (var k in def) {
    this[k](def[k]);
  }
  return this;
};

struct.prototype.view = function(view) {
  if (arguments.length === 0) {
    return this._view;
  }
  if (view instanceof ArrayBuffer) {
    view = new DataView(view);
  }
  this._view = view;
  return this;
};

struct.prototype.offset = function(offset) {
  if (arguments.length === 0) {
    return this._offset;
  }
  this._offset = offset;
  return this;
};

module.exports = struct;

