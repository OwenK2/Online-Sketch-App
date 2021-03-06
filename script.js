var canvas, ctx, temp, tc, third, t, mx, my, sx, sy, hoveredColor, sprayTime
 down = false,
 infoLeft = "18",
 pMode2 = pMode = mode = "pencil",
 penType = "pencil",
 shape_dash = line_dash = horizontal = vertical = arrow = fillPoly = false,
 line_rounded = shape_rounded = true,
 color = "rgb(0,0,0)",
 thickness = 10,
 sides = 4,
 eOpacity = 1,
 changes = [],
 keys = {},
 hIndex = 1,
 colors = ["rgb(209,86,209)","rgb(48,138,248)","rgb(0,194,0)","rgb(233,244,19)","rgb(255,150,45)","rgb(255,46,46)","rgb(255,255,255)","rgb(0,0,0)",];

function load() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  temp = document.getElementById("temp");
  tc = temp.getContext("2d");
  third = document.getElementById("third");
  t = third.getContext("2d");
  resize();
  setColor("#000000");
  document.getElementById("thSlide").value = thickness;
  slide(document.getElementById("thSlide"));
  window.addEventListener("mousemove", move);
  temp.addEventListener("mousedown", dwn);
  window.addEventListener("mouseup", up);
  window.addEventListener("touchmove", function(event) {move(event);});
  temp.addEventListener("touchstart", function(event) {event.preventDefault();dwn(event);});
  window.addEventListener("touchend", function(event) {up(event);});
  window.addEventListener("touchcancel", function(event) {up(event);});
  window.addEventListener("keydown", function(event) {
    keys[event.keyCode] = true;
    if(event.ctrlKey && keys[90]) {event.preventDefault();undo();}
    if(event.ctrlKey && keys[89]) {event.preventDefault();redo();}
    if(event.ctrlKey && keys[83]) {event.preventDefault();save();}
  });
  window.addEventListener("keyup", function(event) {delete keys[event.keyCode]});
  document.getElementById("sidebar").addEventListener("contextMenu", function() {return false;});
  changes = [ctx.getImageData(0,0,canvas.width,canvas.height)];
}

