repository.register("scrSvgTest", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name);

            this.set(css.backgroundimage, "")
//                .set(css.backgroundcolor, "red")
                .move(0, 0, "100%", "100%")
                .set(css.fontfamily, "arial")
                .set(css.fontsize, "12px");
        }

        , onshow: function () {
            //this.element.width = 0
            //this.element.height = 0
        }
    }
})

repository.register("svgCanvas", cControl, function (_super) {
    return {
        namespace: "http://www.w3.org/2000/svg"
        , create: function (name) {
            _super.create.call(this, name, "SVG");
        }
    }
});

repository.register("svgCircle", cControl, function (_super) {
    return {
        namespace: "http://www.w3.org/2000/svg"
//        , attributes: ["cx", "cy", "r", "stroke", "fill", "strokeWidth"]

        , create: function (name) {
            _super.create.call(this, name, "CIRCLE");
            this.focusbehavior = efb.normal
        }

        , draw: function (cx, cy, r, stroke, fill, strokewidth) {
            this.set("cx", cx)
            this.set("cy", cy)
            this.set("r", r)
            this.set("stroke", stroke)
            this.set("fill", fill)
            this.set("stroke-width", strokewidth)
        }

        , onclick: function () {
            alert("click")
        }
    }
});

var oSvgPath = object.create({
    path: null
    , create: function (name) {
        this.clear()
    }

    , clear: function () {
        this.path = []
    }

    , moveto: function (x, y) {
        this.add("M" + x + "," + y)
    }

    , lineto: function (x, y) {
        this.add( "L" + x + "," + y)
    }

    , arc: function (x, y, r, d1, d2, direction) {
        this.add( "A" +   + x + "," + y + " " + r + " 0," + direction + " " + d1 + "," + d2) 
    }

    , close: function () {
        this.add("Z")
    }

    , add: function (step) {
        if (step) {
            this.path.push(step)
        }
    }

    , tosvg: function() {
        return this.path.join(" ")
    }
});

repository.register("svgSlice", cControl, function (_super) {
    return {
        namespace: "http://www.w3.org/2000/svg"
        , path: null

        , create: function (name) {
            _super.create.call(this, name, "PATH");
            this.focusbehavior = efb.normal
        }

        , draw: function (x, y, radius, startangle, endangle, stroke, fill, strokewidth) {
            this.path = new oSvgPath()

            var x1 = parseInt(x + radius * Math.cos(Math.PI * startangle / 180));
            var y1 = parseInt(y + radius * Math.sin(Math.PI * startangle / 180));

            var x2 = parseInt(x + radius * Math.cos(Math.PI * endangle / 180));
            var y2 = parseInt(y + radius * Math.sin(Math.PI * endangle / 180));

            this.path.moveto(x, y)
            this.path.lineto(x1, y1)
            this.path.arc(radius, radius, 0, x2, y2, 1)
            this.path.close()

            this.set("d", this.path.tosvg())
            this.set("stroke", stroke)
            this.set("fill", fill)
            this.set("stroke-width", strokewidth)

            return this
        }
    }
});

repository.register("svgTestPath", cControl, function (_super) {
    return {
        namespace: "http://www.w3.org/2000/svg"
        , path: null

        , create: function() {
            _super.create.call(this, name, "PATH");
            this.focusbehavior = efb.normal

        }

        , draw: function () {
            this.path = new oSvgPath()

            this.path.moveto(100, 20)
            this.path.lineto(100, 200)
            this.path.moveto(300, 20)
            this.path.lineto(300, 200)
            this.path.moveto(100, 80)
            this.path.lineto(300, 80)
            this.path.moveto(100, 120)
            this.path.lineto(300, 120)
//            this.path.close()

            this.set("d", this.path.tosvg())
            this.set("stroke", "green")
            this.set("fill", "blue")
            this.set("stroke-width", "2")

        }
    }
});



var testsvg = function () {
    if (!background) {
        background = new repository.scrSvgTest().show();
    }
    var canvas;

    canvas = background.svgCanvas()
        .move(800, 300, 500, 500)
        .set(css.backgroundcolor, "#EEE")
        .set(css.zindex, 100)
        .show()

    //c = canvas.svgCircle("circle")
    //c.show()
    //c.draw(50, 50, 20, "green", "yellow", 4)

    canvas.svgSlice("slice#")
        .show()
        .draw(200, 200, 80, 70, 190, "#888", "green", 2)
        .onclick(function () { alert("green") })

    canvas.svgSlice("slice#")
        .show()
        .draw(200, 200, 80, 190, 260, "#888", "blue", 2)
        .onclick(function () { alert("blue") })

    canvas.svgSlice("slice#")
        .show()
        .draw(200, 200, 80, 260, 70, "#888", "red", 2)
        .onclick(function () { alert("red") })

    //canvas.svgTestPath()
    //    .move(800, 300, 500, 500)
    //    .show()
    //    .draw()
}


