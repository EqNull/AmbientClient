/// <reference path="base.js" />
/// <reference path="control.js" />
/// <reference path="wgbase.js" />
/// <reference path="wgtool.js" />
/// <reference path="wgeditor.js" />

var __ec = 1

var einput = {
    bool: __ec++
    , number: __ec++
    , text: __ec++
    , memo: __ec++
    , option: __ec++
    , date: __ec++
    , color: __ec++
    , position: __ec++
}

repository.register("oTableCell", cControl, function (_super) {
    return {
        datatype: null
        , editmode: false
        , _value: ""
        , create: function (name, value, datatype) {
            _super.create.call(this, name);
            this.focusbehavior = efb.normal
            this._value = value
            this.datatype = datatype
            this.set(css.overflow, "hidden")
        }

        , onshow: function () {
            this.set("value", this._value)
            this.onfocus(function () {
                this.edit()
            })

            this.onblur(function () {
                this.update()
            })
        }

        , edit: function () {
            if (this.editmode) { return }

            this.editmode = true
            var x = this.oInputText("input")
                .move(0, 0, this.innerwidth(), this.innerheight())
                .setborder(eborder.all)
                .set("value", this._value)
                .onchange(function () {
                    this.parent._value = this.get("value")
                })
                .show()
                .setfocus()

            return this
        }

        , update: function () {
            if (!this.editmode) { return }
            this.editmode = false
            this.controls.input.destroy()
            this.set("value", this._value)

            return this
        }

        , value: function (newval) {
            if (newval) {
                if (this.editmode) {
                    this.controls["input"].value(newval)
                } else {
                    this.element.innerHTML = replace$(newval, "/n", "<br>");
                }
                this._value = newval
                
                return this
            } else {
                return this._value
            }
        }
    }
})

var cTableSelection = object.create({
    left: 0
    , top: 0
    , right: 0
    , bottom: 0

    , create: function (left, top, right, bottom) {
        if (left != undefined) { this.left = left }
        if (top != undefined) { this.top = top }
        if (right != undefined) { this.right = right }
        if (bottom != undefined) { this.bottom = bottom }
    }
})

repository.register("oTable", cControl, function (_super) {
    return {
        hruler: null
        , vruler: null
        , selection: null

        , create: function (name) {
            _super.create.call(this, null);
            this.selection = new cTableSelection()

            this.vruler = new cRuler()
            this.hruler = new cRuler()

            this.cells = []

            this.set(css.backgroundcolor, "#eeeeee")
                .setborder(eborder.top | eborder.left, "#666666", "solid", 1)
            return this
        }
        , pagesize: function(width, height) {
            if (width != null) { this.hruler.setpagesize(width) }
            if (height != null) { this.vruler.setpagesize(height) }
            return this
        }
        , addrow: function (height) {
            var rownr = this.vruler.count + 1

            this.vruler.add(height || 18)
            this.cells[rownr] = []
            this.selection.left = 1
            this.selection.top = this.vruler.count
            return this
        }
        , addheader: function (caption) {
            //var cell = this.currentrow.oTableHeader(value).show()
            //cell.element.innerHTML = caption
            //return cell
        }
        , addcol: function (datatype, width) {
            this.hruler.add(width || 60)
            return this
        }
        , addfield: function (value, datatype) {
            var colnr = this.selection.left++;
            var rownr = this.selection.top

            if (colnr > this.hruler.count) { this.addcol(datatype) }

            var coldata = this.hruler.marks[colnr]
            var rowdata = this.vruler.marks[rownr]

            var name = dec2letter(colnr) + ":" + rownr

            if (typeof value == "object") {
                var cell = value
                cell.setparent(this)
            } else {
                var cell = this.oTableCell(name, value, datatype || coldata.datatype || rowdata.datatype )
            }

//            if ((colnr < this.hruler.count) && (rownr < this.vruler.count)) {
                cell.setborder(eborder.bottom | eborder.right, "#666666", "solid", 1)
                //                .set(css.backgroundcolor, "#cccccc")
                    .sizable(eborder.bottom | eborder.right)
                    .onsize(function (event) {
                        if (event.selectedborder & eborder.right) {
                            this.parent.resizecol(cell.colnr, Math.max(16, event.control.width + event.modx), true)
                        }
                        if (event.selectedborder & eborder.bottom) {
                            this.parent.resizerow(cell.rownr, Math.max(16, event.control.height + event.mody), true)
                        }
                        this.parent.redraw()
                    })
                    .onresize(function (event) {
                        if (this.editmode) {
                            this.controls.input.size(this.innerwidth(), this.innerheight())
                        }
                    })
//            }
            cell.move(coldata.pos, rowdata.pos, coldata.size, rowdata.size)
                 .show()

            cell.rownr = rownr
            cell.colnr = colnr

            this.cells[rownr][colnr] = cell
            return cell
        }

        , cell: function (cellname) {
            return this.controls[cellname]
        }

        , resizerow: function (rownr, height, silent) {
            this.vruler.marks[rownr].size = height
            if (!silent) { this.redraw() }
            return this
        }

        , resizecol: function(colnr, width, silent) {
            this.hruler.marks[colnr].size = width
            if (!silent) { this.redraw() }
            return this
        }
        , onshow: function () {
            this.redraw()
        }
        , redraw: function () {
            var x
            var y
            var row
            var col
            var cell

            this.vruler.recalc()
            this.hruler.recalc()

            for (y = 1; y <= this.vruler.count; y++) {
                row = this.vruler.marks[y]
                if (row.dirty) {
                    for (x = 1; x <= this.hruler.count; x++) {
                        col = this.hruler.marks[x]

                        if (col.dirty) {
                            cell = this.cells[y][x]
                            cell.move(col.pos, row.pos, col.size, row.size)
                            cell.dirty = false
                        }
                    }
                }
            }

            this.size(this.hruler.pagesize, this.vruler.pagesize)

            return this
        }
    }
})

