/// <reference path="base.js" />
/// <reference path="control.js" />
/// <reference path="wgbase.js" />
/// <reference path="wgtools.js" />

//var getSelectionTopLeft = function () {
//    var selection = window.getSelection();
//    var rangePos, x, y;
//    if (selection.rangeCount) {
//        rangePos = window.getSelection().getRangeAt(0).getClientRects()[0];
//        // you can get also right and bottom here if you like
//        x = parseInt(rangePos.left);
//        y = parseInt(rangePos.top);
//        debug.log("found selection at: x=" + x + ", y=" + y);
//    } else {
//        x = 0;
//        y = 0;
//        debug.log("no selections found");
//    }
//    return { x: x, y: y };
//}
//var move = function (offsetX, offsetY) {
//    var coords = getSelectionTopLeft();
//    var square = document.getElementById('square');
//    square.style.left = (coords.x + offsetX) + 'px';
//    square.style.top = (coords.y + offsetY) + 'px';
//}

repository.register("oEditLine", cControl, function (_super) {
    return {
        autosize: true
        , text: ""
        , create: function (name, text) {
            this.state = estate.unloaded
            _super.create.call(this, name, "SPAN");
            this.load()

            this.set("text", text)
        }
        , redraw: function () {
            if (this.autosize) {
                this.style.width = "";
            }
            this.element.innerHTML = this.text
        }
        , classname: setproperty(name, "this.element.className")
        , onshow: function () { this.redraw() }
        , onpaint: function () { this.redraw() }
    }
})

repository.register("oToolbarButton", repository.oIcon, function (_super) {
    return {
        create: function (name, icon) {
            _super.create.call(this, name, icon);

            this.set(css.float, "left")
                .set(css.position, "relative")
                .set("autosize", true)
                .set(css.backgroundimage, "linear-gradient(to bottom, #3498db, #2980b9)")
                .set(css.boxshadow, "1px 1px 2px #666666")
                .set(css.borderradius, "2px")
                .set(css.color, "white")
                .size(20, 20)
                .set(css.marginright, "2px")
                .set("focusbehavior", efb.normal)
        }
    }
})

repository.register("oToolbar", cControl, function (_super) {
    return {
        create: function() {
            _super.create.call(this, name);
        }
        , add: function (name, icon) {
            var button = this.oToolbarButton(name, icon)

            button.onclick(function (event) {
                this.parent.onclick_button(event)
            })
            .show()
            return button
        }
        , onclick_button: emitevents
    }
})

