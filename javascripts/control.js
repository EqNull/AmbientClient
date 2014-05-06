/// <reference path="base.js" />

//Todo: replace __background with a json or set __background to the body
//Todo: Add status to control. Enabled becomes a state. Add function / var that returns if a control is able to receive any events.
//Todo: finish grouped controls
//Todo: use css3 transitions if available, and replace animation timers with a requestAnimationFrame hook
//Todo: tabindex. Setting / loosing focus has to be done manually. 

var __uniqueid = 1;

var classbind = function (instance, method) {
    return function () {
        return method.apply(instance, arguments);
    }
};

var environ = {
    istouch: ("createTouch" in document)
    , button: 0
}

var cRect = object.create({
    create: function (left, top, width, height) {
        this.left = left
        this.top = top
        this.width = width
        this.height = height
        this.right = left + width - 1
        this.bottom = top + height - 1
    }

    , clone: function () {
        return new cRect(this.left, this.top, this.width, this.height)
    }

    , torect: function (rect) {
        this.create(
            parseInt(rect.left) >>> 0
            , parseInt(rect.top) >>> 0
            , parseInt(rect.width) >>> 0
            , parseInt(rect.height) >>> 0
        )
    }

    , move: function (left, top) {
        if (typeof left == "object") { return this.move(left.left, left.top)}
        this.left += left
        this.top += top
        this.right = this.left + this.width - 1
        this.bottom = this.top + this.height - 1
        return this;
    }

    , substractborder: function (left, top, right, bottom) {
        if (typeof left == "object") { return this.substractborder(left.left, left.top, left.right, left.bottom) }
        this.create(this.left + left, this.top + top, this.width - left - right, this.height - top - bottom )
        return this;
    }

    , calculaterelative: function (width, height, alignright, containerrect) {
        var result

        if (alignright) {
            result = new cRect(this.right + 1, this.top, width, height)
            if (((result.right + 1) > containerrect.width) && (result.width < this.left)) {
                result.left = this.left - width
            }

            if (result.height >= containerrect.height) {
                result.top = 0
            } else if ((result.bottom + 1) > containerrect.height) {
                result.top = containerrect.height - height
            }
        } else {
            result = new cRect(this.left, this.bottom + 1, width, height)
            if (((result.bottom + 1) > containerrect.height) && (result.height < this.top)) {
                result.top = this.top - height
            }

            if (result.width > containerrect.width) {
                result.left = 0
            } else if ((result.right + 1) > containerrect.width) {
                result.left = containerrect.width - width
            }
        }
        return result
    }
    , borderhit: function (x, y) {
        var result = (x < (this.left + 4) ? eborder.left : 0) + (y < (this.top + 4) ? eborder.top : 0) + (x >= (this.right - 4) ? eborder.right : 0) + (y >= (this.bottom - 4) ? eborder.bottom : 0)
        return result
    }
    , hit: function (x, y) {
        return !((x < this.left) || (y < this.top) || (x > this.right) || (y > this.bottom))
    }

    , movecontrol: function(ctrl) {
        ctrl.move(this.left, this.top, this.width, this.height)
    }
})

//######################################################################
//Easing
//######################################################################
//* Based on easing equations from Robert Penner
//* http://www.robertpenner.com/easing
var tween = function (startpos, endpos, currentstep, easein, easeout) {
    if (easein || easeout) {
        if (!easein) {
            currentstep = (1 - easeout(1 - currentstep))
        } else if (!easeout) {
            currentstep = easein(currentstep)
        } else {
            if (currentstep < .5) {
                currentstep = (easein(currentstep * 2)) / 2
            } else {
                currentstep = .5 + ((1 - easeout((1 - currentstep) * 2)) / 2)
            }
        }
    }
    if ((startpos == 0) && (endpos == 1)) {
        return currentstep
    } else {
        return Math.round((endpos - startpos) * currentstep) + startpos
    }
}

var easing = (function() {
    return {
        quad: function (t) { return t * t; }
        , cubic: function (t) { return t * t * t; }
        , quart: function (t) { return t * t * t * t; }
        , quint: function (t) { return t * t * t * t * t; }
        , sine: function (t) { return 1 - Math.cos(t * (Math.PI / 2)); }
        , expo: function (t) { return (t == 0) ? 0 : Math.pow(2, 10 * (t - 1)); }
        , circ: function (t) { return -(Math.sqrt(1 - t * t) - 1); }

        , elastic: function (t) {
            if (t == 0) { return 0; }
            if (t == 1) { return 1; }
            var p = 0.3;
            var s = 0.075;
            return -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * (2 * Math.PI) / p));
        }

        , back: function (t) {
            var s = 1.70158;
            return t * t * ((s + 1) * t - s);
        }

        , bounce: function (t) {
            t = 1 - t;
            if (t < (1 / 2.75)) { return 1 - (7.5625 * t * t); }
            if (t < (2 / 2.75)) { return 1 - (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75); }
            if (t < (2.5 / 2.75)) { return 1 - (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375); }
            return 1 - (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
        }
    }
})();


function tohtmlpos(coord, units) {
    var result = "" + coord;
    var length = result.length;

    if (length > 0) {
        var charcode = result.charCodeAt(length - 1);
        if ((charcode >= 48) && (charcode <= 57)) { result += units; }
    }
    return result;
}

var efb = {
    none : 0
    , click : 1
    , normal : 1
    //    ,state: 2
    , stateaction : 3
    //    ,option: 4
    , optionaction : 7
    , capturekeys : 8
    , change : 16
    , move : 32
    , drag : 64
    , drop : 128
    , size : 256
    , scroll: 512
    , resize: 1024
    , background: 2048
    , other: 32768
}


//var sTimer = function(key, status, startpos, endpos, units, delay, duration, easin, easout, starttime, params, interval, next) {
//    this.key = key
//    this.status = status
//    this.startpos = startpos || 0;
//    this.endpos = endpos || startpos || 0;
//    this.units = units || ""
//    this.delay = delay || 0
//    this.duration = duration || 0
//    this.easin = easin || null;
//    this.easeout = easeout || null
//    this.params = params || null
//    this.interval = interval || 0;
//    this.next = next || null
//    this.starttime = new Date().getTime();
//}



var eborder = {
    left: 1
    , top: 2
    , right: 4
    , bottom: 8
    , all: 15
};


