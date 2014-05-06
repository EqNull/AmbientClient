/// <reference path="base.js" />
/// <reference path="control.js" />
/// <reference path="wgbase.js" />

var cRgb = object.create({
    create: function (red, green, blue, alpha) {
        if (typeof red == "string") {
            this.hex(red)
        } else {
            this.rgb(red, green, blue, alpha)
        }
    }
    , rgb: function (red, green, blue, alpha) {
        this.red = (red == null? this.red: red)
        this.green = (green == null? this.green: green)
        this.blue = (blue == null? this.blue : blue)
        this.alpha = alpha == undefined ? this.alpha || 255 : alpha
    }
    , hex: function (color) {
        if (color != null) {
            if (typeof (color) == "string") { color = parseInt(color.substr(1), 16) }

            if (typeof (color) == "number") {
                this.red = (color & 0xff0000) >> 16
                this.green = (color & 0x00ff00) >> 8
                this.blue = color & 0x0000ff
            }
            return this;
        }
        return "#" + hex2(this.red) + hex2(this.green) + hex2(this.blue)
    }

    , inverse: function () {
        if (this.lum != undefined) {
            this.hue += this.sat
            if (this.hue > 100) { this.hue -= 100 }
            if (this.hue < 0) { this.hue += 100 }
            this.hsl(this.hue, this.sat, this.lum)
        } else {
            this.rgb(255 - this.red, 255 - this.green, 255 - this.blue)
        }
    }

    , hsl: function (h, s, l) {
        if (arguments.length) {
            var r, g, b;
            h = (h == null ? this.hue : h) / 100
            s = (s == null ? this.sat : s) / 100
            l = (l == null ? this.lum : l) / 100

            if (s == 0) {
                r = g = b = l; // achromatic
            } else {
                function hue2rgb(p, q, t) {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }

                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            this.hue = h * 100
            this.sat = s * 100
            this.lum = l * 100

            this.red = r * 255
            this.green = g * 255
            this.blue = b * 255

            return this
        }

        var r = this.red / 255
        var g = this.green / 255
        var b = this.blue / 255

        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        this.hue = h * 100
        this.sat = s * 100
        this.lum = l * 100

        return this
    }

});


repository.register("oColorbar", cControl, function (_super) {
    return {
        create: function (name, type) {
            _super.create.call(this, name)
            this.type = type || name
        }
        , onshow: function () {
            this.oCanvas("bar")
                    .setborder(eborder.all, "#888", "solid", 1)
                    .show()
                    .move(10, 0, this.innerwidth() - 20, this.innerheight())
            this.oIcon("topmarker")
                    .move(0, -7, 20, 20)
                    .set("autosize", true)
                    .set("charcode", "&#xf0d7;")  //caret-down
                    .show()
            this.oIcon("bottommarker")
                    .move(0, this.innerheight() - 14, 20, 20)
                    .set("autosize", true)
                    .set("charcode", "&#xf0d8;")  //caret-up
                    .show()
            this.set(css.overflow, "hidden")
            this.focusbehavior = efb.normal | efb.drag

            this.onmousedown(this.updatemarker)

            this.ondrag(function (event) {
                if (event.button) { this.updatemarker(event) }
                event.modx = 0
                event.mody = 0
            })
        }
        , draw: function (hue, sat, lum) {
            var bar = this.controls.bar
            var width = bar.innerwidth();
            var height = bar.innerheight();
            var rgb = new cRgb()
            var clientposition = bar.clientposition() 
            var mod = clientposition.left + ((this.type == "hue" ? hue : this.type == "sat" ? sat : lum) * (clientposition.width) / 100)

            //todo:
            mod += 10

            this.controls.topmarker.move(mod - 10)
            this.controls.bottommarker.move(mod - 10)

            if ((height <= 0) || (width <= 0)) { return }

            bar.pixelmode(true)
            for (var x = 0; x < width; x++) {
                mod = x * 100 / width;

                rgb.hsl(this.type == "hue" ? mod : hue, this.type == "sat" ? mod : sat, this.type == "lum" ? mod : lum)

                for (var y = 0; y <= height; y++) {
                    bar.setpixel(x, y, rgb)
                }
            }
            bar.pixelmode(false)
        }
        , updatemarker: function (event) {
            var bar = this.controls.bar
            debug.log(event.mouse.x)
            x = (between(event.mouse.x - bar.innerleft(), 0, bar.innerwidth()) * 100) / bar.innerwidth()

            this.raise("change", x)
        }
        , onchange: emitevents
    }
})

repository.register("oColorPicker", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name)
            this.hsl = new cRgb().hsl(50, 100, 50)
            this.size(250, 130)
        }
        , onshow: function () {
            var self = this;

            this.oColorbar("hue")
                .move(0, 10, this.innerwidth(), 30)
                .show()
            this.oColorbar("sat")
                .move(0, 50, this.innerwidth(), 30)
                .show()
            this.oColorbar("lum")
                .move(0, 90, this.innerwidth(), 30)
                .show()

            this.redraw();
        }
        , onchange_hue: function (event, value) {
            this.hsl.hsl(value, null, null)
            this.redraw()
        }
        , onchange_sat: function (event, value) {
            this.hsl.hsl(null, value, null)
            this.redraw()
        }
        , onchange_lum: function (event, value) {
            this.hsl.hsl(null, null, value)
            this.redraw()
        }
        , redraw: function (hexcolor) {
            if (hexcolor) { this.hsl.hex(hexcolor).hsl() }

            var hsl = this.hsl

            this.controls.hue.draw(hsl.hue, hsl.sat, hsl.lum)
            this.controls.sat.draw(hsl.hue, hsl.sat, hsl.lum)
            this.controls.lum.draw(hsl.hue, hsl.sat, hsl.lum)

            this.raise("change", this.hsl.hex())
            return this;
        }
    }
})