//Settings
function setMode(elem) {
  moreSettings(false,false,true);
  if(typeof elem == "string" && mode == elem || typeof elem !== "string" && mode == elem.dataset.mode.toLowerCase().replace(/ /g, "_"))return;
  pMode2 = pMode;
  pMode = mode;
  if(typeof elem == "string") mode = elem;
  else mode = elem.dataset.mode.toLowerCase().replace(/ /g, "_");
  document.getElementsByClassName("selected")[0].className = document.getElementsByClassName("selected")[0].className.replace(" selected", "");
  var modes = document.getElementsByClassName("tool");
  for(var i = 0;i<modes.length;i++) {
    if(modes[i].dataset.mode.toLowerCase().replace(/ /g, "_") === mode)modes[i].className += " selected";
  }
}
function setColor(c) {
  if(c.indexOf("rgb") > -1)c = rgbHex(c);
  document.getElementById("colorInput").value = c;
  color = hexRgb(c);
  var tools = document.getElementsByClassName("tool");
  for(var i = 0;i<tools.length;i++) tools[i].style.borderColor = color;
  if(colors.indexOf(color) === -1) {colors.push(color);}
  if(mode == "eraser" || mode == "picker") {if(pMode=="eraser"){setMode(pMode2);}else setMode(pMode);}
  updateColors();
}
function updateColors() {
  while(colors.length > 12)colors.splice(colors.length-5,1);
  document.getElementById("colors").innerHTML = "";
  for(var i = colors.length-1;i>=0;i--) {
    document.getElementById("colors").innerHTML += '<div onclick="setColor(this.style.backgroundColor)" style="background-color: '+colors[i]+'" class="color"></div>';
  }
  var blots = document.getElementsByClassName("color");
  for(var i = 0;i<blots.length;i++) {
    if(blots[i].style.backgroundColor.replace(/ /g,"") === color) {blots[i].className = "color selected";}
    else {blots[i].className = "color";}
  }
}
function setSides(val) {
  if(val < 3 || isNaN(val)) {if(document.getElementById("sides").value !== ""){document.getElementById("sides").value = sides;}return;}
  var shape = document.getElementById("shape").getContext("2d");
  shape.clearRect(0,0,shape.canvas.width,shape.canvas.height);
  sides = val;
  shape.strokeStyle = "#2c3e50";
  drawPoly(shape,shape.canvas.width/2,shape.canvas.height/2,val,Math.min(shape.canvas.width,shape.canvas.height)/2-1,Math.PI*3/2);
  move(false);
}
function slide(elem) {
  var v = (elem.value - elem.min)/(elem.max - elem.min)*100;
  elem.style.backgroundImage =   "linear-gradient(to right,#b3c5c6 0%,#b3c5c6 "+v+"%,#cbd6d8 "+v+"%,#cbd6d8 100%)";
}
function toggleSetting(elem) {
  var penTypes = ['pencil', 'marker', 'highlighter', 'spray_paint', 'quill', 'connect'];
  var lineTypes = ['horizontal', 'vertical'];
  if(penTypes.indexOf(elem.id) > -1) {for(var i in penTypes){document.getElementById(penTypes[i]).className = "btn";}}
  if(elem.id == "horizontal" && !horizontal) {vertical = false;document.getElementById("vertical").className = "btn";}
  if(elem.id == "vertical" && !vertical) {horizontal = false;document.getElementById("horizontal").className = "btn";}
  if(penTypes.indexOf(elem.id) == -1 && eval(elem.id)) {
    eval(elem.id+"=false");
    elem.className = "btn";
  }
  else {
    elem.className = "btn on";
    if(penTypes.indexOf(elem.id) > -1) {penType = elem.id;document.getElementById("tool").style.backgroundImage = elem.style.backgroundImage;document.getElementById("tool").textContent = penType.replace("_", " ");moreSettings(false,false,true);}
    else eval(elem.id+"=true");
  }
}
function toggleTools() {
  if(document.getElementById("sidebar").offsetTop < 0) {document.getElementById("sidebar").className = "";}
  else {document.getElementById("sidebar").className = "up";}
}
function addHistory() {
    changes[hIndex] = ctx.getImageData(0,0,canvas.width,canvas.height);
    hIndex ++;
}
function updateSettings() {
  var btns = document.getElementsByClassName("btn");
  for(var i in btns){btns[i].className = "btn";}
  if(penType == "pencil")document.getElementById("pencil").className = "btn on";
  if(penType == "marker")document.getElementById("marker").className = "btn on";
  if(penType == "highlighter")document.getElementById("highlighter").className = "btn on";
  if(penType == "spray_paint")document.getElementById("spray_paint").className = "btn on";
  if(penType == "quill")document.getElementById("quill").className = "btn on";
  if(penType == "connect")document.getElementById("connect").className = "btn on";
  if(line_rounded)document.getElementById("line_rounded").className = "btn on";
  if(shape_rounded)document.getElementById("shape_rounded").className = "btn on";
  if(arrow)document.getElementById("arrow").className = "btn on";
  if(line_dash)document.getElementById("line_dash").className = "btn on";
  if(shape_dash)document.getElementById("shape_dash").className = "btn on";
  if(vertical)document.getElementById("vertical").className = "btn on";
  if(horizontal)document.getElementById("horizontal").className = "btn on";
  if(fillPoly)document.getElementById("fillPoly").className = "btn on";
  document.getElementById("sides").placeholder = sides;
  setSides(sides);
}
function applyStyle() {
  ctx.strokeStyle = tc.strokeStyle = t.strokeStyle = color;
  ctx.fillStyle = tc.fillStyle = t.fillStyle = color;
  if(mode == "eraser") {ctx.globalCompositeOperation = "destination-out";}
  else ctx.globalCompositeOperation = 'source-over';
  if(!line_rounded && mode == "line") {ctx.lineCap = tc.lineCap = t.lineCap = 'square';ctx.lineJoin = tc.lineJoin = t.lineJoin= 'miter';}
  else if(!shape_rounded && mode == "polygon") {ctx.lineCap = tc.lineCap = t.lineCap = 'butt';ctx.lineJoin = tc.lineJoin = t.lineJoin= 'miter';}
  else ctx.lineJoin = ctx.lineCap = tc.lineJoin = tc.lineCap = t.lineCap = t.lineJoin = 'round';
  if(line_dash && mode == "line" || shape_dash && mode == "polygon") {ctx.setLineDash([thickness, thickness*1.5]);tc.setLineDash([thickness, thickness*1.5]);t.setLineDash([thickness, thickness*1.5])}
  else {ctx.setLineDash([]);tc.setLineDash([]);t.setLineDash([]);}
  ctx.lineWidth = tc.lineWidth = t.lineWidth = thickness;
  ctx.globalAlpha = tc.globalAlpha = t.globalAlpha = 1;
  ctx.shadowBlur = tc.shadowBlur = t.shadowBlur = 0;
}
function moreSettings(elem,code,close) {
  if(close) {
    document.getElementById("info").style.left = "20%";
    document.getElementById("info").style.display = "none";
    return;
  }
  document.getElementById("info").innerHTML = code;
  document.getElementById("info").style.display = "block";
  document.getElementById("info").style.top = elem.offsetTop + elem.offsetHeight/2 - document.getElementById("info").offsetHeight/2 - document.getElementById("toolWrap").scrollTop;
  document.getElementById("info").style.left = "18%";

  updateSettings();
}