var keycodes = function() {
    var result = [];

    var specialkeys = {
        "32": "space"
        , "13": "enter"
        , "9": "tab"
        , "27": "esc"
        , "8": "backspace"
        , "37": "left"
        , "38": "up"
        , "39": "right"
        , "40": "down"
    }

    var index;

    for (index = 1; index <= 127; index++) {
        result[index] = chr$(index).toLowerCase();
    }

    for (index in specialkeys) {
        result[index] = specialkeys[index];
    }

    for (index = 1; index <= 12; index++) {
        result[111 + index] = "f" + index;
    }
    return result;
}();

var _ec = -1

var estate = {
    unloaded: _ec++
    , none: _ec++
    , created: _ec++
    , showed: _ec++
    , hidden: _ec++
}


var __htmlevents = {
    "mouseover": { name: "mouseenter", behaviortype: efb.click }
    , "mouseout": { name: "mouseleave", behaviortype: efb.click | efb.background }
    , "mouseup": { name: "mouseup", behaviortype: efb.click | efb.drag | efb.scroll }
    , "mousedown": { name: "mousedown", behaviortype: efb.click | efb.drag | efb.scroll }
    , "mousemove": { name: "mousemove", behaviortype: efb.move | efb.drag | efb.scroll}
    , "touchstart": { name: "mousedown", behaviortype: efb.click | efb.drag | efb.scroll }
    , "touchend": { name: "mouseup", behaviortype: efb.click | efb.drag | efb.scroll }
    , "touchmove": { name: "mousemove", behaviortype: efb.move | efb.drag | efb.scroll, }
    //, "focus": { name: "focus", behaviortype: efb.click }
    //, "blur": { name: "blur", behaviortype: efb.click }
    , "select": { name: "select", behaviortype: efb.click }
    , "change": { name: "change", behaviortype: efb.change | efb.capturekeys }
    , "resize": { name: "resize", behaviortype: efb.resize }
    , "keydown": { name: "keydown", behaviortype: efb.capturekeys, cancelbubble: false}
    , "keyup": { name: "keyup", behaviortype: efb.capturekeys, cancelbubble: false }

}

var evt = {
    none: {}
    , bool: { options: ["yes", "no"] }
    , text: { }
    , number: { filter: function (val) { return parseInt(val) } }
    , unit: { options: ["px", "%", "pt", "pc", "cm", "mm", "in", "em", "ex", "auto"] }
    , visibility: { options: ["visibility", "hidden"] }
    , pos: { } // fields: { pos: { type: "number" }, unit: { type: "unit" } } }
    , color: {}
    , overflow: { options: ["none", "hidden", "scroll"] }
    , position: { options: ["absolute", "relative", "fixed", "static"] }
    , bgrepeat: { options: ["no-repeat", "repeat", "repeat-x", "repeat-y"] }
    , float: { options: ["none", "left", "right"] }
    , clear: { options: ["none", "left", "right", "both"] }
    , fontstyle: { options: ["normal", "italic", "oblique"] }
    , fontvariant: { options: ["normal", "small-caps"] }
    , textdecoration: { options: ["none", "underline", "strikethrough", "overline"] }
    , textalign: { options: ["left", "center", "right", "justify"] }
    , texttransform: { options: ["none", "capitalize", "uppercase", "lowercase"] }
    , wordwrap: { options: ["normal", "break-word" ] }
    , whitespace: { options: ["normal", "nowrap", "pre", "pre-line", "pre-wrap"] }
    , borderstyle: { options: ["none", "solid", "dotted", "dashed", "double"] }
    , border: { fields: { width: { type: "pos" }, style: { type: "borderstyle" }, color: { type: "color" } } }
    , borderradius: { fields: { type: "number", max: 0, max: 100 } }
    , display: { options: ["none", "block", "inline", "list-item", "inline-block", "table-cell"] }
    , cursor: { options: ["auto", "crosshair", "default", "hand", "move", "text", "wait", "help"] }
}

var __css = {
    "width": { type: "pos", group: "layout" }
    , "border-radius": { type: "borderradius", test: "prefix", sides: ["top-left", "top-right", "bottom-right", "bottom-left"] }

    , "height": { type: "pos" }
    , "left": { type: "pos" }
    , "top": { type: "pos" }
    , "right": { type: "pos" }
    , "bottom": { type: "pos" }
    , "overflow": { type: "overflow" }
    , "overflow-x": { type: "overflow", inherit: "overflow"}
    , "overflow-y": { type: "overflow", inherit: "overflow" }
    , "position": { type: "position" }
    , "float": { type: "float" }
    , "clear": { type: "clear" }
    , "display": { type: "display" }
    , "margin": { type: "pos", sides: "ltrb" }
    , "padding": { type: "pos", sides: "ltrb" }
    , "visibility": { type: "visibility" }
    , "z-index": { type: "number" }

    , "cursor": { type: "cursor", group: "appearance" }
    , "background-color": { type: "color" }
    , "background-repeat": { type: "bgrepeat"}
    , "background-image": { type: "image" }
    , "background-attachment": { type: "text" }
    , "background-position": { type: "text" }
    , "opacity": { test: "prefix" }

    , "border": { type: "border", sides: "ltrb" }
    , "border-style": { type: "borderstyle", sides: "ltrb" }
    , "border-color": { type: "color", sides: "ltrb" }
    , "border-thick": { type: "pos", sides: "ltrb" }

    //, "border-top-left-radius": { inherit: "border-radius" }
    //, "border-top-right-radius": { inherit: "border-radius" }
    //, "border-bottom-right-radius": { inherit: "border-radius" }
    //, "border-bottom-left-radius": { inherit: "border-radius" }

    , "color": { type: "color", group: "text" }
    , "font-family": { type: "cssfont" }
    , "font-size": { type: "pos" }
    , "font-weight": { type: "number" }
    , "font-height": { type: "pos" }
    , "font-variant": { type: "fontvariant" } 
    , "letter-spacing": { type: "pos" }
    , "font-style": { type: "fontstyle" }
    , "line-height": { type: "pos" }

    , "text-align": { type: "textalign" }
    , "text-decoration": { type: "textdecoration" }
    , "text-transform": { type: "texttransform" }
    , "text-indent": { type: "pos" }
    , "word-wrap": { type: "wordwrap" } 
    , "white-space": { type: "whitespace" }

    , "vertical-align": {}
    , "border-collapse": {}
    , "border-spacing": {}
    , "box-shadow": { test: "prefix" }
    , "blur": { test: "prefix" }
    , "box-sizing": { test: "prefix" }
    , "transition": { test: "prefix" }
    , "transition-timing-function": { test: "prefix" }
};