repository.register("oInputColor", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);

            this.oInputText("input")
                .move(0, 0, "100%", 20)
                .value("#FFFFFF")
                .show()
                .onfocus(function (event) {
                    if (this.parent.controls && this.parent.controls.colorpicker) { return }

                    var picker = this.parent.oColorPicker("colorpicker")
                        .show()
                        .redraw(this.value())
                        .set(css.backgroundcolor, "#181818")
                        .onchange(function (event, color) {
                            this.parent.controls.input.value(color)
                            this.parent.updateinput()
                        })

                    var rect = this.absoluteposition().calculaterelative(picker.outerwidth(), picker.outerheight(), false, browser.pagerect()).move(-this.outerleft(), -this.outertop())
                    picker.move(rect.left, rect.top)
                })

            this.onblur(function () {
                this.controls.colorpicker.destroy()
            })
        }
        , value: function(newval)  {
            if (newval) {
                this.controls.input.value(newval)

                this.updateinput()
                this.updatecolorpicker()
                return this;
            }
            return this.controls.input.value()
        }
        , updateinput: function () {
            var input = this.controls.input
            var rgb = new cRgb().hex(input.value())
            var oldrgb = new cRgb().hex(input.value())

            input.set(css.backgroundcolor, rgb.hex())
            rgb.inverse()
            input.set(css.color, rgb.hex())
        }
        , updatecolorpicker: function() {
            if (this.controls.colorpicker) {
                this.controls.colorpicker.redraw(this.controls.input)
            }
        }
    }
})

repository.register("oInputSpinner", cControl, function (_super) {
    return {
        create: function () {
            _super.create.call(this, name);

            this.oInputText("input")
                .show()
                .value(0)

            var drag = this.oIcon("drag")
                .show()
                .set(css.backgroundcolor, "#D0D0D0")
                .ondragstart(function() {
                    this.__value = parseInt(this.parent.value())
                })
                .ondrag(function (event) {
                    debug.log(event.mody + " : " + (event.mody * (Math.abs((1 + event.modx) / 16))))
                    this.parent.value(this.__value - (event.mody * (Math.abs((1 + event.modx) / 16))))
                    //this.draginfo.modx = 0
                    //this.draginfo.mody = 0
                })
                .ondragend(function () {
                    this.move(this.parent.innerwidth() - 20, 0, 20, 20)
                })
                .set("charcode", "&#xf0dc;")
                .set("autosize", true)

            drag.focusbehavior = efb.drag
        }
        , onshow: function () {
            this.controls.input.move(0, 0, this.innerwidth() - 20, 20)
            this.controls.drag.move(this.innerwidth() - 20, 1, 20, 20)
        }
        , max: 100
        , min: -100
        , value: function (newval) {
            if (newval) {
                newval = between(Math.round(newval), this.min, this.max)
                this.controls.input.value(newval)
                return this
            }
            return parseInt(this.controls.input.value())
        }
    }
})


repository.register("oCollapsiblePanel", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);
            this.folded = false;
        }
        , onshow: function (caption) {
            this.set(css.overflow, "hidden")

            this.oRect("bar")
                .set("focusbehavior", efb.normal)
                .move(0, 0, "100%", 20)
                .set(css.backgroundcolor, "blue")
                .onmousedown(function () {
                    this.parent.togglefold(!this.parent.folded);
                })
                .show()
                .oIcon("foldstate")
                    .set(css.color, "#FFF")
                    .move(3, 3, 18, 18)
                    .show()


            this.panel = this.oRect("panel")
                .move(0, 20, "100%", 200)
                .set(css.backgroundcolor, "green")
                .show()

            var fold = this.folded;
            this.folded = null
            this.togglefold(fold)
        }
        , togglefold: function (fold) {
            if (this.folded != null) {
                this.set(css.transition, "height .4s")
            }
            if (fold) {
                if (this.folded == true) { return }
                this.folded = true;
                this.size(null, this.panel.outerbottom())
                this.raise("fold")
            } else {
                if (this.folded == false) { return }
                this.folded = false;
                this.size(null, this.controls.bar.outerheight())
                this.raise("collapse")
            }
            this.controls.bar.controls.foldstate.set("charcode", this.folded ? "&#xf068;" : "&#xf067;")  //fa-min and fa-plus
            return this;
        }
        , onfold: emitevents
        , oncollapse: emitevents
    }
});

repository.register("oAccordion", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this);
            this.maxheight = 0;
            this.autosize = true
            this.set("margin", "2px")
        }
        , onpaint: function () {
            if (this.autosize) { this.style.height = "" }
        }
        , add: function (caption) {
            var cp = this.oCollapsiblePanel("panel#")
                .set(css.position, "relative")
                .size("100%")

            cp.set("folded", (cp.groupindex == 1) ? false : true)
            cp.show()
            return this
        }
        , onfold_panel: function (event) {
            var controls = this.controllist("panel")
            for (var index in controls) {
                var ctrl = controls[index]

                if (event.source.id != ctrl.id) {
                    ctrl.togglefold(false)
                }
            }
        }
    }
});


//debug.log(parseInt("404040".substr(1), 16))