//Event Handlers
function resize() {
  var save = ctx.getImageData(0,0,canvas.width,canvas.height);
  if(document.body.offsetWidth/100*82 > canvas.width && document.body.offsetWidth > 820) {
    document.getElementById("sidebar").className = "";
    canvas.width = document.body.offsetWidth/100*82;
    temp.width = document.body.offsetWidth/100*82;
    third.width = document.body.offsetWidth/100*82;
  }
  else if(document.body.offsetWidth > canvas.width) {
    document.getElementById("sidebar").className = "up";
    canvas.width = document.body.offsetWidth;
    temp.width = document.body.offsetWidth;
    third.width = document.body.offsetWidth;
  }

  if(window.innerHeight > canvas.height) {
    canvas.height = window.innerHeight;
    temp.height = window.innerHeight;
    third.height = window.innerHeight;
  }
  document.getElementById("toolWrap").style.height = "calc(100vh - " + document.getElementById("head").offsetHeight + "px)";
  ctx.putImageData(save,0,0)
}
function move(event) {
  if(event) {
    mx = !event.touches ? event.clientX - canvas.offsetLeft : event.touches[0].clientX-canvas.offsetLeft;
    my = !event.touches ? event.clientY - canvas.offsetTop : event.touches[0].clientY - canvas.offsetTop;
  }
  hoveredColor = idColor(ctx,mx,my,true).replace("rgba(","rgb(").replace(/,[\s]?(\d+)?(\.+)?(\d+)[)]/gi, ")");
  if(down) {
    switch(mode) {
      case "pencil": if(penType == "highlighter") {pencil(t);}else {pencil(ctx);}break;
      case "eraser": pencil(ctx);break;
      case "line": line(tc);break;
      case "polygon": drawPoly(tc,sx,sy,sides,Math.sqrt(Math.pow(mx-sx,2) + Math.pow(my-sy,2)),Math.atan2((my-sy),(mx-sx)));break;
    }
  }
  switch(mode) {
    case "pencil": marker(tc);break;
    case "eraser": marker(tc);break;
    case "line": if(down)return;marker(tc);break;
    case "polygon": if(!down){tc.clearRect(0,0,temp.width,temp.height);drawPoly(tc,mx,my,sides,0,0,true,false,0);drawPoly(tc,mx,my,sides,0,0,true,false,1);}break;
    case "picker": picker(tc);break;
  }
}
function up(event) {
  ctx.beginPath();
  tc.beginPath();
  if(penType == "highlighter" && mode == "pencil"){var img = new Image();img.src = third.toDataURL();t.clearRect(0,0,third.width,third.height);img.onload = function() {ctx.drawImage(img,0,0);};}
  if(mode == "line" && sx !== null && sy !== null) {line(ctx);}
  else if(mode == "polygon" && sx !== null && sy !== null) {drawPoly(ctx,sx,sy,sides,Math.sqrt(Math.pow(mx-sx,2) + Math.pow(my-sy,2)),Math.atan2((my-sy),(mx-sx)))}
  else if(mode == "picker" && mx > 0 && my > 0) {setColor(hoveredColor);}
  else if(mode == "pencil" || mode == "eraser") {points = [];}
  clearTimeout(sprayTime);
  sprayTime = 0;
  sx = sy = null;
  if(down) {addHistory()}
  down = false;
}
function dwn(event) {
  down = true;
  moreSettings(false,false,true);
  sx = mx;
  sy = my;
  move(event);
}
function undo() {
  if(hIndex <= 1)return;
  hIndex--;
  ctx.putImageData(changes[hIndex-1],0,0);
}
function redo() {
  if(hIndex == changes.length)return;
  hIndex++;
  ctx.putImageData(changes[hIndex-1],0,0);
}

