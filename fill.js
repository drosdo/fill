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
    this.dontPlace = false;
    this.rows = [];
    this.currentRow = 0;

    setTimeout(function() {
      that.fillRow();

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

  fillRow: function() {
    var i;
    var width = 0;
    var ids = [];

    for (i = 0; i < this.$blocks.length; i++) {
      if (width >= this.wrapSize.width) {
        this.fixBlocks(ids, width);
        this.placeBlocks(ids);
        this.fillNextRow(i);
        break;
      } else {
        ids.push(i);
        width += this.blockSizes[i].width;
      }
    }
  },
  getRatio: function (width) {
    return this.wrapSize.width / width;
  },
  fixBlocks: function(ids, width) {
    var k = this.getRatio(width);
    for (var i = 0; i < ids.length; i++) {
      this.blockSizes[i].width *= k;
      this.blockSizes[i].height *= k;
      this.$blocks[i].style.width = this.blockSizes[i].width + 'px';
      this.$blocks[i].style.height = this.blockSizes[i].height + 'px';
    }
  },
  fixBlockTo: function(id, width) {
    console.log(id, width);
    this.blockSizes[id].height *= (this.blockSizes[id].width / width);
    this.blockSizes[id].width = width;
    this.$blocks[id].style.width = this.blockSizes[id].width + 'px';
    this.$blocks[id].style.height = this.blockSizes[id].height + 'px';
    console.log(this.blockSizes[id]);

  },
  placeBlocks: function(ids) {
    var width = 0;
    for (var i = 0; i < ids.length; i++) {
      var j = ids[i];
      this.setBlockCss(this.$blocks[j], width, 0);
      width += this.blockSizes[j].width;
    }
    this.currentRow = 0;
    this.rows.push(this.blockSizes.slice(0, ids.length));
    console.log(this.rows)

  },
  fillNextRow: function (startFrom) {
    var blocksSizesByHeight = [];
    var takenBlocks = [];
    var closestId;
    var width = 0;
    var transformx;
    var currentBlock;
    var currentBlockSize;
    blocksSizesByHeight = this.rows[0].sort(this.compareHeights);


    for (var j = 0; j < blocksSizesByHeight.length; j++) {

      closestId = this.getClosestBlock(startFrom, blocksSizesByHeight[j].width, takenBlocks);
      takenBlocks.push(closestId);
      currentBlock = this.$blocks[ this.blockSizes.indexOf( blocksSizesByHeight[j] ) ];
      currentBlockSize = this.blockSizes[ this.blockSizes.indexOf( blocksSizesByHeight[j] ) ];
      transformx = currentBlock.dataset.transformx;
      this.fixBlockTo(closestId, currentBlockSize.width);
      this.setBlockCss(this.$blocks[closestId], transformx, blocksSizesByHeight[j].height )
    }
  },
  getClosestBlock: function (startFrom, prevWidth, takenBlocks) {
    var delta = 0;
    var minDelta = 100000;
    var minId = 0;
    for (var i = startFrom; i < this.$blocks.length; i++) {
      delta = Math.abs(prevWidth - this.blockSizes[i].width);
      if (delta < minDelta && takenBlocks.indexOf(i) < 0) {
        minDelta = delta;
        minId = i;
      }
    }
    return minId;
  },
  setBlockCss: function(block, x, y) {
    console.log(x)
    block.dataset.transformx = x;
    block.dataset.transformy = y;
    block.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  },
  compareHeights: function(a, b) {
    return a.height - b.height;
  }


  
} ;

var fill = new Fill();