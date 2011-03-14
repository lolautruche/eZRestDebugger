/**
 * Abstract StorageHandler class
 * @abstract
 */
function StorageHandler() {};

StorageHandler.prototype = {
  
  getValue: function(name) {},
  
  setValue: function(name, val) {},
  
  removeValue: function(name) {},
  
  reset: function() {},
};

// =====================================

/**
 * Storage Handler implementation for AIR environment
 */
function AirStorageHandler() {};

AirStorageHandler.prototype = new StorageHandler();
AirStorageHandler.prototype.parent = StorageHandler.prototype;
AirStorageHandler.constructor = AirStorageHandler;

AirStorageHandler.prototype.getValue = function(name) {
  var val = null;
  var bytes = air.EncryptedLocalStore.getItem(name);
  if(bytes !== null) {
    val = bytes.readUTFBytes(bytes.length);
  }
  
  return val;
};
AirStorageHandler.prototype.setValue = function(name, val) {
  var bytes = new air.ByteArray();
  bytes.writeUTFBytes(val);
  air.EncryptedLocalStore.setItem(name, bytes);
};
AirStorageHandler.prototype.removeValue = function(name) {
  air.EncryptedLocalStore.removeItem(name);
};
AirStorageHandler.prototype.reset = function() {
  air.EncryptedLocalStore.reset();
  this.parent.reset.call(this);
}

// =====================================

/**
 * Storage Handler implementation for HTML5 environment, with localStorage()
 */
function LocalStorageHandler() {};
LocalStorageHandler.prototype = new StorageHandler();
LocalStorageHandler.prototype.parent = StorageHandler.prototype;
LocalStorageHandler.constructor = LocalStorageHandler;

LocalStorageHandler.prototype.getValue = function(name) {};
LocalStorageHandler.prototype.setValue = function(name, value) {};
LocalStorageHandler.prototype.removeValue = function(name) {};
LocalStorageHandler.prototype.reset = function() {
  this.parent.reset.call(this);
}
