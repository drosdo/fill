!function() {
  for (var a, b = function() {
  }, c = ["assert", "clear", "count", "debug", "dir", "dirxml", "error", "exception", "group", "groupCollapsed", "groupEnd", "info", "log", "markTimeline", "profile", "profileEnd", "table", "time", "timeEnd", "timeStamp", "trace", "warn"], d = c.length, e = window.console = window.console || {}; d--;)a = c[d], e[a] || (e[a] = b)
}();
var app = app || {};
app.Model = function() {
  this.initialize()
}, app.Model.prototype = {
  USED_MAX_SIZE: 300, initialize: function() {
    this.used = [], this.isConnected = !1, this.doConnect()
  }, doConnect: function() {
    this.socket = io("http://ikeaknopka.ru", {
      path: "/app/socket.io",
      upgrade: !1
    }), this.socket.on("connect", _.bind(this.onConnect, this))
  }, onConnect: function() {
    this.isConnected = !0, this.requestedSum && this.request(this.requestedSum)
  }, request: function(a) {
    if (!this.isConnected)return void(this.requestedSum = a);
    var b = Math.ceil(app.utils.linear(10, 200, a / 1e5));
    this.requestedSum = null, this.sum = a, this.startDate = (new Date).getTime(), this.socket.emit("shuffle", {
      sum: a,
      target_count: b,
      declined_ids: this.used
    }, _.bind(this.onResult, this))
  }, replace: function(a) {
    if (!this.isConnected)return void app.utils.serverError();
    this.replaceId = a, delete this.accepted_ids[a];
    var b = 2 + Math.floor(2 * Math.random());
    this.startDate = (new Date).getTime(), this.socket.emit("shuffle", {
      accepted_ids: this.accepted_ids,
      sum: this.sum,
      declined_ids: this.used,
      target_count: b
    }, _.bind(this.onReplaceResult, this))
  }, serveData: function(a) {
    this.amount = 0, this.accepted_ids = a.accepted_ids, this.data = _.map(a.product_info, function(b, c) {
      return this.addToUsed(c), b.count = a.accepted_ids[c], this.amount += b.count, b
    }, this), this.change = a.change
  }, addToUsed: function(a) {
    _.contains(this.used, a) || this.used.push(a), this.used.length > this.USED_MAX_SIZE && (this.used = _.last(this.used, this.USED_MAX_SIZE))
  }, onResult: function(a) {
    this.serveData(a), app.$document.trigger("RequestResult")
  }, onReplaceResult: function(a) {
    var b = _.keys(this.accepted_ids);
    this.serveData(a);
    var c = _.difference(_.keys(this.accepted_ids), b);
    return _.contains(c, this.replaceId.toString()) ? (this.used = [this.replaceId], void this.replace(this.replaceId)) : (this.newData = _.filter(this.data, function(a) {
      return _.contains(c, a.article)
    }, this), void app.$document.trigger("ReplaceResult"))
  }
};
var app = app || {};
app.App = function() {
  this.initialize()
}, app.App.prototype = {
  initialize: function() {
    setTimeout(function() {
      app.$body.removeClass("preload")
    }, 30), this.initStartViews(), this.onContentLoaded(), app.$document.on("ContentLoaded", _.bind(this.onContentLoaded, this)), app.$document.on("ButtonReleased", _.bind(this.onButtonReleased, this)), app.$document.on("RequestResult", _.bind(this.onRequestResult, this)), app.$document.on("StartImagesPreloaded", _.bind(this.checkImagePreloaded, this)), app.$window.resize(), app.$document.on("touchstart", _.bind(this.onTouchStart, this)), app.$document.on("MSPointerDown", _.bind(this.onTouchStart, this)), app.utils.detectMobile.Android() && app.$body.addClass("is_android")
  }, onTouchStart: function() {
    app.config.isTap = !0
  }, initStartViews: function() {
    app.model = new app.Model, new app.Layout, new app.NavSections
  }, onContentLoaded: function() {
    this.$introWrapper = app.$(".ib-intro-wrapper"), this.$intro = app.$(".ib-intro"), this.$header = app.$(".ib-header"), this.$list = app.$(".ib-list"), app.progress = new app.Progress, app.intro = new app.Intro, app.manual = new app.Manual, app.share = new app.Share, app.speaker = new app.Speaker, app.cheers = new app.Cheers, app.startButton = new app.StartButton, app.header = new app.Header, app.list = new app.List, new app.Statistics, this.$intro.removeClass("is_hide"), app.$(".ib-header-repeat").click(_.bind(this.onRepeat, this))
  }, onButtonReleased: function() {
    this.$intro.addClass("is_release"), app.speaker.stop("ticking"), this.checkPreloadedCount = 0, app.model.request(app.startButton.sum);
    for (var a = [100, 1e3, 3e3, 5e3, 1e4, 15e3, 3e4, 6e4, 1e5], b = 100, c = 0; a[c] < app.startButton.sum && c < a.length - 1; c++)b = a[c + 1];
    app.utils.event("nav", "start_button", b)
  }, onRequestResult: function() {
    app.speaker.stop("ticking"), app.speaker.sounds.ticking.volume(0);
    setTimeout(_.bind(this.checkImagePreloaded, this), 1500)
  }, checkImagePreloaded: function() {
    if (this.checkPreloadedCount++, 2 == this.checkPreloadedCount) {
      this.$intro.addClass("is_end"), app.cheers.hide(), app.speaker.play("SoftBell_Done5"), app.$body.addClass("is_list");
      var a = this;
      setTimeout(function() {
        a.$header.removeClass("is_hide"), a.$list.removeClass("is_hide"), app.speaker.play("Rainbow1"), app.list.onStart()
      }, 300), setTimeout(function() {
        a.$intro.removeClass("is_start is_end is_release").addClass("is_hide"), a.$introWrapper.hide()
      }, 1500)
    }
  }, onRepeat: function() {
    this.$intro.hasClass("is_hide") && (app.model.sum = 0, app.$body.removeClass("is_list"), this.$list.addClass("is_hide"), app.startButton.reset(), this.$intro.removeClassDelayed("is_hide"), this.$header.addClass("is_hide"), this.$introWrapper.show(), app.speaker.play("Rainbow1"))
  }
};
var app = app || {};
app.Cheers = function() {
  this.initialize()
}, app.Cheers.prototype = {
  SHOW_DELAY: 80, initialize: function() {
    this.$el = app.$(".cheers__text"), this.template = _.template(app.$("#word-template").html())
  }, reset: function() {
    this.$el.empty(), this.$current = null, this.currentWords = [], this.last = -1
  }, update: function(a) {
    this.disabled = !1;
    var b = Math.floor(a * (app.config.cheers.length - 1));
    b > this.last && (this.last = b, this.changeItem(app.config.cheers[b]))
  }, hide: function() {
    if (this.disabled = !0, this.$current) {
      this.currentWords = _.sortBy(this.currentWords, function(a) {
        return 1e3 * a.offset().top - a.offset().left
      }), _.each(this.currentWords, function(a, b) {
        setTimeout(function() {
          a.addClass("is_remove")
        }, b * this.SHOW_DELAY)
      }, this);
      var a = this.$current;
      setTimeout(function() {
        a.remove()
      }, this.currentWords.length * this.SHOW_DELAY + 1e3)
    }
  }, changeItem: function(a) {
    var b = this;
    if (this.$current) {
      this.currentWords = _.sortBy(this.currentWords, function(a) {
        return 1e3 * a.offset().top - a.offset().left
      }), _.each(this.currentWords, function(a, b) {
        setTimeout(function() {
          a.addClass("is_remove")
        }, b * this.SHOW_DELAY)
      }, this);
      var c = this.$current;
      setTimeout(function() {
        c.remove()
      }, this.currentWords.length * this.SHOW_DELAY + 1e3), setTimeout(function() {
        b.setText(a)
      }, this.currentWords.length * this.SHOW_DELAY + 200)
    } else setTimeout(function() {
      b.setText(a)
    }, 3 * this.SHOW_DELAY + 500)
  }, setText: function(a) {
    if (!this.disabled) {
      var b = a.text.split(" "), c = a.size || 1, d = app.$('<span class="cheers__wrapper"></span>');
      d.css("font-size", c + "em"), this.$current = d, this.currentWords = [];
      var e = a.hasSum;
      e || (this.$sum = null), _.each(b, function(a, b) {
        var c = {text: a}, f = app.$(this.template(c));
        e && "0" == a && (this.$sum = f.find(".value").addClass("js-progress-sum")), d.append(f), this.currentWords.push(f), setTimeout(function() {
          f.removeClass("is_hide")
        }, b * this.SHOW_DELAY + 30)
      }, this), this.$el.append(d)
    }
  }, setSum: function(a) {
    this.$sum && this.$sum.text(a)
  }
};
var app = app || {};
app.Hamburger = function() {
  this.initialize()
}, app.Hamburger.prototype = {
  initialize: function() {
    this.$nav = app.$(".nav__list"), app.$(".hamburger").click(_.bind(this.onClick, this))
  }, onClick: function() {
    this.$nav.toggle()
  }
};
var app = app || {};
app.Header = function() {
  this.initialize()
}, app.Header.prototype = {
  initialize: function() {
    this.$amount = app.$(".ib-header__amount"), this.$sum = app.$(".ib-sum__value"), this.$change = app.$(".ib-change__value"), this.$mobileSearchButton = app.$(".header-mobile-nav__item_search"), this.$mobileSearch = app.$(".header__mobile-search"), app.$document.on("RequestResult", _.bind(this.render, this)), app.$document.on("ReplaceResult", _.bind(this.render, this)), this.$mobileSearchButton.click(_.bind(this.toggleMobileSearch, this))
  }, render: function() {
    var a = app.model.amount;
    a += " " + app.utils.declineNumeral(a, ["товар", "товара", "товаров"]), this.$amount.text(a), this.$sum.text(app.utils.formatNumber(app.model.sum)), this.$change.text(app.model.change)
  }, toggleMobileSearch: function() {
    this.$mobileSearch.slideToggle(300)
  }
};
var app = app || {};
app.Intro = function() {
  this.initialize()
}, app.Intro.prototype = {
  initialize: function() {
    this.$wrapper = app.$(".ib-intro-wrapper"), this.$el = app.$(".ib-intro"), this.HEIGHT = 530, app.$window.resize(_.bind(this.onResize, this))
  }, onResize: function() {
  }
};
var app = app || {};
app.Layout = function() {
  this.initialize()
}, app.Layout.prototype = {
  initialize: function() {
    app.$window.resize(_.bind(this.onResize, this))
  }, initWrapper: function() {
    app.$("#main .gridRow:first").remove();
    var a = app.$(".gridComponent");
    a.removeAttr("style"), app.$wrapper = app.$("<div></div>"), app.$wrapper.addClass("ib-wrapper"), a.append(app.$wrapper)
  }, initTemplate: function() {
    app.$wrapper.load(app.url + "template.html", function() {
      app.$document.trigger("ContentLoaded")
    })
  }, onResize: function() {
  }
};
var app = app || {};
app.List = function() {
  this.initialize()
}, app.List.prototype = {
  RESOLUTION: 15,
  ITEM_SET: [.2, .8, .1, .3, 0, .5, 0, 0, .2, .1, 1, 0, .3, 0, .1, .7, .2, .3, 0],
  greetingsIndex: 0,
  usedGreetings: {},
  initialize: function() {
    this.$el = app.$(".ib-list"), this.template = _.template(app.$("#ib-item-template").html()), app.$document.on("click", ".ib-item__button_add", _.bind(this.onAdd, this)), app.$document.on("click", ".ib-item__button_replace", _.bind(this.onReplace, this)), app.$document.on("mouseenter", ".ib-item", _.bind(this.onOver, this)), app.$document.on("click", ".ib-item", _.bind(this.onClick, this)), app.$document.on("click", ".ib-item__bubble", _.bind(this.onBubbleClick, this)), app.$document.on("RequestResult", _.bind(this.render, this)), app.$document.on("ReplaceResult", _.bind(this.onReplaceResult, this)), app.$(".ib-header__disco").click(_.bind(this.rebuildGrid, this)), app.$window.scroll(_.bind(this.onScroll, this)).scroll(), app.$window.resize(_.bind(this.onResize, this))
  },
  onOver: function() {
    this.replace || app.config.isTap || app.speaker.play("Wood_Note3")
  },
  onClick: function(a) {
    var b = app.$(a.currentTarget);
    if (this.$el.hasClass("is_moving"))return void a.preventDefault();
    if (!app.config.isTap)return app.utils.event("items", "open page", b.data("id")), !0;
    if (!this.replace) {
      if (app.speaker.play("Wood_Note3"), b.hasClass("is_hover"))return app.utils.event("items", "open page", b.data("id")), !0;
      app.$(".ib-item").removeClass("is_hover"), b.addClass("is_hover")
    }
    a.preventDefault()
  },
  resetFindData: function() {
    var a = Math.floor(this.data.length / 15 * 1300 / this.RESOLUTION) * Math.floor(this.LIST_WIDTH / this.RESOLUTION);
    this.findData = {
      pos: 0,
      rects: [],
      points: new Array(a),
      maxHeight: 0,
      sets: {},
      listWidth: Math.floor(this.LIST_WIDTH / this.RESOLUTION),
      minPos: []
    }
  },
  shuffleData: function() {
    var a = {};
    this.data = _.sortBy(this.data, function(b) {
      return b.ikea_set ? (a[b.ikea_set] || (a[b.ikea_set] = 1e3 * -Math.random()), a[b.ikea_set] + Math.random()) : Math.random()
    }), _.each(this.data, function(a, b) {
      a.scale = this.ITEM_SET[b % this.ITEM_SET.length] * (this.ITEM_MAX_SCALE - this.ITEM_MIN_SCALE) + this.ITEM_MIN_SCALE, a.isOld = !1, a.num = b
    }, this)
  },
  render: function() {
    this.data = app.model.data, this.$el.empty(), this.resetFindData(), this.shuffleData(), this.startTime = (new Date).getTime(), _.each(this.data, _.bind(this.renderItem, this)), this.windowTop = app.$window.scrollTop() - this.$el.offset().top, this.windowBottom = this.windowTop + app.$window.height(), this.startScreenData = this.getWindowItems(), this.startIds = _.map(this.startScreenData, function(a) {
      return a.article
    }), this.startIds = _.first(this.startIds, 10), this.startIds = this.startIds.join(","), this.preloadStartImages(this.startScreenData), _.each(this.data, _.bind(this.placeItem, this)), _.each(this.startScreenData, function(a) {
      a.$el.addClass("is_start-screen is_start-screen-transition"), app.utils.setCoords(a.$el, this.LIST_WIDTH / 2 - a.realWidth / 2, app.$window.height() / 3 - a.realHeight / 2)
    }, this), this.$el.height(this.findData.maxHeight * this.RESOLUTION), this.calcDensity()
  },
  preloadStartImages: function(a) {
    var b = _.map(a, function(a) {
      return a.image
    });
    app.utils.preload(b, _.bind(this.preloadStartImagesProgress, this)), _.each(a, this.enableItemImage)
  },
  preloadStartImagesProgress: function(a) {
    app.progress.set(a), 1 == a && (setTimeout(function() {
      app.$document.trigger("StartImagesPreloaded")
    }, 500), _.each(this.data, this.enableItemImage))
  },
  onStart: function() {
    _.each(this.startScreenData, function(a) {
      var b = Math.sqrt(2 * Math.pow(a.x + a.width / 2 - this.findData.listWidth / 2, 2) + Math.pow(a.y + a.height / 2 - 330 / this.RESOLUTION, 2)), c = 7 * b;
      c += 50 * (.5 - Math.random()), c = Math.floor(c), c = Math.max(c, 30);
      a.$el.attr("style");
      a.$el.css("z-index", 1e3 - c);
      var d = this;
      setTimeout(function() {
        a.$el.removeClass("is_start-screen"), app.utils.setCoords(a.$el, a.x * d.RESOLUTION, a.y * d.RESOLUTION)
      }, c), setTimeout(function() {
        a.$el.removeClass("is_start-screen-transition").css("z-index", "")
      }, c + 1e3)
    }, this), this.checkBubbleTimeoutId && clearTimeout(this.checkBubbleTimeoutId), setTimeout(_.bind(this.checkBubble, this), 2e3)
  },
  checkBubble: function() {
    if (!this.$el.hasClass("is_hide")) {
      var a = _.filter(this.data, function(a) {
        var b = a.y * this.RESOLUTION;
        return a.text = a.greetings.length ? _.sample(a.greetings) : app.config.greetings[this.greetingsIndex % app.config.greetings.length], !this.usedGreetings[a.text] && b + a.height * this.RESOLUTION < this.windowBottom && b > this.windowTop && !a.isBubbleShowed
      }, this), b = _.sample(a);
      b && !this.$el.hasClass("is_moving") && (this.showBubble(b), b.isBubbleShowed = !0, b.greetings.length ? this.usedGreetings[b.text] = !0 : this.greetingsIndex++), this.checkBubbleTimeoutId = setTimeout(_.bind(this.checkBubble, this), 8e3 + 6e3 * Math.random())
    }
  },
  showBubble: function(a) {
    var b = app.$('<div class="ib-item__bubble"></div>'), c = app.$('<div class="bubble"></div>');
    b.append(c);
    var d = !1;
    a.$el.hasClass("is_right") && (c.addClass("is_right"), d = !0), c.html(a.text), c.width(app.utils.linear(4, 13, (a.text.length - 6) / 27) + "em"), this.$el.append(b);
    var e, f;
    e = d ? a.x * this.RESOLUTION + .25 * a.realWidth - c.outerWidth() : a.x * this.RESOLUTION + .75 * a.realWidth, f = a.y * this.RESOLUTION + .1 * a.realHeight, app.utils.setCoords(b, e, f), b.addClassDelayed("is_show");
    var g = a.text.length / 28 * 2e3;
    g = Math.max(g, 1e3), setTimeout(function() {
      b.removeClass("is_show")
    }, g), setTimeout(function() {
      b.remove()
    }, g + 1e3)
  },
  rebuildGrid: function() {
    app.$body.hasClass("is_list") && (this.resetFindData(), this.shuffleData(), this.startTime = (new Date).getTime(), _.each(this.data, function(a) {
      this.findPlace(a)
    }, this), _.each(this.data, _.bind(this.placeItem, this)), this.$el.height(this.findData.maxHeight * this.RESOLUTION), this.calcDensity())
  },
  calcDensity: function() {
    var a = (this.findData.maxHeight * this.RESOLUTION * this.LIST_WIDTH, 0);
    _.each(this.data, function(b) {
      a += b.realWidth * b.realHeight
    }, this)
  },
  renderItem: function(a) {
    this.prepareItem(a), this.findPlace(a)
  },
  prepareItem: function(a) {
    a.greetings.length ? a.greetings = a.greetings.split(";") : a.greetings = [], a.formattedPrice = app.utils.formatNumber(a.price);
    var b = app.$(this.template(a));
    b.addClass(a.size), a.$el = b, a.$item = a.$el.find(".ib-item"), a.$info = a.$el.find(".ib-item__info"), a.$image = a.$el.find(".ib-item__image"), a.image = "photos/" + a.article + ".png", this.$el.append(b)
  },
  enableItemImage: function(a) {
    a.$image.css("background-image", 'url("' + a.image + '")')
  },
  findPlace: function(a, b, c, d) {
    var e = a.scale, f = a.size, g = a.ikea_set, h = "undefined" != typeof b && "undefined" != typeof c, i = this.findData.listWidth / 3;
    h && (i = this.findData.listWidth / 10), !h && g && this.findData.sets[g] && (b = this.findData.sets[g].x, c = this.findData.sets[g].y, h = !0, a.background = this.findData.sets[g].color);
    var j = this.IMAGE_BASE_SIZE * e, k = this.IMAGE_BASE_SIZE * e;
    switch (f) {
      case"V1":
        k *= 1.4 / 1.2, j /= 1.2;
        break;
      case"V2":
        k *= 1.8 / 1.4, j /= 1.4;
        break;
      case"H1":
        j *= 1.67 / 1.5, k /= 1.5;
        break;
      case"H2":
        j *= 1.165, k /= 2
    }
    j > this.IMAGE_MAX_SIZE && (k *= this.IMAGE_MAX_SIZE / j, j = this.IMAGE_MAX_SIZE), k > this.IMAGE_MAX_SIZE && (j *= this.IMAGE_MAX_SIZE / k, k = this.IMAGE_MAX_SIZE), a.imageRatio || (a.imageRatio = k / j);
    var l = j;
    a.$el.width(l);
    var m = k + a.$info.height() + this.ITEM_EXTRA_HEIGHT, n = Math.floor(l / this.RESOLUTION), o = Math.floor(m / this.RESOLUTION);
    h && (b -= Math.floor(n / 2), c -= Math.floor(o / 2));
    var p = this.findData.rects, q = this.findData.listWidth, r = 0;
    h || (r = Math.max(r, this.checkMinPos(n, o)));
    var s = 0;
    for (r--; ;) {
      r++;
      var t, u, v = r;
      if (h) {
        var w = app.utils.spiral(r - 1);
        if (t = b + w[0], u = c + w[1], 0 > t || 0 > u || t > this.findData.listWidth)continue;
        v = u * q + t
      } else t = v % q, u = Math.floor(v / q), 0 == t && (p = this.filterRects(p, u - 100));
      if (!(d && c > u || this.findData.points[v])) {
        var x = t, y = t + n, z = u, A = u + o;
        if (s++, this.checkPlace(p, x, y, z, A)) {
          var B, C, D, E;
          if (0 > z - i)for (B = 0; z > B; B++)if (C = B + o, this.checkPlace(p, x, y, B, C)) {
            u = B, z = u, A = C, v = u * q + t;
            break
          }
          if (0 > x - i)for (D = 0; x > D; D++)if (E = D + n, this.checkPlace(p, D, E, z, A)) {
            t = D, x = t, y = E, v = u * q + t;
            break
          }
          if (y + i > this.findData.listWidth)for (E = this.findData.listWidth; E > y; E--)if (D = E - n, this.checkPlace(p, D, E, z, A)) {
            t = D, x = t, y = E, v = u * q + t;
            break
          }
          a.x = t, a.y = u, a.width = n, a.height = o, a.realWidth = l, a.realHeight = m, this.fillPlace(p, x, y, z, A), h || this.findData.minPos.push({
            width: n,
            height: o,
            pos: v
          }), this.findData.maxHeight = Math.max(this.findData.maxHeight, A), this.findData.pos = Math.max(this.findData.pos, v), g && !this.findData.sets[g] && (this.findData.sets[g] = {
            x: Math.floor(t + n / 2),
            y: Math.floor(u + o / 2),
            color: "#" + Math.floor(16777215 * Math.random()).toString(16)
          }, a.background = this.findData.sets[g].color);
          break
        }
        a.size || a.scale != this.ITEM_MIN_SCALE || (this.findData.points[q * u + t] = 1)
      }
    }
  },
  checkMinPos: function(a, b) {
    var c = 0;
    return _.each(this.findData.minPos, function(d) {
      a >= d.width && b >= d.height && (c = Math.max(c, d.pos))
    }, this), c
  },
  fillPlace: function(a, b, c, d, e) {
    var f = {left: b, right: c, top: d, bottom: e};
    this.findData.rects.push(f), a.push(f);
    for (var g = this.findData.listWidth, h = d; e >= h; h++)for (var i = b; c >= i; i++)this.findData.points[g * h + i] = 1
  },
  placeItem: function(a) {
    var b = a.$el;
    if (app.utils.setCoords(b, a.x * this.RESOLUTION, a.y * this.RESOLUTION), b.width(a.realWidth), b.height(a.realHeight), b.data("x", a.x), b.data("y", a.y), b.toggleClass("is_right", a.x + a.width / 2 > this.findData.listWidth / 2), a.isOld) {
      var c = a.y * this.RESOLUTION, d = a.oldY * this.RESOLUTION, e = c + a.realHeight < this.windowTop || c > this.windowBottom;
      d + a.realHeight < this.windowTop || d > this.windowBottom;
      e && b.addClass("is_teleport"), a.$item.removeAttr("style"), setTimeout(function() {
        a.$item.height() > a.realHeight && app.utils.setScale(a.$item, a.realHeight / a.$item.height())
      }, 1030)
    }
    a.isOld = !0, a.oldX = a.x, a.oldY = a.y, b.data("width", a.width), b.data("height", a.height)
  },
  checkPlace: function(a, b, c, d, e) {
    if (c > this.findData.listWidth || 0 > b || 0 > d)return !1;
    var f = _.filter(a, function(a) {
      return b <= a.right && a.left <= c && d <= a.bottom && a.top <= e
    });
    return !f.length
  },
  filterRects: function(a, b) {
    return _.filter(a, function(a) {
      return a.bottom >= b
    })
  },
  onAdd: function(a) {
    a.preventDefault(), a.stopPropagation();
    var b = app.$(a.currentTarget).closest(".ib-list__item");
    setTimeout(function() {
      b.addClass("is_added")
    }, 500);
    var c = b.data("id");
    if (!app.utils.isMobile(), !0) {
      var d = b.clone().removeClass("is_hover").addClass("is_no-transition");
      d.find(".ib-item").removeClass("is_hover"), app.$(".wrapper").append(d), app.utils.setTransform(d, ""), d.offset(b.offset()).addClass("is_basket");
      var e = parseInt(d.css("left").replace("px", "")), f = parseInt(d.css("top").replace("px", "")), g = this;
      setTimeout(function() {
        d.removeClass("is_no-transition");
        var a = g.LIST_WIDTH - e - d.width() / 2, b = app.$(".header-nav__item_buy").offset().top - f;
        app.utils.setTransform(d, "translateX(" + a + "px)"), app.utils.setTransform(d.find(".ib-item"), "translateY(" + b + "px)"), app.utils.setTransform(d.find(".ib-item__image"), "rotate(90deg) scale(0)")
      }, 30), setTimeout(function() {
        d.remove()
      }, 1030)
    }
    app.speaker.play("Swipe1"), app.$.get("http://www.ikea.com/webapp/wcs/stores/servlet/IrwWSInterestItemAdd?partNumber=" + c + "&langId=-31&storeId=23&listId=.&quantity=1", function(a) {
    }), app.utils.event("items", "add to basket", c)
  },
  onReplace: function(a) {
    if (!this.replace) {
      var b = app.$(a.currentTarget).closest(".ib-item"), c = b.data("id");
      this.replace = _.findWhere(this.data, {article: c.toString()}), setTimeout(function() {
        app.model.replace(c)
      }, 400);
      var d = this.replace.$el;
      d.addClass("is_remove"), this.replace.ikea_group && app.speaker.play(app.config.soundGroups[this.replace.ikea_group]), a.preventDefault(), a.stopPropagation(), app.utils.event("items", "replace", b.data("id"))
    }
  },
  prepareReplaceData: function() {
    app.$(".ib-item__bubble").removeClass("is_show"), this.startTime = (new Date).getTime();
    var a = this.replace.$el, b = parseInt(a.data("x")), c = parseInt(a.data("y")), d = parseInt(a.data("width")), e = parseInt(a.data("height")), f = this.replace.scale, g = this.data.indexOf(this.replace);
    b = Math.floor(b + d / 2), c = Math.floor(c + e / 2), a.remove();
    var h = {x: b, y: c, width: d, height: e, scale: f, index: g};
    return this.data = _.without(this.data, this.replace), h
  },
  onReplaceResult: function() {
    var a = this.prepareReplaceData();
    this.findData.maxHeight * this.RESOLUTION > this.windowBottom + .5 * app.$window.height() ? this.replaceSmart(a) : this.replaceDefault(a)
  },
  replaceDefault: function(a) {
    return this.resetFindData(), this.addReplaceItems(a), _.each(app.model.newData, function(a) {
      a.isNew = !0
    }, this), this.moveAllItems(a), this.$el.addClass("is_moving"), _.each(app.model.newData, _.bind(this.placeItem, this)), _.each(this.data, _.bind(this.placeItem, this)), this.data = this.data.concat(app.model.newData), !0
  },
  replaceSmart: function(a) {
    this.resetFindData(), this.addReplaceItems(a);
    var b = this.moveWindowItems(a);
    this.moveAllItems(a), this.$el.addClass("is_moving"), _.each(app.model.newData, _.bind(this.placeItem, this)), _.each(b, _.bind(this.placeItem, this)), _.each(this.data, _.bind(this.placeItem, this)), this.data = this.data.concat(app.model.newData).concat(b)
  },
  moveAllItems: function(a) {
    var b = _.map(this.data, _.clone);
    _.each(b, function(a) {
      a.type = "fake", this.findPlace(a)
    }, this);
    var c = b.concat(this.data);
    c = _.sortBy(c, function(b) {
      return b.isNew ? -(1 / 0) : Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)
    }, this), _.each(c, function(a) {
      if (!a.isUsed) {
        var d, e;
        if ("fake" == a.type ? (d = this.getClosest(this.data, a), e = a) : (e = this.getClosest(b, a), d = a), !d) {
          var f = _.filter(c, function(a) {
            return !a.isUsed
          });
          console.log(f)
        }
        d.isUsed = !0, e.isUsed = !0, d.scale = e.scale, d.x = e.x, d.y = e.y, d.width = e.width, d.height = e.height, d.realWidth = e.realWidth, d.realHeight = e.realHeight
      }
    }, this), _.each(this.data, function(a) {
      a.isUsed = !1, a.isNew = !1
    }, this)
  },
  addReplaceItems: function(a) {
    app.model.newData = _.shuffle(app.model.newData), _.each(app.model.newData, function(b) {
      b.scale = a.scale / app.model.newData.length, b.scale = Math.max(this.ITEM_MIN_SCALE, b.scale), b.scale = Math.min(this.ITEM_MAX_SCALE, b.scale), this.prepareItem(b), this.findPlace(b, a.x, a.y, !0), b.$el.addClass("is_hide is_new is_bounce")
    }, this);
    var b = _.map(app.model.newData, function(a) {
      return a.image
    });
    app.utils.preload(b, _.bind(this.preloadReplaceImagesProgress, this)), _.each(app.model.newData, this.enableItemImage)
  },
  preloadReplaceImagesProgress: function(a) {
    1 == a && this.replaceFinish()
  },
  moveWindowItems: function(a) {
    var b = this.getWindowItems();
    return this.data = _.difference(this.data, b), b = _.sortBy(b, function(b) {
      return Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2)
    }, this), _.each(b, function(a) {
      this.findPlace(a, Math.floor(parseInt(a.$el.data("x")) + parseInt(a.$el.data("width") / 2)), Math.floor(parseInt(a.$el.data("y")) + parseInt(a.$el.data("height") / 2)))
    }, this), b
  },
  getWindowItems: function() {
    return _.filter(this.data, function(a) {
      var b = a.y * this.RESOLUTION;
      return b < this.windowBottom && b + a.realHeight > this.windowTop
    }, this)
  },
  replaceFinish: function() {
    this.data = _.sortBy(this.data, function(a) {
      return 1e3 * a.y + a.x
    }, this), _.each(this.data, function(a, b) {
      a.num = b
    }, this), setTimeout(function() {
      app.$(".ib-list__item.is_teleport").removeClass("is_teleport")
    }, 200), setTimeout(function() {
      app.$(".ib-list__item.is_hide").removeClass("is_hide")
    }, 200);
    var a = this;
    setTimeout(function() {
      app.$(".ib-list__item.is_new").removeClass("is_new"), a.replace = null
    }, 1400), setTimeout(function() {
      a.$el.removeClass("is_moving")
    }, 1300), this.$el.height(this.findData.maxHeight * this.RESOLUTION), this.calcDensity()
  },
  getClosest: function(a, b) {
    var c = 1 / 0, d = null;
    return _.each(a, function(a) {
      if (!a.isUsed) {
        var e = Math.pow(b.x + b.width / 2 - (a.x + a.width / 2), 2) + Math.pow(b.y + b.height / 2 - (a.y + a.height / 2), 2);
        c > e && a.size == b.size && (c = e, d = a)
      }
    }, this), d
  },
  onScroll: function() {
    this.windowTop = app.$window.scrollTop() - this.$el.offset().top, this.windowBottom = this.windowTop + app.$window.height()
  },
  onBubbleClick: function(a) {
    var b = app.$(a.currentTarget);
    b.removeClass("is_show")
  },
  onResize: function() {
    var a = Math.min(app.$window.width() - 26, 1060);
    this.LIST_WIDTH != a && (this.LIST_WIDTH = a, this.ITEM_EXTRA_HEIGHT = 5 + 10 * this.LIST_WIDTH / 1060, app.utils.isMobile() ? (this.ITEM_MIN_SCALE = 1, this.ITEM_MAX_SCALE = 2, app.$window.width() <= 400 ? (this.IMAGE_BASE_SIZE = Math.floor(this.LIST_WIDTH / 4), this.IMAGE_MAX_SIZE = Math.floor(.66 * this.LIST_WIDTH)) : (this.IMAGE_BASE_SIZE = 98, this.IMAGE_MAX_SIZE = Math.floor(.5 * this.LIST_WIDTH), this.ITEM_MAX_SCALE = this.LIST_WIDTH / 98 * .5, this.IMAGE_MAX_SIZE = Math.min(this.IMAGE_MAX_SIZE, 500))) : (this.ITEM_MIN_SCALE = .6, this.ITEM_MAX_SCALE = 2, this.IMAGE_BASE_SIZE = 210, this.IMAGE_MAX_SIZE = 500), clearTimeout(this.rebuildId), this.rebuildId = setTimeout(_.bind(this.rebuildGrid, this), 100))
  }
}, app.utils = app.utils || {}, app.utils.spiral = function(a) {
  var b = Math.floor((Math.sqrt(a + 1) - 1) / 2) + 1, c = 8 * b * (b - 1) / 2, d = 2 * b, e = (1 + a - c) % (8 * b), f = [0, 0, b];
  switch (Math.floor(e / (2 * b))) {
    case 0:
      f[0] = e - b, f[1] = -b;
      break;
    case 1:
      f[0] = b, f[1] = e % d - b;
      break;
    case 2:
      f[0] = b - e % d, f[1] = b;
      break;
    case 3:
      f[0] = -b, f[1] = b - e % d
  }
  return f
}, app.utils.insertArrayAt = function(a, b, c) {
  return a.slice(0, c).concat(b).concat(a.slice(c))
}, app.utils.formatPercent = function(a) {
  return Math.round(100 * a) + "%"
};
var app = app || {};
app.Manual = function() {
  this.initialize()
}, app.Manual.prototype = {
  initialize: function() {
    this.$el = app.$(".ib-manual"), this.$button = app.$(".js-show-manual"), this.$button.click(_.bind(this.toggle, this))
  }, toggle: function() {
    this.$el.find("img").each(function() {
      app.$(this).attr("src", app.$(this).data("src"))
    }), this.$el.is(":visible") ? (this.$el.hide(), app.$body.removeClass("is_popup")) : (this.$el.addClass("is_hide").show().removeClassDelayed("is_hide"), app.$body.addClass("is_popup"))
  }
};
var app = app || {};
app.NavSections = function() {
  this.initialize()
}, app.NavSections.prototype = {
  initialize: function() {
    this.$el = app.$(".nav__sections"), this.$button = app.$(".nav__item_all-sections"), this.$button.mouseenter(_.bind(this.show, this)), this.$button.mouseleave(_.bind(this.hide, this)), this.$el.mouseenter(_.bind(this.onElOver, this)), this.$el.mouseleave(_.bind(this.hide, this))
  }, onElOver: function() {
    this.hideId && clearTimeout(this.hideId), this.hideId2 && clearTimeout(this.hideId2)
  }, show: function() {
    this.hideId && clearTimeout(this.hideId), this.hideId2 && clearTimeout(this.hideId2), this.$el.show().addClassDelayed("is_active")
  }, hide: function() {
    this.hideId = setTimeout(_.bind(this.doHide, this), 50)
  }, doHide: function() {
    this.$el.removeClass("is_active");
    var a = this;
    this.hideId2 = setTimeout(function() {
      a.$el.hide()
    }, 500)
  }
};
var app = app || {};
app.Progress = function() {
  this.initialize()
}, app.Progress.prototype = {
  CANVAS_SIZE: 543, LINE_WIDTH: 12, initialize: function() {
    this.$el = app.$(".radial-progress__canvas"), this.$progress = app.$(".radial-progress"), this.isEnabled = !1, this.value = 0, this.canvasValue = 0, this.initCanvas()
  }, onResize: function() {
    setTimeout(_.bind(this.initCanvas, this), 1500)
  }, initCanvas: function() {
    this.CANVAS_SIZE = 543, this.LINE_WIDTH = 12 / 543 * this.CANVAS_SIZE, this.$el[0].width = this.CANVAS_SIZE, this.$el[0].height = this.CANVAS_SIZE, this.ctx = this.$el[0].getContext("2d"), this.circ = 2 * Math.PI, this.quart = Math.PI / 2, this.imd = this.ctx.getImageData(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE), this.ctx.beginPath(), this.ctx.strokeStyle = "#ffe161", this.ctx.lineCap = "square", this.ctx.closePath(), this.ctx.fill(), this.ctx.lineWidth = this.LINE_WIDTH, this.update(this.canvasValue)
  }, enable: function() {
    this.isEnabled = !0, this.speed = 1e-4, this.startTime = (new Date).getTime(), this.canvasValue = 0, this.set(this.value), requestAnimFrame(_.bind(this.onFrame, this))
  }, onFrame: function() {
    this.canvasValue += this.speed, this.canvasValue = Math.min(1, this.canvasValue), this.update(this.canvasValue), this.isEnabled && requestAnimFrame(_.bind(this.onFrame, this))
  }, disable: function() {
    this.isEnabled = !1, this.canvasValue = 0, this.update(this.canvasValue), clearInterval(this.id)
  }, set: function(a) {
    this.value = a, this.value && (this.speed = (this.value - this.canvasValue) / 40, this.speed = Math.max(0, this.speed))
  }, update: function(a) {
    this.ctx.putImageData(this.imd, 0, 0), this.ctx.beginPath(), this.ctx.arc(this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2 - this.LINE_WIDTH / 2, -this.quart, this.circ + this.circ * a - this.quart, !0), this.ctx.stroke()
  }
}, window.requestAnimFrame = function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(a, b) {
      window.setTimeout(a, 1e3 / 60)
    }
}();
var app = app || {};
app.Share = function() {
  this.initialize()
}, app.Share.prototype = {
  initialize: function() {
    this.$el = app.$(".ib-share"), this.$button = app.$(".js-show-share"), this.$button.click(_.bind(this.toggle, this)), app.$(".ib-share__logo_fb").click(_.bind(this.onFb, this)), app.$(".ib-share__logo_vk").click(_.bind(this.onVk, this)), app.$(".ib-share__logo_od").click(_.bind(this.onOd, this)), app.$(".ib-share__logo_tw").click(_.bind(this.onTw, this))
  }, toggle: function() {
    this.$el.is(":visible") ? (this.$el.hide(), app.$body.removeClass("is_popup")) : (this.$el.addClass("is_hide").show().removeClassDelayed("is_hide"), app.$body.addClass("is_popup"))
  }, getUrl: function(a) {
    var b = "http://www.ikea.com/ext/ru/knopka/";
    if (app.model.sum) {
      var c = Math.floor(9007199254740991 * Math.random());
      b += "share/" + c + "/?sum=" + app.model.sum + "&count=" + app.model.amount, app.list.startIds && (b += "&list=" + app.list.startIds)
    } else b += "share/?id=" + _.random(1, 3);
    return "vkontakte" == a && (b += "&vk"), b
  }, share: function(a) {
    var b = this.getUrl(a), c = "http://share.yandex.ru/go.xml?service=" + a + "&url=" + encodeURIComponent(b) + "&title=" + encodeURIComponent("ВСЁВОЗМОЖНАЯ КНОПКА: ДЕРЖИТЕ СКОЛЬКО ХОТИТЕ!"), d = 800, e = 500, f = (window.screen.width - d) / 2, g = (window.screen.height - e) / 2, h = window.open(c, "vote", "height=" + e + ",width=" + d + ",top=" + g + ",left=" + f);
    h.focus()
  }, onVk: function() {
    this.share("vkontakte")
  }, onFb: function() {
    this.share("facebook")
  }, onTw: function() {
    this.share("twitter")
  }, onOd: function() {
    this.share("odnoklassniki")
  }
};
var app = app || {};
app.Speaker = function() {
  this.initialize()
}, app.Speaker.prototype = {
  initialize: function() {
    this.enabled = !0, this.isInit = !1, this.$el = app.$(".ib-sound-button"), this.$el.click(_.bind(this.toggle, this)), app.$document.on("ButtonDown", _.bind(this.initSounds, this)), this.initStartSounds()
  }, initSounds: function() {
    this.isInit || (_.each(app.config.sounds, function(a) {
      this.sounds[a] = new Howl({urls: ["mp3/" + a + ".mp3"], volume: 1})
    }, this), this.isInit = !0, app.speaker.sounds.Wood_Note3.volume(.5))
  }, initStartSounds: function() {
    this.sounds = {}, _.each(app.config.startSounds, function(a) {
      this.sounds[a] = new Howl({urls: ["mp3/" + a + ".mp3"], volume: 1})
    }, this)
  }, play: function(a, b) {
    this.sounds[a] && this.enabled && (b && (this.sounds[a].loop = !0), this.sounds[a].play())
  }, stop: function(a) {
    this.sounds[a] && this.enabled && this.sounds[a].stop()
  }, toggle: function() {
    this.$el.toggleClass("is_active"), this.enabled = this.$el.hasClass("is_active")
  }
};
var app = app || {};
app.StartButton = function() {
  this.initialize()
}, app.StartButton.prototype = {
  TIME: 9e4, MAX_SUM: 1e5, START_SUM: 6, CHEER_DELAY: 0, initialize: function() {
    this.$intro = app.$(".ib-intro"), app.utils.getParameter("time") && (this.TIME = 1e3 * parseInt(app.utils.getParameter("time"))), this.sum = 0, this.isPressed = !1, this.timingFunction = app.utils.bezier(.95, .05, .795, .035, 1e3 / 60 / 1 / 4), this.$el = app.$(".ib-start-button"), this.$wrapper = this.$el.find(".ib-start-button__wrapper"), this.$value = app.$(".ib-start__price-value"), this.$progress = app.$(".ib-start-button__progress"), this.$manualLink = app.$(".ib-controls__manual-link"), this.$el.mousedown(_.bind(this.onMouseDown, this)), this.$el.mouseup(_.bind(this.onMouseUp, this)), this.$el.mouseout(_.bind(this.onMouseUp, this)), this.$el.on("touchstart", _.bind(this.onTouchStart, this)), this.$el.on("touchend", _.bind(this.onTouchEnd, this)), this.$el.on("MSPointerDown", _.bind(this.onTouchStart, this)), this.$el.on("MSPointerUp", _.bind(this.onTouchEnd, this)), window.addEventListener("orientationchange", _.bind(this.onMouseUp, this)), app.$document.keydown(_.bind(this.onKeyDown, this)), app.$document.keyup(_.bind(this.onKeyUp, this))
  }, onTouchStart: function(a) {
    app.config.isTap = !0, this.onMouseDown(), a.preventDefault()
  }, onTouchEnd: function(a) {
    this.onMouseUp(), a.preventDefault()
  }, onKeyDown: function(a) {
    32 != a.keyCode || this.$intro.hasClass("is_hide") || (this.onMouseDown(), a.preventDefault())
  }, onKeyUp: function(a) {
    32 != a.keyCode || this.$intro.hasClass("is_hide") || (this.onMouseUp(), a.preventDefault())
  }, onMouseDown: function() {
    this.$intro.hasClass("is_release") || 1 == this.isPressed || (app.speaker.play("Click_Note1"), app.speaker.enabled && app.speaker.sounds.ticking.loop(!0).volume(0).play().fadeIn(.05, 1e3), this.isPressed = !0, this.startTime = (new Date).getTime(),
      this.sum = 0, window.requestAnimFrame(_.bind(this.onFrame, this)), this.$intro.addClass("is_start is_pressed"), app.cheers.reset(), this.$manualLink.addClass("is_hide"), app.$document.trigger("ButtonDown"))
  }, onMouseUp: function() {
    app.speaker.stop("ticking"), app.speaker.sounds.ticking.volume(0), this.isPressed && (this.isPressed = !1, this.isStop = !0, this.$intro.removeClass("is_pressed"), app.speaker.play("Space_Note1"))
  }, onFrame: function() {
    var a = (new Date).getTime(), b = a - this.startTime, c = b / this.TIME, d = this.timingFunction(b / this.TIME);
    this.sum = parseInt(d * (this.MAX_SUM - this.START_SUM)) + this.START_SUM, this.sum = Math.min(this.sum, this.MAX_SUM);
    var e = this.sum < 1e3 ? this.sum : app.utils.formatNumber(this.sum);
    return this.$value.text(e), app.cheers.setSum(e), c > this.CHEER_DELAY && app.cheers.update((c - this.CHEER_DELAY) / (1 - this.CHEER_DELAY)), this.isStop ? (this.isStop = !1, app.$document.trigger("ButtonReleased"), void this.startProgress()) : void(this.isPressed && window.requestAnimFrame(_.bind(this.onFrame, this)))
  }, startProgress: function() {
    app.cheers.hide(), this.$progress.show().addClassDelayed("is_show"), setTimeout(function() {
      app.progress.enable()
    }, 930)
  }, reset: function() {
    this.sum = 0, this.$value.text(0), this.$progress.hide().removeClass("is_show"), app.progress.disable(), this.$manualLink.removeClass("is_hide")
  }
};
var app = app || {};
app.Statistics = function() {
  this.initialize()
}, app.Statistics.prototype = {
  initialize: function() {
    app.$(".header-logo__link").clickEvent("external", "header", "logo"), app.$(".header a").not(".header-logo__link").click(function() {
      app.utils.event("external", "header", app.$(this).attr("href"))
    }), app.$(".nav a").click(function() {
      app.utils.event("external", "nav", app.$(this).attr("href"))
    }), app.$(".footer a").click(function() {
      app.utils.event("external", "footer", app.$(this).attr("href"))
    }), app.$(".ib-sound-button").clickEvent("sound", "toggle"), app.$(".ib-share__logo_fb").click(function() {
      app.model.sum ? app.utils.event("share", "list", "fb") : app.utils.event("share", "main", "fb")
    }), app.$(".ib-share__logo_vk").click(function() {
      app.model.sum ? app.utils.event("share", "list", "vk") : app.utils.event("share", "main", "vk")
    }), app.$(".ib-share__logo_tg").click(function() {
      app.model.sum ? app.utils.event("share", "list", "tg") : app.utils.event("share", "main", "tg")
    }), app.$(".ib-share__logo_od").click(function() {
      app.model.sum ? app.utils.event("share", "list", "od") : app.utils.event("share", "main", "od")
    }), app.$(".ib-share__logo_tw").click(function() {
      app.model.sum ? app.utils.event("share", "list", "tw") : app.utils.event("share", "main", "tw")
    }), app.$(".ib-share__logo_wa").click(function() {
      app.model.sum ? app.utils.event("share", "list", "wa") : app.utils.event("share", "main", "wa")
    }), app.$(".js-show-manual").clickEvent("nav", "how it works"), app.$(".js-show-share").clickEvent("nav", "share"), app.$(".ib-header-repeat").clickEvent("nav", "restart")
  }
};
var app = app || {};
app.config = {
  isTap: !1,
  cheers: [{sum: 100, text: "Отлично начали!"}, {sum: 200, text: "Дальше еще интереснее…"}, {
    sum: 500,
    text: "Прекрасно жмете!"
  }, {sum: 1300, text: "Браво 0 раз!", hasSum: !0}, {sum: 1500, text: "Не останавливайтесь!"}, {
    sum: 2e3,
    text: "…и у вас красивый палец"
  }, {sum: 4e3, text: "Поражаемся силе вашего пальца!"}, {sum: 4500, text: "Вы же пальцем нажимаете?.."}, {
    sum: 4600,
    text: "…или сели на&nbsp;кнопку? 😊"
  }, {sum: 4800, text: "ОГО!!!!"}, {
    sum: 5e3,
    text: "Так еще никто не&nbsp;нажимал – снимаем шляпу!",
    size: .9
  }, {sum: 5300, text: "Поднажмите еще…"}, {sum: 5900, text: "С вами так здорово!"}, {
    sum: 6500,
    text: "Чувствуется, вы соскучились по ИКЕА",
    size: .9
  }, {sum: 8e3, text: "И это только начало, не правда ли?"}, {sum: 8350, text: "18500 слов восхищения!"}, {
    sum: 1e4,
    text: "Вот это да!"
  }, {sum: 15e3, text: "Если не хватит рук – у нас есть доставка!"}, {
    sum: 2e4,
    text: "Вы даже не&nbsp;представляете, сколько всего вас ждет!",
    size: .8
  }, {sum: 25e3, text: "Теперь уже точно не&nbsp;отпускайте!"}, {sum: 3e4, text: "Дальше – больше!"}, {
    sum: 45e3,
    text: "Вас не догнать!"
  }, {sum: 55e3, text: "А вот это уже интересно!.."}, {sum: 7e4, text: "ОГО!!!!!!"}, {
    sum: 75e3,
    text: "До мирового рекорда по&nbsp;удерживанию кнопки – несколько шагов…",
    size: .8
  }, {sum: 8e4, text: "То ли еще будет!"}, {sum: 85e3, text: "Главное сейчас – не&nbsp;отпустить…"}, {
    sum: 9e4,
    text: "Начинаем обратный отсчет…"
  }, {sum: 99e3, text: "95…"}, {sum: 1e5, text: "Забирайте всё! В&nbsp;магазине выбор больше: ждем вас.", size: .9}],
  startSounds: ["Click_Note1", "ticking", "Space_Note1", "Rainbow1"],
  sounds: ["Aqua_Drib3", "Birdy_Done4", "Birdy_Error3", "Bottles_Done10", "Bounce_Error1", "Elastic_Done9", "Elastic_Rise2", "SpaceBall_Note2", "Swipe1", "Wood_Note3", "Wood_Note5", "SoftBell_Done5", "Wood_Error5"],
  soundGroups: {
    9: "Wood_Error5",
    10: "SpaceBall_Note2",
    11: "Birdy_Error3",
    12: "Elastic_Rise2",
    13: "Bounce_Error1",
    14: "Elastic_Done9",
    15: "Aqua_Drib3",
    16: "Bottles_Done10",
    18: "Birdy_Done4"
  },
  greetings: ["Я уже почти в&nbsp;списке покупок", "<nobr>Ну наконец-то!</nobr>", "Привет!", "Красивое у&nbsp;меня имя, правда?", "По-моему, я&nbsp;тут самый симпатичный", "Нет, я&nbsp;самый симпатичный", "Не спорьте: я&nbsp;тут лучше всех"]
}, app.state = {}, app.$ = jQuery.noConflict(), app.$document = app.$(document), app.$window = app.$(window), app.$html = app.$("html"), app.$body = app.$("body"), app.$wrapper = app.$(".ib-wrapper"), app.url = "http://ikeaknopka.ru/frontend/";
var app = app || {};
app.utils = app.utils || {}, app.loaded = [], app.utils.event = function(a, b, c, d) {
  if ("function" == typeof ga) {
    b = "undefined" == typeof b ? "event" : b.toString(), ga("send", "event", a, b, c, d);
    var e = a + "_" + b;
    try {
      irwStatPageFunctionality("ext>knopka_2016_august>" + e, e)
    } catch (f) {
    }
  }
}, app.utils.isMobile = function() {
  return app.$window.width() <= 960
}, app.utils.isVertical = function() {
  return app.$("html").hasClass("is_vertical")
}, app.utils.preload = function(a, b) {
  var c = [], d = 0;
  return _.each(a, function(e) {
    var f = new Image;
    c.push(f), f.onload = function() {
      app.loaded.push(e), d++, b && b(d / a.length)
    }, f.src = e
  }), c
}, app.utils.preloadCallback = function(a, b) {
  var c = new Image;
  return -1 != app.loaded.indexOf(a) ? void b() : (c.onload = function() {
    -1 == app.loaded.indexOf(a) && (b(), app.loaded.push(a))
  }, setTimeout(function() {
    -1 == app.loaded.indexOf(a) && (b(), app.loaded.push(a))
  }, app.config.image_load_timeout), void(c.src = a))
}, app.utils.setCoords = function(a, b, c) {
  app.utils.setTransform(a, "translate(" + b + "px, " + c + "px)")
}, app.utils.setScale = function(a, b) {
  app.utils.setTransform(a, "scale(" + b + ")")
}, app.utils.setTransform = function(a, b) {
  a.css("-webkit-transform", b), a.css("-ms-transform", b), a.css("transform", b)
}, app.utils.getScrollbarWidth = function() {
  var a = document.createElement("div");
  a.className = "scrollbar-measure", document.body.appendChild(a);
  var b = a.offsetWidth - a.clientWidth;
  return document.body.removeChild(a), b
}, app.utils.declineNumeral = function(a, b) {
  var c = [2, 0, 1, 1, 1, 2];
  return b[a % 100 > 4 && 20 > a % 100 ? 2 : c[5 > a % 10 ? a % 10 : 5]]
}, app.utils.serverError = function() {
  alert("Ошибка доступа к серверу, попробуйте позже")
}, app.utils.mod = function(a, b) {
  var c = a % b;
  return 0 > c ? c + b : c
}, function(a) {
  jQuery.fn.extend({
    clicktouch: function(a) {
      var b, c = !1;
      app.$(this).css("-webkit-tap-highlight-color", "rgba(0,0,0,0)"), app.$(this).on("touchstart", function(d) {
        var e = app.$.proxy(a, this);
        e(d), c = !0, clearTimeout(b), b = setTimeout(function() {
          c = !1
        }, 500), d.preventDefault(), d.stopPropagation()
      }), app.$(this).on("touchmove", function(a) {
        a.preventDefault(), a.stopPropagation()
      }), app.$(this).on("click", function(b) {
        if (c)return b.preventDefault(), !1;
        var d = app.$.proxy(a, this);
        d(b)
      })
    }
  }), jQuery.fn.extend({
    addClassDelayed: function(a) {
      var b = app.$(this);
      setTimeout(function() {
        b.addClass(a)
      }, 30)
    }, removeClassDelayed: function(a) {
      var b = app.$(this);
      setTimeout(function() {
        b.removeClass(a)
      }, 30)
    }
  }), jQuery.fn.extend({
    clickEvent: function(a, b, c, d) {
      app.$(this).click(function() {
        app.utils.event(a, b, c, d)
      })
    }
  }), jQuery.fn.extend({
    swipe: function(a, b) {
      var c, d, e;
      this.on("touchstart", function(a) {
        c = a.originalEvent.touches[0].clientX, d = a.originalEvent.touches[0].clientY, e = !1
      }).on("touchmove", function(f) {
        if (c && d) {
          var g = f.originalEvent.changedTouches[0].clientX, h = f.originalEvent.changedTouches[0].clientY, i = c - g, j = d - h, k = Math.abs(i) > 10 && Math.abs(i) > Math.abs(j);
          if (k && !e) {
            var l;
            l = i > 0 ? app.$.proxy(a, this) : app.$.proxy(b, this), l(f), e = !0
          }
          e && f.preventDefault()
        }
      }).on("touchend touchcancel", function(a) {
        c = null, d = null
      })
    }
  }), jQuery.fn.extend({
    transform: function(b) {
      app.utils.setTransform(a(this), b)
    }
  }), jQuery.fn.extend({
    setScale: function(a) {
      app.$(this).css("font-size", a + "em")
    }, removeScale: function() {
      app.$(this).css("font-size", "")
    }
  })
}(jQuery), window.requestAnimFrame = function() {
  return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(a) {
      window.setTimeout(a, 1e3 / 60)
    }
}(), app.utils.bezier = function(a, b, c, d, e) {
  var f = function(b) {
    var d = 1 - b;
    return 3 * d * d * b * a + 3 * d * b * b * c + b * b * b
  }, g = function(a) {
    var c = 1 - a;
    return 3 * c * c * a * b + 3 * c * a * a * d + a * a * a
  }, h = function(b) {
    var d = 1 - b;
    return 3 * (2 * (b - 1) * b + d * d) * a + 3 * (-b * b * b + 2 * d * b) * c
  };
  return function(a) {
    var b, c, d, i, j, k, l = a;
    for (d = l, k = 0; 8 > k; k++) {
      if (i = f(d) - l, Math.abs(i) < e)return g(d);
      if (j = h(d), Math.abs(j) < 1e-6)break;
      d -= i / j
    }
    if (b = 0, c = 1, d = l, b > d)return g(b);
    if (d > c)return g(c);
    for (; c > b;) {
      if (i = f(d), Math.abs(i - l) < e)return g(d);
      l > i ? b = d : c = d, d = .5 * (c - b) + b
    }
    return g(d)
  }
}, app.utils.formatNumber = function(a, b, c) {
  b || (b = " "), c || (c = ",");
  var d = a.toString(), e = 0 > a, f = d.lastIndexOf(".");
  f = f > -1 ? f : d.length;
  for (var g = d.substring(f), h = -1, i = f; i > 0; i--)h++, h % 3 === 0 && i !== f && (!e || i > 1) && (g = b + g), g = d.charAt(i - 1) + g;
  return g.replace(".", c)
}, app.utils.getParameter = function(a) {
  a = a.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var b = new RegExp("[\\?&]" + a + "=([^&#]*)"), c = b.exec(location.search);
  return null === c ? null : decodeURIComponent(c[1].replace(/\+/g, " "))
}, app.utils.linear = function(a, b, c) {
  return (b - a) * c + a
}, app.utils.detectMobile = {
  Windows: function() {
    return /IEMobile/i.test(navigator.userAgent)
  }, Android: function() {
    return /Android/i.test(navigator.userAgent)
  }, BlackBerry: function() {
    return /BlackBerry/i.test(navigator.userAgent)
  }, iOS: function() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent)
  }, any: function() {
    return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows()
  }
}, function() {
  "use strict";
  app.app = new app.App
}();
//# sourceMappingURL=app.min.js.map/**