var __cssdata = {}

var x = {
    background: { color: "10", repeat: "repeat" }
    , border: { left: { with: 2 }, right: { width: 4 }, style: "solid" }
}

var capitalize = function (word) {
    if (!word) { return ""}
    return left$(word, 1).toUpperCase() + mid$(word, 2)
}

var css = (function () {
    var item
    var css = {}
    var stylename = ""
    var prefixes = ["", "-webkit-", "-moz-", "-ms-", "-o-"]
    var namesplit
    var newname
    var testdiv = document.createElement("DIV")
    var sideindex
    var side

    for (var index in __css) {
        item = __css[index]

        var sides = item.sides || [null]
        if (sides == "ltrb") { sides = ["left", "top", "right", "bottom"] }
        //Todo: complete rewrite. 
        for (sideindex = -1; sideindex < sides.length; sideindex++) {
            var namesplit = split$(index, "-")
            side = sides[sideindex] || ""

            if (side) {
                newname = arrayinsert(namesplit, 1, split$(side, "-"))
            } else {
                newname = namesplit
            }

            capitalizedname = newname[0]

            //Todo: use get and setattribute for testing
            for (var i = 1; i < newname.length; i++) {
                capitalizedname += capitalize(newname[i])
            }
            var style = {}


            if (item) {
                if (item.test == "prefix") {
                    for (var prefixindex in prefixes) {
                        var prefix = prefixes[prefixindex]
                        if (testdiv.style[prefix + capitalizedname] != undefined) {
                            capitalizedname = prefix + capitalizedname
                            break
                        }
                    }
                }
            }

            var cssname = newname.join("-")
            var stylename = newname.join("")

            css[stylename] = capitalizedname

//          todo: special cases, like transforms
//            if (stylename) { style.css = cssname }
//            __cssdata[cssname] = style
        }
    }
    return css
})()

var __background;
var __controls = {};

var mousehighlight = null;  //Control where the mousepointer is over
var mousefocus = null;  //Last control that accepted a mousedown.
//var mousedrag = null;  //Last control that accepted a dragstart.
var dragevent = null;

function domeventadd(element, eventname, callback) {
    if (element.addEventListener) {
        element.addEventListener(eventname, callback, false)
    } else if (element.attachEvent) {
        element.attachEvent("on" + eventname, callback)
    }
}

function domeventremove(element, eventname, callback) {
    if (element.removeEventListener) {
        element.removeEventListener(eventname, callback, false)
    } else if (element.detachEvent) {
        element.detachEvent("on" + eventname, callback)
    }
}


//Catch all events at document level
document.onmouseover = __HandleHTMLevents;
document.onmousedown = __HandleHTMLevents;
//document.onchange = __HandleHTMLevents;
document.onkeydown = __HandleHTMLevents;
document.onkeyup = __HandleHTMLevents;

//document.onfocus = __HandleHTMLevents;
//document.onblur = __HandleHTMLevents;

//Make touch devices and desktop act somewhat similar.
if (environ.istouch) {
    //Todo: Newer devices need support for simultaneous support of both mouse and touch
    document.ontouchstart = __HandleHTMLevents;
    document.ontouchend = __HandleHTMLevents;
    document.ontouchmove = __HandleHTMLevents;
} else {
    document.onmouseout = __HandleHTMLevents;
    document.onmouseup = __HandleHTMLevents;
    document.onmousemove = __HandleHTMLevents;
}

var cHtmlEvent = object.create(cEvent, { 
    create: function(event) {
        var eventdef = __htmlevents[event.type]
        var mouseinfo = (event.touches && event.touches.length ? event.touches[0] : event);

        switch (eventdef.name) {
            case "mousedown": //Mouse move doesn't give the correct button
                environ.button = !!(event.which || event.button) || !!(event.touches && event.touches.length)
                break;
            case "mouseup":
                environ.button = 0
                break;
        }

        this.name = eventdef.name || event.type
        this.htmlevent = event.type
        this.behaviortype = eventdef.behaviortype || efb.other
        this.cancelbubble = eventdef.cancelbubble != undefined ? eventdef.cancelbubble : true
        this.mouse = {
            x: mouseinfo.pageX || (mouseinfo.clientX + document.body.scrollLeft)
            , y: mouseinfo.pageY || (mouseinfo.clientY + document.body.scrollTop)
        }
//Todo: Cross browser scrollposition of the page
//        typeof window.pageYOffset != 'undefined' ? window.pageYOffset : document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop ? document.body.scrollTop : 0;
        this.key = keycodes[event.keyCode]
        this.ctrlkey = event.ctrlKey
        this.altkey = event.altKey
        this.shiftkey = event.shiftKey
        this.button = environ.button
    }
})

