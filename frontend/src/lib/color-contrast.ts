/** Choose the stronger black/white contrast after compositing optional HEX alpha. */
export function actionInk(color:string,background:string):string {
 function rgb(hex:string){let raw=hex.slice(1);if(raw.length===3)raw=raw.split('').map(c=>c+c).join('');return [parseInt(raw.slice(0,2),16),parseInt(raw.slice(2,4),16),parseInt(raw.slice(4,6),16),raw.length===8?parseInt(raw.slice(6),16)/255:1];}
 const c=rgb(color),bg=rgb(background),linear=c.slice(0,3).map((v,i)=>(v*c[3]+bg[i]*(1-c[3]))/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
 const l=.2126*linear[0]+.7152*linear[1]+.0722*linear[2];return l>.179?'#000000':'#ffffff';
}
