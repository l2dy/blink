!function(e){var t={};function a(o){if(t[o])return t[o].exports;var s=t[o]={i:o,l:!1,exports:{}};return e[o].call(s.exports,s,s.exports,a),s.l=!0,s.exports}a.m=e,a.c=t,a.d=function(e,t,o){a.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:o})},a.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},a.t=function(e,t){if(1&t&&(e=a(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var o=Object.create(null);if(a.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)a.d(o,s,function(t){return e[t]}.bind(null,s));return o},a.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return a.d(t,"a",t),t},a.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},a.p="",a(a.s=0)}([function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var o=new(a(1).default);document.body.append(o.element),o.focus(!0),window._onKB=o.onKB,window._kb=o,o.ready()},function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const o=a(2),s=a(3),l=a(4),r=o.KBActions.CANCEL,i=o.KBActions.DEFAULT,n=o.KBActions.PASS,d=o.KBActions.STRIP;function c(e){let t="",a=e.length;for(let o=0;o<a;o+=2)t+=String.fromCharCode(parseInt(e.substr(o,2),16));return t}function h(e){switch(e){case"escape":return{keyCode:27,code:"[Escape]",key:"[Escape]"};case"tab":return{keyCode:9,code:"[Tab]",key:"[Tab]"};default:return null}}const y=new Set(["20:0","16:1","16:2","17:1","17:2","18:1","18:2","91:1","91:2","93:0"]),m="16:1",p="17:1",k="18:1",u="91:1",C="20:0";function _(e){let t=229==e.keyCode?0:e.keyCode,a=e.location;return t?`${t}:${a}`:`${t}:${a}:${(e.key||"").toLowerCase()}`}function f(e){e&&(e.preventDefault(),e.stopPropagation())}t.default=class{constructor(){this.element=document.createElement("input"),this._keyMap=new o.default(this),this._bindings=new l.default,this._lang="en",this._langWithDeletes=!1,this.hasSelection=!1,this._lastKeyDownEvent=null,this._capsLockRemapped=!1,this._shiftRemapped=!1,this._removeAccents=!1,this._metaSendsEscape=!0,this._altSendsWhat="escape",this._ignoreAccents={AltLeft:!0,AltRight:!0},this._modsMap={ShiftLeft:"Shift",ShiftRight:"Shift",AltLeft:"Escape",AltRight:"Escape",MetaLeft:"Meta",MetaRight:"Meta",ControlLeft:"Control",ControlRight:"Control",CapsLock:""},this._downMap={},this._upMap={},this._mods={Shift:new Set,Alt:new Set,Meta:new Set,Control:new Set},this._up=new Set,this._down=new Set,this._captureMode=!1,this._updateUIKitModsIfNeeded=e=>{let t=e.code;if(this._capsLockRemapped){let a;a="keyup"==e.type&&"CapsLock"==t?0:s.toUIKitFlags(e),o.op("mods",{mods:a})}"AltLeft"!=t&&"AltRight"!=t||this._ignoreAccents[t]&&("keydown"==e.type?o.op("guard-ime-on",{}):o.op("guard-ime-off",{}),f(e))},this._downKeysIds=()=>{let e=Array.from(this._down);return this._mods.Meta.has("tb-meta")&&-1==e.indexOf(u)&&e.push(u),this._mods.Control.has("tb-ctrl")&&-1==e.indexOf(p)&&e.push(p),this._mods.Alt.has("tb-alt")&&-1==e.indexOf(k)&&e.push(k),this._mods.Shift.has("tb-shift")&&-1==e.indexOf(m)&&e.push(m),e},this._onKeyDown=e=>{if(e.isComposing)return void(this._lastKeyDownEvent=null);let t=e;if(229===e.keyCode){if(!this._lastKeyDownEvent)return;t=this._lastKeyDownEvent}else this._lastKeyDownEvent=e;if(this._captureMode){let a=_+"-"+t.code;return this._down.add(a),this._capture(),this._updateUIKitModsIfNeeded(t),void f(e)}let a=_(t);this._down.add(a);let o=this._bindings.match(this._downKeysIds());if(y.has(a)||this._down.delete(a),o)return this._execBinding(o,e),void f(e);let s=this._downMap[a],l=this._mod(this._modsMap[t.code]),r=!1;s&&((r=!(l&&this._mods[l].has(a)))||(this._handleKeyDownKey(s,e),r=!0)),l&&this._mods[l].add(a),this._upMap[a]&&this._up.add(a),this._updateUIKitModsIfNeeded(t),r||this._handleKeyDown(t.keyCode,e)},this._onBeforeInput=e=>{"dictation"!==this._lang?("insertText"===e.inputType&&this._output(e.data),"deleteContentBackward"===e.inputType&&this._output(o.DEL),f(e)):o.op("voice",{data:e.data||""})},this._onInput=e=>f(e),this._onKeyUp=e=>{if(this._lastKeyDownEvent=null,this._captureMode){let t=_(e)+"-"+e.code;return this._down.delete(t),this._capture(),this._updateUIKitModsIfNeeded(e),void f(e)}let t=_(e);this._down.delete(t);let a=this._mod(this._modsMap[e.code]);a&&this._mods[a].delete(t),this._updateUIKitModsIfNeeded(e);let o=this._upMap[t];o&&this._up.has(t)&&this._handleKeyDownKey(o,null),f(e)},this._handleKeyDown=(e,t)=>{let a={keyCode:e,key:"",code:"Unidentified"};t&&(a.code=t.code,a.key=t.key),this._handleKeyDownKey(a,t)},this._handleKeyDownKey=(e,t)=>{let a=this._keyMap,o=this._mods.Alt.size>0,s=this._mods.Control.size>0,l=this._mods.Meta.size>0,c=this._mods.Shift.size>0,h=e.code,y=e.key,m=function(e,t,a){if(!a)return e;if(a.ctrlKey){let o=a.key.toLowerCase(),s=a.keyCode;if(8==s&&"h"==o||9==s&&"i"==o||13==s&&"c"==o||13==s&&"m"==o||27==s&&"["==o)return e.keyCode=t.keyCode(o)||e.keyCode,e;let l=a.code;(8==s&&"KeyH"==l||9==s&&"KeyI"==l||13==s&&"KeyC"==l||13==s&&"KeyM"==l||27==s&&"BracketLeft"==l)&&(e.keyCode=t.keyCode(l)||e.keyCode)}return e}({key:y,code:h,keyCode:e.keyCode,alt:o,ctrl:s,meta:l,shift:c},this._keyMap,t),p=a.getKeyDef(m.keyCode);var k=null;function u(e){k=e;var t=p[e];return"function"==typeof t&&(t=t.call(a,m,p)),t===i&&"normal"!=e&&(t=u("normal")),t}let C;if(C=u(s?"ctrl":o?"alt":l?"meta":"normal"),!this.hasSelection&&(C===n||C===i&&!(s||o||l))){if(C===n&&!e.src)return;if(/^\[\w+\]$/.test(p.keyCap)){if(!e.src)return void(this._removeAccents=!1)}else if(this._langWithDeletes)return;let a=this._removeAccents?function(e){let t=e.normalize("NFD").replace(/[\u0300-\u036f]/g,""),a=t.replace(/^[\u02c6\u00a8\u00b4\u02dc\u0060]/,"");return a&&(t=a),t}(y):y;return this._removeAccents=!1,this._capsLockRemapped||this._shiftRemapped?this._output(c?a.toUpperCase():a.toLowerCase()):this._output(a),void f(t)}if(this._removeAccents=!1,C===d&&(o=s=!1,"function"==typeof(C=p.normal)&&(C=C.call(a,m,p)),C==i&&2==p.keyCap.length&&(C=p.keyCap.substr(c?1:0,1))),f(t),C!==r&&!this.hasSelection)if(C===i||"string"==typeof C){if("ctrl"==k?s=!1:"alt"==k?o=!1:"meta"==k&&(l=!1),c=m.shift,(o||s||c||l)&&"string"==typeof C&&"["==C.substr(0,2)){let e=1;c&&(e+=1),o&&(e+=2),s&&(e+=4),l&&(e+=8);let t=";"+e;C=3==C.length?"[1"+t+C.substr(2,1):C.substr(0,C.length-1)+t+C.substr(C.length-1)}else{if(C===i&&(C=p.keyCap.substr(c?1:0,1),s)){let e=p.keyCap.substr(0,1).charCodeAt(0);e>=64&&e<=95&&(C=String.fromCharCode(e-64))}let e=C.toString();if(o&&"8-bit"==this._altSendsWhat&&1==e.length){let t=e.charCodeAt(0)+128;C=String.fromCharCode(t)}(o&&"escape"==this._altSendsWhat||l&&this._metaSendsEscape)&&(C=""+e)}"string"==typeof C?this._output(C):console.warn("action is not a string",C)}else console.log("Invalid action: "+JSON.stringify(C))},this._onIME=e=>{let t=e.type,a=e.data||"";o.op("ime",{type:t,data:a}),"compositionend"==t&&this._output(a)},this._output=e=>{this._up.clear(),this.element.value=" ",this.element.selectionStart=1,this.element.selectionEnd=1,e&&o.op("out",{data:e})},this._stateReset=e=>{this._down.clear(),this._up.clear(),this._mods={Shift:new Set,Alt:new Set,Meta:new Set,Control:new Set},this.element.value=" ",this.element.selectionStart=1,this.element.selectionEnd=1,this.hasSelection=e},this._capture=()=>o.op("capture",{keyIds:this._down.values}),this._configKey=e=>{let t=e.code,a=h(e.down);a&&(this._downMap[t.id]=a),this._mod(e.mod)&&(this._modsMap[t.code]=e.mod);let o=h(e.up);o&&(this._upMap[t.id]=o),"AltRight"!=t.code&&"AltLeft"!=t.code||(this._ignoreAccents[t.code]=e.ignoreAccents)},this._config=e=>{this._reset(),this._bindings.reset(),this._configKey(e.capsLock),this._configKey(e.command.left),this._configKey(e.command.right),this._configKey(e.control.left),this._configKey(e.control.right),this._configKey(e.option.left),this._configKey(e.option.right),this._configKey(e.shift.left),this._configKey(e.shift.right),this._bindings.expandFn(e.fn),this._bindings.expandCursor(e.cursor);for(let t of e.shortcuts){let e={keys:this._keysFromShortcut(t.input,t.modifiers),action:t.action,shiftLoc:0,controlLoc:0,optionLoc:0,commandLoc:0};this._bindings.expandBinding(e)}},this._toggleCaptureMode=e=>this._captureMode=!!e,this._onToolbarMods=e=>{let t=s.UIKitFlagsToObject(e);t.alt?this._mods.Alt.add("tb-alt"):this._mods.Alt.delete("tb-alt"),t.ctrl?this._mods.Control.add("tb-ctrl"):this._mods.Control.delete("tb-ctrl"),t.shift?this._mods.Shift.add("tb-shift"):this._mods.Shift.delete("tb-shift"),t.meta?this._mods.Meta.add("tb-meta"):this._mods.Meta.delete("tb-meta")},this._execPress=(e,t,a)=>{let o=e.split(/:/g),l=this._mods;this._mods={Shift:new Set,Alt:new Set,Meta:new Set,Control:new Set};let r=parseInt(o[0],10),i=s.UIKitFlagsToObject(r);i.shift&&this._mods.Shift.add("tb-shift"),i.ctrl&&this._mods.Control.add("tb-ctrl"),i.alt&&this._mods.Alt.add("tb-alt"),i.meta&&this._mods.Meta.add("tb-meta");let n=parseInt(o[1],10),d=""==o[3]?":":o[3]||this._keyMap.key(n)||"",c={keyCode:n,key:d,code:"",src:"toolbar"};if(!a&&r>0){let e=c.keyCode+":"+o[2]+(0==n?":"+d:"");this._down.add(e);let t=this._bindings.match(this._downKeysIds());if(this._down.delete(e),t)return this._execBinding(t,null),void(this._mods=l)}this._handleKeyDownKey(c,t),this._mods=l,this._removeAccents=!0},this.onKB=(e,t)=>{switch(e){case"mods-down":this._handleCapsLockDown(!0);break;case"mods-up":this._handleCapsLockDown(!1);break;case"guard-up":this._handleGuard(!0,t);break;case"guard-down":this._handleGuard(!1,t);break;case"selection":this.hasSelection=t;break;case"lang":this._handleLang(t);break;case"toolbar-mods":this._onToolbarMods(t);break;case"toolbar-press":this._execPress(t,null,!1);break;case"press":this._execPress(t,null,!0);break;case"state-reset":this._stateReset(t);break;case"focus":this.focus(t);break;case"capture":this._toggleCaptureMode(t);break;case"hex":this._output(c(t));break;case"config":this._config(t)}};let e=this.element;e.setAttribute("autocomplete","off"),e.setAttribute("spellcheck","false"),e.setAttribute("autocorrect","off"),e.setAttribute("autocapitalize","none"),e.setAttribute("autofocus","true"),e.value=" ",e.addEventListener("keydown",this._onKeyDown),e.addEventListener("keyup",this._onKeyUp),window.addEventListener("keydown",this._onKeyDown),window.addEventListener("keyup",this._onKeyUp),e.addEventListener("compositionstart",this._onIME),e.addEventListener("compositionupdate",this._onIME),e.addEventListener("compositionend",this._onIME),e.addEventListener("beforeinput",this._onBeforeInput),e.addEventListener("input",this._onInput),this._capsLockRemapped=null!=this._modsMap.CapsLock||null!=this._downMap[C]||null!=this._upMap[C],this._shiftRemapped=null!=this._modsMap.Shift||"Shift"!==this._modsMap.Shift}_mod(e){switch(e){case"Escape":return this._altSendsWhat="escape","Alt";case"8-bit":return this._altSendsWhat="8-bit","Alt";case"Shift":return"Shift";case"Control":return"Control";case"Meta":return this._metaSendsEscape=!1,"Meta";case"Meta-Escape":return this._metaSendsEscape=!0,"Meta";default:return null}}focus(e){e?this.element.focus():this.element.blur()}ready(){o.op("ready",{})}_handleCapsLockDown(e){if(this._captureMode)return e?this._down.delete(C+"-capslock"):this._down.add(C+"-capslock"),void this._capture();let t=this._modsMap.CapsLock;if(e){this._down.add(C);let e=this._downMap[C];return!e||t&&this._mods[t].has(C)||this._handleKeyDownKey(e,null),t&&this._mods[t].add(C),void(this._upMap[C]&&this._up.add(C))}this._down.delete(C),t&&this._mods[t].delete(C);let a=this._upMap[C];a&&this._up.has(C)&&this._handleKeyDownKey(a,null)}_handleLang(e){this._lang=e,this._langWithDeletes="ko-KR"===e,this._stateReset(this.hasSelection),"dictation"!=e&&o.op("voice",{data:""})}_handleGuard(e,t){this.element.value=" ";let a=this._keyMap.keyCode(t),o=`${a}:0`;this._captureMode&&(o+="-Key"+t.toUpperCase()),e?this._down.delete(o):this._down.add(o),this._captureMode?this._capture():e?this._removeAccents=!0:this._handleKeyDown(a,null)}_reset(){this.hasSelection=!1,this._removeAccents=!1,this._modsMap={},this._downMap={},this._upMap={},this._up.clear(),this._down.clear(),this._mods={Shift:new Set,Alt:new Set,Meta:new Set,Control:new Set},this._ignoreAccents={AltLeft:!0,AltRight:!0}}_keysFromShortcut(e,t){var a=[];let o=s.UIKitFlagsToObject(t);o.shift&&a.push(m),o.alt&&a.push(k),o.ctrl&&a.push(p),o.meta&&a.push(u);let l=this._keyMap.keyCode(e);return l?a.push(l+":0"):a.push("0:0-"+e),a}_execBinding(e,t){switch(e.type){case"command":o.op("command",{command:e.value});break;case"press":this._execPress(`${e.mods}:${e.key.id}`,t,!0);break;case"hex":this._output(c(e.value))}}}},function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const o=Symbol("CANCEL"),s=Symbol("DEFAULT"),l=Symbol("PASS"),r=Symbol("STRIP");function i(e,t){let a=Object.assign(Object.assign({},t),{op:e});window.webkit.messageHandlers._kb.postMessage(a)}t.KBActions={CANCEL:o,DEFAULT:s,PASS:l,STRIP:r},t.op=i;const n="",d="[",c="O";t.DEL="";const h=e=>String.fromCharCode(e.charCodeAt(0)-64),y={keyCode:0,keyCap:"[Unidentified]",normal:l,ctrl:l,alt:l,meta:l};t.default=class{constructor(e){this._defs={},this._reverseDefs={},this._onCtrlNum=(e,a)=>{switch(a.keyCap.substr(0,1)){case"1":return"1";case"2":return h("@");case"3":return h("[");case"4":return h("\\");case"5":return h("]");case"6":return h("^");case"7":return h("_");case"8":return t.DEL;case"9":return"9";default:return l}},this._onAltNum=(e,t)=>s,this._onSel=(e,t)=>{let{ArrowDown:a,ArrowLeft:s,ArrowRight:l,ArrowUp:r,Escape:n,h:d,j:c,k:h,l:y,o:m,b:p,f:k,n:u,p:C,w:_,x:f,y:g}=this._reverseDefs;const w=e=>i("selection",e),b={command:"copy"};if(t===s||t===d){w({dir:"left",gran:e.shift?"word":"character"})}else if(t===l||t===y){w({dir:"right",gran:e.shift?"word":"character"})}else t===r||t===h?w({dir:"left",gran:"line"}):t===a||t===c?w({dir:"right",gran:"line"}):t===m||t===f?w({command:"change"}):t===u&&e.ctrl?w({dir:"right",gran:"line"}):t===C?e.ctrl?w({dir:"left",gran:"line"}):e.shift||e.alt||e.meta||w({command:"paste"}):t===p?e.ctrl?w({dir:"left",gran:"character"}):(e.alt,w({dir:"left",gran:"word"})):t===_?e.alt?w(b):w({dir:"right",gran:"word"}):t===k?e.ctrl?w({dir:"right",gran:"character"}):e.alt&&w({dir:"right",gran:"word"}):t===g?w(b):t===n&&w({command:"cancel"});return o},this._keyboard=e,this.reset()}getKeyDef(e){var t=this._defs[e];return t||(console.warn(`No definition for (keyCode ${e})`),t=y,this.addKeyDef(e,t),t)}addKeyDef(e,t){if(e in this._defs&&console.warn("Dup keyCode: ",e),this._defs[e]=t,/^\[\w+\]$/.test(t.keyCap)){let e=t.keyCap.replace(/\W/g,"");this._reverseDefs[e]=t}else{var a=t.keyCap[0];this._reverseDefs[a]=t,/0-9/.test(a)?this._reverseDefs["Digit"+a]=t:/[a-z]/.test(a)&&(this._reverseDefs["Key"+a.toUpperCase()]=t)}}reset(){this._defs={};const e=(e,t,a)=>"function"==typeof e?e.call(this,t,a):e,a=(t,a)=>(o,s)=>{let l=o.shift||o.ctrl||o.alt||o.meta?a:t;return e(l,o,s)},o=(t,a)=>(o,s)=>{let l=o.shift?a:t;return o.shift=!1,e(l,o,s)},i=(e,t)=>e,m=(t,a)=>(o,s)=>{let l=o.alt?t:a;return e(l,o,s)},p=(t,a)=>(o,s)=>{let l=o.shift||o.ctrl||o.alt||o.meta?t:a;return e(l,o,s)},k=t=>(a,o)=>{let s=this._keyboard.hasSelection?this._onSel:t;return e(s,a,o)},u=e=>this.addKeyDef(e.keyCode,e);u(y),u({keyCode:27,keyCap:"[Escape]",normal:k(n),ctrl:s,alt:s,meta:s}),u({keyCode:112,keyCap:"[F1]",normal:a(c+"P",d+"P"),ctrl:s,alt:d+"23~",meta:s}),u({keyCode:113,keyCap:"[F2]",normal:a(c+"Q",d+"Q"),ctrl:s,alt:d+"24~",meta:s}),u({keyCode:114,keyCap:"[F3]",normal:a(c+"R",d+"R"),ctrl:s,alt:d+"25~",meta:s}),u({keyCode:115,keyCap:"[F4]",normal:a(c+"S",d+"S"),ctrl:s,alt:d+"26~",meta:s}),u({keyCode:116,keyCap:"[F5]",normal:d+"15~",ctrl:s,alt:d+"28~",meta:s}),u({keyCode:117,keyCap:"[F6]",normal:d+"17~",ctrl:s,alt:d+"29~",meta:s}),u({keyCode:118,keyCap:"[F7]",normal:d+"18~",ctrl:s,alt:d+"31~",meta:s}),u({keyCode:119,keyCap:"[F8]",normal:d+"19~",ctrl:s,alt:d+"32~",meta:s}),u({keyCode:120,keyCap:"[F9]",normal:d+"20~",ctrl:s,alt:d+"33~",meta:s}),u({keyCode:121,keyCap:"[F10]",normal:d+"21~",ctrl:s,alt:d+"34~",meta:s}),u({keyCode:122,keyCap:"[F11]",normal:d+"23~",ctrl:s,alt:d+"42~",meta:s}),u({keyCode:123,keyCap:"[F12]",normal:d+"24~",ctrl:s,alt:d+"43~",meta:s});const C=this._onCtrlNum,_=this._onAltNum;u({keyCode:192,keyCap:"`~",normal:s,ctrl:o(h("@"),h("^")),alt:s,meta:s}),u({keyCode:49,keyCap:"1!",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:50,keyCap:"2@",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:51,keyCap:"3#",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:52,keyCap:"4$",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:53,keyCap:"5%",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:54,keyCap:"6^",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:55,keyCap:"7&",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:56,keyCap:"8*",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:57,keyCap:"9(",normal:s,ctrl:C,alt:_,meta:s}),u({keyCode:48,keyCap:"0)",normal:s,ctrl:s,alt:_,meta:s}),u({keyCode:189,keyCap:"-_",normal:s,ctrl:h("_"),alt:s,meta:s}),u({keyCode:187,keyCap:"=+",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:8,keyCap:"[Backspace]",normal:i(t.DEL),ctrl:i("\b",t.DEL),alt:s,meta:s}),u({keyCode:9,keyCap:"[Tab]",normal:o("\t",d+"Z"),ctrl:r,alt:l,meta:s}),u({keyCode:81,keyCap:"qQ",normal:s,ctrl:h("Q"),alt:s,meta:s}),u({keyCode:87,keyCap:"wW",normal:k(s),ctrl:h("W"),alt:k(s),meta:s}),u({keyCode:69,keyCap:"eE",normal:s,ctrl:h("E"),alt:s,meta:s}),u({keyCode:82,keyCap:"rR",normal:s,ctrl:h("R"),alt:s,meta:s}),u({keyCode:84,keyCap:"tT",normal:s,ctrl:h("T"),alt:s,meta:s}),u({keyCode:89,keyCap:"yY",normal:k(s),ctrl:h("Y"),alt:s,meta:s}),u({keyCode:85,keyCap:"uU",normal:s,ctrl:h("U"),alt:s,meta:s}),u({keyCode:73,keyCap:"iI",normal:s,ctrl:h("I"),alt:s,meta:s}),u({keyCode:79,keyCap:"oO",normal:k(s),ctrl:h("O"),alt:s,meta:s}),u({keyCode:80,keyCap:"pP",normal:k(s),ctrl:k(h("P")),alt:s,meta:s}),u({keyCode:219,keyCap:"[{",normal:s,ctrl:h("["),alt:s,meta:s}),u({keyCode:221,keyCap:"]}",normal:s,ctrl:h("]"),alt:s,meta:s}),u({keyCode:220,keyCap:"\\|",normal:s,ctrl:h("\\"),alt:s,meta:s}),u({keyCode:20,keyCap:"[CapsLock]",normal:l,ctrl:l,alt:l,meta:s}),u({keyCode:65,keyCap:"aA",normal:s,ctrl:h("A"),alt:s,meta:s}),u({keyCode:83,keyCap:"sS",normal:s,ctrl:h("S"),alt:s,meta:s}),u({keyCode:68,keyCap:"dD",normal:s,ctrl:h("D"),alt:s,meta:s}),u({keyCode:70,keyCap:"fF",normal:s,ctrl:k(h("F")),alt:k(s),meta:s}),u({keyCode:71,keyCap:"gG",normal:s,ctrl:h("G"),alt:s,meta:s}),u({keyCode:72,keyCap:"hH",normal:k(s),ctrl:h("H"),alt:s,meta:s}),u({keyCode:74,keyCap:"jJ",normal:k(s),ctrl:h("J"),alt:s,meta:s}),u({keyCode:75,keyCap:"kK",normal:k(s),ctrl:h("K"),alt:s,meta:s}),u({keyCode:76,keyCap:"lL",normal:k(s),ctrl:h("L"),alt:s,meta:s}),u({keyCode:186,keyCap:";:",normal:s,ctrl:r,alt:s,meta:s}),u({keyCode:222,keyCap:"'\"",normal:s,ctrl:r,alt:s,meta:s}),u({keyCode:13,keyCap:"[Enter]",normal:"\r",ctrl:s,alt:s,meta:s}),u({keyCode:16,keyCap:"[Shift]",normal:l,ctrl:l,alt:l,meta:s}),u({keyCode:90,keyCap:"zZ",normal:s,ctrl:h("Z"),alt:s,meta:s}),u({keyCode:88,keyCap:"xX",normal:k(s),ctrl:k(h("X")),alt:s,meta:s}),u({keyCode:67,keyCap:"cC",normal:s,ctrl:h("C"),alt:s,meta:s}),u({keyCode:86,keyCap:"vV",normal:s,ctrl:h("V"),alt:s,meta:s}),u({keyCode:66,keyCap:"bB",normal:k(s),ctrl:k(h("B")),alt:k(s),meta:s}),u({keyCode:78,keyCap:"nN",normal:s,ctrl:k(h("N")),alt:s,meta:s}),u({keyCode:77,keyCap:"mM",normal:s,ctrl:h("M"),alt:s,meta:s}),u({keyCode:188,keyCap:",<",normal:s,ctrl:m(r,l),alt:s,meta:s}),u({keyCode:190,keyCap:".>",normal:s,ctrl:m(r,l),alt:s,meta:s}),u({keyCode:191,keyCap:"/?",normal:s,ctrl:o(h("_"),h("?")),alt:s,meta:s}),u({keyCode:17,keyCap:"[Control]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:18,keyCap:"[Alt]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:91,keyCap:"[Meta]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:32,keyCap:" ",normal:s,ctrl:h("@"),alt:s,meta:s}),u({keyCode:93,keyCap:"[Meta]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:42,keyCap:"[PRTSCR]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:145,keyCap:"[SCRLK]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:19,keyCap:"[BREAK]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:45,keyCap:"[Insert]",normal:d+"2~",ctrl:s,alt:s,meta:s}),u({keyCode:36,keyCap:"[Home]",normal:n+"OH",ctrl:s,alt:s,meta:s}),u({keyCode:33,keyCap:"[PageUp]",normal:d+"5~",ctrl:s,alt:s,meta:s}),u({keyCode:46,keyCap:"[DEL]",normal:d+"3~",ctrl:s,alt:s,meta:s}),u({keyCode:35,keyCap:"[End]",normal:n+"OF",ctrl:s,alt:s,meta:s}),u({keyCode:34,keyCap:"[PageDown]",normal:d+"6~",ctrl:s,alt:s,meta:s}),u({keyCode:38,keyCap:"[ArrowUp]",normal:k(p(d+"A",c+"A")),ctrl:s,alt:s,meta:s}),u({keyCode:40,keyCap:"[ArrowDown]",normal:k(p(d+"B",c+"B")),ctrl:s,alt:s,meta:s}),u({keyCode:39,keyCap:"[ArrowRight]",normal:k(p(d+"C",c+"C")),ctrl:s,alt:s,meta:s}),u({keyCode:37,keyCap:"[ArrowLeft]",normal:k(p(d+"D",c+"D")),ctrl:s,alt:s,meta:s}),u({keyCode:144,keyCap:"[NumLock]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:12,keyCap:"[Clear]",normal:l,ctrl:l,alt:l,meta:l}),u({keyCode:96,keyCap:"[Numpad0]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:97,keyCap:"[Numpad1]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:98,keyCap:"[Numpad2]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:99,keyCap:"[Numpad3]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:100,keyCap:"[Numpad4]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:101,keyCap:"[Numpad5]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:102,keyCap:"[Numpad6]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:103,keyCap:"[Numpad7]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:104,keyCap:"[Numpad8]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:105,keyCap:"[Numpad9]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:107,keyCap:"[NumpadAdd]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:109,keyCap:"[NumpadSubtract]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:106,keyCap:"[NumpadMultiply]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:111,keyCap:"[NumpadDivide]",normal:s,ctrl:s,alt:s,meta:s}),u({keyCode:110,keyCap:"[NumpadDicimal]",normal:s,ctrl:s,alt:s,meta:s}),this._reverseDefs.Backqoute=this._defs[192],this._reverseDefs.BracketLeft=this._defs[229],this._reverseDefs.BracketRight=this._defs[221],this._reverseDefs.Slash=this._defs[191],this._reverseDefs.Space=this._defs[32]}keyCode(e){let t=this._reverseDefs[e];return t?t.keyCode:0}key(e){let t=this._defs[e];if(!t)return"";let a=t.keyCap;return/^\[\w+\]$/.test(a)?a.substr(1,a.length-2):a.substr(0,1)}}},function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});const o=65536,s=1<<17,l=1<<18,r=1<<19,i=1<<20;t.toUIKitFlags=function(e,t=!0){let a=0;return e.shiftKey&&(a|=s),e.ctrlKey&&(a|=l),e.altKey&&(a|=r),e.metaKey&&(a|=i),t&&(a|=o),a},t.UIKitFlagsToObject=function(e){return{shift:(e&s)==s,alt:(e&r)==r,ctrl:(e&l)==l,meta:(e&i)==i}}},function(e,t,a){"use strict";Object.defineProperty(t,"__esModule",{value:!0});t.default=class{constructor(){this._map={},this.expandFn=e=>{if(0==e.keys.length)return;let t=[{keyCode:121,key:"F10",code:"F10",id:"121:0"},{keyCode:112,key:"F1",code:"F1",id:"112:0"},{keyCode:113,key:"F2",code:"F2",id:"113:0"},{keyCode:114,key:"F3",code:"F3",id:"114:0"},{keyCode:115,key:"F4",code:"F4",id:"115:0"},{keyCode:116,key:"F5",code:"F5",id:"116:0"},{keyCode:117,key:"F6",code:"F6",id:"117:0"},{keyCode:118,key:"F7",code:"F7",id:"118:0"},{keyCode:119,key:"F8",code:"F8",id:"119:0"},{keyCode:120,key:"F9",code:"F9",id:"120:0"}],a=e.keys.slice();for(var o=0;o<10;o++){let s=o+48+":0",l=t[o];e.keys=a.slice(),e.keys.push(s),e.action={type:"press",key:l,mods:0},this.expandBinding(e)}},this.expandCursor=e=>{if(0==e.keys.length)return;let t=[{keyCode:36,key:"HOME",code:"HOME",id:"36:0"},{keyCode:33,key:"PGUP",code:"PGUP",id:"33:0"},{keyCode:35,key:"END",code:"END",id:"35:0"},{keyCode:34,key:"PGDOWN",code:"PGDOWN",id:"34:0"}],a=["37:0","38:0","39:0","40:0"],o=e.keys.slice();for(var s=0;s<a.length;s++){let l=a[s],r=t[s];e.keys=o.slice(),e.keys.push(l),e.action={type:"press",key:r,mods:0},this.expandBinding(e)}},this.expandBinding=e=>{var t=e.keys.map(e=>e.split("-")[0]);if(0==t.length)return;var a=[t.sort()],o=0;var s=[{idLeft:"16:1",idRight:"16:2",loc:e.shiftLoc},{idLeft:"17:1",idRight:"17:2",loc:e.controlLoc},{idLeft:"18:1",idRight:"18:2",loc:e.optionLoc},{idLeft:"91:1",idRight:"93:0",loc:e.commandLoc}];for(let e of s)for(o=a.length-1;o>=0;o--){var l=a[o];let t=l.indexOf(e.idLeft);if(t<0&&(t=l.indexOf(e.idRight)),t<0)continue;if(1==e.loc){l[t]=e.idLeft;continue}if(2==e.loc){l[t]=e.idRight;continue}l[t]=e.idLeft;let s=l.slice();s[t]=e.idRight,a.push(s)}for(let t of a){let a=t.sort().join(":");this._map[a]=e.action}}}reset(){this._map={}}match(e){let t=e.sort().join(":");return this._map[t]}}}]);