/** Original procedural artwork. No third-party sprites or textures are used. */
export type ItemKind = 'mushroom' | 'water' | 'sun' | 'flower' | 'firefly' | 'chest' | 'sign' | 'gift';
export interface WorldItem { id: string; x: number; y: number; kind: ItemKind; collected?: boolean }
export interface WorldState {
  width: number;
  height: number;
  stage: number;
  time: number;
  player: { x: number; y: number; facing: number | string; moving: boolean };
  items: WorldItem[];
  target?: { x: number; y: number } | null;
  flowerBloomed: boolean;
  celebrating: boolean;
  route?: string | null;
}

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const seeds = Array.from({ length: 220 }, (_, i) => {
  const random = (n: number) => { const s = Math.sin(n * 127.1 + i * 311.7) * 43758.5453; return s - Math.floor(s); };
  return { x: random(2) * 1000, y: random(4) * 640, s: random(7), a: random(9) * TAU };
});

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, color: string, rotate = 0) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rotate, 0, TAU); ctx.fill();
}
function stroke(ctx: Ctx, points: number[], color: string, width: number) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(points[0], points[1]);
  for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
  ctx.stroke();
}
function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
}
function leaf(ctx: Ctx, x: number, y: number, size: number, angle: number, color: string) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(size * .8, -size * .65, size, 0);
  ctx.quadraticCurveTo(size * .5, size * .4, 0, 0); ctx.fill(); ctx.restore();
}
function daisy(ctx: Ctx, x: number, y: number, s: number, t = 0, colorful = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t + x) * .06);
  stroke(ctx, [0, 2, -1, 15 * s], '#6c965f', 2 * s);
  leaf(ctx, -1, 11 * s, 6 * s, -.5, '#87a16c');
  for (let i = 0; i < 8; i++) {
    const a = i * TAU / 8;
    ellipse(ctx, Math.cos(a) * 5 * s, Math.sin(a) * 5 * s, 4.2 * s, 2.1 * s,
      colorful ? (i % 2 ? '#efb7b5' : '#f5ced1') : '#fffdf0', a);
  }
  ellipse(ctx, 0, 0, 2.9 * s, 2.9 * s, '#eec469'); ctx.restore();
}
function mushroom(ctx: Ctx, x: number, y: number, s: number, t = 0, special = false) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.7 + x) * .025);
  ellipse(ctx, 0, 3 * s, 17 * s, 5 * s, '#55735a20');
  rounded(ctx, -5 * s, -19 * s, 10 * s, 23 * s, 5 * s, '#fff0ce');
  ellipse(ctx, 3 * s, -5 * s, 2.2 * s, 7 * s, '#e6cfaa');
  ctx.fillStyle = special ? '#cc7971' : '#d98b78';
  ctx.beginPath(); ctx.moveTo(-20 * s, -17 * s); ctx.bezierCurveTo(-18 * s, -44 * s, 15 * s, -47 * s, 22 * s, -17 * s);
  ctx.bezierCurveTo(15 * s, -11 * s, -10 * s, -11 * s, -20 * s, -17 * s); ctx.fill();
  ellipse(ctx, 0, -16 * s, 19 * s, 3.5 * s, '#a8555520');
  ellipse(ctx, -9 * s, -26 * s, 3.6 * s, 4.1 * s, '#fff1d6', .25);
  ellipse(ctx, 4 * s, -33 * s, 4.1 * s, 3.3 * s, '#fff1d6', -.2);
  ellipse(ctx, 14 * s, -22 * s, 2.5 * s, 3 * s, '#fff1d6', -.3);
  ctx.restore();
}
function tree(ctx: Ctx, x: number, y: number, s: number, style: number, t: number) {
  const dark = style % 3 === 0;
  const main = dark ? '#608c72' : style % 3 === 1 ? '#79a283' : '#90b094';
  const shadow = dark ? '#4c7b65' : '#6c987b';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 24, 2, 76, 21, '#315c4320', -.12);
  ctx.fillStyle = '#a78e68'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-8, -83); ctx.lineTo(10, -83); ctx.lineTo(14, 0); ctx.closePath(); ctx.fill();
  stroke(ctx, [4, -3, 2, -70], '#8e785c', 2);
  stroke(ctx, [1, -53, -22, -74], '#a78e68', 8);
  stroke(ctx, [4, -35, 29, -61], '#a78e68', 7);
  const sway = Math.sin(t * .4 + x) * 1.4;
  ctx.translate(sway, 0);
  ctx.fillStyle = shadow; ctx.beginPath();
  ctx.moveTo(-62, -60); ctx.bezierCurveTo(-104, -75, -94, -124, -62, -129);
  ctx.bezierCurveTo(-75, -166, -30, -183, -4, -164);
  ctx.bezierCurveTo(18, -200, 64, -166, 63, -143);
  ctx.bezierCurveTo(102, -138, 109, -95, 77, -82);
  ctx.bezierCurveTo(89, -49, 43, -38, 22, -51);
  ctx.bezierCurveTo(-7, -30, -47, -36, -62, -60); ctx.fill();
  ctx.fillStyle = main; ctx.beginPath();
  ctx.moveTo(-64, -76); ctx.bezierCurveTo(-94, -88, -83, -126, -51, -130);
  ctx.bezierCurveTo(-57, -162, -24, -172, -3, -153);
  ctx.bezierCurveTo(23, -184, 61, -155, 57, -135);
  ctx.bezierCurveTo(88, -131, 93, -104, 68, -91);
  ctx.bezierCurveTo(74, -69, 44, -59, 24, -67);
  ctx.bezierCurveTo(-2, -46, -38, -52, -42, -74); ctx.fill();
  ellipse(ctx, -27, -132, 28, 15, '#d4e2b521', -.4);
  ellipse(ctx, 28, -149, 17, 11, '#e4eaca20', .3);
  [[-57,-106],[-33,-85],[-19,-147],[30,-102],[55,-121],[9,-76]].forEach(([lx,ly],i) => {
    leaf(ctx, lx, ly, 11, i * .7 - .8, dark ? '#87ac893b' : '#b7cda34a');
  });
  ctx.restore();
}
function shrub(ctx: Ctx, x: number, y: number, s: number, berry = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ellipse(ctx, 4, 1, 37, 10, '#5576511c');
  ellipse(ctx, -19, -10, 19, 19, '#98b58e'); ellipse(ctx, 2, -19, 26, 23, '#88a77c'); ellipse(ctx, 23, -8, 18, 17, '#9bb78d');
  leaf(ctx, -12, -20, 14, -.9, '#c7d5a840'); leaf(ctx, 7, -29, 12, -.4, '#c7d5a870');
  if (berry) [[-12,-13],[3,-22],[18,-11],[-3,-5]].forEach(([bx,by])=>ellipse(ctx,bx,by,2.6,2.7,'#d89a9c'));
  ctx.restore();
}
function butterfly(ctx: Ctx, x: number, y: number, s: number, t: number, hue = '#e8bb87') {
  ctx.save(); ctx.translate(x + Math.sin(t * .9 + x) * 10, y + Math.sin(t * 1.4) * 6); ctx.rotate(-.25);
  const flap = .5 + Math.abs(Math.sin(t * 6 + x)) * .5;
  ellipse(ctx,-4*s*flap,-3*s,4.8*s*flap,6*s,hue,-.4); ellipse(ctx,4*s*flap,-3*s,4.8*s*flap,6*s,hue,.4);
  ellipse(ctx,-3*s*flap,3*s,3.5*s*flap,4*s,hue,.5); ellipse(ctx,3*s*flap,3*s,3.5*s*flap,4*s,hue,-.5);
  stroke(ctx,[0,-5*s,0,5*s],'#787b5a',1.4*s);ctx.restore();
}

