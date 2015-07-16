
function rgb(r, g, b){
  return [r/127, g/127, b/127];
}

$.fn.exists = function(a){
    return this.length;
};

$.fn.equals = function(compareTo) {
  if (!compareTo || this.length != compareTo.length) {
    return false;
  }
  for (var i = 0; i < this.length; ++i) {
    if (this[i] !== compareTo[i]) {
      return false;
    }
  }
  return true;
};