//var cPos = object.create({
//    pos: 0
//    , size: 0
//    , min: 0
//    , max: 0
//    , value: 0
//    , positioning: "fixed"  //relative

//    , set: function (size) {
//        if (size != this.size) {
//            if (size < this.min) {
//                this.size = this.min
//            } else if (this.max && (size > this.max)) {
//                this.size = this.max
//            } else {
//                this.size = size
//            }
//            raise("change")
//        }
//    }

//    , onchange: emitevents
//})

cRulerMark = object.create({
    index: 0
    , name: ""
    , pos: 0
    , size: 0
    , datatype: null
    , relativesize: 0
    , mark: 0
    , style: {}
    , dirty: true

    , create: function (index, name) {
        this.index = index
        this.name = name
        this.style.align = "left"
        this.style.color = "black"
        this.style.backgroundcolor = "white"
    }
})

cRuler = object.create({
    pagesize: 0
    , autosize: true
    , marks: []
    , count: 0
    , parent: null

    , create: function (parent) {
        this.marks = [null]
        this.parent = parent
    }

    , setpagesize: function (pagesize) {
        this.pagesize = pagesize 
        this.autosize = false
//        this.recalc()
    }
      
    , add: function(size, relative) {
        var mark = new cRulerMark()

        if (relative) {
            mark.relativesize = size
        } else {
            mark.size = size
        }
        this.marks.push(mark)
        this.count = this.marks.length - 1
        //        this.recalc()
    }

    , del: function (index) {
        this.marks = this.marks.splice(index, 1)
        this.count = this.marks.length - 1
        //        this.recalc()
    }

    , recalc: function () {
        var lastrelative = null
        var remainingsize = this.autosize? 0 : this.pagesize

        var index

        var pos = 0
        var mark
        var newsize = 0

        if (remainingsize > 0) {
            for (index = 1; index <= this.count; index++) {
                mark = this.marks[index]
                if (mark.relativesize) {
                    lastrelative = index
                    relmod += mark.relativesize
                } else {
                    remainingsize -= mark.size
                }
            }
        }

        var relmod = (relmod <= 100 ? 1 : 100 / relmod) / 100

        if (remainingsize < 0) { remainingsize = 0 }

        for (index = 1; index <= this.count; index++) {
            mark = this.marks[index]
            if (pos != mark.pos) {
                mark.dirty = true
                mark.pos = pos
            }

            if (mark.relativesize) {
                newsize = remainingsize * mark.relativesize * relmod
                if (newsize != mark.size) {
                    mark.dirty = true
                    mark.size = newsize
                }
            }
            pos += mark.size
        }
        if (this.autosize) {
            this.pagesize = pos
        }
        this.raise("onchange")
    }

    , onchange: emitevents

})

//var cLayout = object.create({
//    create: function (width, height) {
//        this.hruler = new cRuler(width, this)
//        this.vruler = new cRuler(height, this)

//        this.cols = this.hruler.marks
//        this.rows = this.vruler.marks
//    }
//    , pagesize: function (width, height) {
//        this.hruler.pagesize(width)
//        this.vruler.pagesize(height)
//    }

//    , onchange_hruler: function () {
//        this.raise("change")
//    }

//    , onchange_vruler: function () {
//        this.raise("change")
//    }

//    , onchange: emitevents
//})