var cDragEvent = object.create(cEvent, {
    status: 0

    , create: function (mousedrag, event) {
        var el = mousedrag.element

        this.source = mousedrag

        this.start = { x: event.mouse.x, y: event.mouse.y }
        this.mouse = { x: event.mouse.x, y: event.mouse.y }
        this.modx = { x: 0, y: 0 }
        this.button = event.button

        this.control = mousedrag.absoluteposition()
        this.scroll = { x: el.scrollLeft, y: el.scrollTop }
        this.automove = !!(mousedrag.focusbehavior & efb.drag)

        if (mousedrag.focusbehavior & efb.size) {
            this.selectedborder = (this.control.borderhit(event.mouse.x, event.mouse.y) & mousedrag.__sizable)
        } else {
            this.selectedborder = 0
        }

        if (event.name == "mousedown") {
            this.status = 1
            this.name = "dragstart"
        }
    }

    , mousemove: function (event) {
        this.mouse = { x: event.mouse.x, y: event.mouse.y }
        this.calc(event.mouse.x - this.start.x, event.mouse.y - this.start.y)
    }

    , calc: function (modx, mody) {
        if (modx == undefined) { modx = this.modx }
        if (mody == undefined) { mody = this.mody }

        var mousedrag = this.source

        if (this.status == 1) {
            var mod = Math.max(Math.abs(modx), Math.abs(mody))

            if (this.selectedborder) {
                this.name = "size"
                this.status = 2
            } else if (!(this.source.focusbehavior & efb.normal) || (mod >= 4)) {
                this.name = "drag"
                this.status = 2
            }
        }

        if (this.status == 1) {
            modx = 0
            mody = 0
            return
        }

        if (this.selectedborder) {
            var parentpos = mousedrag.parentposition()
            this.newpos = this.control.clone().move(-parentpos.left, -parentpos.top)

            if (this.selectedborder & eborder.left) {
                if (this.control.width - modx < 16) { modx = this.control.width - 16 }
                this.newpos.left = this.control.left + modx
                this.newpos.width = this.control.width - modx
            }

            if (this.selectedborder & eborder.top) {
                if (this.control.height - mody < 16) { mody = this.control.height - 16 }
                this.newpos.top = this.control.top + mody
                this.newpos.height = this.control.height - mody
            }

            if (this.selectedborder & eborder.right) {
                if (this.control.width + modx < 16) { modx = -(this.control.width - 16) }
                this.newpos.width = this.control.width + modx
            }

            if (this.selectedborder & eborder.bottom) {
                if (this.control.height + mody < 16) { mody = -(this.control.height - 16) }
                this.newpos.height = this.control.height + mody
            }

        } else {
            //Todo: this shouldn't be here
            if (this.automove) {
                var parentpos = mousedrag.parentposition()
                this.newpos = this.control.clone()
                    .move(-parentpos.left, -parentpos.top)
                    .move(modx, mody)

            } else {
                this.newpos = new cRect(
                    between(this.scroll.x - modx, 0, mousedrag.element.scrollWidth)
                    , between(this.scroll.y - mody, 0, mousedrag.element.scrollHeight)
                    , this.control.width
                    , this.control.height
                )
            }
        }
        this.modx = modx
        this.mody = mody
    }

})

var event = {
    type: "mousedown"
    , clientx: 10
    , clienty: 10
    , keycode: 101
    , altkey: false
    , shiftkey: false
    , ctrlkey: false
    , which: 1
    , button: 1
}


function __HandleHTMLevents(e) {
    var ctrl = null;

    if (!e) { e = window.event; }

    if (e.type == "mouseup") {
        alert
    }

    var element = e.target || e.srcElement;

    if ((!element) || ((element) == window)) {
        if (!__background) { return; }
        element = __background.element;
    }

    while (ctrl == null) {
        if ("" + (element).cid != "") {
            ctrl = __controls[(element).cid];
            if (ctrl) {
                break;
            }
        }
        element = element.parentNode;
        if (!element) {
            break;
        }
    }

    var event = new cHtmlEvent(e);

    if (!dragevent) {
        var mousedrag = ctrl;

        while (mousedrag) {
            if ((mousedrag.style.visibility == "visible") && (mousedrag.enabled)) {
                if (mousedrag.focusbehavior & (efb.drag | efb.scroll | efb.size)) {

                    dragevent = new cDragEvent(mousedrag, event)
                    if (dragevent.status) {
                        mousedrag.raise(dragevent)
                    }
                    break;
                }
            }
            mousedrag = mousedrag.parent;
        }
    } else {
        if (dragevent) {
            switch (event.name) {
                case "mousemove": {
                    if (dragevent.status) {
                        dragevent.mousemove(event)

                        dragevent.source.raise(dragevent)

                        if (dragevent.status == 2) {
                            if (dragevent.selectedborder || dragevent.automove) {
                                dragevent.calc(dragevent.modx, dragevent.mody)
                                dragevent.newpos.movecontrol(dragevent.source)
                            } else {
                                var el = dragevent.source.element
                                el.scrollLeft = dragevent.newpos.left
                                el.scrollTop = dragevent.newpos.top
                            }
                        }
                        ctrl = null;
                    }

                    break;
                }
                case "mouseup": {
                    if (dragevent.status == 2) {
                        dragevent.name = "dragend"
                        dragevent.source.raise(dragevent)
                        ctrl = null
                    }
                    dragevent = null
                    break;
                }
            }
        }
    }

    var raiseclick;

    while (ctrl) {
        if ((ctrl.style.visibility == "visible") && (ctrl.enabled)) {
            if (ctrl.focusbehavior & event.behaviortype) {
                break;
            }
        }
        ctrl = ctrl.parent;
    }

    if (!ctrl) {
        switch (event.name) {
            case "mousedown":
                setfocus(null)
                break;
        }
    } else {
        switch (event.name) {
            case "mouseup": {
                if (dragevent && (dragevent.status == 2)) { return }

                if (mousefocus) {
                    if (environ.istouch || (mousefocus == mousehighlight)) {
                        raiseclick = true;
                    }
                }
                setfocus(ctrl)
                break;

            }
            case "mousedown": {
                if (dragevent && (dragevent.status == 2)) { return }

                if (ctrl.focusbehavior & efb.capturekeys) { event.cancelbubble = false }
                setfocus(ctrl)
                break;

            }
            case "mouseenter": {
                //todo: highlight can be tested by comparing the mousehighlight copy.
                //todo: property highlight will be replaced with state / status
                if (ctrl.highlight) {
                    break;
                }
                if (mousehighlight) {
                    if (mousehighlight.hasancestor(ctrl)) {
                        break;
                    } else {
                        ctrl.highlight = false;
                        event.source = mousehighlight
                        mousehighlight.raise(event);
                        mousehighlight.setdirty();
                    }
                }
                mousehighlight = ctrl;
                ctrl.highlight = true;
                break;

            }
            case "mouseleave": {
                if (!ctrl.highlight) {
                    ctrl = null;
                } else {
                    if (mousehighlight) {
                        mousehighlight.highlight = false;
                        mousehighlight = null;
                    }
                }
                if (__background) {
                    if (__background.absoluteposition().hit(event.mouse.x, event.mouse.y)) {
//                        setfocus(null)
                    }
                }
                break;

            }
            case "drag": {
                break;

            }
            case "drop": {
                break;

            }
        }
    }

    var pointer = "default";
    if (dragevent) {
        switch (dragevent.selectedborder) {
            case eborder.left | eborder.top:
            case eborder.right | eborder.bottom:
                pointer = "nw-resize"; break;
            case eborder.left | eborder.bottom:
            case eborder.right | eborder.top:
                pointer = "ne-resize"; break;
            case eborder.left:
            case eborder.right:
                pointer = "ew-resize"; break;
            case eborder.top:
            case eborder.bottom:
                pointer = "ns-resize"; break;

            default:
                switch (dragevent.source.focusbehavior) {
                    case efb.normal:
                        pointer = "pointer"
                    case efb.drag:
                        pointer = "move"
                    default:
                        pointer = "pointer"
                }
        }
        dragevent.source.set(css.cursor, pointer)

        if (!dragevent.status) {  //We only needed the dragevent to set the mouse pointer
            dragevent = null
        }

    } else if (ctrl) {
        if (ctrl.focusbehavior & efb.normal) {
            pointer = "pointer"
        }
        ctrl.set("cursor", pointer)
    }

    if (ctrl) {
        event.source = ctrl
        ctrl.raise(event);
        if (raiseclick) {
            switch (this.focusbehavior) {
                case efb.click:
                case efb.normal: {
                    ctrl.selected = false;

                }
                case efb.stateaction: {
                    ctrl.selected = !ctrl.selected;
                    break;

                }
                case efb.optionaction | efb.stateaction:
                    ctrl.selected = !ctrl.selected;
                    break;
                case efb.optionaction: 
                    if (ctrl.selected) {
                        raiseclick = false;
                    } else {
                        ctrl.selected = true
                    }
            }
            if (raiseclick) {
                event.name = "click";
                ctrl.raise(event.name, event);
            }
        }
        ctrl.setdirty();
    }

    if (event.cancelbubble || (dragevent && dragevent.status == 2)) {
        if (event.stopPropagation) { event.stopPropagation(); }
        if (event.cancelBubble)    { event.cancelBubble = true; }
        if (event.preventDefault)  { event.preventDefault(); }
        if (event.returnValue)     { event.returnValue = false; }
        return false;
    }
}