/** A new, vector-drawn fan-art scout. x/y is the character's ground position. */
export function drawTeemo(ctx: Ctx, x: number, y: number, scale = 1, time = 0, moving = false, offering = false, facing: number | string = 1) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  const step = moving ? Math.sin(time * 13) : Math.sin(time * 2.3) * .1;
  const bob = moving ? Math.abs(Math.sin(time * 13)) * 3 : Math.sin(time * 2) * 1.3;
  ellipse(ctx,0,1,27 - bob * .15,8,'#405f4633');
  ctx.translate(0,-bob);
  const mirror = facing === -1 || facing === 'left' ? -1 : 1;
  ctx.scale(mirror,1);
  // The little scout's travelling pack and soft boots.
  rounded(ctx,-29,-51,19,34,8,'#867658'); rounded(ctx,-33,-48,11,14,4,'#a28f66');
  stroke(ctx,[-25,-48,-20,-24],'#c4b485',3);
  ellipse(ctx,-12,-8 + step*2,11,10,'#79684b',-.1); ellipse(ctx,12,-8 - step*2,11,10,'#79684b',.1);
  ellipse(ctx,0,-33,25,26,'#667b50');
  ctx.fillStyle='#9ba772';ctx.beginPath();ctx.moveTo(-18,-48);ctx.quadraticCurveTo(0,-33,18,-48);ctx.lineTo(14,-18);ctx.quadraticCurveTo(0,-11,-15,-20);ctx.closePath();ctx.fill();
  stroke(ctx,[-17,-40,12,-21],'#d3bd7d',5);
  rounded(ctx,-2,-31,8,7,2,'#e8d89a'); rounded(ctx,0,-29,4,3,1,'#b8945f');
  // Ears sit behind the cream-coloured cheeks.
  ctx.fillStyle='#b28d5f';ctx.beginPath();ctx.moveTo(-22,-61);ctx.quadraticCurveTo(-45,-105,-36,-108);ctx.quadraticCurveTo(-12,-94,-8,-71);ctx.fill();
  ctx.beginPath();ctx.moveTo(20,-64);ctx.quadraticCurveTo(40,-108,46,-100);ctx.quadraticCurveTo(48,-75,29,-57);ctx.fill();
  ctx.fillStyle='#e5bca0';ctx.beginPath();ctx.moveTo(-26,-73);ctx.lineTo(-35,-99);ctx.quadraticCurveTo(-21,-89,-16,-74);ctx.fill();
  ctx.beginPath();ctx.moveTo(29,-73);ctx.lineTo(40,-92);ctx.quadraticCurveTo(40,-78,33,-68);ctx.fill();
  ellipse(ctx,0,-62,32,28,'#c9a777');
  ctx.fillStyle='#f8e9c9';ctx.beginPath();ctx.moveTo(-31,-68);ctx.quadraticCurveTo(-35,-53,-23,-44);ctx.lineTo(-27,-42);ctx.quadraticCurveTo(-10,-28,0,-38);ctx.quadraticCurveTo(15,-30,29,-45);ctx.lineTo(25,-46);ctx.quadraticCurveTo(36,-57,30,-69);ctx.quadraticCurveTo(18,-75,0,-66);ctx.quadraticCurveTo(-18,-74,-31,-68);ctx.fill();
  // Happy eyes, button nose and a very small smile.
  stroke(ctx,[-19,-60,-15,-63,-11,-61],'#5e4d3d',2.3);stroke(ctx,[11,-61,15,-63,19,-60],'#5e4d3d',2.3);
  ellipse(ctx,0,-53,4,2.7,'#805b48');
  ctx.strokeStyle='#976c52';ctx.lineWidth=1.8;ctx.beginPath();ctx.moveTo(-6,-46);ctx.quadraticCurveTo(0,-40,6,-46);ctx.stroke();
  ellipse(ctx,-23,-52,5,2.8,'#e6b69b80');ellipse(ctx,22,-52,5,2.8,'#e6b69b80');
  // The broad explorer hat has its own rounded silhouette.
  ctx.fillStyle='#778857';ctx.beginPath();ctx.moveTo(-29,-76);ctx.bezierCurveTo(-32,-112,24,-119,32,-82);ctx.quadraticCurveTo(1,-72,-29,-76);ctx.fill();
  ctx.fillStyle='#91a068';ctx.beginPath();ctx.moveTo(-25,-88);ctx.quadraticCurveTo(-14,-113,9,-106);ctx.quadraticCurveTo(19,-104,23,-92);ctx.quadraticCurveTo(-3,-95,-25,-88);ctx.fill();
  ctx.fillStyle='#62754b';ctx.beginPath();ctx.moveTo(-38,-82);ctx.quadraticCurveTo(-3,-72,35,-84);ctx.quadraticCurveTo(44,-72,25,-70);ctx.quadraticCurveTo(-4,-65,-36,-73);ctx.quadraticCurveTo(-44,-77,-38,-82);ctx.fill();
  // Crimson goggles, painted from scratch.
  stroke(ctx,[-28,-90,28,-91],'#a45443',9);
  ellipse(ctx,-13,-91,12,10.5,'#b96350',-.12);ellipse(ctx,13,-92,12,10.5,'#b96350',.1);
  ellipse(ctx,-13,-92,8.6,7.6,'#efbf7e',-.12);ellipse(ctx,13,-93,8.6,7.6,'#efbf7e',.1);
  ellipse(ctx,-12,-92,6.5,5.7,'#a1c0b1',-.12);ellipse(ctx,14,-93,6.5,5.7,'#a1c0b1',.1);
  ellipse(ctx,-15,-94,2.2,1.5,'#ecf1d7',-.3);ellipse(ctx,12,-95,2.2,1.5,'#ecf1d7',-.3);
  stroke(ctx,[-1,-92,2,-92],'#d2a56d',3);
  // A red feather tucked into the hat.
  ctx.fillStyle='#cf8974';ctx.beginPath();ctx.moveTo(-22,-101);ctx.quadraticCurveTo(-46,-126,-33,-130);ctx.quadraticCurveTo(-20,-123,-18,-104);ctx.fill();
  stroke(ctx,[-22,-101,-32,-123],'#b7695f',1.5);
  if(offering){
    ellipse(ctx,22,-34,9,7,'#d0b086',-.7);ellipse(ctx,32,-38,8,7,'#f4e4c2');
    stroke(ctx,[30,-37,36,-72],'#75925d',3);
    leaf(ctx,32,-49,12,-.4,'#91ab72');
    for(let i=0;i<10;i++){const a=i*TAU/10;ellipse(ctx,36+Math.cos(a)*10,-77+Math.sin(a)*10,8,4.2,'#fffdf1',a)}
    ellipse(ctx,36,-77,7,7,'#eabe54');ellipse(ctx,34,-79,2,2,'#f5d97e');
  }else{
    ellipse(ctx,-24,-30 + step*3,8,13,'#c9aa7d',-.35);ellipse(ctx,24,-30 - step*3,8,13,'#d7bc90',.35);
    stroke(ctx,[26,-39 - step*3,35,-61 - step*3],'#a17b4f',5);
    stroke(ctx,[26,-39 - step*3,35,-61 - step*3],'#d1af73',2);
  }
  ctx.restore();
}

