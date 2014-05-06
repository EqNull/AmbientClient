/// <reference path="base.js" />
/// <reference path="control.js" />

repository.register("oRect", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);
        }
    }
})

repository.register("oDiv", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);
        }
    }
})

repository.register("oLabel", cControl, function (_super) {
    return {
        autosize: true
        , _text: ""
        , create: function (name, text) {
            _super.create.call(this, name, "SPAN");
            if (text) { this._text = text }
            this.set(css.overflow, "hidden");
        }
        , redraw: function () {
            if (this.autosize) {
                this.style.height = "";
            }
            this.html(replace$(this._text, "/n", "<br>"));
        }
        , text: setproperty("text")
        , onshow: function () { this.redraw() }
        , onpaint: function () { this.redraw() }
    }
})

repository.register("oHorline", cControl, function (_super) {
    return {
        width: 1
        , drawstyle: "solid"
        , _color: "#000000"
        , create: function (name) {
          _super.create.call(this, name);
        }
        , redraw: function () {
            this.size(null, this.width)
            this.setborder(eborder.bottom, this._color, this.drawstyle, this.width)
        }
        , onshow: function () { this.redraw() }
        , onpaint: function () { this.redraw() }
        , color: setproperty("color")
    }
})

repository.register("oButton", cControl, function (_super) {
    return {
        _text: ""
        , create: function (name, text) {
            _super.create.call(this, name);
            if (text) { this._text = text }
            this.focusbehavior = efb.click;
        }
        , text: setproperty("text")
        , onshow: function () {
            var x = this.oLabel("caption")
                x.html(this._text)
                x.show()
        }
        , onpaint: function () {
            this.controls["caption"].html(this._text)
        }
    }
})

repository.register("oIcon", cControl, function (_super) {
    return {
        autosize: false
        , _charcode: ""
        , create: function (name, charcode) {
            _super.create.call(this, name, "SPAN");
            this._charcode = charcode

            this.set(css.fontfamily, "FontAwesome")
            this.set(css.textalign, "center")

            this.style["webkit-font-smoothing"] = "anitialiased"
            this.style["moz-osx-font-smoothing"] = "grayscale"
        }
        , onpaint: function () {
//                this.set(css.lineheight, this.outerwidth() + "px")
            if (this.autosize) {
                var size = Math.max(0, this.outerheight() - 6)
                this.set(css.fontsize, (size) + "px")
            }
            this.set(css.paddingtop, "3px")
            this.element.innerHTML = this._charcode;
        }
        , charcode: setproperty("charcode")
    }
})

repository.register("oCanvas", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name, "canvas");
            this.context = null
        }
        , onresize: function () {
            //Some weird canvas thing, you have to set the width and height to a fixed size
            this.element.width = this.innerwidth();
            this.element.height = this.innerheight();
        }
        , pixelmode: function (toggle, width, height, alpha) {
            if (!this.context) { this.context = this.element.getContext("2d") }

            if (toggle) {
                this.width = width || this.element.width
                this.height = height || this.element.height;
                this.alpha = alpha == undefined ? 255 : alpha
                this.canvasdata = this.context.createImageData(this.width, this.height);
            } else {
                this.context.putImageData(this.canvasdata, 0, 0)
            }
        }
        , setpixel: function (x, y, rgb) {
            var c = this.canvasdata;
            var index = (x + y * this.width) * 4;

            c.data[index + 0] = rgb.red;
            c.data[index + 1] = rgb.green;
            c.data[index + 2] = rgb.blue;
            c.data[index + 3] = this.alpha;
        }
        , getpixel: function (x, y) {
            var c = this.canvasdata;
            var index = (x + y * this.width) * 4;

            return new cRgb(c.data[index + 0], c.data[index + 1], c.data[index + 2], c.data[index + 3])
        }
    }
})

repository.register("oInputText", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name, "INPUT.TEXT");
            this.focusbehavior = efb.normal | efb.capturekeys
            this.onkeyup(function (event) {
                this.raise("change")
            })
            this.onblur(function (event) { this.element.blur() })

        }
        , value: function (newval) {
            if (newval != undefined) {
                this.element.value = newval
                return this;
            } else {
                return this.element.value
            }
        }
        , setfocus: function () {
            _super.setfocus.call(this)
            this.selectall()
        }
        , selectall: function () {
            this.element.select()
        }
        , onchange: emitevents
    }
})



repository.register("oInputList", cControl, function (_super) {
    return {
        //todo: , multiselect: false
        selecteditem: -1
        , add: function (text) {
            var index

            if (this.items.length > 0) {
                index = Math.abs(this.find(text))
                this.items.splice(index - 1, 0, text)
            } else {
                this.items.push(text)
                index = this.items.length
            }
            if (this.state >= estate.showed) {
                this.redraw()
            }

            if (this.state >= estate.showed) {
                this.oLabel("item#" + index)
                    .set("value", text)
                    .set("text", text)
                    .show()
            }
            this.redraw()
        }

        , find: function (text) {
            return find(this.items, text)
        }

        , select: function (index) {
            if ((index > 0 && index < this.items.length)) {
                if ((this.selecteditem >= 0) && (this.selecteditem != index)) {
                    this.controls.item[this.selecteditem].set("selected", false)
                }
                this.controls.item[index].set("selected", true)
                this.selecteditem = index
            }            
        }

        , value: function (newval) {
            var index = Math.abs(this.find(text))
            
            this.select(index)
        }

        , redraw: function () {
            var newheight = Math.min(this.item.length, 8) * 18
            var newwidth = this.outerwidth()

            this.size(newwidth, newheight)
        }
    }
})


repository.register("oInputSelection", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name, "INPUT.TEXT");
            this.focusbehavior = efb.normal | efb.capturekeys
            this.onkeyup(function (event) { this.raise("change") })
            this.onblur(function (event) { this.element.blur() })
        }
        , value: function (newval) {
            if (newval != undefined) {
                this.element.value = newval
                return this;
            } else {
                return this.element.value
            }
        }
        , setfocus: function () {
            _super.setfocus.call(this)
            this.selectall()
        }
        , onchange: emitevents
    }
})


repository.register("scrBackground", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);

            this.set(css.backgroundimage, "")
//                .set(css.backgroundcolor, "red")
                .move(0, 0, "100%", "100%")
                .set(css.fontfamily, "arial")
                .set(css.fontsize, "12px");
        }
    }
})