//TOOLS
var points = [];
function pencil(c) {
  applyStyle();
  if(penType == "highlighter" && mode == "pencil") {c.globalAlpha = .5; c.globalCompositeOperation = "xor";}
  if(penType == "marker" && mode == "pencil")  c.shadowBlur = thickness/1.5;c.shadowColor = color;
  if(penType == "spray_paint" && mode == "pencil") {spray(c);return;}
  points.push([mx,my]);
  if(penType == "quill" && mode == "pencil" || penType == "connect" && mode == "pencil") {
    c.shadowBlur = thickness*2;c.shadowColor = color;
    c.lineWidth = Math.ceil(thickness/20);c.shadowBlur = .5;c.shadowColor = color;
    connect(c);
  }
  c.beginPath();
  c.moveTo(points[0][0],points[0][1]);
  for(var i = 0;i<points.length-1;i++) {
    if(penType == "quill" && mode == "pencil" && i < points.length-5 || penType == "connect" && mode == "pencil" && i < points.length-5){c.moveTo(points[i][0],points[i][1]);continue;}
    c.quadraticCurveTo(points[i][0], points[i][1], points[i][0] + (points[i+1][0] - points[i][0]) / 2,points[i][1] + (points[i+1][1] - points[i][1]) / 2);
  }
  c.stroke();
}

function spray(c) {
  applyStyle();
  sprayTime = setTimeout(function drawSpray() {
    for(var i = 0;i<thickness/2.2;i++) {
      var a = Math.random()*Math.PI*2;
      var r = Math.random()*thickness/2;
      c.globalAlpha = Math.random()*.8+.2;
      c.beginPath();
      c.arc(mx + r*Math.cos(a),my+ r*Math.sin(a),1,0,Math.PI*2);
      c.fill();
    }
    if(!sprayTime)return;
    clearTimeout(sprayTime);
    sprayTime = setTimeout(drawSpray,50);
  }, 50);
}
function connect(c) {
  if(points.length < 2)return;
  var dir = Math.atan2(my-points[points.length-2][1],mx-points[points.length-2][0]);
  if(dir == 0)return;
  var j = 0;
  if(penType == "quill") j = points.length-35;
  for(var i = j;i<points.length;i++) {
    if(i<0)continue;
    var dx = mx-points[i][0], dy = my-points[i][1];
    var a = Math.atan2(dy,dx);
    if(Math.sqrt(dx*dx+dy*dy) < 60 && penType != "quill" || Math.sqrt(dx*dx+dy*dy) < 25 && Math.abs(dir-a) < 20*Math.PI/180) {
      c.beginPath();
      if(penType == "connect") {
        c.globalAlpha = .2;
        c.moveTo(mx-(dx*.1),my-(dy*.1));
        c.lineTo(points[i][0]+(dx*.1),points[i][1]+(dy*.1));
      }
      else {
        c.moveTo(mx,my);
        c.lineTo(points[i][0],points[i][1]);
      }
      c.stroke();
    }
  }
}
function marker(c) {
  var pth = thickness;
  c.lineWidth = 2;
  if(penType == "quill" && mode == "pencil" || penType == "connect" && mode == "pencil") {c.lineWidth = Math.ceil(thickness/20);thickness = c.lineWidth;}
  if(thickness < 10) {c.setLineDash([2,2]);}
  else {c.setLineDash([6,6]);}
  c.clearRect(0,0,c.canvas.width,c.canvas.height);
  c.beginPath();
  if(mode == "line" && !line_rounded) {
    c.lineWidth = 3;
    c.rect(mx-thickness/2,my-thickness/2,thickness,thickness);
    c.strokeStyle = lightDark(hoveredColor,true);
    c.stroke();
    c.beginPath();
    c.lineWidth = 2;
    c.rect(mx-thickness/2,my-thickness/2,thickness,thickness);
    c.strokeStyle = lightDark(hoveredColor);
    c.stroke();
  }
  else {
    c.lineWidth = 3;
    c.arc(mx,my,thickness/2,0,2*Math.PI);
    c.strokeStyle = lightDark(hoveredColor,true);
    c.stroke();
    c.beginPath();
    c.lineWidth = 2;
    c.arc(mx,my,thickness/2,0,2*Math.PI);
    c.strokeStyle = lightDark(hoveredColor);
    c.stroke();
  }
  thickness = pth;
}
function line(c) {
  applyStyle();
  if(horizontal) my = sy;
  else if(vertical) mx = sx;
  if(c == tc) c.clearRect(0,0,c.canvas.width,c.canvas.height);
  c.beginPath();
  c.moveTo(sx,sy);
  c.lineTo(mx,my);
  c.stroke();
  if(arrow && sx != mx || arrow && sy != my) {drawPoly(c,mx,my,3,thickness/2,Math.atan2((my-sy),(mx-sx)),false,true);}
}
function drawPoly(c,x,y,s,r,a,marker,arrow, mnum) {
  applyStyle();
  var j = 2;if(shape_dash)j=1;
  if(c == tc && !arrow && !marker) {c.clearRect(0,0,temp.width,temp.height);}
  if(arrow) {c.setLineDash([]);c.lineCap = "butt";c.lineJoin="miter";}
  if(marker || mx == sx && my == sy) {c.lineWidth = 2;r = 10;a=Math.PI/2*3;if(shape_dash)c.setLineDash[2,2];}
  if(c === tc && marker){if(!mnum){c.lineWidth = 3;c.strokeStyle = lightDark(hoveredColor,true)}else{c.lineWidth = 2;c.strokeStyle = lightDark(hoveredColor);}}
  else if(c === tc)temp.style.cursor = "auto";
  else temp.style.cursor = "none";
  c.beginPath();
  var stx = x+(r*Math.cos(a)), sty = y+(r*Math.sin(a));
  var arc = Math.PI*2/s;
  for(var i=0;i < s+j;i++) {
    if(i === 0)c.moveTo(stx,sty);
    c.lineTo(x+(r*Math.cos(i*arc+a)),y+(r*Math.sin(i*arc+a)));
  }
  if(fillPoly && c.canvas.id !== "shape") {c.fill();}
  c.stroke();
}
function picker(c) {
  imgMarker(c,"dropper.svg");
  c.strokeStyle = hoveredColor;c.lineWidth = 3;c.setLineDash([]);c.shadowBlur=0;c.lineCap = "round";
  c.beginPath();
  c.moveTo(mx+5,my-5);
  c.lineTo(mx+15,my-15);
  c.stroke();
}
function imgMarker(c,src) {
  c.clearRect(0,0,c.canvas.width,c.canvas.height);
  var i1 = new Image(); i1.src = "res/"+src;
  var i2 = new Image(); i2.src = i1.src.replace(".svg", "2.svg");
  c.drawImage(i1,mx,my-24,24,24);
  c.drawImage(i2,mx+1,my-23,24,24);
}
function clearCanvas(c) {
  if(confirm('Really Clear Canvas?')) {
    c.clearRect(0,0,canvas.width,canvas.height);
    moreSettings(false,false,true);addHistory();
    if(pMode=='picker'||pMode=='eraser'){setMode(pMode2);}
    else {setMode(pMode);}
  }
}
function save() {
  var data = canvas.toDataURL("image/png");
  var a = document.createElement('a');
  a.href = data;
  a.target = '_blank';
  a.download = "canvasImage";
  a.click();
}