var setfocus = function (ctrl) {
    if (mousefocus == ctrl) { return }

    var target = mousefocus;
    var commonancestor = ctrl? ctrl.findsharedancestor(mousefocus) : null

    while (target) {
        if (target == commonancestor) { break; }
        if (target.id) {
            target.raise("blur")
        }

        target = target.parent
    }

    mousefocus = ctrl
    if (ctrl) {
        ctrl.mousefocus = true
        if (ctrl.element && ctrl.element.focus) { ctrl.element.focus() }
        ctrl.raise("focus")
    }
}

function setproperty(name, local) {
    var code = ""
    local = local || "this._" + name

    code += "if (newval != undefined) {"
    code += "  " + local + " = newval;"
    code += "  return this;"
    code += "} else {"
    code += "  return " + local
    code += "}"
    return new Function("newval", code)
}

//****************************************************************************************************
// Control
//****************************************************************************************************
var cControl = object.create({
    dirty: -1
    , controlname: ""
    , tagname: "div"
    , tagtype: ""
    , focusbehavior: efb.none
    , groupindex: 0
    , state: 0
    , highlight: false
    , selected: false
    , enabled: true
    , multiselect: false
    , __sizable: 0

    , create: function (name, tagname, markdownvalue) {
//        if (this.estate > estate.none) {
            tagname = (tagname || "div").toLowerCase();

            this.name = name || this.controlname
            var pos = tagname.indexOf(".")
            if (pos >= 0) {
                this.tagname = "input"
                this.tagtype = tagname.substring(pos + 1);
            } else {
                this.tagname = tagname
            }

            this.id = __uniqueid++;
            __controls[this.id] = this;

            if (this.element) {
                this.state = estate.showed
            } else {
                if (this.state != estate.unloaded) {
                    this.load()
                } else {
                    this.style = {}
                    this.element = {}
                }

                if (this.element.style) {
                    this.style.position = "absolute"
                    this.style.visibility = "visible"
                    this.style.boxSizing = "border-box"
                }
            }
//        }
        if (markdownvalue) { this.markdownvalue(markdownvalue) }
//        this.element.className = this.name;
    }

    , markdownvalue: function (value) {
        if (value) {
            if (typeof value == "object") {
                for (var index in value) {
                    this[index] = value
                }
            } else if (this.text != undefined) {
                this.set("text", value)
            } else if (this.value != undefined) {
                this.set("value", value)
            }
            return this
        }

        var index = 0
        var result = {}
        for (index in this) {
            if (this.hasOwnProperty(index)) {
                if (typeof this[index] != "function") {
                    index++
                    result[index] = this[index]
                }
            }
        }

        if (index == 1) {
            if (result["text"]) {
                result = result[text]
            } else if (result["value"]) {
                result = result[value]
            }
        }
        return result
    }

    //Todo: balanced control tree
    , setname: function (name) {
        var parent = this.parent;

        if (!parent) {
            this.name = name
            this.groupname = name
            return
        }

        var pos = name.indexOf("#");
        if (pos > 0) {
            this.groupname = name.substring(0, pos)
            var group = parent.controls[this.groupname]            

            if (!group) {
//                if (parent.controls[this.groupname]) { throw new Error() }
                group = parent.controls[this.groupname] = [null]
                this.groupindex = 1
            } else {
                this.groupindex = parseInt(name.substring(pos + 1)) || group.length
            }

            if (this.groupindex < group.length - 1) {
                this.setgroupindex(this.groupindex)
            } else {
                this.parent.controls[this.groupname][this.groupindex] = this
            }
            name = this.groupname + "#" + this.groupindex
        } else {
            this.groupname = name
        }

        this.name = name;
        this.parent.controls[name] = this
    }

    //Todo: balanced control tree
    , setgroupindex: function (newindex) {
        var items = this.parent.controls[this.groupname]
        var groupcount = items.length - 1

        var currentindex = this.groupindex

        if ((newindex < 1) || (newindex > groupcount)) { return }

        if (currentindex < newindex) {
            for (var index = currentindex + 1; index <= newindex; index++) {
                item[index].groupindex -= 1
                items[index - 1] = items[index]
            }        } else {
            for (var index = currentindex - 1; index >= newindex; index--) {
                item[i].groupindex += 1
                items[index + 1] = items[index]
            }
        }
        items[index] = this
        var relative = item[newindex + 1]
        this.groupindex = currentindex

        if (this.status >= estatus.showed) {
            this.parent.element.insertBefore(this.element, relative.element)
        }
    }

    , load: function () {
        var saveelement = this.element

        if (this.namespace != undefined) {
            this.element = document.createElementNS(this.namespace, this.tagname);
        } else {
            this.element = document.createElement(this.tagname);
        }

        if (this.tagtype) {
            this.element.type = this.tagtype
        }

        //if (this.saveelement) {
        //    merge(this.element, saveelement)
        //}

        if (this.style) {
            merge(this.element.style, this.style)
        }

        this.style = this.element.style;
        this.state = estate.created
        this.element.cid = this.id;
    }

    //cControl.prototype = {
    , show: function () {
        if (this.state <= estate.none) { this.load() }

        if (this.state == estate.created) {
            this.state = estate.showed

            if (this.parent) {
                var rel = (this.groupindex) ? this.parent.controls[this.groupindex + 1] : null
                if (rel) { rel = rel.element }
                this.parent.element.insertBefore(this.element, rel)
            } else {
                document.body.appendChild(this.element);
            }

            if (!__background) {
                __background = this;
                __background.focusbehavior = efb.background;
            }
        }
        if (this.onshow) { this.onshow.apply(this, arguments) }
        this.dirty = 0;

        this.setdirty();

        //        this.paint();
        return this;
    }

    , controllist: function (match) {
        var result = [];
        var index;
        var ctrl;

        match == "*" ? "" : match || "";
        for (index in this.controls) {
            ctrl = this.controls[index];
            if (ctrl.constructor == Array) {
                result = result.concat(ctrl.slice(1))
            } else if ((!ctrl.groupindex) || (match == "") || (match == ctrl.groupname)) {
                result.push(ctrl);
            }
        }
        return result;
    }
    
    //Todo: Set attributes
    , set: function (attribute, value) {
        if (value != undefined) {

            switch (attribute.constructor) {
                case Object:
                    //todo: looping
                    if (attribute.css) {
                        this.style[attribute.css] = value
                    }
                    break;

                case String:
                    //Todo: speed up, and use __cssdata
                    //Testing for function should be first
                    if (typeof this[attribute] == "function") {
                        this[attribute](value)
                    }  else if (this.element.style[attribute] != undefined) {
                        this.element.style[attribute] = value
                    } else if (this[attribute] != undefined) {
                        this[attribute] = value
                    } else {
                        this.element.setAttribute(attribute, value)
                    }
                    break;
            }
            this.setdirty();
            return this;
        }
    }

    , html: function (text) {
        if (text) {
            this.element.innerHTML = text
            return this
        } else {
            return this.element.innerHTML
        }
    }

    , setchildren: function (match, attribute, value) {
        var children = this.controllist(match)

        for (child in children) {
            child.set(attribute, value)
        }
        return this
    }

    , get: function (attribute) {
        if (css[attribute] == undefined) {
            if (typeof this[attribute] == "function") {
                return this[attribute] ()
            } else {
                return this[attribute]
            }
        } else {
            return this.style[attribute]
        }
    }

    , paint: function (force) {
        var index;
        var child;

        if ((force) || (this.dirty & 1)) {
            if (this.onpaint) { this.onpaint() }
//            this.updatestyle();
        }

        var controls = this.controllist();
        for (index in controls) {
            child = controls[index];
            if (child.dirty && child.parent == this) {
                child.paint();
            }
        }

        this.dirty = 0;
        return this;
    }

    , move: function (left, top, width, height) {
        var raiseresize = false;
        var raisemove = false;
        var posstyle = "px"

        if (width != null) {
            this.style.width = tohtmlpos(width, posstyle);
            raiseresize = true;
        }

        if (height != null) {
            this.style.height = tohtmlpos(height, posstyle);
            raiseresize = true;
        }

        if (left != null) {
            if (left == "center") {
                if (this.parent) {
                    left = Math.round((this.parent.innerwidth() - this.innerwidth()) / 2);
                    if (left < 0) { left == 0; }
                } else {
                    left = 0;
                }
            }
            this.style.left = tohtmlpos(left, posstyle);
            raisemove = true;
        }

        if (top != null) {
            if (top == "center") {
                if (this.parent) {
                    top = Math.round((this.parent.innerheight() - this.innerheight()) / 2);
                    if (top < 0) { top == 0; }
                } else {
                    top = 0;
                }
            }
            this.style.top = tohtmlpos(top, posstyle);
            raisemove = true;
        }
        if (raiseresize) {
            this.raise("resize")
//            if (this.onresize) { this.onresize() }
            this.setdirty();
        }
        return this;
    }

    , setfocus: function () {
        setfocus(this)
        this.element.focus()
    }

    , canvassize: function() {
        var ctrl = this.element;
        return new cRect(0, 0, ctrl.clientwidth, ctrl.clientheight)
    }

    //, position: function () {
    //    var ctrl = this.element;
    //    return new cRect(ctrl.offsetLeft, ctrl.offsetTop, ctrl.offsetWidth, ctrl.offsetHeight)
    //}

    , absoluteposition: function () {
        var ctrl = this.element
        
        return new cRect(ctrl.offsetLeft, ctrl.offsetTop, ctrl.offsetWidth, ctrl.offsetHeight).move(this.parentposition())
    }

    , clientposition: function () {
        var ctrl = this.element;
        var padding = this.element.style.padding

//        return new cRect(ctrl.offsetLeft + ctrl.clientLeft, ctrl.offsetTop + ctrl.clientTop, ctrl.clientWidth, ctrl.clientHeight).substractborder((parseInt(padding.left) || 0), (parseInt(padding.top) || 0), (parseInt(padding.width) || 0), (parseInt(padding.height) || 0))
        return new cRect(ctrl.clientLeft, ctrl.clientTop, ctrl.clientWidth, ctrl.clientHeight).substractborder((parseInt(padding.left) || 0), (parseInt(padding.top) || 0), (parseInt(padding.width) || 0), (parseInt(padding.height) || 0))
    }

    , innerleft: function () {
        var ctrl = this.element;
        return ctrl.offsetLeft + ctrl.clientLeft + this.parentposition().left + (parseInt(this.element.style.padding.left) || 0)
    }

    , innertop: function () {
        var ctrl = this.element;
        return ctrl.offsetTop + ctrl.clientTop + this.parentposition().top + (parseInt(this.element.style.padding.top) || 0)
    }

    , outerleft: function () {
        var ctrl = this.element;
        return ctrl.offsetLeft + this.parentposition().left
    }

    , outertop: function () {
        var ctrl = this.element;
        return ctrl.offsetTop + this.parentposition().top
    }

    , parentposition: function () {
        var element = this.element.offsetParent
        var left = 0
        var top = 0
        var width = element.offsetWidth
        var height = element.offsetHeight


        while (element) {
            left += element.offsetLeft
            top += element.offsetTop
            element = element.offsetParent
        }
        return new cRect(left, top, width, height)
    }
    
    , innerwidth: function () {
        return this.element.clientWidth - (parseInt(this.element.style.paddingLeft) || 0) - (parseInt(this.element.style.paddingRight) || 0);
    }

    , innerheight: function () {
        return this.element.clientHeight - (parseInt(this.element.style.paddingTop) || 0) - (parseInt(this.element.style.paddingBottom) || 0);
    }

    , outerwidth: function () {
        return this.element.offsetWidth;
    }

    , outerheight: function () {
        return this.element.offsetHeight;
    }

    , outerright: function () {
        return this.element.offsetLeft + this.element.offsetWidth
    }

    , outerbottom: function () {
        return this.element.offsetTop + this.element.offsetHeight
    }

    , size: function (width, height) {
        this.move(null, null, width, height);
        return this;
    }

    , sizable: function (borders) {
        if (borders) {
            this.focusbehavior |= efb.size
            this.__sizable = borders
        } else {
            this.focusbehavior &= !efb.size
            this.__sizable = 0
        }
        return this;
    }

    , hide: function () {
        //todo:
    }

    //Todo Destroying grouped controls.
    , destroy: function () {
        if (!this.id) { return }
        if (mousefocus == this) { mousefocus = null; }
        if (dragevent && (dragevent.source == this)) { dragevent = null }
        if (mousehighlight == this) { mousehighlight = null; }

        delete __controls[this.id];
        this.id = 0;

        if (this.__timerid) {
            clearInterval(this.__timerid);
            this.__timerid = 0;
            delete this.__timers;
        }

        if (this.ondestroy) { this.ondestroy(); }

        this.destroychild("*");

        var container = this.container || this.parent

        if (container) {
            if (container.id) {
                container.element.removeChild(this.element);
                delete this.parent.controls[this.name];
            }
        } else {
            document.body.removeChild(this.element);
        }
    }

    , destroychild: function (childname) {
        var index;
        var ctrl;
        var controls = this.controllist(childname, true);

        for (index in controls) {
            controls[index].destroy();
        }
        return this;
    }

    , domeventadd: function (eventname, element) {
        domeventadd(element || this.element, eventname, __HandleHTMLevents);
    }

    , domeventremove: function (eventname, element) {
        domeventremove(element || this.element, eventname, __HandleHTMLevents);
    }

    , setdirty: function () {
        var ctrl;

        if (this.dirty < 0) { return }

        if (!this.dirty) {
            if (!__background) { return this; }
            if (!__background.dirty) {
                setTimeout(function () {
                    debug.timerstart();
                    __background.paint();
                    //debug.log("paint")
                }, 1);
            }
            ctrl = this;
            while (ctrl.parent) {
                ctrl = ctrl.parent;
                if (!ctrl.dirty) {
                    ctrl.dirty |= 4;
                }
            }
        }
        this.dirty |= 1;
        //if(dirtyall) {
        //    this.dirty |= 2;
        //}
        return this;
    }

    , hasfocus: function () { }

    , hasancestor : function(ctrl) {
        var parent = this.parent;

        while (!!parent) {
            if (parent == ctrl) {
                return true;
            }
            parent = parent.parent;
        }
        return false;
    }

    , findsharedancestor: function(ctrl) {
        var path1 = this.ancestorpath();
        var path2 = ctrl? ctrl.ancestorpath() : [];

        var index;

        if ((path1.length == 0) || (path2.length == 0)) {
            return null;
        }

        var result = null;
        for (index in path1) {
            if (path1[index] == path2[index]) {
                result = path1[index];
            }
        }
        return result;
    }

    , ancestorpath: function(ancestor) {
        var result = [];
        var ctrl = this

        while (ctrl) {
            if (ctrl == ancestor) {
                result = []
            } else {
                result.unshift(ctrl);
            }
            ctrl = ctrl.parent;
        }
        return result;
    }

    //, fullpath : function () {
    //    if (this.parent) {
    //        return this.parent.name + "/" + this.name;
    //    }
    //    return this.name;
    //}

    , setborder : function (border, color, style, thick) {
        color = color || "";

        style = (color == "")? "none": style || "solid";
        thick = tohtmlpos(thick || 0, "px");

        if (border & eborder.left) {
            this.style.borderLeftColor = color;
            this.style.borderLeftWidth = thick;
            this.style.borderLeftStyle = style;
        }

        if (border & eborder.top) {
            this.style.borderTopColor = color;
            this.style.borderTopWidth = thick;
            this.style.borderTopStyle = style;
        }

        if (border & eborder.right) {
            this.style.borderRightColor = color;
            this.style.borderRightWidth = thick;
            this.style.borderRightStyle = style;
        }

        if (border & eborder.bottom) {
            this.style.borderBottomColor = color;
            this.style.borderBottomWidth = thick;
            this.style.borderBottomStyle = style;
        }

        return this;
    }

    , onshow: null
    , onpaint: null
    , ondestroy: null
    , onhide: emitevents
    , onclick: emitevents
    , onsize: emitevents
    , onmousedown: emitevents
    , onmouseup: emitevents
    , onmousemove: emitevents
    , onmouseenter: emitevents
    , onmouseleave: emitevents

    , onfocus: emitevents
    , onblur: emitevents
    , onselect: emitevents
    , onchange: emitevents
    , onresize: emitevents
    , onkeydown: emitevents
    , onkeyup: emitevents

    , ondrag: emitevents
    , ondragstart: emitevents
    , ondragend: emitevents
})



    //cControl.prototype.updatestyle = function () {
    //    if (this.opacity) {
    //        if (this.style.filter != null) {
    //            this.msfilter("alpha(opacity=" + (this.opacity * 100) + ")");
    //        }
    //    }
    //};

    //cControl.prototype.msfilter = function (filter) {
    //    var currentfilter = this.style.filter || "";
    //    if (currentfilter == "") {
    //        this.style.filter = filter;
    //        return;
    //    }
    //    var filtername = key$(filter, "(").toLowerCase();
    //    var filtersplit = split$(currentfilter, "\n");
    //    var index;
    //    for(index in filtersplit) {
    //        if (filtername == key$(filtersplit[index], "(").toLowerCase()) {
    //            filtersplit[index] = filter;
    //            filter = "";
    //            break;
    //        }
    //    }
    //    if (filter != "") {
    //        filtersplit.push(filter);
    //    }
    //    this.style.filter = filtersplit.join("\n");
    //};


    cControl.prototype.timercreate = function (key, interval, duration) {
        return this;
    };

    cControl.prototype.timerexists = function (key) {
        return !!this.__timers && !!this.__timers[key];
    };

    cControl.prototype.timerstop = function (key) {
        var index;
        var timer;

        if (!this.__timers) {
            return;
        }
        timer = this.__timers[key];
        if (!timer) {
            return;
        }
        if (timer.next) {
            timer.next.starttime = new Date().getTime();
            this.__timers[key] = timer.next;
            return;
        }
        delete this.__timers[key];
        for(index in this.__timers) {
            return;
        }
        clearInterval(this.__timerid);
        this.__timerid = 0;
        delete this.__timers;
        return this;
    };

    cControl.prototype.animate = function (key, startpos, endpos, delay, duration, easein, easeout, params) {
        var activetimer;

        var timer = {
            key: key
            , status: status
            , startpos: startpos || 0
            , endpos: endpos || startpos || 0
            , units: units || ""
            , delay: delay || 0
            , duration: duration || 0
            , easin: easin || null
            , easeout: easeout || null
            , params: params || null
            , interval: interval || 0
            , next: next || null
            , starttime: new Date().getTime()
        }

        if (!this.__timers) {
            this.__timers = {
            };
        }
        if (this.__timers[key]) {
            activetimer = this.__timers[key];
            while(!!activetimer.next) {
                activetimer = activetimer.next;
            }
            activetimer.next = timer;
        } else {
            this.__timers[key] = timer;
        }
        if (!this.__timerid) {
            this.__timerid = setInterval(classbind(this, this.__anim), 1);
        }
        return this;
    };

    cControl.prototype.__anim = function () {
        var savecurrenttick = new Date().getTime();
        var currenttick;
        var index;
        var currentpos;
        var timer;
        if (!this.__timers) { return; }

        for(index in this.__timers) {
            timer = this.__timers[index];
            currenttick = savecurrenttick - timer.starttime;
            if ((timer.status == 0) && (currenttick >= timer.delay)) {
                timer.status = 1;
                if (this.style[timer.key]) {
                    var startpos = this.style[timer.key];
                    if (timer.key.toLowerCase().indexOf("color") > 0) {
                        timer.units = "color";
                    } else {
                        timer.units = startpos.substring(("" + parseInt(startpos)).length);
                    }
                    timer.startpos = timer.startpos || parseInt(startpos);
                }
            }
            if (timer.status == 1) {
                if (currenttick >= timer.duration) {
                    timer.status = 2;
                    currentpos = 1;
                    this.timerstop(timer.key);
                    if (!timer.next) {
                        this.raise("timerend_" + timer.key);
                    }
                } else {
                    currentpos = tween(0, 1, currenttick / timer.duration, timer.easein, timer.easeout);
                }
                if (this.style[timer.key]) {
                    if (timer.units == "color") {
                    } else {
                        this.style[timer.key] = (Math.round((timer.endpos - timer.startpos) * currentpos) + timer.startpos) + timer.units;
                    }
                } else {
                }
            }
        }
    };


    function splitquerystring(querystring, delimiter) {
        var result = {
            page: ""
        };
        var key;
        var value;
        delimiter = delimiter || "&";
        querystring = "" + querystring;
        if (querystring != "") {
            var splitted = split$(querystring, delimiter);
            var index;
            var line;
            for (index in splitted) {
                line = splitted[index];
                if (line != "") {
                    key = key$(line, "=").toLowerCase();
                    value = decodeURIComponent(value$(line, "="));
                    if ((index == 0) && (value == "")) {
                        value = key;
                        key = "page";
                    }
                    result[key] = value;
                }
            }
        }
        return result;
    }

