var content=(function(){"use strict";const x=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;function Ar(t){return t}const We=180,He=180,Ue=260,_e=190,f=t=>typeof t=="object"&&t!==null,q=t=>!f(t)||!f(t.stencil)||typeof t.stencil.id!="string"?"":t.stencil.id,$=t=>{const e=t.toLowerCase();return e.includes("flow")||e.includes("association")||e.includes("connection")||e.includes("link")},K=t=>!f(t)||!Array.isArray(t.childShapes)?[]:t.childShapes,Ve=t=>{const e=[],r=[...t];for(;r.length>0;){const i=r.pop();if(f(i)&&(e.push(i),Array.isArray(i.childShapes)))for(const n of i.childShapes)r.push(n)}return e},z=t=>structuredClone(t),pe=t=>{const e=new Set;for(const r of t)typeof r.resourceId=="string"&&r.resourceId.trim()&&e.add(r.resourceId);return e},Ge=t=>{const e=new Map;for(const r of t){const i=crypto.randomUUID().replace(/-/g,"").slice(0,12);e.set(r,`sid-${i}`)}return e},J=(t,e)=>{if(Array.isArray(t))return t.map(i=>J(i,e));if(!f(t))return t;const r={};for(const[i,n]of Object.entries(t)){if(i==="resourceId"&&typeof n=="string"&&e.has(n)){r[i]=e.get(n);continue}r[i]=J(n,e)}return r},Qe=t=>{if(!Array.isArray(t.childShapes))return;let e=0;for(const r of t.childShapes){if(!f(r))continue;const i=q(r);if($(i)||!f(r.bounds))continue;const n=r.bounds;if(!f(n.upperLeft)||!f(n.lowerRight))continue;const s=n.upperLeft,o=n.lowerRight,a=typeof o.x=="number"&&typeof s.x=="number"?Math.max(40,o.x-s.x):120,l=typeof o.y=="number"&&typeof s.y=="number"?Math.max(40,o.y-s.y):80,c=We+e%3*Ue,d=He+Math.floor(e/3)*_e;n.upperLeft={x:c,y:d},n.lowerRight={x:c+a,y:d+l},e+=1}},je=t=>{const e=K(t).filter(f);return e.length===0?null:e.find(i=>!$(q(i)))??e[0]??null},Ye=t=>!t||!f(t.properties)?null:t.properties,Je=["name","title","text","documentation","description","conditionexpression","conditionExpression","condition","taskname","subject","label","caption"],Ze=t=>t.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),Xe=new Set(["task","usertask","manualtask","servicetask","webservice","scripttask","sendtask","receivetask","businessruletask","callactivity","automatic","bpmn"]),et=t=>t.toLowerCase().replace(/[^a-z0-9]/g,""),tt=t=>{const e=et(t);return Xe.has(e)},rt=t=>{if(!t)return"";for(const e of Je){const r=t[e];if(typeof r=="string"){const i=Ze(r);if(i.length>0&&!tt(i))return i}}return""},it=(t,e)=>{if(!t)return"";for(const r of e){const i=t[r];if(typeof i=="string"&&i.trim())return i.trim()}return""},nt=(t,e)=>{if(!t)return null;for(const r of e){const i=t[r];if(typeof i=="boolean")return i;if(typeof i=="number")return i!==0;if(typeof i=="string"){const n=i.trim().toLowerCase();if(["true","yes","1"].includes(n))return!0;if(["false","no","0"].includes(n))return!1}}return null},st=(t,e)=>{const r=t.toLowerCase(),i=it(e,["tasktype","type","activitytype","implementation","trigger"]).toLowerCase(),n=`${r} ${i}`;return n.includes("callactivity")||n.includes("call activity")?"call-activity":n.includes("servicetask")||n.includes("service task")||n.includes("service")||n.includes("webservice")?"service":n.includes("usertask")||n.includes("user task")||n.includes("user")?"user":n.includes("manualtask")||n.includes("manual task")||n.includes("manual")?"manual":n.includes("scripttask")||n.includes("script task")||n.includes("script")?"script":n.includes("sendtask")||n.includes("send task")||n.includes("send")?"send":n.includes("receivetask")||n.includes("receive task")||n.includes("receive")?"receive":n.includes("businessruletask")||n.includes("business rule")||n.includes("decision")?"business-rule":n.includes("automatic")||n.includes("auto")?"automatic":"default"},ot=t=>h(t,["timer"])?"Timer":h(t,["message"])?"Message":h(t,["signal"])?"Signal":h(t,["conditional"])?"Conditional":h(t,["linkevent"," link "])?"Link":h(t,["multiple"])?"Multiple":h(t,["escalation"])?"Escalation":h(t,["error"])?"Error":h(t,["compensation"])?"Compensation":h(t,["terminate"])?"Terminate":h(t,["cancel"])?"Cancel":"",at=(t,e,r)=>{const i=t.toLowerCase(),n=Object.values(r??{}).filter(a=>typeof a=="string").join(" ").toLowerCase(),s=`${i} ${n}`,o=ot(s);return i.includes("transaction")?"Transaction":i.includes("subprocess")?"Subprocess":i.includes("parallelgateway")?"Parallel Gateway":i.includes("inclusivegateway")?"Inclusive Gateway":i.includes("eventbasedgateway")?"Event-Based Gateway":i.includes("complexgateway")?"Complex Gateway":i.includes("gateway")?"Exclusive Gateway":i.includes("startevent")?o?`Start ${o} Event`:"Start Event":i.includes("endevent")?o?`End ${o} Event`:"End Event":i.includes("boundaryevent")?o?`Boundary ${o} Event`:"Boundary Event":i.includes("intermediate")||i.includes("event")?o?`Intermediate ${o} Event`:"Intermediate Event":i.includes("messageflow")?"Message Flow":i.includes("sequenceflow")?"Sequence Flow":i.includes("association")?"Association":i.includes("dataobject")?"Data Object":i.includes("datastore")?"Data Store":i.includes("annotation")?"Text Annotation":i.includes("group")?"Group":i.includes("pool")||i.includes("lane")||i.includes("participant")?"Pool/Lane":i.includes("task")||i.includes("activity")||i.includes("callactivity")?e==="service"?"Service Task":e==="user"?"User Task":e==="manual"?"Manual Task":e==="script"?"Script Task":e==="send"?"Send Task":e==="receive"?"Receive Task":e==="business-rule"?"Business Rule Task":e==="call-activity"?"Call Activity":e==="automatic"?"Automatic Task":"Task":"Component"},lt=(t,e)=>(t.match(/[^\s]+/g)??[]).slice(0,e).join(" ").trim(),h=(t,e)=>e.some(r=>t.includes(r)),ct=t=>{const e=new Set,r=[];for(const i of t)e.has(i)||(e.add(i),r.push(i));return r},he=t=>{const e=K(t).filter(f);let r=0;for(const i of e)$(q(i))||(r+=1);return r};function dt(t,e=3){const r=K(t).filter(f),i=[];for(const n of r){const s=q(n);if(!(!s||$(s))&&(i.push(s),i.length>=e))break}return i}function N(t){const e=je(t),r=q(e),i=Ye(e),n=rt(i),s=n.length>0,o=st(r,i),a=at(r,o,i);return{stencilId:r,hasContent:s,contentText:n,taskVariant:o,typeName:a,properties:i}}function fe(t){const e=N(t),r=[],i=e.stencilId.toLowerCase(),n=Object.values(e.properties??{}).filter(a=>typeof a=="string").join(" ").toLowerCase(),s=`${i} ${n}`;return e.hasContent&&r.push("content"),he(t)>1&&r.push("multi-element"),h(s,["timer"])&&r.push("timer"),h(s,["message"])&&r.push("message"),h(s,["conditional"])&&r.push("conditional"),h(s,["linkevent"," link "])&&r.push("link"),h(s,["multiple"])&&r.push("multiple"),h(s,["multi","multiple"])&&(h(s,["parallel"])&&r.push("mi-parallel"),h(s,["sequential","serial"])&&r.push("mi-sequential")),h(s,["loop"])&&r.push("loop"),h(s,["adhoc","ad hoc"])&&r.push("adhoc"),h(s,["transaction"])&&r.push("transaction"),(nt(e.properties,["isinterrupting","interrupting"])===!1||h(s,["noninterrupting","non-interrupting"]))&&r.push("non-interrupting"),ct(r)}function ut(t){const e=N(t).taskVariant;return e==="default"?null:e}const Z=(t,e,r)=>{if(Array.isArray(t)){for(const i of t)Z(i,e,r);return}if(f(t)&&!r.has(t)){r.add(t),typeof t.resourceId=="string"&&f(t.stencil)&&typeof t.stencil.id=="string"&&e.push(t);for(const i of Object.values(t))Z(i,e,r)}},W=(t,e,r)=>{if(typeof t=="string")return e.has(t);if(Array.isArray(t))return t.some(i=>W(i,e,r));if(!f(t)||r.has(t))return!1;r.add(t);for(const i of Object.values(t))if(W(i,e,r))return!0;return!1},pt=t=>{if(!Array.isArray(t.childShapes)||!f(t.linked))return;const e=t.childShapes.filter(f),r=pe(e),i=[];if(Z(t.linked,i,new WeakSet),i.length===0)return;const n=i.filter(l=>q(l).toLowerCase().includes("annotation")),s=new Set;for(const l of n)typeof l.resourceId=="string"&&l.resourceId.trim()&&s.add(l.resourceId);const o=i.filter(l=>q(l).toLowerCase().includes("association")),a=[];for(const l of n)a.push(l);for(const l of o){const c=W(l,s,new WeakSet),d=W(l,r,new WeakSet);(c||d)&&a.push(l)}for(const l of a)typeof l.resourceId!="string"||!l.resourceId.trim()||r.has(l.resourceId)||(t.childShapes.push(z(l)),r.add(l.resourceId))};function ge(t){if(!f(t)||!Array.isArray(t.childShapes))return z(t);const e=z(t);return pt(e),e}function ht(t){const e=N(t),r=he(t);let i=e.typeName||"Favorite snippet";if(e.hasContent){const n=lt(e.contentText,2);n&&(i=`${e.typeName}: ${n}`)}return r>1?`${i}, more...`:i}function ft(t){if(!f(t)||!Array.isArray(t.childShapes))return z(t);const e=ge(t),r=Ve(K(e)),i=pe(r),n=Ge(i),s=J(e,n);return f(s)&&(s.useOffset=!1,Qe(s)),s}const ye="favorites",me="favoritesBackups",we="lastCapture",X="sigtastic.favorites.mirror.v1",ee="bpkeys.favorites.mirror.v1",gt=6,H=t=>structuredClone(t),A=t=>t.trim().replace(/\s+/g," "),yt=t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),mt=(t,e)=>{const r=A(t);if(!r)return"Favorite";if(!e.some(c=>A(c.name).toLowerCase()===r.toLowerCase()))return r;const n=r.match(/^(.*?)(?:\s+(\d+))?$/),s=A(n?.[1]??r),o=new RegExp(`^${yt(s)}(?:\\s+(\\d+))?$`,"i"),a=new Set;for(const c of e){const u=A(c.name).match(o);u&&u[1]&&a.add(Number(u[1]))}let l=1;for(;a.has(l);)l+=1;return`${s} ${l}`},wt=t=>[...t].sort((e,r)=>e.order!==r.order?e.order-r.order:e.createdAt-r.createdAt),te=t=>wt(t).map((e,r)=>({...e,order:r})),xt=t=>{if(!t||typeof t!="object")return!1;const e=t;return typeof e.id=="string"&&typeof e.name=="string"&&"payload"in e&&typeof e.namespace=="string"&&typeof e.order=="number"&&typeof e.createdAt=="number"&&typeof e.updatedAt=="number"},re=t=>Array.isArray(t)?t.filter(xt).map(e=>H(e)):[],kt=t=>Array.isArray(t)?t.map(e=>{if(!e||typeof e!="object")return null;const r=e;if(typeof r.savedAt!="number")return null;const i=re(r.favorites);return i.length===0?null:{savedAt:r.savedAt,favorites:i}}).filter(e=>!!e).sort((e,r)=>r.savedAt-e.savedAt):[],xe=()=>{try{if(typeof window<"u"&&window.localStorage)return window.localStorage}catch{}return null},ke=t=>{const e=xe();if(!e)return[];try{const r=e.getItem(t);if(!r)return[];const i=JSON.parse(r);return re(i?.favorites)}catch{return[]}},vt=()=>{const t=ke(X);return t.length>0?t:ke(ee)},bt=t=>{const e=xe();if(e)try{if(t.length===0){e.removeItem(X),e.removeItem(ee);return}e.setItem(X,JSON.stringify({savedAt:Date.now(),favorites:t})),e.removeItem(ee)}catch{}},ie=async()=>{const t=await x.storage.local.get([ye,me]);return{primary:re(t.favorites),backups:kt(t.favoritesBackups),mirrored:vt()}},ve=t=>t.primary.length>0?t.primary:t.backups.length>0?t.backups[0].favorites:t.mirrored.length>0?t.mirrored:[],be=async t=>{const e=te(t),r=await ie(),i=e.length>0?[{savedAt:Date.now(),favorites:e},...r.backups.filter(n=>JSON.stringify(n.favorites)!==JSON.stringify(e))].slice(0,gt):r.backups;await x.storage.local.set({[ye]:e,[me]:i}),bt(e)};async function R(){const t=await ie(),e=ve(t),r=te(e);return t.primary.length===0&&r.length>0&&await be(r),r}async function ne(t,e){const r=t.map((i,n)=>({...i,order:n}));if(r.length===0&&!e?.allowEmpty){const i=await ie(),n=ve(i);return te(n)}return await be(r),r}async function Ce(){const t=await x.storage.local.get(we);return t.lastCapture?H(t.lastCapture):null}async function Ct(t){await x.storage.local.set({[we]:H(t)})}async function St(t,e,r){const i=await R(),n=Date.now(),s=mt(t,i),o=A(r?.defaultDisplayName??""),a=A(r?.defaultDisplayContent??""),l=(r?.displayName??o)||t||s,c=A(l),d=A(r?.displayContent??a),u=c.length>0&&o.length>0?c.toLowerCase()!==o.toLowerCase():c.length>0,p=d.length>0&&a.length>0?d.toLowerCase()!==a.toLowerCase():d.length>0,g={id:crypto.randomUUID(),name:s,displayName:c,displayNameCustom:u,displayContent:d,displayContentCustom:p,payload:ge(e.valueJson),namespace:e.namespace,requestTemplate:e.requestTemplate?H(e.requestTemplate):void 0,order:i.length,createdAt:n,updatedAt:n};return i.unshift(g),await ne(i),g}async function Et(t){const e=await R(),r=e.filter(i=>i.id!==t);return r.length===e.length?e:ne(r,{allowEmpty:!0})}async function Tt(t,e){const r=await R(),i=r.findIndex(c=>c.id===t);if(i===-1)return r;const n=e==="up"?i-1:i+1;if(n<0||n>=r.length)return r;const s=[...r],o=s[i],a=s[n];if(!o||!a)return r;s[i]=a,s[n]=o;const l=Date.now();return s[i]={...a,updatedAt:l},s[n]={...o,updatedAt:l},ne(s)}const O="sigtastic-content";function It(t){if(typeof t!="object"||t===null)return!1;const e=t;return e.source==="sigtastic-hook"&&e.type==="clipboard-write-result"&&typeof e.requestId=="string"&&typeof e.ok=="boolean"}function At(t,e){const r=crypto.randomUUID(),i=e?.sanitize??!0;return{source:O,type:"clipboard-write-request",requestId:r,payload:{valueJson:i?ft(t.payload):t.payload,namespace:t.namespace,requestTemplate:t.requestTemplate}}}const Lt=["default","mac","windows","linux","cros"],w=t=>({default:t,mac:t,windows:t,linux:t,cros:t}),se=[{id:"toggle-overlay",title:"Open Component Panel",description:"Show or hide the saved component overlay in Signavio.",context:"global",defaultBinding:w("Alt+Shift+D"),allowBareKey:!1},{id:"save-favorite",title:"Save Latest Copy",description:"Save the latest copied Signavio snippet as a favorite.",context:"global",defaultBinding:w("Alt+Shift+S"),allowBareKey:!1},{id:"toggle-quick-menu",title:"Open Quick Type Menu",description:"Open the task type quick menu for the current Signavio selection.",context:"global",defaultBinding:w("Alt+Shift+E"),allowBareKey:!1},{id:"overlay-navigate-left",title:"Move Selection Left",description:"Move the selection left in the component overlay.",context:"overlay",defaultBinding:w("ArrowLeft"),allowBareKey:!0,bareKeyWhitelist:["ArrowLeft"]},{id:"overlay-navigate-right",title:"Move Selection Right",description:"Move the selection right in the component overlay.",context:"overlay",defaultBinding:w("ArrowRight"),allowBareKey:!0,bareKeyWhitelist:["ArrowRight"]},{id:"overlay-navigate-up",title:"Move Selection Up",description:"Move the selection up in the component overlay.",context:"overlay",defaultBinding:w("ArrowUp"),allowBareKey:!0,bareKeyWhitelist:["ArrowUp"]},{id:"overlay-navigate-down",title:"Move Selection Down",description:"Move the selection down in the component overlay.",context:"overlay",defaultBinding:w("ArrowDown"),allowBareKey:!0,bareKeyWhitelist:["ArrowDown"]},{id:"overlay-insert-selected",title:"Insert Selected Favorite",description:"Insert the highlighted favorite from the component overlay.",context:"overlay",defaultBinding:w("Enter"),allowBareKey:!0,bareKeyWhitelist:["Enter"]},{id:"overlay-delete-selected",title:"Delete Selected Favorite",description:"Delete the highlighted favorite from the component overlay.",context:"overlay",defaultBinding:w("Alt+Delete"),allowBareKey:!1},{id:"overlay-move-up",title:"Move Favorite Up",description:"Move the highlighted favorite earlier in the overlay list.",context:"overlay",defaultBinding:w("Alt+ArrowUp"),allowBareKey:!1},{id:"overlay-move-down",title:"Move Favorite Down",description:"Move the highlighted favorite later in the overlay list.",context:"overlay",defaultBinding:w("Alt+ArrowDown"),allowBareKey:!1}],Mt=new Map(se.map(t=>[t.id,t])),F={Command:{default:"Command",mac:"Command",windows:"Command",linux:"Command",cros:"Command"},Ctrl:{default:"Ctrl",mac:"Control",windows:"Ctrl",linux:"Ctrl",cros:"Ctrl"},Alt:{default:"Alt",mac:"Option",windows:"Alt",linux:"Alt",cros:"Alt"},Shift:{default:"Shift",mac:"Shift",windows:"Shift",linux:"Shift",cros:"Shift"}},Bt={alt:"Alt",option:"Alt",opt:"Alt",ctrl:"Ctrl",control:"Ctrl",ctl:"Ctrl",command:"Command",cmd:"Command",meta:"Command",super:"Command",macctrl:"Ctrl",shift:"Shift"},qt={arrowup:"ArrowUp",up:"ArrowUp",arrowdown:"ArrowDown",down:"ArrowDown",arrowleft:"ArrowLeft",left:"ArrowLeft",arrowright:"ArrowRight",right:"ArrowRight",enter:"Enter",return:"Enter",space:"Space",spacebar:"Space",tab:"Tab",delete:"Delete",del:"Delete",backspace:"Delete",esc:"Escape",escape:"Escape",pageup:"PageUp",pagedown:"PageDown",home:"Home",end:"End",insert:"Insert",ins:"Insert",comma:"Comma",",":"Comma",period:"Period",".":"Period",slash:"Slash","/":"Slash",semicolon:"Semicolon",";":"Semicolon",quote:"Quote","'":"Quote",backquote:"Backquote","`":"Backquote",minus:"Minus","-":"Minus",equal:"Equal","=":"Equal",bracketleft:"BracketLeft","[":"BracketLeft",bracketright:"BracketRight","]":"BracketRight",backslash:"Backslash","\\":"Backslash"},Nt={ArrowUp:"Up",ArrowDown:"Down",ArrowLeft:"Left",ArrowRight:"Right",PageUp:"Page Up",PageDown:"Page Down",Delete:"Delete",Space:"Space",Quote:"'",Backquote:"`",Minus:"-",Equal:"=",Comma:",",Period:".",Slash:"/",Semicolon:";",BracketLeft:"[",BracketRight:"]",Backslash:"\\"},Ft=new Set(["Alt","AltGraph","Control","Meta","Shift"]),Dt="Escape";function Rt(t,e){return t==="Alt"?F.Alt[e]:t==="Ctrl"?F.Ctrl[e]:F.Command[e]}function Se(t){const e=Mt.get(t);if(!e)throw new Error(`Unknown shortcut definition: ${t}`);return e}function Ee(){return se.reduce((t,e)=>(t[e.id]={...e.defaultBinding},t),{})}function oe(t){const e=t.trim();if(!e)return null;if(/^[A-Za-z]$/.test(e))return e.toUpperCase();if(/^[0-9]$/.test(e))return e;if(/^F([1-9]|1[0-9]|2[0-4])$/i.test(e))return e.toUpperCase();const r=e.replace(/\s+/g,"").toLowerCase();return qt[r]??null}function Te(t){const e=[];return t.command&&e.push("Command"),t.ctrl&&e.push("Ctrl"),t.alt&&e.push("Alt"),t.shift&&e.push("Shift"),e.push(t.key),e.join("+")}function U(t,e){const r=t.trim();if(!r)return{ok:!1,reason:"Enter a shortcut first."};const i=r.split("+").map(o=>o.trim()).filter(Boolean);if(i.length===0)return{ok:!1,reason:"Enter a shortcut first."};const n={alt:!1,ctrl:!1,command:!1,shift:!1,key:""};for(const o of i){const a=o.replace(/\s+/g,"").toLowerCase(),l=Bt[a];if(l){l==="Alt"&&(n.alt=!0),l==="Ctrl"&&(n.ctrl=!0),l==="Command"&&(n.command=!0),l==="Shift"&&(n.shift=!0);continue}const c=oe(o);if(!c)return{ok:!1,reason:`"${o}" is not a supported shortcut key.`};if(n.key)return{ok:!1,reason:"Use only one non-modifier key per shortcut."};n.key=c}if(!n.key)return{ok:!1,reason:"Add a non-modifier key to finish the shortcut."};const s=n.alt||n.ctrl||n.command;return!e.definition.allowBareKey&&!s?{ok:!1,reason:"Add Alt/Option, Ctrl, or Command so the shortcut does not trigger accidentally."}:e.definition.allowBareKey&&!s&&e.definition.bareKeyWhitelist&&!e.definition.bareKeyWhitelist.includes(n.key)?{ok:!1,reason:`Only ${e.definition.bareKeyWhitelist.join(" or ")} can be used without modifiers here.`}:n.key===Dt?{ok:!1,reason:"Escape is reserved for closing and confirming shortcut capture."}:e.platform!=="mac"&&n.command?{ok:!1,reason:"Command shortcuts only work on macOS."}:e.platform!=="mac"&&n.alt&&n.ctrl?{ok:!1,reason:"Alt+Ctrl is blocked because many Windows and Linux keyboards use it for AltGr."}:{ok:!0,shortcut:Te(n),descriptor:n}}function Ot(t,e,r){if(r==="alt")return"Alt";if(r==="ctrl")return"Ctrl";if(r==="command")return e==="mac"?"Command":"Ctrl";const i=U(t,{definition:{id:"toggle-quick-menu",title:"",description:"",context:"global",defaultBinding:w("Alt+Shift+E"),allowBareKey:!0},platform:e});if(i.ok){if(i.descriptor.alt)return"Alt";if(i.descriptor.ctrl)return"Ctrl";if(i.descriptor.command)return"Command"}return e==="mac"?"Command":"Ctrl"}function Pt(t,e,r,i){if(!(t.key===String(r)||t.code===`Digit${r}`||t.code===`Numpad${r}`))return!1;const s=i==="mac"?t.metaKey:!1,o=t.ctrlKey,a=t.altKey;return e==="Alt"?a&&!o&&!s:e==="Ctrl"?o&&!a&&!s:s&&!a&&!o}function $t(t){if(Ft.has(t.key))return null;if(t.key===" ")return"Space";if(t.key.length===1&&/^[A-Za-z]$/.test(t.key))return t.key.toUpperCase();if(t.key.length===1&&/^[0-9]$/.test(t.key))return t.key;const e=oe(t.key);return e||(/^Key[A-Z]$/.test(t.code)?t.code.slice(3):/^Digit[0-9]$/.test(t.code)?t.code.slice(5):oe(t.code)??null)}function Kt(t,e){if(t.repeat)return null;const r=$t(t);if(!r)return null;const i={alt:t.altKey,ctrl:t.ctrlKey,command:e.platform==="mac"?t.metaKey:!1,shift:t.shiftKey,key:r};return U(Te(i),e)}function zt(t,e){const r=U(t,{definition:{id:"toggle-overlay",title:"",description:"",context:"global",defaultBinding:w("Alt+Shift+D"),allowBareKey:!0},platform:e});if(!r.ok)return t;const i=[],n=r.descriptor;return n.command&&i.push(F.Command[e]),n.ctrl&&i.push(F.Ctrl[e]),n.alt&&i.push(F.Alt[e]),n.shift&&i.push(F.Shift[e]),i.push(Nt[n.key]??n.key),i.join(" + ")}function E(t,e){return t[e]||t.default}function Wt(t,e){const r=t.defaultBinding,i={};for(const n of Lt){const s=n==="default"?r.default:typeof e?.[n]=="string"&&e?.[n]?.trim()?String(e?.[n]).trim():i.default??r[n]??r.default,o=U(s,{definition:t,platform:n});i[n]=o.ok?o.shortcut:r[n]}return i}function Ht(t){const r={...Ee()};for(const i of se)r[i.id]=Wt(i,t?.[i.id]);return r}function Ie(t,e,r,i){const n=Kt(t,{definition:e,platform:i});return!!(n?.ok&&n.shortcut===r)}function Ut(t){return t==="mac"?"mac":t==="win"?"windows":t==="linux"?"linux":t==="cros"?"cros":"default"}const _t=172;class Vt{host;root;wrapper;searchInput;listWrap;grid;emptyState;hintText;actions;preferences;favorites=[];filtered=[];selectedId=null;opened=!1;query="";mode="search";cardById=new Map;typeLabelFitFrame=null;selectedScrollFrame=null;constructor(e,r){this.actions=e,this.preferences=r,this.host=document.createElement("div"),this.host.id="sigtastic-overlay-host",this.root=this.host.attachShadow({mode:"open"});const i=document.createElement("style");i.textContent=this.getStyles(),this.wrapper=document.createElement("div"),this.wrapper.className="sigtastic-wrapper",this.wrapper.tabIndex=-1;const n=document.createElement("div");n.className="sigtastic-scrim",n.addEventListener("click",()=>this.close());const s=document.createElement("section");s.className="sigtastic-panel",s.addEventListener("click",p=>{p.stopPropagation()});const o=document.createElement("div");o.className="sigtastic-top-row";const a=document.createElement("div");a.className="sigtastic-search-shell";const l=document.createElement("span");l.className="sigtastic-search-icon",l.setAttribute("aria-hidden","true"),l.innerHTML='<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.8" stroke="currentColor" stroke-width="1.8"/><path d="M16.1 16.1L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',this.searchInput=document.createElement("input"),this.searchInput.className="sigtastic-search",this.searchInput.type="text",this.searchInput.placeholder="Search Components",this.searchInput.setAttribute("aria-label","Search components"),this.searchInput.addEventListener("focus",()=>{this.mode="search"}),this.searchInput.addEventListener("pointerdown",()=>{this.mode="search"}),this.searchInput.addEventListener("input",()=>{this.mode="search",this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid()}),a.append(l,this.searchInput),o.append(a);const c=document.createElement("div");c.className="sigtastic-divider";const d=document.createElement("div");d.className="sigtastic-list-wrap",this.listWrap=d,this.grid=document.createElement("div"),this.grid.className="sigtastic-grid",this.emptyState=document.createElement("div"),this.emptyState.className="sigtastic-empty",d.append(this.grid,this.emptyState);const u=document.createElement("div");u.className="sigtastic-footer-divider",this.hintText=document.createElement("div"),this.hintText.className="sigtastic-hints",this.renderHints(),s.append(o,c,d,u,this.hintText),this.wrapper.append(n,s),this.root.append(i,this.wrapper),this.applyPreferences(),window.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("resize",this.onResize,{passive:!0}),document.documentElement.appendChild(this.host),this.renderGrid()}isOpen(){return this.opened}open(e){this.opened=!0,this.wrapper.classList.add("open"),this.query="",this.mode="search",this.searchInput.value="",this.setFavorites(e),this.searchInput.focus()}close(){this.opened&&(this.opened=!1,this.wrapper.classList.remove("open"),this.actions.onClose())}toggle(e){if(this.opened){this.close();return}this.open(e)}refreshFavorites(e){this.setFavorites(e),this.scheduleSelectedVisibilityScroll()}setPreferences(e){this.preferences=e,this.applyPreferences(),this.renderHints(),this.renderGrid()}setFavorites(e){this.favorites=[...e].sort((r,i)=>r.order-i.order),!this.selectedId&&this.favorites.length>0&&(this.selectedId=this.favorites[0]?.id??null),this.applyFilter(),this.renderGrid()}applyFilter(){if(this.query?this.filtered=this.favorites.filter(e=>{const r=N(e.payload),i=this.getVisualDisplayName(e,r),n=this.getVisualDisplayContent(e,r);return`${e.name} ${i} ${n} ${r.typeName} ${r.contentText}`.toLowerCase().includes(this.query)}):this.filtered=[...this.favorites],this.filtered.length===0){this.selectedId=null;return}(!this.selectedId||!this.filtered.some(e=>e.id===this.selectedId))&&(this.selectedId=this.filtered[0]?.id??null)}getSelectedFavorite(){return this.selectedId?this.filtered.find(e=>e.id===this.selectedId)??null:null}enterSearchMode(e){this.mode="search",this.searchInput.focus(),e&&(this.searchInput.value+=e,this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid())}enterListMode(){this.mode="list",this.searchInput.blur(),this.wrapper.focus()}renderGrid(){this.cardById.clear(),this.grid.innerHTML="";const e=this.filtered;if(this.emptyState.style.display=e.length===0?"block":"none",this.favorites.length===0){this.emptyState.textContent=`No favorites yet. Copy a shape in Signavio and use ${this.preferences.saveFavoriteShortcutLabel} to save one.`,this.hintText.style.opacity="0.75";return}if(e.length===0){this.emptyState.textContent="No favorites match your search.",this.hintText.style.opacity="0.85";return}this.hintText.style.opacity="1";const r=this.getDuplicateSignatureCounts();for(const i of e){const n=document.createElement("button");n.className="sigtastic-card",n.type="button",n.dataset.favoriteId=i.id,n.title=i.name;const s=N(i.payload),o=fe(i.payload),a=ut(i.payload),l=this.getVisualDisplayName(i,s),c=this.getVisualDisplayContent(i,s),d=this.getFavoriteSignature(s,l,c,o),u=(r.get(d)??0)>1;n.addEventListener("click",()=>{this.selectedId=i.id,this.enterListMode(),this.updateSelectedCardClasses()}),n.addEventListener("dblclick",()=>{this.close(),this.actions.onInsert(i)});const p=this.createPreview(i,s,l,o,a,u),g=document.createElement("div");g.className="sigtastic-card-label",g.textContent=c,n.append(p,g),this.grid.appendChild(n),this.cardById.set(i.id,n)}this.updateSelectedCardClasses(),this.scheduleTypeLabelFit()}updateSelectedCardClasses(){for(const[e,r]of this.cardById.entries())r.classList.toggle("selected",e===this.selectedId)}getVisualDisplayName(e,r){const i=e.displayName?.trim()||"";return e.displayNameCustom&&i?i:r.typeName||"Component"}getVisualDisplayContent(e,r){const i=e.displayContent?.trim()||"";return e.displayContentCustom&&i?i:r.hasContent?r.contentText:"Empty"}middleEllipsis(e,r=24){const i=e.trim();if(i.length<=r)return i;if(r<=4)return`${i.slice(0,1)}...`;const n=r-3,s=Math.ceil(n/2),o=Math.floor(n/2);return`${i.slice(0,s)}...${i.slice(i.length-o)}`}scheduleTypeLabelFit(){this.typeLabelFitFrame!==null&&window.cancelAnimationFrame(this.typeLabelFitFrame),this.typeLabelFitFrame=window.requestAnimationFrame(()=>{this.typeLabelFitFrame=null,this.fitTypeLabelsToWidth()})}scheduleSelectedVisibilityScroll(){this.selectedScrollFrame!==null&&window.cancelAnimationFrame(this.selectedScrollFrame),this.selectedScrollFrame=window.requestAnimationFrame(()=>{this.selectedScrollFrame=null,this.scrollSelectedCardToTopIfOutOfView()})}fitTypeLabelsToWidth(){const e=this.grid.querySelectorAll(".sigtastic-type-inline");for(const r of e){const i=r.dataset.fullText?.trim()??"";if(!i){r.textContent="";continue}r.textContent=i;const n=r.clientWidth;if(n<=0||r.scrollWidth<=n)continue;let s=5,o=i.length,a=`${i.slice(0,1)}...`;for(;s<=o;){const l=Math.floor((s+o)/2),c=this.middleEllipsis(i,l);r.textContent=c,r.scrollWidth<=n?(a=c,s=l+1):o=l-1}r.textContent=a}}getFavoriteSignature(e,r,i,n){return[e.typeName.toLowerCase(),r.trim().toLowerCase(),i.trim().toLowerCase(),[...n].sort().join(",")].join("::")}getDuplicateSignatureCounts(){const e=new Map;for(const r of this.favorites){const i=N(r.payload),n=fe(r.payload),s=this.getVisualDisplayName(r,i),o=this.getVisualDisplayContent(r,i),a=this.getFavoriteSignature(i,s,o,n);e.set(a,(e.get(a)??0)+1)}return e}createHintItem(e,r){const i=document.createElement("span");i.className="sigtastic-hint-item";const n=document.createElement("span");n.className="sigtastic-hint-action",n.textContent=e;const s=document.createElement("span");return s.className="sigtastic-hint-key",s.textContent=r,i.append(n,s),i}createHintSeparator(){const e=document.createElement("span");return e.className="sigtastic-hint-separator",e.textContent="|",e}renderHints(){this.hintText.replaceChildren(this.createHintItem("Close","Esc"),this.createHintSeparator(),this.createHintItem("Insert",this.preferences.shortcutLabels["overlay-insert-selected"]),this.createHintSeparator(),this.createHintItem("Remove",this.preferences.shortcutLabels["overlay-delete-selected"]),this.createHintSeparator(),this.createHintItem("Move Up",this.preferences.shortcutLabels["overlay-move-up"]),this.createHintSeparator(),this.createHintItem("Move Down",this.preferences.shortcutLabels["overlay-move-down"]))}applyPreferences(){this.wrapper.dataset.backdropBlur=String(this.preferences.backdropBlurEnabled)}matchesConfiguredShortcut(e,r){return Ie(r,Se(e),this.preferences.shortcuts[e],this.preferences.shortcutPlatform)}createPreview(e,r,i,n,s,o){const a=document.createElement("div");a.className="sigtastic-preview";const l=r.stencilId.toLowerCase(),c=this.getIconKind(l,r),d=dt(e.payload,3).map(m=>m.toLowerCase()),u=d.length>0?d.map(m=>this.getIconKind(m)):[c];if(this.hasRoundedBackground(c)?a.classList.add("rounded-bg"):a.classList.add("shape-only"),a.classList.add(r.hasContent?"has-content":"is-empty"),u.length>1){const m=document.createElement("div");m.className=`sigtastic-preview-stack count-${Math.min(3,u.length)}`,u.slice(0,3).forEach((C,Tr)=>{const ue=document.createElement("div");ue.className=`sigtastic-preview-bubble slot-${Tr+1}`,ue.appendChild(this.createIconSvgNode(C,"sigtastic-preview-bubble-svg")),m.appendChild(ue)}),a.appendChild(m)}else a.appendChild(this.createIconSvgNode(c,"sigtastic-preview-svg"));s&&a.appendChild(this.getTypeBadge(s));const g=document.createElement("div");g.className="sigtastic-type-inline",g.dataset.fullText=i,g.textContent=i,g.setAttribute("title",i),a.appendChild(g);const B=[...n];if(o&&B.push("duplicate"),B.length>0){const m=document.createElement("div");m.className="sigtastic-badge-row";for(const C of B)m.appendChild(this.getBadge(C));a.appendChild(m)}return a}createIconSvgNode(e,r){const i=document.createElementNS("http://www.w3.org/2000/svg","svg");return i.setAttribute("viewBox","-4 -4 148 112"),i.classList.add(r),e.startsWith("gateway-")&&(i.style.height="75%"),i.innerHTML=this.getIconSvg(e),i}getBadge(e){const r=document.createElement("span");r.className="sigtastic-badge";const i={content:'<text x="12" y="15.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" font-family="Segoe UI, sans-serif">T</text>',"multi-element":'<line x1="8.5" y1="8.5" x2="15.5" y2="8.5" stroke="currentColor" stroke-width="1.8"/><line x1="8.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><line x1="15.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="12" cy="14.8" r="2.3" fill="currentColor"/>',duplicate:'<rect x="5.5" y="5.5" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',timer:'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" stroke-width="2"/>',message:'<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8 L12 13 L20 8" fill="none" stroke="currentColor" stroke-width="1.8"/>',conditional:'<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.8"/>',link:'<path d="M8 12 C8 9 10 7 13 7 H16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 7 L14 5 M16 7 L14 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 12 C16 15 14 17 11 17 H8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 17 L10 15 M8 17 L10 19" fill="none" stroke="currentColor" stroke-width="2"/>',multiple:'<circle cx="8" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="16" cy="12" r="2.2" fill="currentColor"/>',loop:'<path d="M17 10 A6 6 0 1 0 18 13" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="18,8 21,10 18,12" fill="currentColor"/>',"mi-parallel":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',"mi-sequential":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="9" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="11" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',adhoc:'<path d="M4 14 C6 10 8 18 10 14 C12 10 14 18 16 14 C18 10 20 18 22 14" fill="none" stroke="currentColor" stroke-width="2"/>',"non-interrupting":'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.5 2.5"/>',transaction:'<rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="8" y="8" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>'};return r.setAttribute("title",e),r.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${i[e]}</svg>`,r}getTypeBadge(e){const r=document.createElement("div");r.className="sigtastic-type-badge-center";const i={user:'<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M4.8 20 C4.8 15.4 8 13 12 13 C16 13 19.2 15.4 19.2 20" fill="currentColor"/>',service:'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.1"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/><line x1="12" y1="3.6" x2="12" y2="6.1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17.9" x2="12" y2="20.4" stroke="currentColor" stroke-width="2"/><line x1="3.6" y1="12" x2="6.1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="17.9" y1="12" x2="20.4" y2="12" stroke="currentColor" stroke-width="2"/>',manual:'<path d="M6 19 V11 C6 9.6 7 8.8 8.2 8.8 C9.3 8.8 10.2 9.6 10.2 11.1 V14.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.2 14.2 V8 C10.2 6.9 11 6.1 12.1 6.1 C13.2 6.1 14 6.9 14 8 V14.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 12 C15 11.6 16.1 12.3 16.4 13.4 L17.8 18.4" fill="none" stroke="currentColor" stroke-width="2"/>',script:'<path d="M6 4.6 H13.8 L18 8.8 V19.4 H6 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" stroke-width="1.9"/><line x1="8.5" y1="15.5" x2="14.2" y2="15.5" stroke="currentColor" stroke-width="1.9"/>',send:'<rect x="3.8" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 8.1 L10.4 12.5 L17 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="16.8" y1="11.7" x2="22" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="22,11.7 18.9,9.5 18.9,13.9" fill="currentColor"/>',receive:'<rect x="7" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8.1 L13.6 12.5 L20.2 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="2" y1="11.7" x2="7.2" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="2,11.7 5.1,9.5 5.1,13.9" fill="currentColor"/>',"business-rule":'<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/><line x1="9.2" y1="5" x2="9.2" y2="19" stroke="currentColor" stroke-width="2"/>',"call-activity":'<rect x="4" y="6" width="16" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="7" y="9" width="10" height="6" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/>',automatic:'<polygon points="8,4 5,12.5 10,12.5 8.2,20 18.4,9.4 12.8,9.4 14.4,4" fill="currentColor"/>'};return r.setAttribute("title",e),r.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${i[e]}</svg>`,r}getIconKind(e,r){const i=Object.values(r?.properties??{}).filter(o=>typeof o=="string").join(" ").toLowerCase(),n=`${e} ${i}`,s=this.getEventFlavor(n);return e.includes("usertask")?"task-user":e.includes("servicetask")||e.includes("service")?"task-service":e.includes("manualtask")||e.includes("manual")?"task-manual":e.includes("scripttask")||e.includes("script")?"task-script":e.includes("sendtask")?"task-send":e.includes("receivetask")?"task-receive":e.includes("businessruletask")||e.includes("decision")?"task-business-rule":e.includes("automatic")?"task-automatic":e.includes("transaction")?"transaction":e.includes("callactivity")?"call-activity":e.includes("subprocess")?"subprocess":e.includes("parallelgateway")?"gateway-parallel":e.includes("inclusivegateway")?"gateway-inclusive":e.includes("eventbasedgateway")?"gateway-event":e.includes("complexgateway")?"gateway-complex":e.includes("gateway")?"gateway-exclusive":e.includes("boundaryevent")?s?`event-boundary-${s}`:"event-boundary":e.includes("startevent")?s?`event-start-${s}`:"event-start":e.includes("endevent")?s?`event-end-${s}`:"event-end":e.includes("event")?s?`event-intermediate-${s}`:"event-intermediate":e.includes("messageflow")?"message-flow":e.includes("sequenceflow")?"sequence-flow":e.includes("association")?"association":e.includes("dataobject")?"data-object":e.includes("datastore")?"data-store":e.includes("group")?"group":e.includes("conversation")?"conversation":e.includes("choreography")?"choreography-task":e.includes("pool")||e.includes("lane")||e.includes("participant")?"pool-lane":e.includes("annotation")?"annotation":e.includes("message")?"message":e.includes("task")||e.includes("activity")||e.includes("callactivity")?"task":"generic"}getEventFlavor(e){return e.includes("timer")?"timer":e.includes("message")?"message":e.includes("signal")?"signal":e.includes("conditional")?"conditional":e.includes("linkevent")||e.includes(" link ")?"link":e.includes("multiple")?"multiple":e.includes("error")?"error":e.includes("compensation")?"compensation":e.includes("escalation")?"escalation":e.includes("terminate")?"terminate":""}hasRoundedBackground(e){return!1}getIconSvg(e){const r='<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';if(e.startsWith("event-start-"))return this.getEventSvg("start",e.replace("event-start-",""));if(e.startsWith("event-intermediate-"))return this.getEventSvg("intermediate",e.replace("event-intermediate-",""));if(e.startsWith("event-end-"))return this.getEventSvg("end",e.replace("event-end-",""));if(e.startsWith("event-boundary-"))return this.getEventSvg("boundary",e.replace("event-boundary-",""));switch(e){case"task":return r;case"task-user":return this.getTaskWithGlyph('<circle cx="70" cy="45" r="9" fill="#5f5f5f"/><path d="M52 67 C52 57 60 52 70 52 C80 52 88 57 88 67" fill="#5f5f5f"/>');case"task-service":return this.getTaskWithGlyph('<circle cx="70" cy="52" r="13" fill="none" stroke="#5f5f5f" stroke-width="2.6"/><circle cx="70" cy="52" r="4" fill="#5f5f5f"/><line x1="70" y1="36" x2="70" y2="40" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="64" x2="70" y2="68" stroke="#5f5f5f" stroke-width="2.2"/><line x1="54" y1="52" x2="58" y2="52" stroke="#5f5f5f" stroke-width="2.2"/><line x1="82" y1="52" x2="86" y2="52" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-manual":return this.getTaskWithGlyph('<path d="M58 66 V50 C58 48 59.2 46.8 61 46.8 C62.8 46.8 64 48 64 50 V56" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M64 56 V45 C64 42.8 65.4 41.4 67.4 41.4 C69.3 41.4 70.8 42.8 70.8 45 V56.5" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M70.8 54.8 C72.5 53.8 74.8 54.4 75.8 56.2 L79.2 62" fill="none" stroke="#5f5f5f" stroke-width="2.4"/>');case"task-script":return this.getTaskWithGlyph('<path d="M59 37 H77 L84 44 V67 H59 Z" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><line x1="63" y1="50" x2="80" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><line x1="63" y1="57" x2="78" y2="57" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-send":return this.getTaskWithGlyph('<rect x="56" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M56 44 L67 51 L78 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="78" y1="50" x2="88" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="88,50 82,46.2 82,53.8" fill="#5f5f5f"/>');case"task-receive":return this.getTaskWithGlyph('<rect x="62" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M62 44 L73 51 L84 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="52" y1="50" x2="62" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="52,50 58,46.2 58,53.8" fill="#5f5f5f"/>');case"task-business-rule":return this.getTaskWithGlyph('<rect x="56" y="39" width="28" height="22" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="56" y1="48" x2="84" y2="48" stroke="#5f5f5f" stroke-width="2.2"/><line x1="65" y1="39" x2="65" y2="61" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-automatic":return this.getTaskWithGlyph('<polygon points="66,36 60,52 68,52 65,67 82,46 74,46 77,36" fill="#5f5f5f"/>');case"subprocess":return'<rect x="20" y="18" width="100" height="68" rx="15" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="64" y1="74" x2="76" y2="74" stroke="#666" stroke-width="2.4"/><line x1="70" y1="68" x2="70" y2="80" stroke="#666" stroke-width="2.4"/>';case"call-activity":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#505050" stroke-width="4"/><rect x="22" y="24" width="96" height="56" rx="12" fill="none" stroke="#646464" stroke-width="2"/>';case"transaction":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="24" y="26" width="92" height="52" rx="10" fill="none" stroke="#666" stroke-width="2.2"/>';case"gateway-exclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="55" y1="38" x2="85" y2="66" stroke="#636363" stroke-width="3"/><line x1="85" y1="38" x2="55" y2="66" stroke="#636363" stroke-width="3"/>';case"gateway-parallel":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="33" x2="70" y2="71" stroke="#636363" stroke-width="3.2"/><line x1="51" y1="52" x2="89" y2="52" stroke="#636363" stroke-width="3.2"/>';case"gateway-inclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="17" fill="none" stroke="#666" stroke-width="3"/>';case"gateway-event":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="14" fill="none" stroke="#666" stroke-width="2.6"/><polygon points="70,38 76,50 70,64 64,50" fill="#666"/>';case"gateway-complex":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="32" x2="70" y2="72" stroke="#666" stroke-width="2.6"/><line x1="50" y1="52" x2="90" y2="52" stroke="#666" stroke-width="2.6"/><line x1="55" y1="37" x2="85" y2="67" stroke="#666" stroke-width="2.4"/><line x1="85" y1="37" x2="55" y2="67" stroke="#666" stroke-width="2.4"/>';case"event-start":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"event-end":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#4d4d4d" stroke-width="5"/>';case"event-intermediate":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>';case"event-boundary":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/><circle cx="70" cy="52" r="6" fill="#737373"/>';case"sequence-flow":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/><polygon points="120,52 102,42 102,62" fill="#5a5a5a"/>';case"message-flow":return'<line x1="16" y1="52" x2="120" y2="52" stroke="#6a6a6a" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/><polygon points="120,52 103,42 103,62" fill="#6a6a6a"/><rect x="52" y="35" width="34" height="24" rx="2" fill="#f6f4d4" stroke="#666" stroke-width="2"/>';case"association":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#737373" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>';case"data-object":return'<path d="M32 18 H90 L108 36 V86 H32 Z" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M90 18 V36 H108" fill="none" stroke="#575757" stroke-width="3"/>';case"data-store":return'<ellipse cx="70" cy="28" rx="34" ry="11" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M36 28 V76 C36 83 51 88 70 88 C89 88 104 83 104 76 V28" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><ellipse cx="70" cy="28" rx="23" ry="7" fill="none" stroke="#666" stroke-width="1.8"/><path d="M40 48 C40 54 54 58 70 58 C86 58 100 54 100 48" fill="none" stroke="#666" stroke-width="1.8"/>';case"pool-lane":return'<rect x="16" y="16" width="108" height="72" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="42" y1="16" x2="42" y2="88" stroke="#666" stroke-width="2.6"/><line x1="42" y1="52" x2="124" y2="52" stroke="#666" stroke-width="2.2"/>';case"annotation":return'<path d="M34 20 H94 L108 34 V84 H34 Z" fill="#f6f4d4" stroke="#666" stroke-width="3"/><path d="M94 20 V34 H108" fill="none" stroke="#666" stroke-width="3"/><line x1="42" y1="44" x2="97" y2="44" stroke="#777" stroke-width="2"/><line x1="42" y1="56" x2="97" y2="56" stroke="#777" stroke-width="2"/><line x1="42" y1="68" x2="85" y2="68" stroke="#777" stroke-width="2"/>';case"group":return'<rect x="18" y="18" width="104" height="68" rx="10" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="7 6"/>';case"conversation":return'<polygon points="70,14 116,38 116,66 70,90 24,66 24,38" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"choreography-task":return'<rect x="16" y="18" width="108" height="68" rx="10" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="16" y="18" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/><rect x="16" y="72" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/>';case"message":return'<rect x="24" y="24" width="92" height="56" rx="8" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M24 28 L70 58 L116 28" fill="none" stroke="#666" stroke-width="2.8"/>';default:return r}}getTaskWithGlyph(e){return`<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>${e}`}getEventSvg(e,r){let n=`<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="${e==="end"?"5":"3"}"/>`;return(e==="intermediate"||e==="boundary")&&(n+='<circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>'),e==="boundary"&&(n+='<circle cx="70" cy="52" r="31" fill="none" stroke="#575757" stroke-width="2" stroke-dasharray="3.5 2.8"/>'),`${n}${this.getEventFlavorSymbol(r)}`}getEventFlavorSymbol(e){switch(e){case"timer":return'<circle cx="70" cy="52" r="12" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="76" y2="55" stroke="#5f5f5f" stroke-width="2.2"/>';case"message":return'<rect x="58" y="43" width="24" height="18" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M58 45 L70 53 L82 45" fill="none" stroke="#5f5f5f" stroke-width="1.9"/>';case"signal":return'<path d="M57 57 C60 51 64 49 70 49 C76 49 80 51 83 57" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M60 61 C63 57 66 55.5 70 55.5 C74 55.5 77 57 80 61" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><circle cx="70" cy="64" r="2.3" fill="#5f5f5f"/>';case"conditional":return'<rect x="58" y="41" width="24" height="22" rx="2.5" fill="none" stroke="#5f5f5f" stroke-width="2.1"/><line x1="62" y1="48" x2="78" y2="48" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="54" x2="78" y2="54" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="60" x2="74" y2="60" stroke="#5f5f5f" stroke-width="2"/>';case"link":return'<path d="M62 52 C62 49 64 47 67 47 H72" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M72 47 L69.5 44.6 M72 47 L69.5 49.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M78 52 C78 55 76 57 73 57 H68" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M68 57 L70.5 54.6 M68 57 L70.5 59.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/>';case"multiple":return'<circle cx="64" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="70" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="76" cy="52" r="2.6" fill="#5f5f5f"/>';case"error":return'<line x1="62" y1="44" x2="78" y2="60" stroke="#5f5f5f" stroke-width="2.5"/><line x1="78" y1="44" x2="62" y2="60" stroke="#5f5f5f" stroke-width="2.5"/>';case"compensation":return'<polygon points="70,52 78,47 78,57" fill="#5f5f5f"/><polygon points="62,52 70,47 70,57" fill="#5f5f5f"/>';case"escalation":return'<line x1="70" y1="60" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="70,42 77,49 63,49" fill="#5f5f5f"/>';case"terminate":return'<rect x="63" y="45" width="14" height="14" fill="#5f5f5f"/>';default:return""}}moveSelectionByKey(e){const r=this.filtered.findIndex(s=>s.id===this.selectedId);if(r<0)return;const i=this.getColumnCount();let n=r;e==="ArrowLeft"?n=r-1:e==="ArrowRight"?n=r+1:e==="ArrowUp"?n=r-i:e==="ArrowDown"&&(n=r+i),n=Math.max(0,Math.min(this.filtered.length-1,n)),this.selectedId=this.filtered[n]?.id??this.selectedId,this.updateSelectedCardClasses(),this.scrollSelectedCardToTopIfOutOfView()}scrollSelectedCardToTopIfOutOfView(){if(!this.selectedId)return;const e=this.cardById.get(this.selectedId);if(!e)return;const r=this.listWrap.getBoundingClientRect(),i=e.getBoundingClientRect(),n=10;if(!(i.top<r.top+n||i.bottom>r.bottom))return;const o=i.top-r.top,a=this.listWrap.scrollTop+o-n;this.listWrap.scrollTo({top:Math.max(0,a),behavior:"smooth"})}moveSelectionToLeftNeighborOnDelete(){const e=this.filtered.findIndex(r=>r.id===this.selectedId);if(!(e<0)){if(e>0){this.selectedId=this.filtered[e-1]?.id??null;return}this.selectedId=this.filtered[1]?.id??null}}onKeyDown=e=>{if(!this.opened)return;if(e.stopPropagation(),e.key==="Escape"){e.preventDefault(),this.close();return}const r=this.getSelectedFavorite(),i=this.matchesConfiguredShortcut("overlay-delete-selected",e),n=this.matchesConfiguredShortcut("overlay-insert-selected",e),s=this.matchesConfiguredShortcut("overlay-navigate-left",e),o=this.matchesConfiguredShortcut("overlay-navigate-right",e),a=this.matchesConfiguredShortcut("overlay-navigate-up",e),l=this.matchesConfiguredShortcut("overlay-navigate-down",e),c=this.matchesConfiguredShortcut("overlay-move-up",e),d=this.matchesConfiguredShortcut("overlay-move-down",e);if(i){e.preventDefault(),r&&(this.enterListMode(),this.moveSelectionToLeftNeighborOnDelete(),this.actions.onDelete(r));return}const u=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key),p=s?"ArrowLeft":o?"ArrowRight":a?"ArrowUp":l?"ArrowDown":null,g=e.key.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey;if(this.mode==="search"){if(e.key==="Delete"||e.key==="Backspace")return;if(p||n||u){if(e.preventDefault(),this.enterListMode(),p||u){this.moveSelectionByKey(p??e.key);return}r&&(this.close(),this.actions.onInsert(r));return}return}if(g){e.preventDefault(),this.enterSearchMode(e.key);return}if(r){if(n){e.preventDefault(),this.close(),this.actions.onInsert(r);return}if(c||d){e.preventDefault();const B=c?"up":"down";this.actions.onMove(r,B);return}if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();return}!u&&!p||(e.preventDefault(),this.moveSelectionByKey(p??e.key))}};onResize=()=>{this.opened&&this.scheduleTypeLabelFit()};getColumnCount(){const e=this.grid.clientWidth;return e<=0?4:Math.max(1,Math.floor(e/_t))}getStyles(){return`
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .sigtastic-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483600;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .sigtastic-wrapper.open {
        display: flex;
      }

      .sigtastic-scrim {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 14, 0.2);
        backdrop-filter: blur(3px);
      }

      .sigtastic-wrapper[data-backdrop-blur="false"] .sigtastic-scrim {
        background: rgba(10, 12, 14, 0.3);
        backdrop-filter: none;
      }

      .sigtastic-panel {
        position: relative;
        width: min(900px, 95vw);
        min-height: min(520px, 74vh);
        max-height: 80vh;
        padding: 20px;
        border-radius: 30px;
        background: rgba(26, 28, 33, 0.78);
        backdrop-filter: blur(8px) saturate(110%);
        box-shadow: 0 22px 54px rgba(0, 0, 0, 0.62);
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto auto;
        gap: 12px;
        border: 1px solid rgba(255, 255, 255, 0.24);
        overflow: hidden;
      }

      .sigtastic-wrapper[data-backdrop-blur="false"] .sigtastic-panel {
        background: rgba(26, 28, 33, 0.84);
      }

      .sigtastic-top-row {
        display: flex;
        align-items: center;
      }

      .sigtastic-search-shell {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 11px;
      }

      .sigtastic-search-icon {
        width: 18px;
        height: 18px;
        color: rgba(236, 236, 236, 0.88);
        display: inline-flex;
        flex: 0 0 auto;
      }

      .sigtastic-search-icon svg {
        width: 100%;
        height: 100%;
      }

      .sigtastic-search {
        width: 100%;
        border: none;
        outline: none;
        background: transparent;
        color: #ececec;
        font-size: 17px;
        font-weight: 500;
        line-height: 1.1;
        letter-spacing: 0.01em;
      }

      .sigtastic-search::placeholder {
        color: rgba(236, 236, 236, 0.88);
      }

      .sigtastic-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .sigtastic-list-wrap {
        overflow-x: hidden;
        overflow-y: auto;
        min-height: 0;
        padding: 10px 2px;
        margin: -12px 0;
      }

      .sigtastic-list-wrap::-webkit-scrollbar {
        width: 8px;
      }

      .sigtastic-list-wrap::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 999px;
      }

      .sigtastic-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 14px;
        align-content: start;
        width: 100%;
        padding: 2px;
      }

      .sigtastic-card {
        border: 1px solid transparent;
        display: grid;
        justify-items: center;
        align-items: start;
        grid-template-rows: auto 1fr;
        height: auto;
        border-radius: 22px;
        background: #383a3fb0;
        color: #ececec;
        cursor: pointer;
        transition: transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease;
        outline: none;
        overflow: visible;
      }

      .sigtastic-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 16px -4px rgba(0, 0, 0, 0.4);
      }

      .sigtastic-card.selected {
        background: #474950b0;
        border-color: rgba(236, 236, 236, 0.72);
        box-shadow: 0 0 0 1px rgba(236, 236, 236, 0.18) inset;
      }

      .sigtastic-preview {
        width: 176px;
        height: 108px;
        border-radius: 14px;
        background: #313338;
        border: 1px solid transparent;
        margin-top: 10px;
        margin-bottom: 5px;
        display: grid;
        place-items: center;
        overflow: visible;
        position: relative;
        padding-bottom: 16px;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      }

      .sigtastic-preview.rounded-bg {
        background: rgba(24, 28, 35, 0.84);
        border-color: rgba(228, 228, 228, 0.18);
      }

      .sigtastic-preview.shape-only {
        border: none;
      }

      .sigtastic-preview.has-content {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      }

      .sigtastic-preview.is-empty {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
      }

      .sigtastic-preview-svg {
        width: 80%;
        height: 100%;
        overflow: visible;
        transform: translateY(-8px);
      }

      .sigtastic-preview-stack {
        position: relative;
        width: 100%;
        height: 100%;
        transform: translateY(-5px);
      }

      .sigtastic-preview-bubble {
        position: absolute;
        border-radius: 12px;
        background: #313338;
        border: 1px solid rgba(241, 241, 241, 0.16);
        box-shadow: 0 7px 14px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }

      .sigtastic-preview-bubble-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

.sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-1 {
	width: 69px;
	height: 54px;
	left: calc(50% - 69px);
	top: 33px;
	z-index: 1;
}

      .sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-2 {
        width: 69px;
        height: 54px;
        left: calc(50% + 3px);
        top: 16px;
        z-index: 2;
      }

.sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-1 {
	width: 52px;
	height: 41px;
	left: 23px;
	top: 41px;
	z-index: 1;
}

.sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-2 {
	width: 52px;
	height: 41px;
	left: 96px;
	top: 46px;
	z-index: 2;
}

.sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-3 {
	width: 52px;
	height: 41px;
	left: 50px;
	top: 14px;
	z-index: 3;
}

      .sigtastic-preview.is-empty .sigtastic-preview-svg {
        opacity: 0.94;
      }

      .sigtastic-type-inline {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #f3f3f3;
        line-height: 1.1;
        white-space: nowrap;
        overflow: hidden;
        text-align: center;
        pointer-events: none;
      }

      .sigtastic-type-badge-center {
        position: absolute;
        left: 50%;
        top: 44%;
        transform: translate(-50%, -50%);
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        color: #f4f4f4;
        background: rgba(20, 25, 33, 0.95);
        border: 1px solid rgba(244, 244, 244, 0.46);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.34);
        pointer-events: none;
      }

      .sigtastic-type-badge-center svg {
        width: 25px;
        height: 25px;
      }

      .sigtastic-badge-row {
        position: absolute;
        top: -6px;
        right: -6px;
        display: flex;
        gap: 4px;
      }

      .sigtastic-badge {
        width: 23px;
        height: 23px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: rgba(19, 24, 32, 0.95);
        border: 1px solid rgba(244, 244, 244, 0.46);
        color: #f1f1f1;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.32);
      }

      .sigtastic-badge svg {
        width: 16px;
        height: 16px;
      }

      .sigtastic-card-label {
        padding: 0 10px 8px 10px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(243, 243, 243, 0.88);
        line-height: 1.2;
        text-align: center;
        white-space: normal;
        overflow: hidden;
        max-height: calc(1.2em * 3);
        display: block;
        -webkit-mask-image: linear-gradient( to bottom, rgb(0, 0, 0) 74%, rgba(0, 0, 0, 0) calc(100% - 4px));
        mask-image: linear-gradient( to bottom, rgb(0, 0, 0) 74%, rgba(0, 0, 0, 0) calc(100% - 4px));
        width: 100%;
        align-self: start;
      }

      .sigtastic-empty {
        display: none;
        font-size: 14px;
        color: rgba(243, 243, 243, 0.86);
        padding: 6px 2px;
      }

      .sigtastic-footer-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .sigtastic-hints {
        align-self: end;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 7px;
        color: rgba(243, 243, 243, 0.84);
        padding-top: 1px;
        min-height: 24px;
        margin: -8px 5px -13px 5px;
      }

      .sigtastic-hint-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .sigtastic-hint-action {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .sigtastic-hint-key {
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        padding: 4px 7px;
        border-radius: 7px;
        background: rgba(176, 182, 192, 0.18);
        border: 1px solid rgba(210, 214, 220, 0.22);
        color: #f2f2f2;
      }

      .sigtastic-hint-separator {
        margin: 0 3px;
        font-size: 12px;
        color: rgba(243, 243, 243, 0.44);
      }

      @media (max-width: 1000px) {
        .sigtastic-panel {
          width: min(900px, calc(100vw - 12px));
          min-height: min(500px, calc(100vh - 12px));
          max-height: calc(100vh - 12px);
          border-radius: 24px;
          padding: 14px;
          gap: 9px;
        }

        .sigtastic-search {
          font-size: 15px;
        }

        .sigtastic-grid {
          grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
          gap: 10px;
        }

        .sigtastic-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 18px;
        }

        .sigtastic-preview {
          width: min(100%, 120px);
          height: 86px;
          border-radius: 14px;
          margin-bottom: 6px;
          padding-bottom: 12px;
        }

        .sigtastic-preview-svg {
          transform: translateY(-4px);
        }

        .sigtastic-preview-stack {
          transform: translateY(-3px);
        }

        .sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-1 {
          width: 44px;
          height: 32px;
          left: calc(50% - 45px);
          top: 21px;
        }

        .sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-2 {
          width: 44px;
          height: 32px;
          left: calc(50% + 1px);
          top: 15px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-1 {
          width: 38px;
          height: 28px;
          left: 8px;
          top: 28px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-2 {
          width: 38px;
          height: 28px;
          left: 56px;
          top: 20px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-3 {
          width: 38px;
          height: 28px;
          left: 32px;
          top: 8px;
        }

        .sigtastic-type-badge-center {
          width: 32px;
          height: 32px;
          top: 50%;
        }

        .sigtastic-type-badge-center svg {
          width: 20px;
          height: 20px;
        }

        .sigtastic-type-inline {
          left: 8px;
          right: 8px;
          bottom: 4px;
          font-size: 11px;
        }

        .sigtastic-card-label {
          font-size: 11px;
          padding: 0 8px 8px;
          max-height: calc(1.2em * 3);
        }

        .sigtastic-hints {
          gap: 6px;
          row-gap: 5px;
        }

        .sigtastic-hint-action {
          font-size: 11px;
        }

        .sigtastic-hint-key {
          font-size: 10px;
          padding: 3px 6px;
        }
      }

      @media (max-width: 700px) {
        .sigtastic-panel {
          width: calc(100vw - 10px);
          min-height: min(460px, calc(100vh - 10px));
          max-height: calc(100vh - 10px);
          border-radius: 20px;
          padding: 12px;
          gap: 8px;
        }

        .sigtastic-grid {
          grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
          gap: 8px;
        }

        .sigtastic-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 16px;
        }

        .sigtastic-preview {
          width: min(100%, 112px);
          height: 82px;
          margin-top: 8px;
          margin-bottom: 5px;
        }

        .sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-1 {
          width: 40px;
          height: 30px;
          left: calc(50% - 42px);
          top: 20px;
        }

        .sigtastic-preview-stack.count-2 .sigtastic-preview-bubble.slot-2 {
          width: 40px;
          height: 30px;
          left: calc(50% + 2px);
          top: 14px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-1 {
          width: 35px;
          height: 26px;
          left: 8px;
          top: 27px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-2 {
          width: 35px;
          height: 26px;
          left: 52px;
          top: 19px;
        }

        .sigtastic-preview-stack.count-3 .sigtastic-preview-bubble.slot-3 {
          width: 35px;
          height: 26px;
          left: 30px;
          top: 8px;
        }

        .sigtastic-type-badge-center {
          width: 30px;
          height: 30px;
          top: 50%;
        }

        .sigtastic-type-badge-center svg {
          width: 18px;
          height: 18px;
        }

        .sigtastic-card-label {
          font-size: 10px;
          padding: 0 7px 7px;
        }

        .sigtastic-hints {
          gap: 5px;
          row-gap: 4px;
        }

        .sigtastic-hint-action {
          font-size: 10px;
        }

        .sigtastic-hint-key {
          font-size: 9px;
          padding: 3px 5px;
        }
      }
    `}}const S=[{id:"none",label:"None"},{id:"send",label:"Send"},{id:"receive",label:"Receive"},{id:"script",label:"Script"},{id:"service",label:"Service"},{id:"user",label:"User"},{id:"manual",label:"Manual"},{id:"business-rule",label:"Business Rule"}],D=6,L=10,Gt=850,Ae=(t,e,r)=>Math.min(r,Math.max(e,t)),ae=t=>t.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(),Le=t=>String(t+1);class Qt{host;root;wrapper;anchor;panel;subtitle;list;actions;supportsCssAnchors;preferences;optionButtons=new Map;opened=!1;applying=!1;modifierKeyPressed=!1;optionHintsVisible=!1;selectedIndex=0;currentTaskType=null;shapeId=null;anchorRect=null;typedQuery="";typedQueryTimer=null;constructor(e,r){this.actions=e,this.preferences=r,this.supportsCssAnchors=!1,this.host=document.createElement("div"),this.host.id="sigtastic-quick-menu-host",this.root=this.host.attachShadow({mode:"open"});const i=document.createElement("style");i.textContent=this.getStyles(),this.wrapper=document.createElement("div"),this.wrapper.className="sigtastic-quick-wrapper";const n=document.createElement("div");n.className="sigtastic-quick-scrim",n.addEventListener("pointerdown",()=>this.close()),this.anchor=document.createElement("div"),this.anchor.className="sigtastic-quick-anchor",this.panel=document.createElement("section"),this.panel.className="sigtastic-quick-panel",this.panel.addEventListener("pointerdown",l=>l.stopPropagation()),this.panel.addEventListener("click",l=>l.stopPropagation());const s=document.createElement("div");s.className="sigtastic-quick-header";const o=document.createElement("h2");o.className="sigtastic-quick-title",o.textContent="Change Type",this.subtitle=document.createElement("div"),this.subtitle.className="sigtastic-quick-subtitle";const a=document.createElement("div");a.className="sigtastic-quick-divider",this.list=document.createElement("div"),this.list.className="sigtastic-quick-list",this.list.setAttribute("role","listbox"),this.list.setAttribute("aria-label","Task type options"),s.append(o,this.subtitle),this.panel.append(s,a,this.list),this.wrapper.append(n,this.anchor,this.panel),this.root.append(i,this.wrapper),window.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("keyup",this.onKeyUp,!0),window.addEventListener("blur",this.onWindowBlur),window.addEventListener("resize",this.onResize,{passive:!0}),document.documentElement.appendChild(this.host)}isOpen(){return this.opened}getShapeId(){return this.shapeId}open(e){this.opened=!0,this.optionHintsVisible=this.modifierKeyPressed,this.typedQuery="",this.currentTaskType=e.taskType,this.shapeId=e.shapeId,this.anchorRect=e.anchorRect,this.selectedIndex=Math.max(0,S.findIndex(r=>r.id===e.taskType)),this.wrapper.classList.add("open"),this.render(),this.syncAnchor(),window.requestAnimationFrame(()=>{this.syncPosition(),this.focusSelectedButton()})}close(){this.opened&&(this.opened=!1,this.applying=!1,this.optionHintsVisible=!1,this.resetTypedQuery(),this.shapeId=null,this.wrapper.classList.remove("open"),this.panel.style.left="",this.panel.style.top="",delete this.panel.dataset.optionHints,this.actions.onClose())}setPreferences(e){this.preferences=e,this.opened&&(this.render(),this.focusSelectedButton())}render(){this.optionButtons.clear(),this.list.replaceChildren();const e=S.find(r=>r.id===this.currentTaskType)?.label??"Unknown";this.subtitle.textContent=this.currentTaskType!==null?`Current: ${e}`:"Choose a type";for(const[r,i]of S.entries()){const n=document.createElement("button");n.type="button",n.className="sigtastic-quick-option",n.dataset.selected=String(r===this.selectedIndex),n.dataset.current=String(i.id===this.currentTaskType),n.setAttribute("role","option"),n.setAttribute("aria-selected",String(r===this.selectedIndex)),n.disabled=this.applying,n.addEventListener("mouseenter",()=>{this.selectedIndex=r,this.updateSelectedOption()}),n.addEventListener("focus",()=>{this.selectedIndex=r,this.updateSelectedOption()}),n.addEventListener("click",()=>{this.applyOption(i.id)});const s=document.createElement("span");s.className="sigtastic-quick-icon",s.setAttribute("aria-hidden","true"),s.innerHTML=this.getTaskTypeIconSvg(i.id);const o=document.createElement("span");o.className="sigtastic-quick-label",o.textContent=i.label;const a=document.createElement("span");if(a.className="sigtastic-quick-shortcut",a.textContent=Le(r),a.setAttribute("title",`${Rt(this.preferences.resolvedNumberShortcutModifier,this.preferences.shortcutPlatform)} + ${Le(r)}`),a.setAttribute("aria-hidden","true"),n.append(s,o),i.id===this.currentTaskType){const l=document.createElement("span");l.className="sigtastic-quick-current",l.textContent="Current",n.append(l)}n.append(a),this.list.appendChild(n),this.optionButtons.set(i.id,n)}this.updateSelectedOption(),this.syncOptionHints()}updateSelectedOption(){S.forEach((e,r)=>{const i=this.optionButtons.get(e.id);if(!i)return;const n=r===this.selectedIndex;i.dataset.selected=String(n),i.setAttribute("aria-selected",String(n))})}syncOptionHints(){this.panel.dataset.optionHints=String(this.optionHintsVisible)}focusSelectedButton(){const e=S[this.selectedIndex],r=e?this.optionButtons.get(e.id):null;r&&(r.focus({preventScroll:!0}),r.scrollIntoView({block:"nearest"}))}async applyOption(e){if(this.applying)return;this.applying=!0,this.panel.dataset.applying="true";for(const i of this.optionButtons.values())i.disabled=!0;const r=await this.actions.onApply(e).catch(()=>!1);if(this.applying=!1,delete this.panel.dataset.applying,r){this.close();return}for(const i of this.optionButtons.values())i.disabled=!1;this.focusSelectedButton()}moveSelection(e){const r=S.length;this.selectedIndex=(this.selectedIndex+e+r)%r,this.updateSelectedOption(),this.focusSelectedButton()}resetTypedQuery(){this.typedQueryTimer!==null&&(window.clearTimeout(this.typedQueryTimer),this.typedQueryTimer=null),this.typedQuery=""}scheduleTypedQueryReset(){this.typedQueryTimer!==null&&window.clearTimeout(this.typedQueryTimer),this.typedQueryTimer=window.setTimeout(()=>{this.typedQuery="",this.typedQueryTimer=null},Gt)}getMatchingOptionIndex(e){const r=ae(e);return r?S.map((n,s)=>{const o=ae(n.label),a=o.split(/\s+/).filter(Boolean),l=a.map(d=>d[0]||"").join("");let c=-1;if(o===r)c=1e3;else if(o.startsWith(r))c=900-o.length;else if(a.some(d=>d.startsWith(r)))c=760-o.length;else if(l.startsWith(r))c=680-l.length;else{const d=o.indexOf(r);d>=0&&(c=520-d)}return{index:s,score:c}}).filter(n=>n.score>=0).sort((n,s)=>s.score-n.score||n.index-s.index)[0]?.index??-1:-1}handleTypeaheadInput(e){const r=ae(e);if(!r)return!1;const i=`${this.typedQuery}${r}`;let n=this.getMatchingOptionIndex(i);if(n>=0)this.typedQuery=i;else{if(n=this.getMatchingOptionIndex(r),n<0)return!1;this.typedQuery=r}return this.scheduleTypedQueryReset(),this.selectedIndex=n,this.updateSelectedOption(),this.focusSelectedButton(),!0}getShortcutOption(e){for(const[r,i]of S.entries())if(Pt(e,this.preferences.resolvedNumberShortcutModifier,r+1,this.preferences.shortcutPlatform))return i.id;return null}syncAnchor(){const e=this.anchorRect;if(!e){this.anchor.style.left=`${window.innerWidth/2}px`,this.anchor.style.top=`${window.innerHeight/2}px`,this.anchor.style.width="1px",this.anchor.style.height="1px";return}this.anchor.style.left=`${e.left}px`,this.anchor.style.top=`${e.top}px`,this.anchor.style.width=`${Math.max(1,e.width)}px`,this.anchor.style.height=`${Math.max(1,e.height)}px`}syncPosition(){if(this.opened){if(this.syncAnchor(),this.supportsCssAnchors){this.panel.dataset.anchored="true",this.panel.style.left="",this.panel.style.top="",window.requestAnimationFrame(()=>{if(!this.opened)return;const e=this.panel.getBoundingClientRect();(e.left<L||e.top<L||e.right>window.innerWidth-L||e.bottom>window.innerHeight-L)&&this.applyFallbackPosition()});return}this.applyFallbackPosition()}}applyFallbackPosition(){this.panel.dataset.anchored="false";const e=this.panel.offsetWidth||260,r=this.panel.offsetHeight||320;let i=(window.innerWidth-e)/2,n=(window.innerHeight-r)/2;if(this.anchorRect){const s=this.anchorRect,o=window.innerWidth-s.right-D,a=s.left-D,l=window.innerHeight-s.bottom-D,c=s.top-D;o>=e?i=s.right+D:a>=e?i=s.left-e-D:i=s.left+s.width/2-e/2,l>=r?n=s.top-4:c>=r?n=s.bottom-r+4:n=s.top+s.height/2-r/2}this.panel.style.left=`${Ae(i,L,window.innerWidth-e-L)}px`,this.panel.style.top=`${Ae(n,L,window.innerHeight-r-L)}px`}onKeyDown=e=>{if(this.isHintModifierKey(e.key)&&(this.modifierKeyPressed=!0,this.opened&&(this.optionHintsVisible=!0,this.syncOptionHints())),!this.opened)return;e.stopPropagation();const r=this.getShortcutOption(e);if(r){e.preventDefault(),this.applyOption(r);return}if(e.key==="Escape"){e.preventDefault(),this.close();return}if(e.key==="ArrowDown"){e.preventDefault(),this.moveSelection(1);return}if(e.key==="ArrowUp"){e.preventDefault(),this.moveSelection(-1);return}if(e.key==="Home"){e.preventDefault(),this.selectedIndex=0,this.updateSelectedOption(),this.focusSelectedButton();return}if(e.key==="End"){e.preventDefault(),this.selectedIndex=S.length-1,this.updateSelectedOption(),this.focusSelectedButton();return}if(e.key==="Enter"){e.preventDefault();const i=S[this.selectedIndex];i&&this.applyOption(i.id);return}if(e.key==="Backspace"){e.preventDefault(),this.typedQuery.length>0&&(this.typedQuery=this.typedQuery.slice(0,-1),this.scheduleTypedQueryReset());return}!e.metaKey&&!e.ctrlKey&&!e.altKey&&e.key.length===1&&/\S/.test(e.key)&&(e.preventDefault(),this.handleTypeaheadInput(e.key))};onKeyUp=e=>{this.isHintModifierKey(e.key)&&(this.modifierKeyPressed=!1),this.opened&&this.isHintModifierKey(e.key)&&(this.optionHintsVisible=!1,this.syncOptionHints())};onWindowBlur=()=>{this.modifierKeyPressed=!1,this.opened&&(this.optionHintsVisible=!1,this.syncOptionHints())};isHintModifierKey(e){return this.preferences.resolvedNumberShortcutModifier==="Alt"?e==="Alt":this.preferences.resolvedNumberShortcutModifier==="Ctrl"?e==="Control":e==="Meta"||e==="Command"}onResize=()=>{this.opened&&this.syncPosition()};getTaskTypeIconSvg(e){return{none:'<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="3.2" stroke="currentColor" stroke-width="1.9"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',send:'<svg viewBox="0 0 24 24" fill="none"><rect x="3.8" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M3.8 7.8 L10.3 12.1 L16.8 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="16.8" y1="11.1" x2="21" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M21 11.1 L18.5 9.2 M21 11.1 L18.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',receive:'<svg viewBox="0 0 24 24" fill="none"><rect x="7.2" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M7.2 7.8 L13.7 12.1 L20.2 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="3" y1="11.1" x2="7.2" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M3 11.1 L5.5 9.2 M3 11.1 L5.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',script:'<svg viewBox="0 0 24 24" fill="none"><path d="M6 4.6 H13.7 L18 8.9 V19.4 H6 Z" stroke="currentColor" stroke-width="1.9"/><line x1="8.4" y1="11.5" x2="15.8" y2="11.5" stroke="currentColor" stroke-width="1.7"/><line x1="8.4" y1="15.2" x2="14.3" y2="15.2" stroke="currentColor" stroke-width="1.7"/></svg>',service:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6.6" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><line x1="12" y1="2.8" x2="12" y2="5.1" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="18.9" x2="12" y2="21.2" stroke="currentColor" stroke-width="1.8"/><line x1="2.8" y1="12" x2="5.1" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="18.9" y1="12" x2="21.2" y2="12" stroke="currentColor" stroke-width="1.8"/></svg>',user:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.3" fill="currentColor"/><path d="M5.2 19.2 C5.2 15.2 8 13 12 13 C16 13 18.8 15.2 18.8 19.2" fill="currentColor"/></svg>',manual:'<svg viewBox="0 0 24 24" fill="none"><path d="M6.5 19 V11.5 C6.5 10.2 7.4 9.4 8.4 9.4 C9.3 9.4 10.1 10.1 10.1 11.5 V14" stroke="currentColor" stroke-width="1.8"/><path d="M10.1 14 V8.4 C10.1 7.2 10.9 6.4 12 6.4 C13.1 6.4 13.9 7.2 13.9 8.4 V14.2" stroke="currentColor" stroke-width="1.8"/><path d="M13.9 12.4 C14.8 12 15.9 12.6 16.2 13.5 L17.6 18.2" stroke="currentColor" stroke-width="1.8"/></svg>',"business-rule":'<svg viewBox="0 0 24 24" fill="none"><rect x="4.6" y="5.3" width="14.8" height="13.4" stroke="currentColor" stroke-width="1.9"/><line x1="4.6" y1="10" x2="19.4" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="9.5" y1="5.3" x2="9.5" y2="18.7" stroke="currentColor" stroke-width="1.8"/></svg>'}[e]}getStyles(){return`
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .sigtastic-quick-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483601;
        display: none;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .sigtastic-quick-wrapper.open {
        display: block;
      }

      .sigtastic-quick-scrim {
        position: absolute;
        inset: 0;
        background: transparent;
      }

      .sigtastic-quick-anchor {
        position: fixed;
        visibility: hidden;
        pointer-events: none;
        anchor-name: --sigtastic-quick-anchor;
      }

      .sigtastic-quick-panel {
        position: fixed;
        width: min(280px, calc(100vw - 20px));
        min-height: 346px;
        max-height: min(430px, calc(100vh - 20px));
        padding: 10px;
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(34, 36, 41, 0.86);
        backdrop-filter: blur(8px) saturate(110%);
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.34);
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr);
        gap: 8px;
        color: #f3f3f3;
        overflow: hidden;
      }

      .sigtastic-quick-panel[data-anchored="true"] {
        position-anchor: --sigtastic-quick-anchor;
        top: anchor(top);
        left: anchor(right);
        margin-left: ${D}px;
        margin-top: -4px;
      }

      .sigtastic-quick-panel[data-applying="true"] {
        opacity: 0.92;
      }

      .sigtastic-quick-header {
        display: grid;
        gap: 2px;
        padding: 2px 2px 0;
      }

      .sigtastic-quick-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .sigtastic-quick-subtitle {
        font-size: 10px;
        color: rgba(243, 243, 243, 0.64);
      }

      .sigtastic-quick-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.16);
      }

      .sigtastic-quick-list {
        display: grid;
        align-content: start;
        gap: 4px;
        overflow: auto;
      }

      .sigtastic-quick-option {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) auto minmax(30px, auto);
        align-items: center;
        gap: 8px;
        width: 100%;
        min-height: 36px;
        padding: 7px 10px;
        border-radius: 10px;
        border: 1px solid transparent;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
        transition: background 120ms ease, border-color 120ms ease;
      }

      .sigtastic-quick-option:hover,
      .sigtastic-quick-option:focus-visible,
      .sigtastic-quick-option[data-selected="true"] {
        background: rgba(0, 0, 0, 0.18);
        border-color: rgba(255, 255, 255, 0.12);
        outline: none;
      }

      .sigtastic-quick-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.92);
      }

      .sigtastic-quick-icon svg {
        width: 16px;
        height: 16px;
      }

      .sigtastic-quick-label {
        font-size: 12px;
        line-height: 1.15;
        font-weight: 500;
        color: #f6f6f6;
      }

      .sigtastic-quick-current {
        grid-column: 3;
        justify-self: end;
        padding: 3px 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        font-size: 9px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(243, 243, 243, 0.78);
      }

      .sigtastic-quick-shortcut {
        grid-column: 4;
        justify-self: end;
        min-width: 24px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(243, 243, 243, 0.62);
        opacity: 0;
        transform: translateX(-1px);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      .sigtastic-quick-panel[data-option-hints="true"] .sigtastic-quick-shortcut {
        opacity: 1;
        transform: translateX(0);
      }

      @media (max-width: 720px) {
        .sigtastic-quick-panel {
          width: min(250px, calc(100vw - 12px));
          min-height: 332px;
          max-height: min(390px, calc(100vh - 12px));
          padding: 8px;
          border-radius: 14px;
        }

        .sigtastic-quick-option {
          padding: 6px 8px;
        }
      }
    `}}const _="settings",Me=1,jt=t=>structuredClone(t);function Be(){return{version:Me,shortcuts:Ee(),appearance:{overlayBackdropBlur:!0},quickMenu:{numberShortcutModifier:"auto"}}}function qe(t){const e=Be();if(!t||typeof t!="object")return e;const r=t;return{version:Me,shortcuts:Ht(r.shortcuts),appearance:{overlayBackdropBlur:typeof r.appearance?.overlayBackdropBlur=="boolean"?r.appearance.overlayBackdropBlur:e.appearance.overlayBackdropBlur},quickMenu:{numberShortcutModifier:r.quickMenu?.numberShortcutModifier==="alt"||r.quickMenu?.numberShortcutModifier==="ctrl"||r.quickMenu?.numberShortcutModifier==="command"||r.quickMenu?.numberShortcutModifier==="auto"?r.quickMenu.numberShortcutModifier:e.quickMenu.numberShortcutModifier}}}async function Yt(){const t=await x.storage.local.get(_),e=qe(t.settings);return JSON.stringify(t.settings)!==JSON.stringify(e)&&await x.storage.local.set({[_]:jt(e)}),e}const Jt="sigtastic-hook";let k=null,T=null,Ne=!1,y="default",v=Be();const Fe=new Map,V=new Map,M=new Map,G=new Map,b=(()=>{let t=null,e=null;return r=>{t||(t=document.createElement("div"),t.style.position="fixed",t.style.right="20px",t.style.bottom="20px",t.style.zIndex="2147483647",t.style.padding="10px 14px",t.style.background="rgba(31, 31, 31, 0.92)",t.style.color="#f3f3f3",t.style.border="1px solid rgba(255, 255, 255, 0.2)",t.style.borderRadius="12px",t.style.fontFamily="system-ui, sans-serif",t.style.fontSize="13px",t.style.boxShadow="0 8px 28px rgba(0, 0, 0, 0.35)",t.style.backdropFilter="blur(3px)",document.body.appendChild(t)),t.textContent=r,t.style.opacity="1",e&&window.clearTimeout(e),e=window.setTimeout(()=>{t&&(t.style.opacity="0")},2500)}})(),Zt=()=>y==="mac"?"Command+V":"Ctrl+V",le=t=>E(v.shortcuts[t],y),I=t=>zt(le(t),y),De=()=>({backdropBlurEnabled:v.appearance.overlayBackdropBlur,saveFavoriteShortcutLabel:I("save-favorite"),shortcutPlatform:y,shortcuts:{"overlay-insert-selected":E(v.shortcuts["overlay-insert-selected"],y),"overlay-delete-selected":E(v.shortcuts["overlay-delete-selected"],y),"overlay-move-up":E(v.shortcuts["overlay-move-up"],y),"overlay-move-down":E(v.shortcuts["overlay-move-down"],y),"overlay-navigate-left":E(v.shortcuts["overlay-navigate-left"],y),"overlay-navigate-right":E(v.shortcuts["overlay-navigate-right"],y),"overlay-navigate-up":E(v.shortcuts["overlay-navigate-up"],y),"overlay-navigate-down":E(v.shortcuts["overlay-navigate-down"],y)},shortcutLabels:{"overlay-insert-selected":I("overlay-insert-selected"),"overlay-delete-selected":I("overlay-delete-selected"),"overlay-move-up":I("overlay-move-up"),"overlay-move-down":I("overlay-move-down"),"overlay-navigate-left":I("overlay-navigate-left"),"overlay-navigate-right":I("overlay-navigate-right"),"overlay-navigate-up":I("overlay-navigate-up"),"overlay-navigate-down":I("overlay-navigate-down")}}),Re=()=>({shortcutPlatform:y,resolvedNumberShortcutModifier:Ot(le("toggle-quick-menu"),y,v.quickMenu.numberShortcutModifier)}),Xt=()=>{k?.setPreferences(De()),T?.setPreferences(Re())},er=t=>t instanceof HTMLElement?t.isContentEditable?!0:!!t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]'):!1,tr=async t=>{if(t==="toggle-overlay"){await wr();return}if(t==="save-favorite"){await mr();return}t==="toggle-quick-menu"&&await xr()},Q=t=>{const e=Date.now(),r=Fe.get(t)??0;e-r<180||(Fe.set(t,e),tr(t))},rr=["toggle-overlay","save-favorite","toggle-quick-menu"],ir=t=>{const e=k?.isOpen()??!1,r=T?.isOpen()??!1;if(!(!e&&!r&&(t.defaultPrevented||er(t.target)))){for(const i of rr)if(Ie(t,Se(i),le(i),y)){t.preventDefault(),t.stopPropagation(),t.stopImmediatePropagation(),Q(i);return}}},Oe=t=>{v=t,Xt()},nr=async()=>{try{const t=await x.runtime.getPlatformInfo();return Ut(t.os)}catch{return"default"}},sr=t=>new Promise(e=>{const r=document.createElement("div");r.style.position="fixed",r.style.inset="0",r.style.zIndex="2147483647",r.style.display="grid",r.style.placeItems="center";const i=document.createElement("div");i.style.position="absolute",i.style.inset="0",i.style.background="rgba(10, 12, 14, 0.4)",i.style.backdropFilter="blur(3px)";const n=document.createElement("div");n.style.position="relative",n.style.width="min(720px, calc(100vw - 32px))",n.style.maxWidth="100%",n.style.maxHeight="calc(100vh - 32px)",n.style.overflow="auto",n.style.boxSizing="border-box",n.style.padding="16px",n.style.borderRadius="16px",n.style.background="rgba(26, 28, 33, 0.92)",n.style.border="1px solid rgba(255, 255, 255, 0.2)",n.style.boxShadow="0 22px 54px rgba(0, 0, 0, 0.62)",n.style.display="grid",n.style.gap="12px",n.style.fontFamily='"Avenir Next", "Segoe UI", sans-serif',n.addEventListener("click",C=>C.stopPropagation());const s=document.createElement("div");s.textContent="Save Favorite",s.style.fontSize="18px",s.style.fontWeight="700",s.style.color="#f3f3f3";const o=document.createElement("label");o.textContent="Name",o.style.fontSize="12px",o.style.fontWeight="600",o.style.color="rgba(243,243,243,0.86)",o.style.display="grid",o.style.gap="6px",o.style.minWidth="0";const a=document.createElement("input");a.type="text",a.value=t.name,a.style.display="block",a.style.width="100%",a.style.maxWidth="100%",a.style.minWidth="0",a.style.boxSizing="border-box",a.style.padding="9px 11px",a.style.borderRadius="10px",a.style.border="1px solid rgba(255,255,255,0.18)",a.style.background="rgba(255,255,255,0.08)",a.style.color="#ececec",a.style.fontSize="15px",a.style.outline="none";const l=document.createElement("label");l.textContent="Content",l.style.fontSize="12px",l.style.fontWeight="600",l.style.color="rgba(243,243,243,0.86)",l.style.display="grid",l.style.gap="6px",l.style.minWidth="0";const c=document.createElement("input");c.type="text",c.value=t.content,c.style.display="block",c.style.width="100%",c.style.maxWidth="100%",c.style.minWidth="0",c.style.boxSizing="border-box",c.style.padding="9px 11px",c.style.borderRadius="10px",c.style.border="1px solid rgba(255,255,255,0.18)",c.style.background="rgba(255,255,255,0.08)",c.style.color="#ececec",c.style.fontSize="15px",c.style.outline="none",o.append(a),l.append(c);const d=document.createElement("div");d.style.display="flex",d.style.justifyContent="flex-end",d.style.gap="8px";const u=document.createElement("button");u.type="button",u.textContent="Cancel",u.style.padding="8px 12px",u.style.borderRadius="10px",u.style.border="1px solid rgba(255,255,255,0.2)",u.style.background="rgba(255,255,255,0.06)",u.style.color="#ececec",u.style.cursor="pointer";const p=document.createElement("button");p.type="button",p.textContent="Save",p.style.padding="8px 12px",p.style.borderRadius="10px",p.style.border="1px solid rgba(255,255,255,0.32)",p.style.background="rgba(255,255,255,0.16)",p.style.color="#f6f6f6",p.style.fontWeight="700",p.style.cursor="pointer",d.append(u,p),n.append(s,o,l,d),r.append(i,n),document.body.append(r);const g=C=>{document.removeEventListener("keydown",m,!0),r.remove(),e(C)},B=()=>{g({name:a.value.trim(),content:c.value.trim()})},m=C=>{if(C.key==="Escape"){C.preventDefault(),g(null);return}C.key==="Enter"&&(C.preventDefault(),B())};i.addEventListener("click",()=>g(null)),u.addEventListener("click",()=>g(null)),p.addEventListener("click",B),document.addEventListener("keydown",m,!0),window.setTimeout(()=>{a.focus(),a.select()},0)}),or=t=>{if(typeof t!="object"||t===null)return!1;const e=t,r=!("requestTemplate"in e)||e.requestTemplate===void 0||typeof e.requestTemplate=="object"&&e.requestTemplate!==null;return typeof e.namespace=="string"&&typeof e.capturedAt=="number"&&(e.source==="fetch"||e.source==="xhr"||e.source==="manual")&&"valueJson"in e&&r},ce=t=>`${t}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,ar=t=>{if(typeof t!="object"||t===null)return!1;const e=t;return typeof e.hasSelection=="boolean"&&typeof e.selectedCount=="number"&&typeof e.isTask=="boolean"&&(e.taskType===null||typeof e.taskType=="string")&&(e.shapeId===null||typeof e.shapeId=="string")},lr=()=>{if(document.getElementById("sigtastic-clipboard-hook"))return;const t=document.createElement("script");t.id="sigtastic-clipboard-hook",t.src=x.runtime.getURL("clipboard-hook.js"),t.async=!1,t.onload=()=>{t.remove()},(document.head||document.documentElement).appendChild(t)},cr=t=>{const e=V.get(t.requestId);if(e){if(window.clearTimeout(e.timer),V.delete(t.requestId),t.ok){e.resolve();return}e.reject(new Error(t.error||`Clipboard write failed (${t.status??"unknown"})`))}},dr=(t,e)=>{if(t.type!==e||typeof t.requestId!="string")return;const r=M.get(t.requestId);if(r){if(window.clearTimeout(r.timer),M.delete(t.requestId),t.ok===!1){r.reject(new Error(typeof t.error=="string"?t.error:"Editor bridge request failed"));return}r.resolve(t.result)}},Pe=async()=>{const t=ce("editor-query"),e=await new Promise((i,n)=>{const s=window.setTimeout(()=>{M.delete(t),n(new Error("Timed out waiting for editor selection info"))},2e4);M.set(t,{resolve:i,reject:n,timer:s}),window.postMessage({source:O,type:"editor-query-request",requestId:t,query:"selection-info"},window.location.origin)});if(!ar(e))throw new Error("Editor selection response was invalid");const r=e.shapeId&&G.has(e.shapeId)?G.get(e.shapeId)??null:null;return e.shapeId&&e.taskType&&G.set(e.shapeId,e.taskType),r&&e.isTask&&(e.taskType===null||e.taskType==="none")?{...e,taskType:r}:e.isTask&&e.taskType===null?{...e,taskType:"none"}:e},ur=async(t,e)=>{const r=ce("editor-action"),i=await new Promise((s,o)=>{const a=window.setTimeout(()=>{M.delete(r),o(new Error("Timed out waiting for task type update"))},2e4);M.set(r,{resolve:s,reject:o,timer:a}),window.postMessage({source:O,type:"editor-action-request",requestId:r,action:"set-task-type",taskType:t,shapeId:e},window.location.origin)});if(typeof i!="object"||i===null||typeof i.ok!="boolean")throw new Error("Editor action response was invalid");const n=i;return n.ok&&e&&G.set(e,t),n},pr=async()=>{const t=ce("editor-action"),e=await new Promise((r,i)=>{const n=window.setTimeout(()=>{M.delete(t),i(new Error("Timed out waiting for quick menu bootstrap"))},2e4);M.set(t,{resolve:r,reject:i,timer:n}),window.postMessage({source:O,type:"editor-action-request",requestId:t,action:"prime-task-type-context"},window.location.origin)});if(typeof e!="object"||e===null||typeof e.ok!="boolean")throw new Error("Quick menu bootstrap response was invalid");return e},hr=async t=>{const e=async r=>{const i=At({payload:t.payload,namespace:t.namespace,requestTemplate:t.requestTemplate},{sanitize:r});await new Promise((n,s)=>{const o=window.setTimeout(()=>{V.delete(i.requestId),s(new Error("Timed out waiting for page clipboard write result"))},5e3);V.set(i.requestId,{resolve:n,reject:s,timer:o}),window.postMessage(i,window.location.origin)})};try{await e(!1)}catch(r){await e(!0).catch(i=>{throw new Error(`Clipboard write failed (raw + sanitized). First: ${String(r)}. Second: ${String(i)}`)})}},fr=()=>k||(k=new Vt({onInsert:async t=>{try{await hr(t),b(`Loaded favorite: ${t.name}. Press ${Zt()} to paste.`)}catch(e){console.error("[Sigtastic] Failed to write favorite payload",e);const r=e instanceof Error?e.message:String(e);b(`Clipboard write failed: ${r.slice(0,120)}`)}},onDelete:async t=>{const e=await Et(t.id);k?.refreshFavorites(e),b(`Deleted favorite: ${t.name}`)},onMove:async(t,e)=>{const r=await Tt(t.id,e);k?.refreshFavorites(r)},onClose:()=>{}},De()),k),gr=t=>({none:"None",send:"Send",receive:"Receive",script:"Script",service:"Service",user:"User",manual:"Manual","business-rule":"Business Rule"})[t],$e=t=>t.hasSelection?t.selectedCount>1?"Select a single task for quick type change.":t.isTask?null:"Quick type menu works on task elements only.":"Select a task first.",yr=()=>T||(T=new Qt({onApply:async t=>{try{const e=await ur(t,T?.getShapeId()??null);return e.ok?(b(`Changed task type to ${gr(t)}.`),!0):(b(e.error||"Unable to change task type."),!1)}catch(e){const r=e instanceof Error?e.message:String(e);return b(`Task type change failed: ${r.slice(0,120)}`),!1}},onClose:()=>{}},Re()),T),mr=async()=>{const t=await Ce();if(!t){b("No copied Signavio snippet found yet.");return}const e=N(t.valueJson),r={name:ht(t.valueJson),content:e.contentText},i=await sr(r);if(!i)return;const n=i.name.trim();if(!n){b("Favorite name cannot be empty.");return}if(await St(n,t,{displayName:i.name,displayContent:i.content,defaultDisplayName:r.name,defaultDisplayContent:r.content}),k?.isOpen()){const s=await R();k.refreshFavorites(s)}b(`Saved favorite: ${n}`)},wr=async()=>{T?.isOpen()&&T.close();const t=await R();fr().toggle(t)},xr=async()=>{k?.isOpen()&&k.close();const t=yr();if(t.isOpen()){t.close();return}let e;try{e=await Pe()}catch(i){const n=i instanceof Error?i.message:String(i);b(`Unable to inspect selection: ${n.slice(0,120)}`);return}const r=$e(e);if(r){b(r);return}if(!Ne){try{const n=await pr();n.ok?(Ne=!0,e=await Pe()):console.warn("[Sigtastic] Quick menu bootstrap did not complete",n.error)}catch(n){console.warn("[Sigtastic] Quick menu bootstrap failed",n)}const i=$e(e);if(i){b(i);return}}t.open(e)},kr={matches:["*://*.signavio.com/*"],runAt:"document_idle",main(){lr(),window.addEventListener("keydown",ir,!0),(async()=>{y=await nr(),Oe(await Yt());const e=(await Ce())?.requestTemplate,r=e?void 0:(await R()).find(n=>n.requestTemplate)?.requestTemplate,i=e??r;i&&window.postMessage({source:O,type:"clipboard-template-bootstrap",template:i},window.location.origin)})(),window.addEventListener("message",async t=>{if(t.source!==window||t.origin!==window.location.origin)return;const e=t.data;if(!(!e||e.source!==Jt||typeof e.type!="string")){if(e.type==="clipboard-captured"&&or(e.payload)){await Ct(e.payload);return}if(e.type==="clipboard-write-result"&&It(e)){cr(e);return}(e.type==="editor-query-result"||e.type==="editor-action-result")&&dr(e,e.type==="editor-query-result"?"editor-query-result":"editor-action-result")}}),x.storage.onChanged.addListener((t,e)=>{e!=="local"||!(_ in t)||Oe(qe(t[_]?.newValue))}),x.runtime.onMessage.addListener(t=>{if(!t||typeof t!="object"||!("type"in t))return;const e=t;if(e.type==="SIGTASTIC_SAVE_FAVORITE"){Q("save-favorite");return}if(e.type==="SIGTASTIC_TOGGLE_OVERLAY"){Q("toggle-overlay");return}e.type==="SIGTASTIC_TOGGLE_QUICK_MENU"&&Q("toggle-quick-menu")})}};function j(t,...e){}const vr={debug:(...t)=>j(console.debug,...t),log:(...t)=>j(console.log,...t),warn:(...t)=>j(console.warn,...t),error:(...t)=>j(console.error,...t)};var Ke=class ze extends Event{static EVENT_NAME=de("wxt:locationchange");constructor(e,r){super(ze.EVENT_NAME,{}),this.newUrl=e,this.oldUrl=r}};function de(t){return`${x?.runtime?.id}:content:${t}`}const br=typeof globalThis.navigation?.addEventListener=="function";function Cr(t){let e,r=!1;return{run(){r||(r=!0,e=new URL(location.href),br?globalThis.navigation.addEventListener("navigate",i=>{const n=new URL(i.destination.url);n.href!==e.href&&(window.dispatchEvent(new Ke(n,e)),e=n)},{signal:t.signal}):t.setInterval(()=>{const i=new URL(location.href);i.href!==e.href&&(window.dispatchEvent(new Ke(i,e)),e=i)},1e3))}}}var Sr=class P{static SCRIPT_STARTED_MESSAGE_TYPE=de("wxt:content-script-started");id;abortController;locationWatcher=Cr(this);constructor(e,r){this.contentScriptName=e,this.options=r,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return x.runtime?.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener("abort",e),()=>this.signal.removeEventListener("abort",e)}block(){return new Promise(()=>{})}setInterval(e,r){const i=setInterval(()=>{this.isValid&&e()},r);return this.onInvalidated(()=>clearInterval(i)),i}setTimeout(e,r){const i=setTimeout(()=>{this.isValid&&e()},r);return this.onInvalidated(()=>clearTimeout(i)),i}requestAnimationFrame(e){const r=requestAnimationFrame((...i)=>{this.isValid&&e(...i)});return this.onInvalidated(()=>cancelAnimationFrame(r)),r}requestIdleCallback(e,r){const i=requestIdleCallback((...n)=>{this.signal.aborted||e(...n)},r);return this.onInvalidated(()=>cancelIdleCallback(i)),i}addEventListener(e,r,i,n){r==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(r.startsWith("wxt:")?de(r):r,i,{...n,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),vr.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(P.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),window.postMessage({type:P.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},"*")}verifyScriptStartedEvent(e){const r=e.detail?.contentScriptName===this.contentScriptName,i=e.detail?.messageId===this.id;return r&&!i}listenForNewerScripts(){const e=r=>{!(r instanceof CustomEvent)||!this.verifyScriptStartedEvent(r)||this.notifyInvalidated()};document.addEventListener(P.SCRIPT_STARTED_MESSAGE_TYPE,e),this.onInvalidated(()=>document.removeEventListener(P.SCRIPT_STARTED_MESSAGE_TYPE,e))}};function Lr(){}function Y(t,...e){}const Er={debug:(...t)=>Y(console.debug,...t),log:(...t)=>Y(console.log,...t),warn:(...t)=>Y(console.warn,...t),error:(...t)=>Y(console.error,...t)};return(async()=>{try{const{main:t,...e}=kr;return await t(new Sr("content",e))}catch(t){throw Er.error('The content script "content" crashed on startup!',t),t}})()})();
content;