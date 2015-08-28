// common functions.
Array.prototype.clear = function() {
    while(this[0]) {
        this.splice(0,1);
    }
}
 
function $(id) {
    return document.getElementById(id);
}
//-------------------------------------------------
// add map function to array.
//-------------------------------------------------
Array.prototype.map_init = function() {
    this.keys = [];
}
 
Array.prototype.map_set = function(key, value) {
    if (this[key] == undefined) {
        this.keys.push(key);
    }
    this[key] = value;
}
 
Array.prototype.map_get = function(key) {
    var index = this.keys.indexOf(key);
     
    if (index == -1) {
        console.log("key: " + key + " is not exist.");
        return null;
    }
     
    var key = this.keys[index];
    return this[key];
}
 
Array.prototype.map_del = function(key) {
    var index = this.keys.indexOf(key);
    if (index != -1) {
        this.keys.splice(index,1);
    }
    if (this[key]) {
        delete this[key];
    }
}
 
Array.prototype.map_keys = function() {
    return this.keys;
}
//-------------------------------------------------