function drawPath(ctx: Ctx) {
  const make = () => {ctx.beginPath();ctx.moveTo(330,710);ctx.bezierCurveTo(340,550,240,512,354,426);ctx.bezierCurveTo(442,358,603,425,686,340);ctx.bezierCurveTo(759,265,707,188,754,90);ctx.bezierCurveTo(777,48,820,20,820,-30)};
  ctx.lineCap='round';make();ctx.strokeStyle='#9cae862b';ctx.lineWidth=113;ctx.stroke();
  make();ctx.strokeStyle='#e2d9b3';ctx.lineWidth=99;ctx.stroke();
  make();ctx.strokeStyle='#ece2c3';ctx.lineWidth=85;ctx.stroke();
  ctx.beginPath();ctx.moveTo(-40,350);ctx.bezierCurveTo(122,306,184,341,275,383);ctx.bezierCurveTo(362,425,463,322,486,228);ctx.quadraticCurveTo(515,128,612,124);
  ctx.strokeStyle='#e6ddbc';ctx.lineWidth=59;ctx.stroke();
  ctx.strokeStyle='#eee5cc';ctx.lineWidth=46;ctx.stroke();
  // Small, irregular stones give the trail a handmade texture.
  [[352,530,3],[300,482,2],[377,412,3],[429,397,2],[521,393,3],[602,390,2],[680,345,3],[734,265,2],[731,190,3],[760,100,2],[133,330,2],[220,362,3],[444,332,2],[482,239,3]].forEach(([x,y,r])=>ellipse(ctx,x,y,r+1,r*.7,'#bead892e',.2));
}
function river(ctx: Ctx,t:number) {
  const make=()=>{ctx.beginPath();ctx.moveTo(954,-20);ctx.bezierCurveTo(932,97,842,136,853,244);ctx.bezierCurveTo(864,354,971,425,1009,528);ctx.quadraticCurveTo(1030,594,1000,670)};
  ctx.lineCap='round';make();ctx.strokeStyle='#739e8b40';ctx.lineWidth=104;ctx.stroke();
  make();ctx.strokeStyle='#9ac9bc';ctx.lineWidth=88;ctx.stroke();
  make();ctx.strokeStyle='#b9d8c7';ctx.lineWidth=74;ctx.stroke();
  for(let i=0;i<8;i++){
    const yy=(i*91+t*5)%700-30;const xx=yy<280?930-Math.sin(yy/220)*80:855+(yy-260)*.41;
    stroke(ctx,[xx-14,yy,xx+4,yy-2,xx+15,yy],'#e5eee156',2);
  }
  // A short wooden footbridge, with cream highlights and little posts.
  ctx.save();ctx.translate(882,331);ctx.rotate(-.4);
  ellipse(ctx,0,10,61,24,'#446c5630');
  rounded(ctx,-65,-22,130,48,7,'#957f5c');
  for(let i=0;i<9;i++)rounded(ctx,-61+i*14,-20,12,43,3,i%2?'#c1ab7c':'#d0b98b');
  stroke(ctx,[-66,-20,66,-20],'#e8d4a4',4);stroke(ctx,[-66,23,66,23],'#a08b63',4);
  [[-59,-22],[58,-22],[-59,24],[58,24]].forEach(([x,y])=>{rounded(ctx,x-3,y-18,6,24,2,'#9d8863');ellipse(ctx,x,y-18,4,2,'#e6d1a3')});ctx.restore();
  // Reeds and soft bank rocks.
  [[902,145],[835,246],[944,399],[967,438]].forEach(([x,y],i)=>{
    ellipse(ctx,x,y,15,8,i%2?'#b2bd9c':'#a3b49a',-.2);
    stroke(ctx,[x+8,y,x+5,y-20],'#7c9c79',2);stroke(ctx,[x+9,y,x+17,y-25],'#7c9c79',2);
  });
}
function glow(ctx:Ctx,x:number,y:number,r:number,color:string){
  const gradient=ctx.createRadialGradient(x,y,0,x,y,r);gradient.addColorStop(0,color);gradient.addColorStop(1,'#f8eabc00');ctx.fillStyle=gradient;ctx.fillRect(x-r,y-r,r*2,r*2);
}
function sign(ctx:Ctx,x:number,y:number,left:boolean){
  ellipse(ctx,x,y+3,28,7,'#59725222');
  rounded(ctx,x-4,y-48,8,50,3,'#aa8e62');
  ctx.save();ctx.translate(x,y-43);
  ctx.fillStyle='#d2b888';ctx.beginPath();ctx.moveTo(-46,-13);ctx.lineTo(36,-13);ctx.lineTo(49,0);ctx.lineTo(36,13);ctx.lineTo(-46,13);ctx.closePath();ctx.fill();
  stroke(ctx,[-40,-10,33,-10],'#e7d5ad',1.5);
  ctx.fillStyle='#756645';ctx.font='600 10px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(left?'Prin flori':'Prin luminiș',-2,0);ctx.restore();
}
function chest(ctx:Ctx,x:number,y:number,t:number,open=false){
  ctx.save();ctx.translate(x,y);
  ellipse(ctx,0,4,36,10,'#6d71442a');
  if(open)glow(ctx,0,-22,65,'#fff1b19c');
  rounded(ctx,-29,-29,58,32,5,'#98774f');rounded(ctx,-26,-25,52,24,3,'#b49361');
  rounded(ctx,-29,open?-61:-45,58,open?20:23,8,'#a88657');
  stroke(ctx,[-19,open?-58:-42,-19,1],'#dbc28a',5);stroke(ctx,[19,open?-58:-42,19,1],'#dbc28a',5);
  rounded(ctx,-7,-22,14,15,3,'#e8cc88');ellipse(ctx,0,-15,2.2,3,'#927248');
  if(open){ellipse(ctx,0,-34,14,13,'#eee1af');ctx.strokeStyle='#b19356';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-34,10,0,TAU);ctx.stroke();stroke(ctx,[0,-42,4,-33,0,-26,-4,-34,0,-42],'#b48b4c',1.6)}
  ctx.restore();
  if(!open){glow(ctx,x,y-26,48+Math.sin(t*2)*5,'#fff0b043');}
}
function item(ctx:Ctx,it:WorldItem,t:number,bloom:boolean){
  const {x,y,kind}=it;
  if(it.collected&&kind!=='flower'&&kind!=='chest'&&kind!=='gift')return;
  const bob=Math.sin(t*2+it.x)*2;
  if(!it.collected){
    // A small cream halo distinguishes objectives from scenery without urgency.
    ellipse(ctx,x,y+3,27,8,'#fff9d522');
    ctx.save();ctx.strokeStyle='#fffbe4b8';ctx.lineWidth=1.3;ctx.setLineDash([2,4]);
    ctx.beginPath();ctx.ellipse(x,y+3,27,8,0,0,TAU);ctx.stroke();ctx.restore();
  }
  if(kind==='mushroom'){
    glow(ctx,x,y-12,38,'#fff0b53b');mushroom(ctx,x,y,1.05,t,true);
    if(Math.sin(t*1.4+x)>.3){ctx.fillStyle='#fff7d3';ctx.font='17px serif';ctx.fillText('✧',x+22,y-37+bob)}
  }else if(kind==='water'){
    ctx.save();ctx.translate(x,y+bob);ellipse(ctx,0,3,26,7,'#52796b21');
    ctx.strokeStyle='#6f9f96';ctx.lineWidth=6;ctx.beginPath();ctx.arc(-12,-26,15,1.6,5);ctx.stroke();
    rounded(ctx,-15,-32,31,31,7,'#9ac4b2');rounded(ctx,-12,-29,25,7,4,'#b6d5c2');
    stroke(ctx,[13,-16,30,-31,36,-32],'#86b0a0',8);stroke(ctx,[32,-37,37,-29],'#bfd9c3',5);
    ctx.fillStyle='#eaf3da';ctx.beginPath();ctx.moveTo(0,-24);ctx.bezierCurveTo(-13,-10,-4,-6,0,-6);ctx.bezierCurveTo(8,-6,10,-12,0,-24);ctx.fill();ctx.restore();
    glow(ctx,x,y-20,48,'#e3f8e22a');
  }else if(kind==='sun'){
    const yy=y-22+bob;glow(ctx,x,yy,65,'#f4d8795e');
    for(let i=0;i<8;i++){const a=i*TAU/8+t*.15;stroke(ctx,[x+Math.cos(a)*22,yy+Math.sin(a)*22,x+Math.cos(a)*29,yy+Math.sin(a)*29],'#e5be68',3)}
    ellipse(ctx,x,yy,17,17,'#f4d684');ellipse(ctx,x-4,yy-5,7,5,'#fff0b263',-.4);
    ellipse(ctx,x-5,yy,1.5,2,'#9c864c');ellipse(ctx,x+5,yy,1.5,2,'#9c864c');
    ctx.strokeStyle='#b08d51';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(x,yy+2,5,.3,2.8);ctx.stroke();
  }else if(kind==='flower'){
    ellipse(ctx,x,y+3,25,7,'#77936024');
    stroke(ctx,[x,y,x-3,y-47],'#6e9a62',4);leaf(ctx,x-2,y-13,18,-.5,'#8cad76');leaf(ctx,x-1,y-21,17,3.5,'#9aba80');
    if(bloom||it.collected){glow(ctx,x,y-48,64,'#fff2b43a');daisy(ctx,x-3,y-50,2.8,t)}
    else{ellipse(ctx,x-3,y-46,7,12,'#bed097',.2);ellipse(ctx,x-6,y-50,4,8,'#dce0ac',-.2)}
  }else if(kind==='firefly'){
    const yy=y-20+Math.sin(t*2.2+x)*7;const xx=x+Math.sin(t+x)*5;
    glow(ctx,xx,yy,54+Math.sin(t*2)*9,'#fff0a377');
    ellipse(ctx,xx-5,yy-4,5,3,'#f7f1d8b0',-.6);ellipse(ctx,xx+5,yy-4,5,3,'#f7f1d8b0',.6);
    ellipse(ctx,xx,yy,4.5,6,'#f3d685');ellipse(ctx,xx,yy+2,3.8,4,'#fff3ab');
    ellipse(ctx,xx,yy-4,2.3,2.3,'#a3995e');
    for(let i=0;i<3;i++)ellipse(ctx,xx-17+i*4,yy+8+i*2,1.2,1.2,'#fff5c78a');
  }else if(kind==='chest')chest(ctx,x,y,t,!!it.collected);
  else if(kind==='sign')sign(ctx,x,y,it.id.includes('left')||it.id.includes('flower'));
  else if(kind==='gift'){
    ctx.save();ctx.translate(x,y+bob);ellipse(ctx,0,4,30,8,'#7b79542a');
    rounded(ctx,-24,-36,48,37,4,'#d9b7b0');rounded(ctx,-27,-42,54,12,3,'#e7c5bc');rounded(ctx,-4,-42,8,43,1,'#f5dfad');
    ctx.strokeStyle='#e7c277';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,-42);ctx.bezierCurveTo(-36,-68,-32,-31,0,-42);ctx.bezierCurveTo(34,-64,27,-26,0,-42);ctx.stroke();ctx.restore();
  }
}