repository.register("oEditor", cControl, function (_super) {
    return {
        debugpanel: null
        , toolbar: null

        , create: function (name) {
            _super.create.call(this, name, "DIV");
            this.focusbehavior = efb.normal | efb.capturekeys
        }

        , onshow: function () {
            var index

            var rect = this.absoluteposition()
            var self = this

            this.toolbar = __background.oToolbar()
                .move(rect.left, rect.top - 21, rect.width, 20)
                .show()
                .onclick_button(function (event) {
                    switch (event.source.name) {
                        case "bold":
                            self.newtag("B", 1)
                            debug.log(JSON.stringify(self.getselection()))
                            break
                            //                             self.execcommand(event.source.name)
                        case "italic":
                            self.newtag("I", 2)
                            break
                        case "underline":

                            self.setselection(3, 1)

                            debug.log(JSON.stringify(self.getselection()))
                    }
                    self.updatedebugpanel()
                })
            this.toolbar.add("bold", "&#xf032;")
            this.toolbar.add("italic", "&#xf033;")
            this.toolbar.add("underline", "&#xf0cd;")


            //for (index = 0; index < 2; index++) {
            //    this.oEditLine("line#", "Regel " + index + ". ")
            //    .show()
            //}

//            this.element.innerHTML = "<b>Dit is de 1ste regel. En </b><div style='float:left;margin: 10px 0 10px 10px;background-color: green; width:80px; height: 20px'><div style='background-color: blue; margin-left:20px;width:40px; height: 20px'></div></div><b>dit is de 2e regel.</b>"
            this.element.innerHTML = "<b>Dit is de 1ste regel. En </b><b>dit is de 2e regel.</b>"

            this.element.contentEditable = true
            //document.execCommand("enableObjectResizing", false, false);

            this.onkeydown(function (event) {
//                debug.log(JSON.stringify(self.getselection()))
                switch (event.key) {
                    case "enter":
                        event.cancelbubble = true
                        break
                }
            })

            this.onkeyup(function () { this.updatedebugpanel() })

            this.updatedebugpanel()
        }

        , updatedebugpanel: function () {
            if (this.debugpanel) {
                this.debugpanel.set("text", this.get("markdown"))
            }
        }

        , execcommand: function (tag) {
            //            document.execCommand("bold", false, null)
            document.execCommand(tag, true, null)
            this.updatedebugpanel()
        }

        //, html: function (newval) {
        //    if (newval) {
        //        //Todo: sanatize newhtml
        //        this.element.innerHTML = newval
        //        return this
        //    } else {
        //        return this.element.innerHTML
        //    }

        //}

        , markdown: function (newval) {
            if (newval) {

            } else {
                var result = this.element.innerHTML
                result = replace$(result, "<", "[")
                result = replace$(result, ">", "]")
                return result
            }
        }
        , setselection: function (start, length) {
            var tree = new nodetree(this.element)
            tree.setselection(start, length)
            tree.showcursorselection()
            this.setfocus()
        }
        , getselection: function () {
            var tree = new nodetree(this.element)
            tree.getcursorselection()
            return tree.getselection()
        }
        , issofttag: function (node) {
            return (node.tagName == "B") 
        }
        , ishardtag: function (node) {
            return (node.tagName == "I")
        }
        , newtag: function(tag, tagtype) {
            var tree = new nodetree(this.element)

            tree.getcursorselection()
                .hidecursorselection()
            this.setfocus()

            if (!tree.start.node) { return }
            
            switch (tagtype) {
                case 1: //softtag
                    this.addsofttag(tree, tag)
                    break
                case 2: //hardtag
                    this.addhardtag(tree, tag)
                    break
            }
            this.setfocus()
            tree.showcursorselection()

        }
        , addsofttag: function (tree, tag) {
            var node = null
            
            if (tree.issinglenodeselection()) {
                tree.insert(null, false, true)
            }

            do {
                if (this.issofttag(tree.node)) {
                    if ((tree.node == tree.start.node) && isbetween(tree.start.offset, 0, tree.node.innerHTML.length)) {
                        var node = tree.insert("B", false, true)
                    }
                    if (tree.node == tree.end.node) {
                        if ((tree.end.offset > 0) && (tree.end.offset < tree.node.innerHTML.length)) {
                            tree.offset = tree.end.offset
                            var node = tree.insert("B", true, true)
                        }

                        //Add tagtype
                        break;
                        }
                }
            } while (tree.deepnext(true))
            this.cleanup(tree)
        }

        , addhardtag: function (tree, tag) {
            do {
                if (this.ishardtag(tree.node)) { return false }
            } while (tree.deepnext(true))

            tree.movefirst()
            tree.insert(null, false, true)
            tree.movelast()
            tree.insert(null, true, true)

            tree.wrapselection(tag)
        }

        , issametag: function (node1, node2) {
            if (node1 && node2 && (node1.tagName == node2.tagName)) {
                if (node1.className == node2.className) {
                    return true
                }
            }
            return false
        }

        , cleanup: function (tree) {
            var prevnode 

            if (tree.movefirst()) {
                do {
                    if (this.issofttag(tree.node)) {
                        prevnode = tree.node.previousSibling
                        if (this.issametag(tree.node, prevnode)) {
                            tree.merge(false)
                        }
                    }
                } while (tree.deepnext(true))
            }
        }

    }
})

function hastextnode(node) {
    return (node && node.firstChild && istextnode(node.firstChild))
}

function istextnode(node) {
    return node && (node.nodeType == 3)
}

function getinnertextnode(node) {
    var result = node

    while (!istextnode(result) && result.firstChild) {
        result = result.firstChild
    }
    return result
}

