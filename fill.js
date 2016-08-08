function Fill() {
  this.$fill = document.querySelector('.js-fill');
  this.$wrap = this.$fill.querySelector('.js-fill-wrap');
  this.$blocks = this.$fill.querySelectorAll('.js-fill-block');
  
  this.init();
}
Fill.prototype = {
  init: function () {
    var that = this;
    this.getWrapSize();
    this.getBlockSizes();
    this.startState();
    setTimeout(function() {
      that.placeBlocks();

    }, 10)
  },
  /* get sizes*/
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

  /*operations*/
  startState: function() {
     this.centerBlocks();
  },
  centerBlocks: function() {
    var i;
    var el;

    for (i = 0; i < this.$blocks.length; i++) {
      this.centerBlock(i)
    }
 },
  centerBlock: function(i) {
    var x;
    var y;
    var el = this.$blocks[i];
    var size = this.blockSizes[i];
    var that = this;


    x = this.wrapSize.width / 2 - size.width / 2;
    y = this.wrapSize.height / 2 - size.height / 2;

    el.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
    setTimeout(function() {
      el.style.transition = 'transform 1s, width 1s';
    },10)

  },
  placeBlocks: function () {
    var i;
    this.filledMap = [];
    for (i = 0; i < this.$blocks.length; i++) {
      this.placeBLock(i);
    }
  },
  placeBLock: function (i) {
    var j;
    var x2;
    var y2;

    if (i === 0){
      this.setBlockCss(this.$blocks[i], 0, 0);
      this.filledMap[i] = {
        'x1' : 0,
        'y1': 0,
        'x2': this.blockSizes[i].width,
        'y2': this.blockSizes[i].height
      };
    } else {
      console.log(i - 1)
      x1 = this.filledMap[i - 1].x2;
      y1 = 0;
      x2 = x1 + this.blockSizes[i].width;
      console.log(x2)
      y2 = y1 + this.blockSizes[i].height;

      this.filledMap[i] = {
        'x1': x1,
        'y1': y1,
        'x2': x2,
        'y2': y2
      };
      if ((x1 + this.blockSizes[i].width) < this.wrapSize.width) {
        this.setBlockCss(this.$blocks[i], x1, y1);
      } else {
        //если не влезает - ищу у след размеры ближайшие, чуть большие и уменьшаю
        var delta = this.filledMap[i - 1].x2 - this.wrapSize.width;
        var deltas = [];
        var nextBlocks = [];
        var min;
        for (var k = i; k < this.blockSizes.length; k++) {
          if ((this.blockSizes[k].width - delta) > 0) {
            nextBlocks[this.blockSizes[k].width] = k;
            deltas.push(this.blockSizes[k].width);
          }
        }
        min = Math.min.apply(null, deltas),
        console.log(min)
        console.log(delta) //  - не то. смотрю ширину у след а не у всех
      }


    }

    console.log(this.$blocks[i])
  },

  findPlace: function(i) {
    this.getEmptySpace(i);
  },
  getEmptySpace: function(i) {

  },
  setBlockCss: function(block, x, y) {
    block.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  }


  
} ;

var fill = new Fill();