//Helpers
function idColor(context,x,y, fix) {
  var rgb = context.getImageData(x, y, 1, 1).data;
  if(rgb[3] === 0 && fix)return "rgba(255,255,255, 1)";
  return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + rgb[3] + ")";
}
function lightDark(c,invert) {
  if(c.indexOf("#") > -1)c = hexRgb(c);
  c = parseFloat(rgbHsl(c).replace("hsl(","").replace(")", "").split(",")[2].replace("%", ""));
  if(c > 50 && !invert || c < 50 && invert)return "#000000";
  else return "#ffffff";
}
var mylatesttap;
function dblClick(callback) {
   var now = new Date().getTime();
   var timesince = now - mylatesttap;
   if((timesince < 600) && (timesince > 0)){
    eval(callback);
   }
   mylatesttap = new Date().getTime();
}
function rgbHex(rgb){
 rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
 return (rgb && rgb.length === 4) ? "#" +
  ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
  ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}
function hexRgb(hex) {
  var c = hex.substring(1).split('');
  if(c.length== 3){
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x'+c.join('');
  return 'rgb('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+')';
}
function rgbHsl(rgb) {
  rgb = rgb.replace("rgb(", "").replace("rgba(", "").replace(")", "").replace(/ /g, "").split(",");
  var r = bound01(rgb[0], 255);
  var g = bound01(rgb[1], 255);
  var b = bound01(rgb[2], 255);
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;
  if(max == min) {
      h = s = 0; // achromatic
  }
  else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch(max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return "hsl(" + Math.round(h*360) + ',' + Math.round(s*100)+"%" + ',' + Math.round(l*100)+"%)";
}
function bound01(n, max) {
    if (parseFloat(n) === 1 && n.indexOf(".") > -1) { n = "100%"; }
    var processPercent = n.toString().indexOf("%") > -1;
    n = Math.min(max, Math.max(0, parseFloat(n)));
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }
    if ((Math.abs(n - max) < 0.000001)) {
        return 1;
    }
    return (n % max) / parseFloat(max);
}
function midPointBtw(p1, p2) {
  return {
    x: p1.x + (p2.x - p1.x) / 2,
    y: p1.y + (p2.y - p1.y) / 2
  };
}