function truenode(node) {
    if (istextnode(node)) {
        return node.parentNode
    }
    return node
}

//todo: to set the selection
//find parent recursively where child node is first child. 

var nodetree = object.create({
    node: null
    , offset: 0
    , charcount: 0
    , root: null
    , start: null
    , end: null
    , create: function (root) {
        this.root = truenode(root) || null
        this.node = this.root
        this.offset = 0
        this.charcount = 0
        this.setselection(0, 0)
    }

    , bookmark: function (value) {
        if (value) {
            this.setposition(value.node, value.offset)
        } else {
            return { node: this.node, offset: this.offset }
        }
    }

    , setposition: function (node, offset) {
        this.node = truenode(node)
        this.offset = offset || 0
        return (this.node)
    }

    , movenextuntil: function(node) {
    }

    , movenextchars: function(offset, charcount) {
    }

    , moveprevuntil: function (node) {
    }
    
    , gettextposition: function (node, offset) {
        var bookmark = this.bookmark()
        this.setposition(node, offset)
        var charcount = offset

        while (this.deepprev()) {
            if (istextnode(this.node)) {
                charcount += this.node.nodeValue.length
            }
        }
        this.bookmark(bookmark)
        return charcount
    }

    , findnode: function (charcount) {
        if (this.offset) { charcount += this.offset }

        var node = null

        do {
            node = this.node
            if (istextnode(node)) {
                if (node.nodeValue.length >= charcount) { break }
                charcount -= node.nodeValue.length
            }
        } while (this.deepnext())
        this.offset = charcount 
        this.node = truenode(node)
        return node
    }

    , remove: function () {
        var node = this.node

        if (node.firstChild) {
            this.node = node.firstChild
            this.remove()
            this.node = node
        }
        this.deepnext(true)

        if (node == this.start.node) {
            this.start.node = this.node
            this.start.offset = 0
        }
        if (node == this.end.node) {
            this.start.node = this.node
            this.start.offset = 0
        }
        this.node = node
        this.deepprev(true)

        node.parentNode.removeChild(node)
    }

    , movefirst: function () {
        return this.setposition(this.start.node || this.root, this.start.offset || 0)

    }
    , movelast: function () {
        return this.setposition(this.end.node || this.root, this.end.offset || this.root.innerHTML.length)
    }
    , deepnext: function (skiptextnode) {
        if (!this.node) { return false }

        if (this.node.firstChild && (!skiptextnode || (!istextnode(this.node.firstChild)))) {
            this.node = this.node.firstChild
            return true
        }

        do {
            if (this.node.nextSibling) {
                this.node = this.node.nextSibling
                return true
            }
            if (!this.node.parentNode) { return false }
            this.node = this.node.parentNode
        } while ((this.node != this.root))

        return false
    }

    , deepprev: function (skiptextnode) {
        if (!this.node) { return false }

        if (this.node == this.root) { return false } 

        if (this.node.previousSibling) {
            this.node = this.node.previousSibling
            while (this.node.lastChild && (!skiptextnode || (!istextnode(this.node.lastChild)))) {
                this.node = this.node.lastChild
            }
        } else {
            if (!this.node.parentNode) { return false }
            this.node = this.node.parentNode
        }

        return true
    }

    , setselection: function (start, length) {
        this.start = { node: this.root, offset: 0 }
        this.end = { node: this.root, offset: 0 }

        if ((start > 0) || (length > 0)) {
            this.movefirst()
            if (this.findnode(start)) {
                this.start = {
                    node: truenode(this.node)
                    , offset: this.offset
                }

                this.findnode(length)
                this.end = {
                    node: truenode(this.node)
                    , offset: this.offset
                }
            }
        }
        return this
    }

    , getselection: function () {
        var result = {}

        result.start = this.gettextposition(this.start.node, this.start.offset)
        result.length = this.gettextposition(this.end.node, this.end.offset) - result.start

        return result
    }
       
    , showcursorselection: function () {
        var range = window.document.createRange()

        range.setStart(getinnertextnode(this.start.node), this.start.offset)
        range.setEnd(getinnertextnode(this.end.node), this.end.offset)

        window.getSelection().addRange(range)
    }

    , getcursorselection: function () {
        var sel = window.getSelection()
        this.setselection(0, 0)

        if (sel && sel.rangeCount) {
            var tr = sel.getRangeAt(0)

            this.start = {
                node: truenode(tr.startContainer)
                , offset: tr.startOffset
            }
            this.end = {
                node: truenode(tr.endContainer)
                , offset: tr.endOffset
            }
        }
        this.movefirst()
        return this
    }

    , issinglenodeselection: function () {
        return (this.start.container == this.end.container)
    }
    , noselection: function () {
        return (this.singlenodeselection() && (this.start.offset >= this.end.offset))
    }
        
    , hidecursorselection: function () {
        var sel = window.getSelection()

        if (sel.rangeCount > 0) { sel.removeAllRanges() }
    }

    , wrapselection: function (tag) {
        this.movefirst()

        var parent = this.insert(tag, true, false)
        var node = this.node
        while ((node != this.end.node) && this.deepnext()) {
            node = this.node
            parent.appendChild(node)
        }
    }

    , insert: function (tag, insertbefore, splitcontents) {
        var el
        var node

        if (tag) {
            node = document.createElement(tag)
        } else {
            node = this.node.cloneNode()
            node.id = ""
        }

        var part1 = left$(this.node.innerHTML, this.offset)
        var part2 = mid$(this.node.innerHTML, this.offset + 1)

        if (insertbefore) {
            el = this.node
            if (splitcontents) {
                node.innerHTML = part1
                this.node.innerHTML = part2
            }
        } else {
            el = this.node.nextSibling
            if (splitcontents) {
                this.node.innerHTML = part1
                node.innerHTML = part2
            }
        }

        if (splitcontents) {
            if (this.end.node == this.node) {
                if (insertbefore) {
                    if (this.end.offset > this.offset) {
                        this.end.offset -= part1.length
                    } else {
                        this.end.node = node
                    }
                } else {
                    if (this.end.offset >= this.offset) {
                        this.end.node = node
                        this.end.offset -= part1.length
                    }

                }
            }

            if (this.start.node == this.node) {
                if (insertbefore) {
                    if ((this.start.offset > this.offset)) {
                        this.start.offset = this.start.offset - this.offset
                    } else {
                        this.start.node = node
                    }
                } else {
                    if ((this.start.offset >= this.offset)) {
                        this.start.node = node
                        this.start.offset = this.start.offset - this.offset
                    }
                }
            }
        }
        this.node.parentNode.insertBefore(node, el)
        this.node = node
        this.offset = 0

        return node
    }

    , merge: function (intonext) {
        var node = this.node

        var len = node.innerHTML.length

        if (intonext) {
            this.node = this.node.nextSibling
            if (this.node) {
                node.innerHTML = node.innerHTML + this.node.innerHTML

                if (this.node == this.start.node) {
                    this.start.node = node
                    this.start.offset += len
                } else if (this.node == this.end.node) {
                    this.end.node = node
                    this.end.offset += len
                }
                this.remove()

            }
        } else {
            this.node = this.node.previousSibling

            if (this.node) {
                node.innerHTML = this.node.innerHTML + node.innerHTML
                if (this.node == this.start.node) {
                    this.start.node = node
                }
                if (this.node == this.end.node) {
                    this.end.node = node
                }
                if (node == this.start.node) {
                    this.start.offset += len
                }
                if (node == this.end.node) {
                    this.end.offset += len
                }
                this.remove()
            }
        }

        this.node = node
        return node
    }

    , dump: function () {
        debug.log("Start: " + this.start.node.tagName + ": " + this.start.offset + " : " + this.start.node.innerHTML)
        debug.log("End: " + this.end.node.tagName + ": " + this.end.offset + " : " + this.start.node.innerHTML)
        debug.log("Current: " + this.node.tagName + ": " + this.offset + " : " + this.start.node.innerHTML)
    }
})


//var findLastChildNode = function (node) {
//    if (!node) { return null }
//    while (node.lastChild) {
//        node = node.lastChild
//    }
//    return node
//}

