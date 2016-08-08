function Fill() {
  this.$fill = document.querySelector('.js-fill');
  this.$wrap = this.$fill.querySelector('.js-fill-wrap');
  this.$blockHolder = this.$fill.querySelector('.js-fill-blocks');
  this.$blocks = this.$blockHolder.querySelectorAll('.js-fill-block');
  
  this.init();
}
Fill.prototype = {
  init: function () {
    this.getWrapSize();
    this.getBlockSizes();
    this.placeBlocks();
  },
  getWrapSize: function () {
    this.wrapSize = {
       'width' : this.$wrap.offsetWidth,
       'height' : this.$wrap.offsetHeight
    };
    console.log(this.wrapSize)
  },
  getBlockSizes: function () {
    var i;
    this.blockSizes = [];
    for (i = 0; i < this.$blocks.length; i++) {
      this.blockSizes[i] = {
        'width':this.$blocks[i].offsetWidth,
        'height' : this.$blocks[i].offsetHeight
      }
    }
  },
  placeBlocks: function () {
    var i;
    for (i = 0; i < this.$blocks.length; i++) {
      this.placeBLock(i);
    }
  },
  placeBLock: function (i) {
    console.log(this.$blocks[i])
  }

  
} ;

var fill = new Fill();