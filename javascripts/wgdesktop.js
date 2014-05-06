/// <reference path="base.js" />
/// <reference path="control.js" />
/// <reference path="wgbase.js" />
/// <reference path="wgtools.js" />
/// <reference path="wgeditor.js" />
/// <reference path="wginput.js" />


var emi = {
    normal: 0
    , haschildren: 1
    , line: 2
    , text: 3
    , header: 4
    , checked: 5
    , unchecked: 6
}


repository.register("oDesktopButton", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name)

            this.iconcode = "&#xf192;";
            this.text = "";
            this.set(css.margin, "2px")
            this.focusbehavior = efb.click | efb.drag | efb.size;
        }
        , onshow: function () {
            this.oIcon("icon")
                .set("charcode", this.iconcode)
                .set("autosize", true)
                .move(1, 1, 30, 30)
                .show()

            this.oLabel("caption")
                .set("text", this.text)
                .set("autosize", false)
                .set(css.textalign, "center")
                .show()
        }

        , onsize: function () {
            var draginfo = this.draginfo;

            if (!draginfo) { return }


            draginfo.modx = roundto(draginfo.modx, 40)
            draginfo.mody = roundto(draginfo.mody, 40)
        }

        , onpaint: function () {
            this.controls.caption.set("text", this.text)
            this.show80x80();

            //            if ((height <= 160) && (width >= 160)) { width = 160 }

            //            this.size(width, height)

            //            var fn = "show" + width + "+" + height;
        }

        , show40x40: function () {
            //            this.size(36, 36)
            this.controls.icon.move(center, 5, 30, 30)
            this.controls.caption.set(css.visibility, "hidden")
        }
        , show80x80: function () {
            //            this.size()
            this.controls.icon.move("center", 5, 40, 40)
            this.controls.caption
                .set(css.visibility, "visible")
                .move("5%", 50, "90%", 30)
            //                .show()
        }
        , show160x80: function () {
            this.controls.icon.move("center", 3, 40, 40)
            this.controls.caption
                .set(css.visibility, "visible")
                .move("center", 50, 70, 20)
            //                .show()
        }
        , show160x160: function () {
        }
        , showbig: function () {
        }
        , showfull: function () {
        }
    }
})

repository.register("wgMenu", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name)
        }
        , onshow: function () {

        }
    }
})

repository.register("scrDesktop", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name)
        }
        , onshow: function () {

        }
    }
})

repository.register("oPopupMenuItem", cControl, function (_super) {
    return {
        text: ""
        , itemtype: emi.normal
        , tag: null
        , icon: null
        , create: function (name, value) {
            _super.create.call(this, name, "DIV", value)
        }

        , onshow: function () {
            //todo: icon not implemented yet
            var size = new cRect(0, 0, 0, 20);

            var focusbehavior = efb.normal
            var style = {}

            var special = ""

            switch (this.itemtype) {
                case emi.haschildren:
                    special = "&#xf0da;" //caret-right
                    break;
                case emi.checked:
                    special = "&#xf00c;" //icon-check
                    break;
                case emi.unchecked:
//                        special = "" //icon-uncheck
                    break;
                case emi.header:
                    style[css.fontweight] = "bold"
                    break;
                case emi.line:
                    var focusbehavior = efb.none
                    this.text = ""
                    height = 10
                    break;
                default:
                    special = "&#xf0da;" //caret-right
                    this.icon = "&#xf00c;" //icon-check
            }

            this.focusbehavior = focusbehavior

            this.oRect("background")
                .move(0, 0, "100%", "100%")
                .set(css.visibility, "hidden")
                .set(css.backgroundcolor, "#000")
//                    .set(css.opacity, ".2")
                .show()

            if (this.itemtype == emi.line) {
                var x = this.oHorline()
                    .move(2, 2)
                    .set(css.right, "2px")
                    .color("#606060")
                    .show()

                    size.height = 5
                    size.width = 40
            } else {
                this.oLabel("caption")
                    .set("autosize", false)
                    .move(20, 3, "auto", size.height - 6)
                    .set(css.whitespace, "nowrap")
                    .set(css.overflow, "hidden")
                    .set(css.color, "#FFF")
                    .set(css.textalign, "left")
                    .set("text", this.text)
                    .show()
                    size.width = 40 + this.controls.caption.outerwidth()
            }


            if (special) {
                this.oIcon("special")
                    .size(16, 12)
                    .set(css.top, "1px")
                    .set(css.right, "0px")
                    .set("text", special)
                    .set("charcode", special)
                    .set(css.color, "#FFF")
                    .show()
            }

            if (this.icon) {
                this.oIcon("icon")
                    .size(16, 12)
                    .set(css.top, "1px")
                    .set(css.float, "left")
                    .set("charcode", this.icon)
                    .set(css.color, "#FFF")
                    .show()
            }


            this.size(size.width, size.height)
        }

        , onpaint: function () { 
            if (this.mousehighlight) {
                this.controls.background.set(css.visibility, "visible");
            } else {
                this.controls.background.set(css.visibility, "hidden");
            }

            //this.controls.caption.move(20)
            //if (this.controls.special) { this.controls.special.move(this.outerwidth() - 18) }
        }
    }
})