var browser = (function () {
    return {
        historyadd: function (screenname, params) {
            if (!(window.history && window.history.pushState)) {
                return;
            }
            var querystring = "?" + screenname;
            try {
                if (!history.state) {
                    history.replaceState(querystring, screenname, querystring);
                } else {
                    if (history.state != querystring) {
                        history.pushState(querystring, screenname, querystring);
                    }
                }
            } catch (e) {
            }
        }

        , navigate: function (event) {
            if (!event.state) {
                return;
            }
            if (this.showscreen) {
                this.showscreen(event.state);
            }
        }

        , pagewidth: function () {
            return window.innerWidth || document.documentElement.clientWidth;
        }

        , pageheight: function () {
            return window.innerHeight || document.documentElement.clientHeight;
        }

        , pagerect: function () {
            return new cRect(0, 0, this.pagewidth(), this.pageheight() )
        }
    }

    //requestAnimationFrame(function () {
    //  setImmediate(function() {
    //    if (!__background) { return }
    //    if (background.dirty) {
    //        debug.timerstart();
    //        __background.paint();
    //        debug.log("paint")
    //    }
    //})
})();

window.onpopstate = classbind(browser, browser.navigate);

var repository = object.create({
    controls: null
    
    , register: function (controlname, _super, prototype) {
        if (this[controlname]) { throw new Error() }

        var control = object.create(_super, prototype)
        this[controlname] = control
        control.prototype.controlname = controlname

        var controlfactory = (function (args) { //Hack to pass arguments to a new class
            function fn(args) {
                return control.apply(this, args);
            }
            fn.prototype = control.prototype;
            return fn;
        })();

        cControl.prototype[controlname] = function (name, tag) {
            name = name || controlname
            if (!this.controls) { this.controls = {} }

            var newcontrol = this.controls[name]

            if (!newcontrol) {
                newcontrol = new controlfactory(arguments);

                newcontrol.parent = this
                newcontrol.setname(name)
            }
            return newcontrol;
        }
    }
})

repository = new repository()

 

function loadimage(path, onload) {
    path = "/images/" + path

    var image = new Image()
    image.onload = function () {
        onload(null, image)
    }
    image.onerror = function () {
        onload(new Error("error"), image)
    }
    image.src = path;
}
