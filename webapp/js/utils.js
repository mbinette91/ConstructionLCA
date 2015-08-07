
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

/* File input JS, source: http://www.abeautifulsite.net/whipping-file-inputs-into-shape-with-bootstrap-3/ */
$(document).on('change', '.btn-file :file', function() {
  var input = $(this),
    numFiles = input.get(0).files ? input.get(0).files.length : 1,
    label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
  input.trigger('fileselect', [numFiles, label]);
});