/** Paint one frame. Coordinates, scenery and movement all use a 1000 × 640 world. */
export function renderWorld(ctx:Ctx,state:WorldState){
  const {time:t,stage,player}=state;
  ctx.save();
  ctx.scale(state.width/1000,state.height/640);
  ctx.clearRect(0,0,1000,640);
  const bg=ctx.createLinearGradient(0,0,900,700);bg.addColorStop(0,'#b8cdb0');bg.addColorStop(.5,'#c5d5b6');bg.addColorStop(1,'#b3c7a5');ctx.fillStyle=bg;ctx.fillRect(0,0,1000,640);
  // Broad, dappled meadow patches, kept quiet so the scout remains readable.
  ellipse(ctx,340,210,245,130,'#d2ddbd72',-.3);ellipse(ctx,600,460,320,130,'#d6deba42',.15);
  ellipse(ctx,80,500,160,230,'#97b29328',-.1);ellipse(ctx,700,110,270,100,'#9eb99532',.2);
  river(ctx,t);drawPath(ctx);
  // The meadow's very small details are deterministic, avoiding flicker.
  seeds.forEach((p,i)=>{
    if(i%3===0){
      ctx.globalAlpha=.2+p.s*.2;
      stroke(ctx,[p.x-3,p.y,p.x-4,p.y-4-p.s*3],'#648b61',1.2);
      stroke(ctx,[p.x,p.y+1,p.x+2,p.y-5-p.s*3],'#769767',1.1);ctx.globalAlpha=1;
    }else if(i%7===0)ellipse(ctx,p.x,p.y,1.3+p.s,1,'#e6e9c35a');
  });
  // A cottage-sized woodland border frames the route without hiding objectives.
  const backTrees=[[-12,225,1.4,0],[100,160,1.2,1],[232,111,1.08,2],[368,64,1.3,0],[505,44,1.3,1],[640,20,1.2,2],[832,45,1.3,1],[1006,150,1.45,0],[1018,295,1.2,1]];
  backTrees.forEach(([x,y,s,k])=>tree(ctx,x,y,s,k,t));
  shrub(ctx,149,171,.9,true);shrub(ctx,550,121,.7);shrub(ctx,810,166,.65,true);
  shrub(ctx,60,262,.8);shrub(ctx,956,279,.75);shrub(ctx,760,485,.75,true);
  // Decorative mushrooms are smaller and less vivid than collectible ones.
  [[59,186,.45],[80,196,.32],[235,532,.36],[211,538,.48],[823,479,.5],[845,485,.35],[469,152,.38]].forEach(([x,y,s])=>mushroom(ctx,x,y,s,t));
  [[99,396,1],[120,412,.8],[179,280,.7],[554,493,1],[577,506,.7],[698,223,.9],[684,235,.6],[812,570,.8],[833,558,.7],[440,180,.65],[460,190,.8],[147,559,.8]].forEach(([x,y,s],i)=>daisy(ctx,x,y,s,t,i%5===0));
  // Flat pebbles and tiny grasses at the edges.
  [[138,226,14,7],[163,232,10,6],[620,553,14,7],[644,555,9,5],[775,215,10,6],[559,154,8,5]].forEach(([x,y,rx,ry],i)=>{ellipse(ctx,x,y+2,rx+1,ry,'#6f8e6433');ellipse(ctx,x,y,rx,ry,i%2?'#c0c3a6':'#aeb99b');ellipse(ctx,x-2,y-2,rx*.6,ry*.3,'#dde0c344')});
  butterfly(ctx,190,245,.8,t,'#e9d395');butterfly(ctx,659,482,.9,t,'#dfb5a1');butterfly(ctx,787,115,.7,t,'#eee1b4');
  // A curious little butterfly is a click/tap surprise at a stable map location.
  glow(ctx,875,160,25,'#fff6b93e');butterfly(ctx,875,160,1.2,t,'#f2d899');
  if(Math.sin(t*1.1)>.4){ctx.fillStyle='#fff5cd';ctx.font='16px Georgia,serif';ctx.fillText('✧',893,145+Math.sin(t)*2)}
  // A birthday bunting gradually welcomes the explorer into the final clearing.
  if(stage>=5){
    ctx.save();ctx.strokeStyle='#978b69';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(250,139);ctx.quadraticCurveTo(500,218,755,130);ctx.stroke();
    for(let i=0;i<13;i++){const x=270+i*37;const y=146+Math.sin((x-250)/505*Math.PI)*38;ctx.fillStyle=['#e1b0a9','#ead59d','#b1c1a1'][i%3];ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+19,y+2);ctx.lineTo(x+10,y+24);ctx.closePath();ctx.fill()}
    ctx.restore();
    for(let i=0;i<14;i++)daisy(ctx,360+i*27,485+Math.sin(i*2.1)*35,.8+(i%3)*.2,t);
  }
  if(state.target){
    const pulse=(t*1.5)%1;
    ctx.strokeStyle=`rgba(255,252,225,${.7-pulse*.6})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(state.target.x,state.target.y,8+pulse*13,4+pulse*6,0,0,TAU);ctx.stroke();
    ellipse(ctx,state.target.x,state.target.y,2,2,'#fff6ce');
  }
  // Items and scout share a ground-sorted draw order.
  const sorted:[number,()=>void][] = state.items.map(it=>[it.y,()=>item(ctx,it,t,stage===5||state.flowerBloomed)]);
  sorted.push([player.y,()=>{
    ellipse(ctx,player.x,player.y+2,36,12,'#fff8d36b');
    ctx.strokeStyle='#fff9da9c';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(player.x,player.y+2,36,12,0,0,TAU);ctx.stroke();
    if(state.celebrating){ctx.save();ctx.translate(player.x,player.y);ctx.rotate(Math.sin(t*8)*.12);drawTeemo(ctx,0,0,1.0,t,true,stage>=5,player.facing);ctx.restore()}
    else drawTeemo(ctx,player.x,player.y,1,t,player.moving,stage>=5&&state.flowerBloomed,player.facing);
  }]);
  sorted.sort((a,b)=>a[0]-b[0]).forEach(([,draw])=>draw());
  // The front treeline creates depth, with a wide gap in the middle.
  tree(ctx,-52,603,1.55,0,t);tree(ctx,65,709,1.6,1,t);tree(ctx,188,720,1.05,2,t);
  tree(ctx,934,752,1.5,1,t);tree(ctx,1041,612,1.45,0,t);
  shrub(ctx,174,624,1.05,true);shrub(ctx,750,652,1.1);shrub(ctx,820,626,1,true);
  // A subtle evening tint accompanies the firefly chapter.
  if(stage===3||stage===4){ctx.fillStyle='#5267890d';ctx.fillRect(0,0,1000,640)}
  for(let i=0;i<(stage>=3?23:10);i++){
    const p=seeds[i*7];const xx=p.x+Math.sin(t*.4+p.a)*9;const yy=p.y+Math.cos(t*.5+p.a)*8;const a=.25+Math.sin(t*1.3+p.a)*.2;
    ctx.globalAlpha=a;glow(ctx,xx,yy,12,'#fff7bdaa');ellipse(ctx,xx,yy,1.2,1.2,'#fffbd6');ctx.globalAlpha=1;
  }
  if(state.celebrating){
    for(let i=0;i<65;i++){
      const p=seeds[i];const speed=24+p.s*30;const yy=(p.y+t*speed)%720-40;const xx=p.x+Math.sin(t*1.6+p.a)*18;
      ctx.save();ctx.translate(xx,yy);ctx.rotate(t+p.a);ctx.fillStyle=['#eed28d','#e2a59a','#9dbb9b','#fff2cd','#c2b2cf'][i%5];ctx.globalAlpha=.8;ctx.fillRect(-2,-4,4,7);ctx.restore();
    }
  }
  // Warm paper-like light across the middle, with darker edges.
  const vignette=ctx.createRadialGradient(490,340,150,500,340,650);vignette.addColorStop(0,'#f4edc200');vignette.addColorStop(.65,'#47694800');vignette.addColorStop(1,'#25492c18');ctx.fillStyle=vignette;ctx.fillRect(0,0,1000,640);
  ctx.restore();
}
