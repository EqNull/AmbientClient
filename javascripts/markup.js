/// <reference path="base.js" />

//todo: add data { data }
//todo: add code {for x = 10 }
//todo: add regular tags [div .class #name :param :param style=value]  --> [color:#FF00FF] or [color:{green}]

markdown = (function (scope) {
    var _ec = 0

    var ebbct = {
        none: _ec++
        , bold: _ec++
        , italic: _ec++
        , strikethrough: _ec++
        , underline: _ec++
        , quote: _ec++
        , code: _ec++
        , strong: _ec++
        , em: _ec++
    }

    var _ec = 0;

    var ett = {
        none: _ec++
        , style: _ec++
        , tag: _ec++
        , styletag: _ec++
        , columntag: _ec++
        , innertag: _ec++
        , block: _ec++
    }

    var upgrades = {
        target: "self"
        , from: ""
        , to: ""
    }

    var tags = { 
        "B": { type: ett.styletag }
        , "I": { type: ett.styletag }
        , "U": { type: ett.styletag, shortcut: "__" }
        , "S": { type: ett.styletag }
        , "Q": { type: ett.styletag }
        , "ICON": { type: ett.styletag, autoclose: true }
        , "COLOR": { type: ett.style, tag: "SPAN" }
        , "STRONG": { type: ett.styletag, shortcut: "**" }
        , "EM": { type: ett.styletag, shortcut: "//" }
        , "DEL": { type: ett.styletag }
        , "INS": { type: ett.styletag }
        , "BLOCKQUOTE": { type: ett.block, shortcut: "''" }
        , "PRE": { type: ett.block }
        , "CODE": { type: ett.block }
        , "TABLE": { type: ett.tag }
        , "TR": { type: ett.tag }
        , "TD": { type: ett.columntag }
        , "TH": { type: ett.columntag }
        , "LI": { type: ett.tag }
        , "|": { type: ett.columntag, needs: "MTR", tag: "TD" }
        , "|!": { type: ett.columntag, needs: "MTR", tag: "TH" }
        , "MTABLE": { type: ett.tag, markdown: true, tag: "TABLE" }
        , "MTR": { type: ett.innertag, needs: "MTABLE", markdown: true, tag: "TR" }
        , "-": { type: ett.innertag, needs: "MUL", repeatable: true, tag: "LI" }
        , "*": { type: ett.innertag, needs: "MOL", repeatable: true, tag: "LI" }
        , "MUL": { type: ett.tag, markdown: true, tag: "UL" }
        , "MOL": { type: ett.tag, markdown: true, tag: "OL" }
        , "UL": { type: ett.tag }
        , "OL": { type: ett.tag }
        , "H3": { type: ett.innertag, shortcut: "!" }
        , "H4": { type: ett.innertag, shortcut: "!!" }
        , "H5": { type: ett.innertag, shortcut: "!!!" }
        , "H6": { type: ett.innertag, shortcut: "!!!!" }
    }

    var specialchars = {
        "!": true
        , "-": true
        , "|": true
        , "*": true
        , "=": true
        , "~": true
    }

    var isspecialchar = function(token) {
        return specialchars[token] || false;
    }

    function initialize() {
        var tag
        var index
        var shortcut;
        var starttag;
        var letter;

        for (index in tags) {
            tag = tags[index];
            tag.name = index;
            if (!tag.upgrades) { tag.upgrades = {} }
            tag.tag = tag.tag || tag.name

            switch (tag.type) {
                case ett.tag:
                case ett.block:
                    tag["singleline"] = false;
                    break;
                default:
                    tag["singleline"] = true;
            }
            shortcut = tag.shortcut || "";
            if (shortcut) {
                tag = clone(tag);
                tags["shortcut"] = tag;
            }
        }
    }

    initialize();


    scope.tohtml = function (text, stack) {
        stack = stack || [];
        var initialstacksize = stack.length;
        var lineindex;
        var lines;
        var firstchar;
        var newtags;
        var line;
        var blockmode;

        if (text == "") { return "" }

        text = replace$(text, cr, "")
        text = replace$(text, "&#13;", "")
        text = replace$(text, "&#10;", lf)
        lines = splittrim$(text, lf);

        //Merge multiline blocks
        for (lineindex = lines.length - 1; lineindex > 0; lineindex--) {
            if (lines[lineindex].charAt(0) == "/") {
                lines[lineindex - 1] += " " + mid$(ltrim$(lines[lineindex]), 2)
                lines[lineindex] = ""
            }
        }

        for (lineindex = 0; lineindex < lines.length; lineindex++) {
            newtags = []
            line = lines[lineindex]
            firstchar = left$(line, 1)
            linebefore = "";
            lineafter = ""

            if (isspecialchar(firstchar)) {
                markdowncode = getmarkdown(line)
                newtags = findtag(markdowncode);
            }

            if (newtags.length > 0) {
                //Do markdown table
                if ((stack.length > 0) && (stack[stack.length - 1].type == ett.blockmode)) {
                    if (blockmode == line) {
                        blockmode = null;
                        linebefore = "</" + stack.pop().tag + ">"
                        line = ""
                    }
                } else if (newtags[0].type == ett.block) {
                    if (line == newtags[0].name) {
                        linebefore = "<" + newtags[0].tag + ">"
                        line = ""
                        blockmode = newtags[0].name;
                        stack.push(newtags[0])
                    }
                } else if (newtags[newtags.length - 1].type == ett.columntag) {
                    var columns = splitcolumns(line, stack)

                    for (var columnindex in columns) {
                        var line = columns[columnindex]
                        if (line) {
                            markdowncode = getmarkdown(line)

                            newtags = findtag(line.substring(0, markdowncode.length));
                            linebefore += addtags(stack, newtags);
                            linebefore += bbcodetohtml(line.substr(markdowncode.length), stack)
                        }
                    }
                    line = "";
                } else {
                    //Do markdown list
                    linebefore += addtags(stack, newtags);
                    line = line.substr(markdowncode.length);
                }
            } else {
                //This line doesn't start with markdown 
                linebefore += closetags(stack, "filter", "markdown")
                lineafter += "<br />"
            }

            if (!blockmode) {
                lineafter = closetags(stack, "filter", "singleline") + lineafter;
                line = bbcodetohtml(line, stack)
            }
            lines[lineindex] = linebefore + line + lineafter;

//            debug.log(lines[lineindex])
        }
        lines[lines.length - 1] += closetags(stack, "position", initialstacksize)
        return lines.join("");
    }

    function splitcolumns(line) {
        var delimiter = line.charAt(0);
        var lines = split$(line, delimiter)

        for (var index = 1; index < lines.length; index++) {
            if (right$(lines[index - 1], 1) == "/") {
                lines[index - 1] = sub$(lines[index - 1], 0, lines[index - 1].length - 1) + lines[index]
                lines[index] = ""
            } else {
                lines[index] = delimiter + lines[index]
            }
        }
        return lines;
    }

    function getmarkdown(line) {
        var result = "";
        var character = "";

        for (var charindex = 0; charindex < line.length; charindex++) {
            character = line.charAt(charindex);
            if (!isspecialchar(character)) { break; }
            result += character
        }
        return result;
    }

    function findtag(shortcut) {
        var result = [];
        var tag = tags[shortcut] || tags[shortcut.charAt(0)];
        var index;
        var needs;

        if (!tag) { return [] }

        //Add expected parents for regular tags
        if (!tag.repeatable) {
            result.push(tag);
            while (tag && tag.needs) {
                tag = tags[tag.needs];
                if (tag) { result.unshift(tag) }
            }
            return result;
        }

        //Find repeatable markdown tags, and add expected parents
        for (index = 0; index < shortcut.length; index++) {
            if (!tags[shortcut.charAt(index)]) { break }
            tag = tags[shortcut.charAt(index)];
            if (tag.needs) {
                needs = tags[tag.needs];
                result.push(needs);
            }
            if (!tag.repeatable) { break; }
        }
        result.push(tag)

        return result;
    }

    var addtags = function(stack, tags, parentsonly) {
        var stackindex = stack.length - 1;
        var tagindex;
        var result = "";
        var current;

        if (tags[tags.length - 1].repeatable) {
            stackindex = 0;
        } else {
            stackindex = Math.max(stack.length - tags.length, 0)
        }

        while ((tags.length > 1) && (stackindex < stack.length)) {
            if (stack[stackindex].tag != tags[0].tag) { break; }
            tags.shift();
            stackindex++;
        }
        //Remove all tags from this point
        result += closetags(stack, "position", stackindex)

        //Add the new tags
        var addlength = parentsonly ? tags.length - 1 : tags.length;

        for (tagindex = 0; tagindex < addlength; tagindex++) {
            current = tags[tagindex]
            stack.push(current)
            result += "<" + current.tag + ">"
        }
        return result;
    }

    var closetags = function(stack, type, param) {
        var stackindex = 0;
        var current;
        var result = "";

        switch (type) {
            case "all":
                stackindex = 0;
                break;
            case "position":
                stackindex = param >>> 0;
                break;
            case "filter":
                for (stackindex = stack.length - 1; stackindex >= 0; stackindex--) {
                    if (!stack[stackindex][param]) { break; }
                }
                stackindex++;
            default:
        }

        while (stack.length > stackindex) {
            current = stack.pop();
            result += "</" + current.tag + ">";
        }

        return result;
    }



    var findbbtag = function (command, value, stack) {
        var closing = false;
        var tag = "";
        var result = "";
        var splitted = "";

        //Todo: Read attributes and classnames
        //Special tags

        splitted = splittrim$(command)
        command = splitted[0].toUpperCase();
        splitted[0] = ""

        if (command.charAt(0) == "/") {
            if (command.length == 1) {
                command = splitted[1];
                splitted[1] = "";
            } else {
                command = mid$(command, 2);
            }
            closing = true;
        }

        tag = tags[command]

        if (tag) {
            if (closing) {
                result = "</" + tag.tag + ">"
                //Todo: add test
                stack.pop();  
            } else {
                if (!value) {
                    if (tag.type == ett.styletag) {
                        result += closetags(stack, "filter", "singleline")
                    }
                    stack.push(tag)
                }
                result = paste$("<" + tag.tag + ">", value, "", "</" + tag.tag + ">")
            }
        } else {
            result = command + value
        }
        return result;
    }

    var bbcodetohtml = function (line, stack) {
        var posb
        var pose
        var htmlcode
        var lineafter
        var value

        //Todo: special codes

        while (true) {
            posb = instr$(line, "[", posb)
            if (posb == 0) { break }
            if ((posb > 1) && (line.charAt(posb - 2) == "/")) { break }
            pose = instr$(line, "]", posb + 1)
            if (pose == 0) { break }

            htmlcode = mid$(line, posb + 1, pose - posb - 1)
            lineafter = mid$(line, pose + 1);
            line = left$(line, posb - 1)

            if (lineafter.charAt(0) == "(") {
                pose = instr$(lineafter, ")") || line.length - 1
                value = sub$(lineafter, 2, pose - 1) 
                lineafter = mid$(lineafter, pose + 1);
            } else {
                value = ""
            }

            htmlcode = findbbtag(htmlcode, value, stack)
            line += htmlcode + lineafter;
            posb = posb + htmlcode.length;
        }
        return line;
    }

    return scope;
})

if (window !== undefined) markdown(window);

//<IMG src='' align='center' />
//<A href='' class='readmore' target='_blank'>Tekst</A>