repository.register("oPopupMenu", cControl, function (_super) {
    return {
        create: function (name) {
            _super.create.call(this, name)
            this.items = [];
            this.relative = null
            this.root = this

        }
        , onshow: function (relativerect, alignright) {
            this.set(css.padding , "0px")

            var width = 0;
            var height = 2;
                
            this.oRect("bottom")
                .move(0, 0, "100%", "100%")
                .set(css.backgroundcolor, "#000000")
                .set(css.opacity, ".8")
                .set(css.blur, "6px")
                .show()

            for (var index in this.items) {
                var item = this.items[index]

                var menuitem = this.oPopupMenuItem("item#", item.text)
                menuitem.set("itemtype", item.itemtype || emi.normal)
                menuitem.set("icon", item.icon || null)
                menuitem.set("tag", item.tag || null)
                menuitem.onmouseenter(function () {
                        this.raise(new cEvent("fold", this))
                    })
                    .onmousedown(function () {
                        this.raise(new cEvent("select", this))
                    })
                    .move(2, height)
                    .show()

                width = Math.max(menuitem.outerwidth(), width)
                height += menuitem.outerheight()
            }

            this.size(width + 4, height + 4)

            var items = this.controls["item"]

            for (var index = 1; index < items.length; index++) {
                items[index].size(width)
            }

            //var pagerect = browser.pagerect();
            //var rect = pagerect.calculaterelative(width + 4, height + 4, true, pagerect)
            //this.move(rect.left, rect.top)
        }

        , loaditem: function (text, itemtype, icon, tag) {
            this.items.push({ text: text, itemtype: itemtype, icon: icon, tag: tag })
        }

        , onselect: emitevents
        , onfold: emitevents
    }
})


var background;


var test = function () {
    background = new repository.scrBackground().show();


    testsvg()

    var menu = background.wgMenu()
            .move(0, 0, "100%", 80)
            menu.set(css.backgroundimage, "linear-gradient(to bottom, #444, #888)")
            .set(css.boxshadow, "2px 0px 2px #888")
            .show()


    var icon = menu.oIcon("settings")
        .set("charcode", "&#xf013;")  //fa-cog
        .set("autosize", true)
        .set(css.float, "right")
        icon.set(css.position, "relative")
        .set(css.margin, "3px")
        .set(css.padding, "7px")
        .size(40, 40)
        .set(css.backgroundimage, "linear-gradient(to bottom, #3498db, #2980b9)")
        .set(css.boxshadow, "2px 2px 5px #666666")
        .set(css.borderradius, "10px")
        .set(css.color, "white")
        .show()

    var desktop = background.scrDesktop()
            .move(0, 80, "100%", browser.pageheight() - 80)
            .set(css.backgroundcolor, "#eee")
            .show();

    desktop.oDesktopButton("button")
                .move(50, 200, 80, 80)
                .set("text", "drag or resize")
                .set(css.backgroundimage, "linear-gradient(to bottom, #3498db, #2980b9)")
                .set(css.boxshadow, "2px 2px 5px #666666")
                .set(css.borderradius, "10px")
                .setborder(eborder.all, "solid #1f548c 1px")
                .set(css.color, "white")
                .onclick(function () { alert("moo") })
                .sizable(eborder.all)
                .set("focusbehavior", efb.click | efb.drag | efb.size)
                .show()

    desktop.oColorPicker()
                .move(10, 10, 250, 130)
                .set(css.backgroundcolor, "#181818")
                .show()

    var x = desktop.oAccordion()
                .move(300, 0, 200, 400)
                .show()
                .add("1")
                .add("2")
                .add("3")

    var y = desktop.oPopupMenu()
        .move(550, 200, 100, "")

    y.loaditem("Menu item 1")
    y.loaditem("Menu item 2")
    y.loaditem("Menu item 3")
    y.loaditem("Menu item 4", emi.line)
    y.loaditem("Menu item with a longer text")
    y.show()

    debug.timerstart()
    length = 10000
    for (var i = 0; i < length; i++) {
        desktop.oRect("rect")
                .move(10, 10, 100, 100)
                .show()
    }
    debug.log("done")



    desktop.oInputSpinner("spinner")
        .move(550, 20, 200, 20)
        .show()

    desktop.oInputColor("inputcolor")
        .move(550, 120, 200, 20)
        .show()
        .value("#00FF00")


    //var rows = 50
    //var cols = 20

    //debug.timerstart()

    //var table = desktop.oTable()
    //    .move(20, 20)

    //table.autosize = true;
    ////        .pagesize(600, 300)

    //for (var y = 0; y < rows; y++) {
    //    table.addrow()
    //    for (var x = 0; x < cols; x++) {
    //        table.addfield(y + "-" + x)
    //    }
    //}
    //table.show()

    //debug.log("table")

    //var debugpanel = desktop.oLabel()
    //    .move(450, 50, 400, 500)
    //    .set(css.backgroundcolor, "#E0E0E0")
    //    .show()

    //desktop.oEditor()
    //    .move(20, 50, 400, 500)
    //    .setborder(eborder.all, "#666666", "solid", 1)
    //    .set("debugpanel", debugpanel)
    //    .show()
}

 test()