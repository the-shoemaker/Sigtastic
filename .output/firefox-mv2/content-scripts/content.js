var content=(function(){"use strict";const b=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;function Mt(r){return r}const he=180,fe=180,ye=260,ke=190,h=r=>typeof r=="object"&&r!==null,S=r=>!h(r)||!h(r.stencil)||typeof r.stencil.id!="string"?"":r.stencil.id,q=r=>{const e=r.toLowerCase();return e.includes("flow")||e.includes("association")||e.includes("connection")||e.includes("link")},F=r=>!h(r)||!Array.isArray(r.childShapes)?[]:r.childShapes,ge=r=>{const e=[],t=[...r];for(;t.length>0;){const i=t.pop();if(h(i)&&(e.push(i),Array.isArray(i.childShapes)))for(const n of i.childShapes)t.push(n)}return e},R=r=>structuredClone(r),Z=r=>{const e=new Set;for(const t of r)typeof t.resourceId=="string"&&t.resourceId.trim()&&e.add(t.resourceId);return e},xe=r=>{const e=new Map;for(const t of r){const i=crypto.randomUUID().replace(/-/g,"").slice(0,12);e.set(t,`sid-${i}`)}return e},H=(r,e)=>{if(Array.isArray(r))return r.map(i=>H(i,e));if(!h(r))return r;const t={};for(const[i,n]of Object.entries(r)){if(i==="resourceId"&&typeof n=="string"&&e.has(n)){t[i]=e.get(n);continue}t[i]=H(n,e)}return t},me=r=>{if(!Array.isArray(r.childShapes))return;let e=0;for(const t of r.childShapes){if(!h(t))continue;const i=S(t);if(q(i)||!h(t.bounds))continue;const n=t.bounds;if(!h(n.upperLeft)||!h(n.lowerRight))continue;const s=n.upperLeft,a=n.lowerRight,o=typeof a.x=="number"&&typeof s.x=="number"?Math.max(40,a.x-s.x):120,l=typeof a.y=="number"&&typeof s.y=="number"?Math.max(40,a.y-s.y):80,c=he+e%3*ye,d=fe+Math.floor(e/3)*ke;n.upperLeft={x:c,y:d},n.lowerRight={x:c+o,y:d+l},e+=1}},we=r=>{const e=F(r).filter(h);return e.length===0?null:e.find(i=>!q(S(i)))??e[0]??null},be=r=>!r||!h(r.properties)?null:r.properties,ve=["name","title","text","documentation","description","conditionexpression","conditionExpression","condition","taskname","subject","label","caption"],Ce=r=>r.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),Se=new Set(["task","usertask","manualtask","servicetask","webservice","scripttask","sendtask","receivetask","businessruletask","callactivity","automatic","bpmn"]),Ee=r=>r.toLowerCase().replace(/[^a-z0-9]/g,""),Te=r=>{const e=Ee(r);return Se.has(e)},Ie=r=>{if(!r)return"";for(const e of ve){const t=r[e];if(typeof t=="string"){const i=Ce(t);if(i.length>0&&!Te(i))return i}}return""},Le=(r,e)=>{if(!r)return"";for(const t of e){const i=r[t];if(typeof i=="string"&&i.trim())return i.trim()}return""},Ae=(r,e)=>{if(!r)return null;for(const t of e){const i=r[t];if(typeof i=="boolean")return i;if(typeof i=="number")return i!==0;if(typeof i=="string"){const n=i.trim().toLowerCase();if(["true","yes","1"].includes(n))return!0;if(["false","no","0"].includes(n))return!1}}return null},Me=(r,e)=>{const t=r.toLowerCase(),i=Le(e,["tasktype","type","activitytype","implementation","trigger"]).toLowerCase(),n=`${t} ${i}`;return n.includes("callactivity")||n.includes("call activity")?"call-activity":n.includes("servicetask")||n.includes("service task")||n.includes("service")||n.includes("webservice")?"service":n.includes("usertask")||n.includes("user task")||n.includes("user")?"user":n.includes("manualtask")||n.includes("manual task")||n.includes("manual")?"manual":n.includes("scripttask")||n.includes("script task")||n.includes("script")?"script":n.includes("sendtask")||n.includes("send task")||n.includes("send")?"send":n.includes("receivetask")||n.includes("receive task")||n.includes("receive")?"receive":n.includes("businessruletask")||n.includes("business rule")||n.includes("decision")?"business-rule":n.includes("automatic")||n.includes("auto")?"automatic":"default"},Ne=r=>u(r,["timer"])?"Timer":u(r,["message"])?"Message":u(r,["signal"])?"Signal":u(r,["conditional"])?"Conditional":u(r,["linkevent"," link "])?"Link":u(r,["multiple"])?"Multiple":u(r,["escalation"])?"Escalation":u(r,["error"])?"Error":u(r,["compensation"])?"Compensation":u(r,["terminate"])?"Terminate":u(r,["cancel"])?"Cancel":"",qe=(r,e,t)=>{const i=r.toLowerCase(),n=Object.values(t??{}).filter(o=>typeof o=="string").join(" ").toLowerCase(),s=`${i} ${n}`,a=Ne(s);return i.includes("transaction")?"Transaction":i.includes("subprocess")?"Subprocess":i.includes("parallelgateway")?"Parallel Gateway":i.includes("inclusivegateway")?"Inclusive Gateway":i.includes("eventbasedgateway")?"Event-Based Gateway":i.includes("complexgateway")?"Complex Gateway":i.includes("gateway")?"Exclusive Gateway":i.includes("startevent")?a?`Start ${a} Event`:"Start Event":i.includes("endevent")?a?`End ${a} Event`:"End Event":i.includes("boundaryevent")?a?`Boundary ${a} Event`:"Boundary Event":i.includes("intermediate")||i.includes("event")?a?`Intermediate ${a} Event`:"Intermediate Event":i.includes("messageflow")?"Message Flow":i.includes("sequenceflow")?"Sequence Flow":i.includes("association")?"Association":i.includes("dataobject")?"Data Object":i.includes("datastore")?"Data Store":i.includes("annotation")?"Text Annotation":i.includes("group")?"Group":i.includes("pool")||i.includes("lane")||i.includes("participant")?"Pool/Lane":i.includes("task")||i.includes("activity")||i.includes("callactivity")?e==="service"?"Service Task":e==="user"?"User Task":e==="manual"?"Manual Task":e==="script"?"Script Task":e==="send"?"Send Task":e==="receive"?"Receive Task":e==="business-rule"?"Business Rule Task":e==="call-activity"?"Call Activity":e==="automatic"?"Automatic Task":"Task":"Component"},Fe=(r,e)=>(r.match(/[^\s]+/g)??[]).slice(0,e).join(" ").trim(),u=(r,e)=>e.some(t=>r.includes(t)),Re=r=>{const e=new Set,t=[];for(const i of r)e.has(i)||(e.add(i),t.push(i));return t},X=r=>{const e=F(r).filter(h);let t=0;for(const i of e)q(S(i))||(t+=1);return t};function Oe(r,e=3){const t=F(r).filter(h),i=[];for(const n of t){const s=S(n);if(!(!s||q(s))&&(i.push(s),i.length>=e))break}return i}function E(r){const e=we(r),t=S(e),i=be(e),n=Ie(i),s=n.length>0,a=Me(t,i),o=qe(t,a,i);return{stencilId:t,hasContent:s,contentText:n,taskVariant:a,typeName:o,properties:i}}function ee(r){const e=E(r),t=[],i=e.stencilId.toLowerCase(),n=Object.values(e.properties??{}).filter(o=>typeof o=="string").join(" ").toLowerCase(),s=`${i} ${n}`;return e.hasContent&&t.push("content"),X(r)>1&&t.push("multi-element"),u(s,["timer"])&&t.push("timer"),u(s,["message"])&&t.push("message"),u(s,["conditional"])&&t.push("conditional"),u(s,["linkevent"," link "])&&t.push("link"),u(s,["multiple"])&&t.push("multiple"),u(s,["multi","multiple"])&&(u(s,["parallel"])&&t.push("mi-parallel"),u(s,["sequential","serial"])&&t.push("mi-sequential")),u(s,["loop"])&&t.push("loop"),u(s,["adhoc","ad hoc"])&&t.push("adhoc"),u(s,["transaction"])&&t.push("transaction"),(Ae(e.properties,["isinterrupting","interrupting"])===!1||u(s,["noninterrupting","non-interrupting"]))&&t.push("non-interrupting"),Re(t)}function Be(r){const e=E(r).taskVariant;return e==="default"?null:e}const V=(r,e,t)=>{if(Array.isArray(r)){for(const i of r)V(i,e,t);return}if(h(r)&&!t.has(r)){t.add(r),typeof r.resourceId=="string"&&h(r.stencil)&&typeof r.stencil.id=="string"&&e.push(r);for(const i of Object.values(r))V(i,e,t)}},O=(r,e,t)=>{if(typeof r=="string")return e.has(r);if(Array.isArray(r))return r.some(i=>O(i,e,t));if(!h(r)||t.has(r))return!1;t.add(r);for(const i of Object.values(r))if(O(i,e,t))return!0;return!1},De=r=>{if(!Array.isArray(r.childShapes)||!h(r.linked))return;const e=r.childShapes.filter(h),t=Z(e),i=[];if(V(r.linked,i,new WeakSet),i.length===0)return;const n=i.filter(l=>S(l).toLowerCase().includes("annotation")),s=new Set;for(const l of n)typeof l.resourceId=="string"&&l.resourceId.trim()&&s.add(l.resourceId);const a=i.filter(l=>S(l).toLowerCase().includes("association")),o=[];for(const l of n)o.push(l);for(const l of a){const c=O(l,s,new WeakSet),d=O(l,t,new WeakSet);(c||d)&&o.push(l)}for(const l of o)typeof l.resourceId!="string"||!l.resourceId.trim()||t.has(l.resourceId)||(r.childShapes.push(R(l)),t.add(l.resourceId))};function te(r){if(!h(r)||!Array.isArray(r.childShapes))return R(r);const e=R(r);return De(e),e}function $e(r){const e=E(r),t=X(r);let i=e.typeName||"Favorite snippet";if(e.hasContent){const n=Fe(e.contentText,2);n&&(i=`${e.typeName}: ${n}`)}return t>1?`${i}, more...`:i}function We(r){if(!h(r)||!Array.isArray(r.childShapes))return R(r);const e=te(r),t=ge(F(e)),i=Z(t),n=xe(i),s=H(e,n);return h(s)&&(s.useOffset=!1,me(s)),s}const re="favorites",ie="favoritesBackups",ne="lastCapture",_="bpkeys.favorites.mirror.v1",ze=6,B=r=>structuredClone(r),v=r=>r.trim().replace(/\s+/g," "),Pe=r=>r.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),He=(r,e)=>{const t=v(r);if(!t)return"Favorite";if(!e.some(c=>v(c.name).toLowerCase()===t.toLowerCase()))return t;const n=t.match(/^(.*?)(?:\s+(\d+))?$/),s=v(n?.[1]??t),a=new RegExp(`^${Pe(s)}(?:\\s+(\\d+))?$`,"i"),o=new Set;for(const c of e){const p=v(c.name).match(a);p&&p[1]&&o.add(Number(p[1]))}let l=1;for(;o.has(l);)l+=1;return`${s} ${l}`},Ve=r=>[...r].sort((e,t)=>e.order!==t.order?e.order-t.order:e.createdAt-t.createdAt),U=r=>Ve(r).map((e,t)=>({...e,order:t})),_e=r=>{if(!r||typeof r!="object")return!1;const e=r;return typeof e.id=="string"&&typeof e.name=="string"&&"payload"in e&&typeof e.namespace=="string"&&typeof e.order=="number"&&typeof e.createdAt=="number"&&typeof e.updatedAt=="number"},K=r=>Array.isArray(r)?r.filter(_e).map(e=>B(e)):[],Ue=r=>Array.isArray(r)?r.map(e=>{if(!e||typeof e!="object")return null;const t=e;if(typeof t.savedAt!="number")return null;const i=K(t.favorites);return i.length===0?null:{savedAt:t.savedAt,favorites:i}}).filter(e=>!!e).sort((e,t)=>t.savedAt-e.savedAt):[],se=()=>{try{if(typeof window<"u"&&window.localStorage)return window.localStorage}catch{}return null},Ke=()=>{const r=se();if(!r)return[];try{const e=r.getItem(_);if(!e)return[];const t=JSON.parse(e);return K(t?.favorites)}catch{return[]}},je=r=>{const e=se();if(e)try{if(r.length===0){e.removeItem(_);return}e.setItem(_,JSON.stringify({savedAt:Date.now(),favorites:r}))}catch{}},j=async()=>{const r=await b.storage.local.get([re,ie]);return{primary:K(r.favorites),backups:Ue(r.favoritesBackups),mirrored:Ke()}},oe=r=>r.primary.length>0?r.primary:r.backups.length>0?r.backups[0].favorites:r.mirrored.length>0?r.mirrored:[],ae=async r=>{const e=U(r),t=await j(),i=e.length>0?[{savedAt:Date.now(),favorites:e},...t.backups.filter(n=>JSON.stringify(n.favorites)!==JSON.stringify(e))].slice(0,ze):t.backups;await b.storage.local.set({[re]:e,[ie]:i}),je(e)};async function L(){const r=await j(),e=oe(r),t=U(e);return r.primary.length===0&&t.length>0&&await ae(t),t}async function G(r,e){const t=r.map((i,n)=>({...i,order:n}));if(t.length===0&&!e?.allowEmpty){const i=await j(),n=oe(i);return U(n)}return await ae(t),t}async function le(){const r=await b.storage.local.get(ne);return r.lastCapture?B(r.lastCapture):null}async function Ge(r){await b.storage.local.set({[ne]:B(r)})}async function Qe(r,e,t){const i=await L(),n=Date.now(),s=He(r,i),a=v(t?.defaultDisplayName??""),o=v(t?.defaultDisplayContent??""),l=(t?.displayName??a)||r||s,c=v(l),d=v(t?.displayContent??o),p=c.length>0&&a.length>0?c.toLowerCase()!==a.toLowerCase():c.length>0,y=d.length>0&&o.length>0?d.toLowerCase()!==o.toLowerCase():d.length>0,f={id:crypto.randomUUID(),name:s,displayName:c,displayNameCustom:p,displayContent:d,displayContentCustom:y,payload:te(e.valueJson),namespace:e.namespace,requestTemplate:e.requestTemplate?B(e.requestTemplate):void 0,order:i.length,createdAt:n,updatedAt:n};return i.unshift(f),await G(i),f}async function Ye(r){const e=await L(),t=e.filter(i=>i.id!==r);return t.length===e.length?e:G(t,{allowEmpty:!0})}async function Je(r,e){const t=await L(),i=t.findIndex(c=>c.id===r);if(i===-1)return t;const n=e==="up"?i-1:i+1;if(n<0||n>=t.length)return t;const s=[...t],a=s[i],o=s[n];if(!a||!o)return t;s[i]=o,s[n]=a;const l=Date.now();return s[i]={...o,updatedAt:l},s[n]={...a,updatedAt:l},G(s)}const D="signavio-bpkeys-content";function Ze(r){if(typeof r!="object"||r===null)return!1;const e=r;return e.source==="signavio-bpkeys-hook"&&e.type==="clipboard-write-result"&&typeof e.requestId=="string"&&typeof e.ok=="boolean"}function Xe(r,e){const t=crypto.randomUUID(),i=e?.sanitize??!0;return{source:D,type:"clipboard-write-request",requestId:t,payload:{valueJson:i?We(r.payload):r.payload,namespace:r.namespace,requestTemplate:r.requestTemplate}}}const et=172;class tt{host;root;wrapper;searchInput;listWrap;grid;emptyState;hintText;actions;favorites=[];filtered=[];selectedId=null;opened=!1;query="";mode="search";cardById=new Map;typeLabelFitFrame=null;selectedScrollFrame=null;constructor(e){this.actions=e,this.host=document.createElement("div"),this.host.id="bpkeys-overlay-host",this.root=this.host.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent=this.getStyles(),this.wrapper=document.createElement("div"),this.wrapper.className="bpkeys-wrapper",this.wrapper.tabIndex=-1;const i=document.createElement("div");i.className="bpkeys-scrim",i.addEventListener("click",()=>this.close());const n=document.createElement("section");n.className="bpkeys-panel",n.addEventListener("click",p=>{p.stopPropagation()});const s=document.createElement("div");s.className="bpkeys-top-row";const a=document.createElement("div");a.className="bpkeys-search-shell";const o=document.createElement("span");o.className="bpkeys-search-icon",o.setAttribute("aria-hidden","true"),o.innerHTML='<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.8" stroke="currentColor" stroke-width="1.8"/><path d="M16.1 16.1L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',this.searchInput=document.createElement("input"),this.searchInput.className="bpkeys-search",this.searchInput.type="text",this.searchInput.placeholder="Search Components",this.searchInput.setAttribute("aria-label","Search components"),this.searchInput.addEventListener("focus",()=>{this.mode="search"}),this.searchInput.addEventListener("pointerdown",()=>{this.mode="search"}),this.searchInput.addEventListener("input",()=>{this.mode="search",this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid()}),a.append(o,this.searchInput),s.append(a);const l=document.createElement("div");l.className="bpkeys-divider";const c=document.createElement("div");c.className="bpkeys-list-wrap",this.listWrap=c,this.grid=document.createElement("div"),this.grid.className="bpkeys-grid",this.emptyState=document.createElement("div"),this.emptyState.className="bpkeys-empty",c.append(this.grid,this.emptyState);const d=document.createElement("div");d.className="bpkeys-footer-divider",this.hintText=document.createElement("div"),this.hintText.className="bpkeys-hints",this.hintText.replaceChildren(this.createHintItem("Close","Esc"),this.createHintSeparator(),this.createHintItem("Insert","Enter"),this.createHintSeparator(),this.createHintItem("Remove","Option+Delete"),this.createHintSeparator(),this.createHintItem("Reorder","Option+Up/Down")),n.append(s,l,c,d,this.hintText),this.wrapper.append(i,n),this.root.append(t,this.wrapper),window.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("resize",this.onResize,{passive:!0}),document.documentElement.appendChild(this.host),this.renderGrid()}isOpen(){return this.opened}open(e){this.opened=!0,this.wrapper.classList.add("open"),this.query="",this.mode="search",this.searchInput.value="",this.setFavorites(e),this.searchInput.focus()}close(){this.opened&&(this.opened=!1,this.wrapper.classList.remove("open"),this.actions.onClose())}toggle(e){if(this.opened){this.close();return}this.open(e)}refreshFavorites(e){this.setFavorites(e),this.scheduleSelectedVisibilityScroll()}setFavorites(e){this.favorites=[...e].sort((t,i)=>t.order-i.order),!this.selectedId&&this.favorites.length>0&&(this.selectedId=this.favorites[0]?.id??null),this.applyFilter(),this.renderGrid()}applyFilter(){if(this.query?this.filtered=this.favorites.filter(e=>{const t=E(e.payload),i=this.getVisualDisplayName(e,t),n=this.getVisualDisplayContent(e,t);return`${e.name} ${i} ${n} ${t.typeName} ${t.contentText}`.toLowerCase().includes(this.query)}):this.filtered=[...this.favorites],this.filtered.length===0){this.selectedId=null;return}(!this.selectedId||!this.filtered.some(e=>e.id===this.selectedId))&&(this.selectedId=this.filtered[0]?.id??null)}getSelectedFavorite(){return this.selectedId?this.filtered.find(e=>e.id===this.selectedId)??null:null}enterSearchMode(e){this.mode="search",this.searchInput.focus(),e&&(this.searchInput.value+=e,this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid())}enterListMode(){this.mode="list",this.searchInput.blur(),this.wrapper.focus()}renderGrid(){this.cardById.clear(),this.grid.innerHTML="";const e=this.filtered;if(this.emptyState.style.display=e.length===0?"block":"none",this.favorites.length===0){this.emptyState.textContent="No favorites yet. Copy a shape in Signavio and use Option+Shift+S to save one.",this.hintText.style.opacity="0.75";return}if(e.length===0){this.emptyState.textContent="No favorites match your search.",this.hintText.style.opacity="0.85";return}this.hintText.style.opacity="1";const t=this.getDuplicateSignatureCounts();for(const i of e){const n=document.createElement("button");n.className="bpkeys-card",n.type="button",n.dataset.favoriteId=i.id,n.title=i.name;const s=E(i.payload),a=ee(i.payload),o=Be(i.payload),l=this.getVisualDisplayName(i,s),c=this.getVisualDisplayContent(i,s),d=this.getFavoriteSignature(s,l,c,a),p=(t.get(d)??0)>1;n.addEventListener("click",()=>{this.selectedId=i.id,this.enterListMode(),this.updateSelectedCardClasses()}),n.addEventListener("dblclick",()=>{this.close(),this.actions.onInsert(i)});const y=this.createPreview(i,s,l,a,o,p),f=document.createElement("div");f.className="bpkeys-card-label",f.textContent=c,n.append(y,f),this.grid.appendChild(n),this.cardById.set(i.id,n)}this.updateSelectedCardClasses(),this.scheduleTypeLabelFit()}updateSelectedCardClasses(){for(const[e,t]of this.cardById.entries())t.classList.toggle("selected",e===this.selectedId)}getVisualDisplayName(e,t){const i=e.displayName?.trim()||"";return e.displayNameCustom&&i?i:t.typeName||"Component"}getVisualDisplayContent(e,t){const i=e.displayContent?.trim()||"";return e.displayContentCustom&&i?i:t.hasContent?t.contentText:"Empty"}middleEllipsis(e,t=24){const i=e.trim();if(i.length<=t)return i;if(t<=4)return`${i.slice(0,1)}...`;const n=t-3,s=Math.ceil(n/2),a=Math.floor(n/2);return`${i.slice(0,s)}...${i.slice(i.length-a)}`}scheduleTypeLabelFit(){this.typeLabelFitFrame!==null&&window.cancelAnimationFrame(this.typeLabelFitFrame),this.typeLabelFitFrame=window.requestAnimationFrame(()=>{this.typeLabelFitFrame=null,this.fitTypeLabelsToWidth()})}scheduleSelectedVisibilityScroll(){this.selectedScrollFrame!==null&&window.cancelAnimationFrame(this.selectedScrollFrame),this.selectedScrollFrame=window.requestAnimationFrame(()=>{this.selectedScrollFrame=null,this.scrollSelectedCardToTopIfOutOfView()})}fitTypeLabelsToWidth(){const e=this.grid.querySelectorAll(".bpkeys-type-inline");for(const t of e){const i=t.dataset.fullText?.trim()??"";if(!i){t.textContent="";continue}t.textContent=i;const n=t.clientWidth;if(n<=0||t.scrollWidth<=n)continue;let s=5,a=i.length,o=`${i.slice(0,1)}...`;for(;s<=a;){const l=Math.floor((s+a)/2),c=this.middleEllipsis(i,l);t.textContent=c,t.scrollWidth<=n?(o=c,s=l+1):a=l-1}t.textContent=o}}getFavoriteSignature(e,t,i,n){return[e.typeName.toLowerCase(),t.trim().toLowerCase(),i.trim().toLowerCase(),[...n].sort().join(",")].join("::")}getDuplicateSignatureCounts(){const e=new Map;for(const t of this.favorites){const i=E(t.payload),n=ee(t.payload),s=this.getVisualDisplayName(t,i),a=this.getVisualDisplayContent(t,i),o=this.getFavoriteSignature(i,s,a,n);e.set(o,(e.get(o)??0)+1)}return e}createHintItem(e,t){const i=document.createElement("span");i.className="bpkeys-hint-item";const n=document.createElement("span");n.className="bpkeys-hint-action",n.textContent=e;const s=document.createElement("span");return s.className="bpkeys-hint-key",s.textContent=t,i.append(n,s),i}createHintSeparator(){const e=document.createElement("span");return e.className="bpkeys-hint-separator",e.textContent="|",e}createPreview(e,t,i,n,s,a){const o=document.createElement("div");o.className="bpkeys-preview";const l=t.stencilId.toLowerCase(),c=this.getIconKind(l,t),d=Oe(e.payload,3).map(k=>k.toLowerCase()),p=d.length>0?d.map(k=>this.getIconKind(k)):[c];if(this.hasRoundedBackground(c)?o.classList.add("rounded-bg"):o.classList.add("shape-only"),o.classList.add(t.hasContent?"has-content":"is-empty"),p.length>1){const k=document.createElement("div");k.className=`bpkeys-preview-stack count-${Math.min(3,p.length)}`,p.slice(0,3).forEach((x,Lt)=>{const J=document.createElement("div");J.className=`bpkeys-preview-bubble slot-${Lt+1}`,J.appendChild(this.createIconSvgNode(x,"bpkeys-preview-bubble-svg")),k.appendChild(J)}),o.appendChild(k)}else o.appendChild(this.createIconSvgNode(c,"bpkeys-preview-svg"));s&&o.appendChild(this.getTypeBadge(s));const f=document.createElement("div");f.className="bpkeys-type-inline",f.dataset.fullText=i,f.textContent=i,f.setAttribute("title",i),o.appendChild(f);const M=[...n];if(a&&M.push("duplicate"),M.length>0){const k=document.createElement("div");k.className="bpkeys-badge-row";for(const x of M)k.appendChild(this.getBadge(x));o.appendChild(k)}return o}createIconSvgNode(e,t){const i=document.createElementNS("http://www.w3.org/2000/svg","svg");return i.setAttribute("viewBox","-4 -4 148 112"),i.classList.add(t),e.startsWith("gateway-")&&(i.style.height="75%"),i.innerHTML=this.getIconSvg(e),i}getBadge(e){const t=document.createElement("span");t.className="bpkeys-badge";const i={content:'<text x="12" y="15.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" font-family="Segoe UI, sans-serif">T</text>',"multi-element":'<line x1="8.5" y1="8.5" x2="15.5" y2="8.5" stroke="currentColor" stroke-width="1.8"/><line x1="8.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><line x1="15.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="12" cy="14.8" r="2.3" fill="currentColor"/>',duplicate:'<rect x="5.5" y="5.5" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',timer:'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" stroke-width="2"/>',message:'<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8 L12 13 L20 8" fill="none" stroke="currentColor" stroke-width="1.8"/>',conditional:'<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.8"/>',link:'<path d="M8 12 C8 9 10 7 13 7 H16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 7 L14 5 M16 7 L14 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 12 C16 15 14 17 11 17 H8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 17 L10 15 M8 17 L10 19" fill="none" stroke="currentColor" stroke-width="2"/>',multiple:'<circle cx="8" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="16" cy="12" r="2.2" fill="currentColor"/>',loop:'<path d="M17 10 A6 6 0 1 0 18 13" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="18,8 21,10 18,12" fill="currentColor"/>',"mi-parallel":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',"mi-sequential":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="9" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="11" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',adhoc:'<path d="M4 14 C6 10 8 18 10 14 C12 10 14 18 16 14 C18 10 20 18 22 14" fill="none" stroke="currentColor" stroke-width="2"/>',"non-interrupting":'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.5 2.5"/>',transaction:'<rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="8" y="8" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>'};return t.setAttribute("title",e),t.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${i[e]}</svg>`,t}getTypeBadge(e){const t=document.createElement("div");t.className="bpkeys-type-badge-center";const i={user:'<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M4.8 20 C4.8 15.4 8 13 12 13 C16 13 19.2 15.4 19.2 20" fill="currentColor"/>',service:'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.1"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/><line x1="12" y1="3.6" x2="12" y2="6.1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17.9" x2="12" y2="20.4" stroke="currentColor" stroke-width="2"/><line x1="3.6" y1="12" x2="6.1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="17.9" y1="12" x2="20.4" y2="12" stroke="currentColor" stroke-width="2"/>',manual:'<path d="M6 19 V11 C6 9.6 7 8.8 8.2 8.8 C9.3 8.8 10.2 9.6 10.2 11.1 V14.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.2 14.2 V8 C10.2 6.9 11 6.1 12.1 6.1 C13.2 6.1 14 6.9 14 8 V14.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 12 C15 11.6 16.1 12.3 16.4 13.4 L17.8 18.4" fill="none" stroke="currentColor" stroke-width="2"/>',script:'<path d="M6 4.6 H13.8 L18 8.8 V19.4 H6 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" stroke-width="1.9"/><line x1="8.5" y1="15.5" x2="14.2" y2="15.5" stroke="currentColor" stroke-width="1.9"/>',send:'<rect x="3.8" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 8.1 L10.4 12.5 L17 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="16.8" y1="11.7" x2="22" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="22,11.7 18.9,9.5 18.9,13.9" fill="currentColor"/>',receive:'<rect x="7" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8.1 L13.6 12.5 L20.2 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="2" y1="11.7" x2="7.2" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="2,11.7 5.1,9.5 5.1,13.9" fill="currentColor"/>',"business-rule":'<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/><line x1="9.2" y1="5" x2="9.2" y2="19" stroke="currentColor" stroke-width="2"/>',"call-activity":'<rect x="4" y="6" width="16" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="7" y="9" width="10" height="6" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/>',automatic:'<polygon points="8,4 5,12.5 10,12.5 8.2,20 18.4,9.4 12.8,9.4 14.4,4" fill="currentColor"/>'};return t.setAttribute("title",e),t.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${i[e]}</svg>`,t}getIconKind(e,t){const i=Object.values(t?.properties??{}).filter(a=>typeof a=="string").join(" ").toLowerCase(),n=`${e} ${i}`,s=this.getEventFlavor(n);return e.includes("usertask")?"task-user":e.includes("servicetask")||e.includes("service")?"task-service":e.includes("manualtask")||e.includes("manual")?"task-manual":e.includes("scripttask")||e.includes("script")?"task-script":e.includes("sendtask")?"task-send":e.includes("receivetask")?"task-receive":e.includes("businessruletask")||e.includes("decision")?"task-business-rule":e.includes("automatic")?"task-automatic":e.includes("transaction")?"transaction":e.includes("callactivity")?"call-activity":e.includes("subprocess")?"subprocess":e.includes("parallelgateway")?"gateway-parallel":e.includes("inclusivegateway")?"gateway-inclusive":e.includes("eventbasedgateway")?"gateway-event":e.includes("complexgateway")?"gateway-complex":e.includes("gateway")?"gateway-exclusive":e.includes("boundaryevent")?s?`event-boundary-${s}`:"event-boundary":e.includes("startevent")?s?`event-start-${s}`:"event-start":e.includes("endevent")?s?`event-end-${s}`:"event-end":e.includes("event")?s?`event-intermediate-${s}`:"event-intermediate":e.includes("messageflow")?"message-flow":e.includes("sequenceflow")?"sequence-flow":e.includes("association")?"association":e.includes("dataobject")?"data-object":e.includes("datastore")?"data-store":e.includes("group")?"group":e.includes("conversation")?"conversation":e.includes("choreography")?"choreography-task":e.includes("pool")||e.includes("lane")||e.includes("participant")?"pool-lane":e.includes("annotation")?"annotation":e.includes("message")?"message":e.includes("task")||e.includes("activity")||e.includes("callactivity")?"task":"generic"}getEventFlavor(e){return e.includes("timer")?"timer":e.includes("message")?"message":e.includes("signal")?"signal":e.includes("conditional")?"conditional":e.includes("linkevent")||e.includes(" link ")?"link":e.includes("multiple")?"multiple":e.includes("error")?"error":e.includes("compensation")?"compensation":e.includes("escalation")?"escalation":e.includes("terminate")?"terminate":""}hasRoundedBackground(e){return!1}getIconSvg(e){const t='<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';if(e.startsWith("event-start-"))return this.getEventSvg("start",e.replace("event-start-",""));if(e.startsWith("event-intermediate-"))return this.getEventSvg("intermediate",e.replace("event-intermediate-",""));if(e.startsWith("event-end-"))return this.getEventSvg("end",e.replace("event-end-",""));if(e.startsWith("event-boundary-"))return this.getEventSvg("boundary",e.replace("event-boundary-",""));switch(e){case"task":return t;case"task-user":return this.getTaskWithGlyph('<circle cx="70" cy="45" r="9" fill="#5f5f5f"/><path d="M52 67 C52 57 60 52 70 52 C80 52 88 57 88 67" fill="#5f5f5f"/>');case"task-service":return this.getTaskWithGlyph('<circle cx="70" cy="52" r="13" fill="none" stroke="#5f5f5f" stroke-width="2.6"/><circle cx="70" cy="52" r="4" fill="#5f5f5f"/><line x1="70" y1="36" x2="70" y2="40" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="64" x2="70" y2="68" stroke="#5f5f5f" stroke-width="2.2"/><line x1="54" y1="52" x2="58" y2="52" stroke="#5f5f5f" stroke-width="2.2"/><line x1="82" y1="52" x2="86" y2="52" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-manual":return this.getTaskWithGlyph('<path d="M58 66 V50 C58 48 59.2 46.8 61 46.8 C62.8 46.8 64 48 64 50 V56" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M64 56 V45 C64 42.8 65.4 41.4 67.4 41.4 C69.3 41.4 70.8 42.8 70.8 45 V56.5" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M70.8 54.8 C72.5 53.8 74.8 54.4 75.8 56.2 L79.2 62" fill="none" stroke="#5f5f5f" stroke-width="2.4"/>');case"task-script":return this.getTaskWithGlyph('<path d="M59 37 H77 L84 44 V67 H59 Z" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><line x1="63" y1="50" x2="80" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><line x1="63" y1="57" x2="78" y2="57" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-send":return this.getTaskWithGlyph('<rect x="56" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M56 44 L67 51 L78 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="78" y1="50" x2="88" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="88,50 82,46.2 82,53.8" fill="#5f5f5f"/>');case"task-receive":return this.getTaskWithGlyph('<rect x="62" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M62 44 L73 51 L84 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="52" y1="50" x2="62" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="52,50 58,46.2 58,53.8" fill="#5f5f5f"/>');case"task-business-rule":return this.getTaskWithGlyph('<rect x="56" y="39" width="28" height="22" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="56" y1="48" x2="84" y2="48" stroke="#5f5f5f" stroke-width="2.2"/><line x1="65" y1="39" x2="65" y2="61" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-automatic":return this.getTaskWithGlyph('<polygon points="66,36 60,52 68,52 65,67 82,46 74,46 77,36" fill="#5f5f5f"/>');case"subprocess":return'<rect x="20" y="18" width="100" height="68" rx="15" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="64" y1="74" x2="76" y2="74" stroke="#666" stroke-width="2.4"/><line x1="70" y1="68" x2="70" y2="80" stroke="#666" stroke-width="2.4"/>';case"call-activity":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#505050" stroke-width="4"/><rect x="22" y="24" width="96" height="56" rx="12" fill="none" stroke="#646464" stroke-width="2"/>';case"transaction":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="24" y="26" width="92" height="52" rx="10" fill="none" stroke="#666" stroke-width="2.2"/>';case"gateway-exclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="55" y1="38" x2="85" y2="66" stroke="#636363" stroke-width="3"/><line x1="85" y1="38" x2="55" y2="66" stroke="#636363" stroke-width="3"/>';case"gateway-parallel":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="33" x2="70" y2="71" stroke="#636363" stroke-width="3.2"/><line x1="51" y1="52" x2="89" y2="52" stroke="#636363" stroke-width="3.2"/>';case"gateway-inclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="17" fill="none" stroke="#666" stroke-width="3"/>';case"gateway-event":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="14" fill="none" stroke="#666" stroke-width="2.6"/><polygon points="70,38 76,50 70,64 64,50" fill="#666"/>';case"gateway-complex":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="32" x2="70" y2="72" stroke="#666" stroke-width="2.6"/><line x1="50" y1="52" x2="90" y2="52" stroke="#666" stroke-width="2.6"/><line x1="55" y1="37" x2="85" y2="67" stroke="#666" stroke-width="2.4"/><line x1="85" y1="37" x2="55" y2="67" stroke="#666" stroke-width="2.4"/>';case"event-start":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"event-end":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#4d4d4d" stroke-width="5"/>';case"event-intermediate":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>';case"event-boundary":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/><circle cx="70" cy="52" r="6" fill="#737373"/>';case"sequence-flow":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/><polygon points="120,52 102,42 102,62" fill="#5a5a5a"/>';case"message-flow":return'<line x1="16" y1="52" x2="120" y2="52" stroke="#6a6a6a" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/><polygon points="120,52 103,42 103,62" fill="#6a6a6a"/><rect x="52" y="35" width="34" height="24" rx="2" fill="#f6f4d4" stroke="#666" stroke-width="2"/>';case"association":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#737373" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>';case"data-object":return'<path d="M32 18 H90 L108 36 V86 H32 Z" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M90 18 V36 H108" fill="none" stroke="#575757" stroke-width="3"/>';case"data-store":return'<ellipse cx="70" cy="28" rx="34" ry="11" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M36 28 V76 C36 83 51 88 70 88 C89 88 104 83 104 76 V28" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><ellipse cx="70" cy="28" rx="23" ry="7" fill="none" stroke="#666" stroke-width="1.8"/><path d="M40 48 C40 54 54 58 70 58 C86 58 100 54 100 48" fill="none" stroke="#666" stroke-width="1.8"/>';case"pool-lane":return'<rect x="16" y="16" width="108" height="72" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="42" y1="16" x2="42" y2="88" stroke="#666" stroke-width="2.6"/><line x1="42" y1="52" x2="124" y2="52" stroke="#666" stroke-width="2.2"/>';case"annotation":return'<path d="M34 20 H94 L108 34 V84 H34 Z" fill="#f6f4d4" stroke="#666" stroke-width="3"/><path d="M94 20 V34 H108" fill="none" stroke="#666" stroke-width="3"/><line x1="42" y1="44" x2="97" y2="44" stroke="#777" stroke-width="2"/><line x1="42" y1="56" x2="97" y2="56" stroke="#777" stroke-width="2"/><line x1="42" y1="68" x2="85" y2="68" stroke="#777" stroke-width="2"/>';case"group":return'<rect x="18" y="18" width="104" height="68" rx="10" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="7 6"/>';case"conversation":return'<polygon points="70,14 116,38 116,66 70,90 24,66 24,38" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"choreography-task":return'<rect x="16" y="18" width="108" height="68" rx="10" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="16" y="18" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/><rect x="16" y="72" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/>';case"message":return'<rect x="24" y="24" width="92" height="56" rx="8" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M24 28 L70 58 L116 28" fill="none" stroke="#666" stroke-width="2.8"/>';default:return t}}getTaskWithGlyph(e){return`<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>${e}`}getEventSvg(e,t){let n=`<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="${e==="end"?"5":"3"}"/>`;return(e==="intermediate"||e==="boundary")&&(n+='<circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>'),e==="boundary"&&(n+='<circle cx="70" cy="52" r="31" fill="none" stroke="#575757" stroke-width="2" stroke-dasharray="3.5 2.8"/>'),`${n}${this.getEventFlavorSymbol(t)}`}getEventFlavorSymbol(e){switch(e){case"timer":return'<circle cx="70" cy="52" r="12" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="76" y2="55" stroke="#5f5f5f" stroke-width="2.2"/>';case"message":return'<rect x="58" y="43" width="24" height="18" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M58 45 L70 53 L82 45" fill="none" stroke="#5f5f5f" stroke-width="1.9"/>';case"signal":return'<path d="M57 57 C60 51 64 49 70 49 C76 49 80 51 83 57" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M60 61 C63 57 66 55.5 70 55.5 C74 55.5 77 57 80 61" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><circle cx="70" cy="64" r="2.3" fill="#5f5f5f"/>';case"conditional":return'<rect x="58" y="41" width="24" height="22" rx="2.5" fill="none" stroke="#5f5f5f" stroke-width="2.1"/><line x1="62" y1="48" x2="78" y2="48" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="54" x2="78" y2="54" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="60" x2="74" y2="60" stroke="#5f5f5f" stroke-width="2"/>';case"link":return'<path d="M62 52 C62 49 64 47 67 47 H72" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M72 47 L69.5 44.6 M72 47 L69.5 49.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M78 52 C78 55 76 57 73 57 H68" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M68 57 L70.5 54.6 M68 57 L70.5 59.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/>';case"multiple":return'<circle cx="64" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="70" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="76" cy="52" r="2.6" fill="#5f5f5f"/>';case"error":return'<line x1="62" y1="44" x2="78" y2="60" stroke="#5f5f5f" stroke-width="2.5"/><line x1="78" y1="44" x2="62" y2="60" stroke="#5f5f5f" stroke-width="2.5"/>';case"compensation":return'<polygon points="70,52 78,47 78,57" fill="#5f5f5f"/><polygon points="62,52 70,47 70,57" fill="#5f5f5f"/>';case"escalation":return'<line x1="70" y1="60" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="70,42 77,49 63,49" fill="#5f5f5f"/>';case"terminate":return'<rect x="63" y="45" width="14" height="14" fill="#5f5f5f"/>';default:return""}}moveSelectionByKey(e){const t=this.filtered.findIndex(s=>s.id===this.selectedId);if(t<0)return;const i=this.getColumnCount();let n=t;e==="ArrowLeft"?n=t-1:e==="ArrowRight"?n=t+1:e==="ArrowUp"?n=t-i:e==="ArrowDown"&&(n=t+i),n=Math.max(0,Math.min(this.filtered.length-1,n)),this.selectedId=this.filtered[n]?.id??this.selectedId,this.updateSelectedCardClasses(),this.scrollSelectedCardToTopIfOutOfView()}scrollSelectedCardToTopIfOutOfView(){if(!this.selectedId)return;const e=this.cardById.get(this.selectedId);if(!e)return;const t=this.listWrap.getBoundingClientRect(),i=e.getBoundingClientRect(),n=10;if(!(i.top<t.top+n||i.bottom>t.bottom))return;const a=i.top-t.top,o=this.listWrap.scrollTop+a-n;this.listWrap.scrollTo({top:Math.max(0,o),behavior:"smooth"})}moveSelectionToLeftNeighborOnDelete(){const e=this.filtered.findIndex(t=>t.id===this.selectedId);if(!(e<0)){if(e>0){this.selectedId=this.filtered[e-1]?.id??null;return}this.selectedId=this.filtered[1]?.id??null}}onKeyDown=e=>{if(!this.opened)return;if(e.stopPropagation(),e.key==="Escape"){e.preventDefault(),this.close();return}const t=this.getSelectedFavorite();if(e.altKey&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault(),t&&(this.enterListMode(),this.moveSelectionToLeftNeighborOnDelete(),this.actions.onDelete(t));return}const i=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key),n=e.key.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey;if(this.mode==="search"){if(e.key==="Delete"||e.key==="Backspace")return;if(i||e.key==="Enter"){if(e.preventDefault(),this.enterListMode(),i){this.moveSelectionByKey(e.key);return}t&&(this.close(),this.actions.onInsert(t));return}return}if(n){e.preventDefault(),this.enterSearchMode(e.key);return}if(t){if(e.key==="Enter"){e.preventDefault(),this.close(),this.actions.onInsert(t);return}if(e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();const s=e.key==="ArrowUp"?"up":"down";this.actions.onMove(t,s);return}if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();return}i&&(e.preventDefault(),this.moveSelectionByKey(e.key))}};onResize=()=>{this.opened&&this.scheduleTypeLabelFit()};getColumnCount(){const e=this.grid.clientWidth;return e<=0?4:Math.max(1,Math.floor(e/et))}getStyles(){return`
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .bpkeys-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483600;
        display: none;
        align-items: center;
        justify-content: center;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .bpkeys-wrapper.open {
        display: flex;
      }

      .bpkeys-scrim {
        position: absolute;
        inset: 0;
        background: rgba(10, 12, 14, 0.2);
        backdrop-filter: blur(3px);
      }

      .bpkeys-panel {
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

      .bpkeys-top-row {
        display: flex;
        align-items: center;
      }

      .bpkeys-search-shell {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 9px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        padding: 8px 11px;
      }

      .bpkeys-search-icon {
        width: 18px;
        height: 18px;
        color: rgba(236, 236, 236, 0.88);
        display: inline-flex;
        flex: 0 0 auto;
      }

      .bpkeys-search-icon svg {
        width: 100%;
        height: 100%;
      }

      .bpkeys-search {
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

      .bpkeys-search::placeholder {
        color: rgba(236, 236, 236, 0.88);
      }

      .bpkeys-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .bpkeys-list-wrap {
        overflow-x: hidden;
        overflow-y: auto;
        min-height: 0;
        padding: 10px 2px;
        margin: -12px 0;
      }

      .bpkeys-list-wrap::-webkit-scrollbar {
        width: 8px;
      }

      .bpkeys-list-wrap::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.16);
        border-radius: 999px;
      }

      .bpkeys-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 14px;
        align-content: start;
        width: 100%;
        padding: 2px;
      }

      .bpkeys-card {
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

      .bpkeys-card:hover {
        transform: translateY(-1px);
        box-shadow: 0 5px 16px -4px rgba(0, 0, 0, 0.4);
      }

      .bpkeys-card.selected {
        background: #474950b0;
        border-color: rgba(236, 236, 236, 0.72);
        box-shadow: 0 0 0 1px rgba(236, 236, 236, 0.18) inset;
      }

      .bpkeys-preview {
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

      .bpkeys-preview.rounded-bg {
        background: rgba(24, 28, 35, 0.84);
        border-color: rgba(228, 228, 228, 0.18);
      }

      .bpkeys-preview.shape-only {
        border: none;
      }

      .bpkeys-preview.has-content {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.08) inset;
      }

      .bpkeys-preview.is-empty {
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
      }

      .bpkeys-preview-svg {
        width: 80%;
        height: 100%;
        overflow: visible;
        transform: translateY(-8px);
      }

      .bpkeys-preview-stack {
        position: relative;
        width: 100%;
        height: 100%;
        transform: translateY(-5px);
      }

      .bpkeys-preview-bubble {
        position: absolute;
        border-radius: 12px;
        background: #313338;
        border: 1px solid rgba(241, 241, 241, 0.16);
        box-shadow: 0 7px 14px rgba(0, 0, 0, 0.22);
        overflow: hidden;
      }

      .bpkeys-preview-bubble-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

.bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
	width: 69px;
	height: 54px;
	left: calc(50% - 69px);
	top: 33px;
	z-index: 1;
}

      .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
        width: 69px;
        height: 54px;
        left: calc(50% + 3px);
        top: 16px;
        z-index: 2;
      }

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
	width: 52px;
	height: 41px;
	left: 23px;
	top: 41px;
	z-index: 1;
}

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
	width: 52px;
	height: 41px;
	left: 96px;
	top: 46px;
	z-index: 2;
}

.bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
	width: 52px;
	height: 41px;
	left: 50px;
	top: 14px;
	z-index: 3;
}

      .bpkeys-preview.is-empty .bpkeys-preview-svg {
        opacity: 0.94;
      }

      .bpkeys-type-inline {
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

      .bpkeys-type-badge-center {
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

      .bpkeys-type-badge-center svg {
        width: 25px;
        height: 25px;
      }

      .bpkeys-badge-row {
        position: absolute;
        top: -6px;
        right: -6px;
        display: flex;
        gap: 4px;
      }

      .bpkeys-badge {
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

      .bpkeys-badge svg {
        width: 16px;
        height: 16px;
      }

      .bpkeys-card-label {
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

      .bpkeys-empty {
        display: none;
        font-size: 14px;
        color: rgba(243, 243, 243, 0.86);
        padding: 6px 2px;
      }

      .bpkeys-footer-divider {
        height: 1px;
        border-radius: 999px;
        background: rgba(246, 246, 246, 0.22);
      }

      .bpkeys-hints {
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

      .bpkeys-hint-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }

      .bpkeys-hint-action {
        font-size: 12px;
        font-weight: 500;
        letter-spacing: 0.01em;
      }

      .bpkeys-hint-key {
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        padding: 4px 7px;
        border-radius: 7px;
        background: rgba(176, 182, 192, 0.18);
        border: 1px solid rgba(210, 214, 220, 0.22);
        color: #f2f2f2;
      }

      .bpkeys-hint-separator {
        margin: 0 3px;
        font-size: 12px;
        color: rgba(243, 243, 243, 0.44);
      }

      @media (max-width: 1000px) {
        .bpkeys-panel {
          width: min(900px, calc(100vw - 12px));
          min-height: min(500px, calc(100vh - 12px));
          max-height: calc(100vh - 12px);
          border-radius: 24px;
          padding: 14px;
          gap: 9px;
        }

        .bpkeys-search {
          font-size: 15px;
        }

        .bpkeys-grid {
          grid-template-columns: repeat(auto-fill, minmax(138px, 1fr));
          gap: 10px;
        }

        .bpkeys-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 18px;
        }

        .bpkeys-preview {
          width: min(100%, 120px);
          height: 86px;
          border-radius: 14px;
          margin-bottom: 6px;
          padding-bottom: 12px;
        }

        .bpkeys-preview-svg {
          transform: translateY(-4px);
        }

        .bpkeys-preview-stack {
          transform: translateY(-3px);
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
          width: 44px;
          height: 32px;
          left: calc(50% - 45px);
          top: 21px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
          width: 44px;
          height: 32px;
          left: calc(50% + 1px);
          top: 15px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
          width: 38px;
          height: 28px;
          left: 8px;
          top: 28px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
          width: 38px;
          height: 28px;
          left: 56px;
          top: 20px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
          width: 38px;
          height: 28px;
          left: 32px;
          top: 8px;
        }

        .bpkeys-type-badge-center {
          width: 32px;
          height: 32px;
          top: 50%;
        }

        .bpkeys-type-badge-center svg {
          width: 20px;
          height: 20px;
        }

        .bpkeys-type-inline {
          left: 8px;
          right: 8px;
          bottom: 4px;
          font-size: 11px;
        }

        .bpkeys-card-label {
          font-size: 11px;
          padding: 0 8px 8px;
          max-height: calc(1.2em * 3);
        }

        .bpkeys-hints {
          gap: 6px;
          row-gap: 5px;
        }

        .bpkeys-hint-action {
          font-size: 11px;
        }

        .bpkeys-hint-key {
          font-size: 10px;
          padding: 3px 6px;
        }
      }

      @media (max-width: 700px) {
        .bpkeys-panel {
          width: calc(100vw - 10px);
          min-height: min(460px, calc(100vh - 10px));
          max-height: calc(100vh - 10px);
          border-radius: 20px;
          padding: 12px;
          gap: 8px;
        }

        .bpkeys-grid {
          grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
          gap: 8px;
        }

        .bpkeys-card {
          height: auto;
          min-height: 0;
          grid-template-rows: auto auto;
          border-radius: 16px;
        }

        .bpkeys-preview {
          width: min(100%, 112px);
          height: 82px;
          margin-top: 8px;
          margin-bottom: 5px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-1 {
          width: 40px;
          height: 30px;
          left: calc(50% - 42px);
          top: 20px;
        }

        .bpkeys-preview-stack.count-2 .bpkeys-preview-bubble.slot-2 {
          width: 40px;
          height: 30px;
          left: calc(50% + 2px);
          top: 14px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-1 {
          width: 35px;
          height: 26px;
          left: 8px;
          top: 27px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-2 {
          width: 35px;
          height: 26px;
          left: 52px;
          top: 19px;
        }

        .bpkeys-preview-stack.count-3 .bpkeys-preview-bubble.slot-3 {
          width: 35px;
          height: 26px;
          left: 30px;
          top: 8px;
        }

        .bpkeys-type-badge-center {
          width: 30px;
          height: 30px;
          top: 50%;
        }

        .bpkeys-type-badge-center svg {
          width: 18px;
          height: 18px;
        }

        .bpkeys-card-label {
          font-size: 10px;
          padding: 0 7px 7px;
        }

        .bpkeys-hints {
          gap: 5px;
          row-gap: 4px;
        }

        .bpkeys-hint-action {
          font-size: 10px;
        }

        .bpkeys-hint-key {
          font-size: 9px;
          padding: 3px 5px;
        }
      }
    `}}const m=[{id:"none",label:"None"},{id:"send",label:"Send"},{id:"receive",label:"Receive"},{id:"script",label:"Script"},{id:"service",label:"Service"},{id:"user",label:"User"},{id:"manual",label:"Manual"},{id:"business-rule",label:"Business Rule"}],T=6,C=10,rt=850,ce=(r,e,t)=>Math.min(t,Math.max(e,r)),Q=r=>r.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(),it=r=>String(r+1);class nt{host;root;wrapper;anchor;panel;subtitle;list;actions;supportsCssAnchors;optionButtons=new Map;opened=!1;applying=!1;altKeyPressed=!1;optionHintsVisible=!1;selectedIndex=0;currentTaskType=null;shapeId=null;anchorRect=null;typedQuery="";typedQueryTimer=null;constructor(e){this.actions=e,this.supportsCssAnchors=!1,this.host=document.createElement("div"),this.host.id="bpkeys-quick-menu-host",this.root=this.host.attachShadow({mode:"open"});const t=document.createElement("style");t.textContent=this.getStyles(),this.wrapper=document.createElement("div"),this.wrapper.className="bpkeys-quick-wrapper";const i=document.createElement("div");i.className="bpkeys-quick-scrim",i.addEventListener("pointerdown",()=>this.close()),this.anchor=document.createElement("div"),this.anchor.className="bpkeys-quick-anchor",this.panel=document.createElement("section"),this.panel.className="bpkeys-quick-panel",this.panel.addEventListener("pointerdown",o=>o.stopPropagation()),this.panel.addEventListener("click",o=>o.stopPropagation());const n=document.createElement("div");n.className="bpkeys-quick-header";const s=document.createElement("h2");s.className="bpkeys-quick-title",s.textContent="Change Type",this.subtitle=document.createElement("div"),this.subtitle.className="bpkeys-quick-subtitle";const a=document.createElement("div");a.className="bpkeys-quick-divider",this.list=document.createElement("div"),this.list.className="bpkeys-quick-list",this.list.setAttribute("role","listbox"),this.list.setAttribute("aria-label","Task type options"),n.append(s,this.subtitle),this.panel.append(n,a,this.list),this.wrapper.append(i,this.anchor,this.panel),this.root.append(t,this.wrapper),window.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("keyup",this.onKeyUp,!0),window.addEventListener("blur",this.onWindowBlur),window.addEventListener("resize",this.onResize,{passive:!0}),document.documentElement.appendChild(this.host)}isOpen(){return this.opened}getShapeId(){return this.shapeId}open(e){this.opened=!0,this.optionHintsVisible=this.altKeyPressed,this.typedQuery="",this.currentTaskType=e.taskType,this.shapeId=e.shapeId,this.anchorRect=e.anchorRect,this.selectedIndex=Math.max(0,m.findIndex(t=>t.id===e.taskType)),this.wrapper.classList.add("open"),this.render(),this.syncAnchor(),window.requestAnimationFrame(()=>{this.syncPosition(),this.focusSelectedButton()})}close(){this.opened&&(this.opened=!1,this.applying=!1,this.optionHintsVisible=!1,this.resetTypedQuery(),this.shapeId=null,this.wrapper.classList.remove("open"),this.panel.style.left="",this.panel.style.top="",delete this.panel.dataset.optionHints,this.actions.onClose())}render(){this.optionButtons.clear(),this.list.replaceChildren();const e=m.find(t=>t.id===this.currentTaskType)?.label??"Unknown";this.subtitle.textContent=this.currentTaskType!==null?`Current: ${e}`:"Choose a type";for(const[t,i]of m.entries()){const n=document.createElement("button");n.type="button",n.className="bpkeys-quick-option",n.dataset.selected=String(t===this.selectedIndex),n.dataset.current=String(i.id===this.currentTaskType),n.setAttribute("role","option"),n.setAttribute("aria-selected",String(t===this.selectedIndex)),n.disabled=this.applying,n.addEventListener("mouseenter",()=>{this.selectedIndex=t,this.updateSelectedOption()}),n.addEventListener("focus",()=>{this.selectedIndex=t,this.updateSelectedOption()}),n.addEventListener("click",()=>{this.applyOption(i.id)});const s=document.createElement("span");s.className="bpkeys-quick-icon",s.setAttribute("aria-hidden","true"),s.innerHTML=this.getTaskTypeIconSvg(i.id);const a=document.createElement("span");a.className="bpkeys-quick-label",a.textContent=i.label;const o=document.createElement("span");if(o.className="bpkeys-quick-shortcut",o.textContent=it(t),o.setAttribute("aria-hidden","true"),n.append(s,a),i.id===this.currentTaskType){const l=document.createElement("span");l.className="bpkeys-quick-current",l.textContent="Current",n.append(l)}n.append(o),this.list.appendChild(n),this.optionButtons.set(i.id,n)}this.updateSelectedOption(),this.syncOptionHints()}updateSelectedOption(){m.forEach((e,t)=>{const i=this.optionButtons.get(e.id);if(!i)return;const n=t===this.selectedIndex;i.dataset.selected=String(n),i.setAttribute("aria-selected",String(n))})}syncOptionHints(){this.panel.dataset.optionHints=String(this.optionHintsVisible)}focusSelectedButton(){const e=m[this.selectedIndex],t=e?this.optionButtons.get(e.id):null;t&&(t.focus({preventScroll:!0}),t.scrollIntoView({block:"nearest"}))}async applyOption(e){if(this.applying)return;this.applying=!0,this.panel.dataset.applying="true";for(const i of this.optionButtons.values())i.disabled=!0;const t=await this.actions.onApply(e).catch(()=>!1);if(this.applying=!1,delete this.panel.dataset.applying,t){this.close();return}for(const i of this.optionButtons.values())i.disabled=!1;this.focusSelectedButton()}moveSelection(e){const t=m.length;this.selectedIndex=(this.selectedIndex+e+t)%t,this.updateSelectedOption(),this.focusSelectedButton()}resetTypedQuery(){this.typedQueryTimer!==null&&(window.clearTimeout(this.typedQueryTimer),this.typedQueryTimer=null),this.typedQuery=""}scheduleTypedQueryReset(){this.typedQueryTimer!==null&&window.clearTimeout(this.typedQueryTimer),this.typedQueryTimer=window.setTimeout(()=>{this.typedQuery="",this.typedQueryTimer=null},rt)}getMatchingOptionIndex(e){const t=Q(e);return t?m.map((n,s)=>{const a=Q(n.label),o=a.split(/\s+/).filter(Boolean),l=o.map(d=>d[0]||"").join("");let c=-1;if(a===t)c=1e3;else if(a.startsWith(t))c=900-a.length;else if(o.some(d=>d.startsWith(t)))c=760-a.length;else if(l.startsWith(t))c=680-l.length;else{const d=a.indexOf(t);d>=0&&(c=520-d)}return{index:s,score:c}}).filter(n=>n.score>=0).sort((n,s)=>s.score-n.score||n.index-s.index)[0]?.index??-1:-1}handleTypeaheadInput(e){const t=Q(e);if(!t)return!1;const i=`${this.typedQuery}${t}`;let n=this.getMatchingOptionIndex(i);if(n>=0)this.typedQuery=i;else{if(n=this.getMatchingOptionIndex(t),n<0)return!1;this.typedQuery=t}return this.scheduleTypedQueryReset(),this.selectedIndex=n,this.updateSelectedOption(),this.focusSelectedButton(),!0}getShortcutOption(e){if(!e.altKey)return null;const t=e.code||"";let i=-1;return t.startsWith("Digit")?i=Number.parseInt(t.slice(5),10)-1:t.startsWith("Numpad")&&(i=Number.parseInt(t.slice(6),10)-1),Number.isNaN(i)||i<0||i>=m.length?null:m[i]?.id??null}syncAnchor(){const e=this.anchorRect;if(!e){this.anchor.style.left=`${window.innerWidth/2}px`,this.anchor.style.top=`${window.innerHeight/2}px`,this.anchor.style.width="1px",this.anchor.style.height="1px";return}this.anchor.style.left=`${e.left}px`,this.anchor.style.top=`${e.top}px`,this.anchor.style.width=`${Math.max(1,e.width)}px`,this.anchor.style.height=`${Math.max(1,e.height)}px`}syncPosition(){if(this.opened){if(this.syncAnchor(),this.supportsCssAnchors){this.panel.dataset.anchored="true",this.panel.style.left="",this.panel.style.top="",window.requestAnimationFrame(()=>{if(!this.opened)return;const e=this.panel.getBoundingClientRect();(e.left<C||e.top<C||e.right>window.innerWidth-C||e.bottom>window.innerHeight-C)&&this.applyFallbackPosition()});return}this.applyFallbackPosition()}}applyFallbackPosition(){this.panel.dataset.anchored="false";const e=this.panel.offsetWidth||260,t=this.panel.offsetHeight||320;let i=(window.innerWidth-e)/2,n=(window.innerHeight-t)/2;if(this.anchorRect){const s=this.anchorRect,a=window.innerWidth-s.right-T,o=s.left-T,l=window.innerHeight-s.bottom-T,c=s.top-T;a>=e?i=s.right+T:o>=e?i=s.left-e-T:i=s.left+s.width/2-e/2,l>=t?n=s.top-4:c>=t?n=s.bottom-t+4:n=s.top+s.height/2-t/2}this.panel.style.left=`${ce(i,C,window.innerWidth-e-C)}px`,this.panel.style.top=`${ce(n,C,window.innerHeight-t-C)}px`}onKeyDown=e=>{if(e.key==="Alt"&&(this.altKeyPressed=!0,this.opened&&(this.optionHintsVisible=!0,this.syncOptionHints())),!this.opened)return;e.stopPropagation();const t=this.getShortcutOption(e);if(t){e.preventDefault(),this.applyOption(t);return}if(e.key==="Escape"){e.preventDefault(),this.close();return}if(e.key==="ArrowDown"){e.preventDefault(),this.moveSelection(1);return}if(e.key==="ArrowUp"){e.preventDefault(),this.moveSelection(-1);return}if(e.key==="Home"){e.preventDefault(),this.selectedIndex=0,this.updateSelectedOption(),this.focusSelectedButton();return}if(e.key==="End"){e.preventDefault(),this.selectedIndex=m.length-1,this.updateSelectedOption(),this.focusSelectedButton();return}if(e.key==="Enter"){e.preventDefault();const i=m[this.selectedIndex];i&&this.applyOption(i.id);return}if(e.key==="Backspace"){e.preventDefault(),this.typedQuery.length>0&&(this.typedQuery=this.typedQuery.slice(0,-1),this.scheduleTypedQueryReset());return}!e.metaKey&&!e.ctrlKey&&!e.altKey&&e.key.length===1&&/\S/.test(e.key)&&(e.preventDefault(),this.handleTypeaheadInput(e.key))};onKeyUp=e=>{e.key==="Alt"&&(this.altKeyPressed=!1),this.opened&&e.key==="Alt"&&(this.optionHintsVisible=!1,this.syncOptionHints())};onWindowBlur=()=>{this.altKeyPressed=!1,this.opened&&(this.optionHintsVisible=!1,this.syncOptionHints())};onResize=()=>{this.opened&&this.syncPosition()};getTaskTypeIconSvg(e){return{none:'<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="6" width="16" height="12" rx="3.2" stroke="currentColor" stroke-width="1.9"/><line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',send:'<svg viewBox="0 0 24 24" fill="none"><rect x="3.8" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M3.8 7.8 L10.3 12.1 L16.8 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="16.8" y1="11.1" x2="21" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M21 11.1 L18.5 9.2 M21 11.1 L18.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',receive:'<svg viewBox="0 0 24 24" fill="none"><rect x="7.2" y="6.5" width="13" height="9.2" rx="2" stroke="currentColor" stroke-width="1.9"/><path d="M7.2 7.8 L13.7 12.1 L20.2 7.8" stroke="currentColor" stroke-width="1.6"/><line x1="3" y1="11.1" x2="7.2" y2="11.1" stroke="currentColor" stroke-width="1.9"/><path d="M3 11.1 L5.5 9.2 M3 11.1 L5.5 13" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>',script:'<svg viewBox="0 0 24 24" fill="none"><path d="M6 4.6 H13.7 L18 8.9 V19.4 H6 Z" stroke="currentColor" stroke-width="1.9"/><line x1="8.4" y1="11.5" x2="15.8" y2="11.5" stroke="currentColor" stroke-width="1.7"/><line x1="8.4" y1="15.2" x2="14.3" y2="15.2" stroke="currentColor" stroke-width="1.7"/></svg>',service:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="6.6" stroke="currentColor" stroke-width="1.9"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><line x1="12" y1="2.8" x2="12" y2="5.1" stroke="currentColor" stroke-width="1.8"/><line x1="12" y1="18.9" x2="12" y2="21.2" stroke="currentColor" stroke-width="1.8"/><line x1="2.8" y1="12" x2="5.1" y2="12" stroke="currentColor" stroke-width="1.8"/><line x1="18.9" y1="12" x2="21.2" y2="12" stroke="currentColor" stroke-width="1.8"/></svg>',user:'<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.3" fill="currentColor"/><path d="M5.2 19.2 C5.2 15.2 8 13 12 13 C16 13 18.8 15.2 18.8 19.2" fill="currentColor"/></svg>',manual:'<svg viewBox="0 0 24 24" fill="none"><path d="M6.5 19 V11.5 C6.5 10.2 7.4 9.4 8.4 9.4 C9.3 9.4 10.1 10.1 10.1 11.5 V14" stroke="currentColor" stroke-width="1.8"/><path d="M10.1 14 V8.4 C10.1 7.2 10.9 6.4 12 6.4 C13.1 6.4 13.9 7.2 13.9 8.4 V14.2" stroke="currentColor" stroke-width="1.8"/><path d="M13.9 12.4 C14.8 12 15.9 12.6 16.2 13.5 L17.6 18.2" stroke="currentColor" stroke-width="1.8"/></svg>',"business-rule":'<svg viewBox="0 0 24 24" fill="none"><rect x="4.6" y="5.3" width="14.8" height="13.4" stroke="currentColor" stroke-width="1.9"/><line x1="4.6" y1="10" x2="19.4" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="9.5" y1="5.3" x2="9.5" y2="18.7" stroke="currentColor" stroke-width="1.8"/></svg>'}[e]}getStyles(){return`
      :host {
        all: initial;
      }

      :host, :host * {
        box-sizing: border-box;
      }

      .bpkeys-quick-wrapper {
        position: fixed;
        inset: 0;
        z-index: 2147483601;
        display: none;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      .bpkeys-quick-wrapper.open {
        display: block;
      }

      .bpkeys-quick-scrim {
        position: absolute;
        inset: 0;
        background: transparent;
      }

      .bpkeys-quick-anchor {
        position: fixed;
        visibility: hidden;
        pointer-events: none;
        anchor-name: --bpkeys-quick-anchor;
      }

      .bpkeys-quick-panel {
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

      .bpkeys-quick-panel[data-anchored="true"] {
        position-anchor: --bpkeys-quick-anchor;
        top: anchor(top);
        left: anchor(right);
        margin-left: ${T}px;
        margin-top: -4px;
      }

      .bpkeys-quick-panel[data-applying="true"] {
        opacity: 0.92;
      }

      .bpkeys-quick-header {
        display: grid;
        gap: 2px;
        padding: 2px 2px 0;
      }

      .bpkeys-quick-title {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.01em;
      }

      .bpkeys-quick-subtitle {
        font-size: 10px;
        color: rgba(243, 243, 243, 0.64);
      }

      .bpkeys-quick-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.16);
      }

      .bpkeys-quick-list {
        display: grid;
        align-content: start;
        gap: 4px;
        overflow: auto;
      }

      .bpkeys-quick-option {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr) 70px 18px;
        align-items: center;
        gap: 10px;
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

      .bpkeys-quick-option:hover,
      .bpkeys-quick-option:focus-visible,
      .bpkeys-quick-option[data-selected="true"] {
        background: rgba(0, 0, 0, 0.18);
        border-color: rgba(255, 255, 255, 0.12);
        outline: none;
      }

      .bpkeys-quick-icon {
        display: grid;
        place-items: center;
        width: 24px;
        height: 24px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.07);
        color: rgba(255, 255, 255, 0.92);
      }

      .bpkeys-quick-icon svg {
        width: 16px;
        height: 16px;
      }

      .bpkeys-quick-label {
        font-size: 12px;
        line-height: 1.15;
        font-weight: 500;
        color: #f6f6f6;
      }

      .bpkeys-quick-current {
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

      .bpkeys-quick-shortcut {
        grid-column: 4;
        justify-self: end;
        min-width: 10px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(243, 243, 243, 0.62);
        opacity: 0;
        transform: translateX(-3px);
        transition: opacity 120ms ease, transform 120ms ease;
      }

      .bpkeys-quick-panel[data-option-hints="true"] .bpkeys-quick-shortcut {
        opacity: 1;
        transform: translateX(0);
      }

      @media (max-width: 720px) {
        .bpkeys-quick-panel {
          width: min(250px, calc(100vw - 12px));
          min-height: 332px;
          max-height: min(390px, calc(100vh - 12px));
          padding: 8px;
          border-radius: 14px;
        }

        .bpkeys-quick-option {
          padding: 6px 8px;
        }
      }
    `}}const st="signavio-bpkeys-hook";let w=null,I=null;const $=new Map,A=new Map,W=new Map,g=(()=>{let r=null,e=null;return t=>{r||(r=document.createElement("div"),r.style.position="fixed",r.style.right="20px",r.style.bottom="20px",r.style.zIndex="2147483647",r.style.padding="10px 14px",r.style.background="rgba(31, 31, 31, 0.92)",r.style.color="#f3f3f3",r.style.border="1px solid rgba(255, 255, 255, 0.2)",r.style.borderRadius="12px",r.style.fontFamily="system-ui, sans-serif",r.style.fontSize="13px",r.style.boxShadow="0 8px 28px rgba(0, 0, 0, 0.35)",r.style.backdropFilter="blur(3px)",document.body.appendChild(r)),r.textContent=t,r.style.opacity="1",e&&window.clearTimeout(e),e=window.setTimeout(()=>{r&&(r.style.opacity="0")},2500)}})(),ot=r=>new Promise(e=>{const t=document.createElement("div");t.style.position="fixed",t.style.inset="0",t.style.zIndex="2147483647",t.style.display="grid",t.style.placeItems="center";const i=document.createElement("div");i.style.position="absolute",i.style.inset="0",i.style.background="rgba(10, 12, 14, 0.4)",i.style.backdropFilter="blur(3px)";const n=document.createElement("div");n.style.position="relative",n.style.width="min(720px, calc(100vw - 32px))",n.style.maxWidth="100%",n.style.maxHeight="calc(100vh - 32px)",n.style.overflow="auto",n.style.boxSizing="border-box",n.style.padding="16px",n.style.borderRadius="16px",n.style.background="rgba(26, 28, 33, 0.92)",n.style.border="1px solid rgba(255, 255, 255, 0.2)",n.style.boxShadow="0 22px 54px rgba(0, 0, 0, 0.62)",n.style.display="grid",n.style.gap="12px",n.style.fontFamily='"Avenir Next", "Segoe UI", sans-serif',n.addEventListener("click",x=>x.stopPropagation());const s=document.createElement("div");s.textContent="Save Favorite",s.style.fontSize="18px",s.style.fontWeight="700",s.style.color="#f3f3f3";const a=document.createElement("label");a.textContent="Name",a.style.fontSize="12px",a.style.fontWeight="600",a.style.color="rgba(243,243,243,0.86)",a.style.display="grid",a.style.gap="6px",a.style.minWidth="0";const o=document.createElement("input");o.type="text",o.value=r.name,o.style.display="block",o.style.width="100%",o.style.maxWidth="100%",o.style.minWidth="0",o.style.boxSizing="border-box",o.style.padding="9px 11px",o.style.borderRadius="10px",o.style.border="1px solid rgba(255,255,255,0.18)",o.style.background="rgba(255,255,255,0.08)",o.style.color="#ececec",o.style.fontSize="15px",o.style.outline="none";const l=document.createElement("label");l.textContent="Content",l.style.fontSize="12px",l.style.fontWeight="600",l.style.color="rgba(243,243,243,0.86)",l.style.display="grid",l.style.gap="6px",l.style.minWidth="0";const c=document.createElement("input");c.type="text",c.value=r.content,c.style.display="block",c.style.width="100%",c.style.maxWidth="100%",c.style.minWidth="0",c.style.boxSizing="border-box",c.style.padding="9px 11px",c.style.borderRadius="10px",c.style.border="1px solid rgba(255,255,255,0.18)",c.style.background="rgba(255,255,255,0.08)",c.style.color="#ececec",c.style.fontSize="15px",c.style.outline="none",a.append(o),l.append(c);const d=document.createElement("div");d.style.display="flex",d.style.justifyContent="flex-end",d.style.gap="8px";const p=document.createElement("button");p.type="button",p.textContent="Cancel",p.style.padding="8px 12px",p.style.borderRadius="10px",p.style.border="1px solid rgba(255,255,255,0.2)",p.style.background="rgba(255,255,255,0.06)",p.style.color="#ececec",p.style.cursor="pointer";const y=document.createElement("button");y.type="button",y.textContent="Save",y.style.padding="8px 12px",y.style.borderRadius="10px",y.style.border="1px solid rgba(255,255,255,0.32)",y.style.background="rgba(255,255,255,0.16)",y.style.color="#f6f6f6",y.style.fontWeight="700",y.style.cursor="pointer",d.append(p,y),n.append(s,a,l,d),t.append(i,n),document.body.append(t);const f=x=>{document.removeEventListener("keydown",k,!0),t.remove(),e(x)},M=()=>{f({name:o.value.trim(),content:c.value.trim()})},k=x=>{if(x.key==="Escape"){x.preventDefault(),f(null);return}x.key==="Enter"&&(x.preventDefault(),M())};i.addEventListener("click",()=>f(null)),p.addEventListener("click",()=>f(null)),y.addEventListener("click",M),document.addEventListener("keydown",k,!0),window.setTimeout(()=>{o.focus(),o.select()},0)}),at=r=>{if(typeof r!="object"||r===null)return!1;const e=r,t=!("requestTemplate"in e)||e.requestTemplate===void 0||typeof e.requestTemplate=="object"&&e.requestTemplate!==null;return typeof e.namespace=="string"&&typeof e.capturedAt=="number"&&(e.source==="fetch"||e.source==="xhr"||e.source==="manual")&&"valueJson"in e&&t},de=r=>`${r}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`,lt=r=>{if(typeof r!="object"||r===null)return!1;const e=r;return typeof e.hasSelection=="boolean"&&typeof e.selectedCount=="number"&&typeof e.isTask=="boolean"&&(e.taskType===null||typeof e.taskType=="string")&&(e.shapeId===null||typeof e.shapeId=="string")},ct=()=>{if(document.getElementById("bpkeys-clipboard-hook"))return;const r=document.createElement("script");r.id="bpkeys-clipboard-hook",r.src=b.runtime.getURL("clipboard-hook.js"),r.async=!1,r.onload=()=>{r.remove()},(document.head||document.documentElement).appendChild(r)},dt=r=>{const e=$.get(r.requestId);if(e){if(window.clearTimeout(e.timer),$.delete(r.requestId),r.ok){e.resolve();return}e.reject(new Error(r.error||`Clipboard write failed (${r.status??"unknown"})`))}},pt=(r,e)=>{if(r.type!==e||typeof r.requestId!="string")return;const t=A.get(r.requestId);if(t){if(window.clearTimeout(t.timer),A.delete(r.requestId),r.ok===!1){t.reject(new Error(typeof r.error=="string"?r.error:"Editor bridge request failed"));return}t.resolve(r.result)}},ut=async()=>{const r=de("editor-query"),e=await new Promise((i,n)=>{const s=window.setTimeout(()=>{A.delete(r),n(new Error("Timed out waiting for editor selection info"))},2e4);A.set(r,{resolve:i,reject:n,timer:s}),window.postMessage({source:D,type:"editor-query-request",requestId:r,query:"selection-info"},window.location.origin)});if(!lt(e))throw new Error("Editor selection response was invalid");const t=e.shapeId&&W.has(e.shapeId)?W.get(e.shapeId)??null:null;return e.shapeId&&e.taskType&&W.set(e.shapeId,e.taskType),t&&e.isTask&&(e.taskType===null||e.taskType==="none")?{...e,taskType:t}:e.isTask&&e.taskType===null?{...e,taskType:"none"}:e},ht=async(r,e)=>{const t=de("editor-action"),i=await new Promise((s,a)=>{const o=window.setTimeout(()=>{A.delete(t),a(new Error("Timed out waiting for task type update"))},2e4);A.set(t,{resolve:s,reject:a,timer:o}),window.postMessage({source:D,type:"editor-action-request",requestId:t,action:"set-task-type",taskType:r,shapeId:e},window.location.origin)});if(typeof i!="object"||i===null||typeof i.ok!="boolean")throw new Error("Editor action response was invalid");const n=i;return n.ok&&e&&W.set(e,r),n},ft=async r=>{const e=async t=>{const i=Xe({payload:r.payload,namespace:r.namespace,requestTemplate:r.requestTemplate},{sanitize:t});await new Promise((n,s)=>{const a=window.setTimeout(()=>{$.delete(i.requestId),s(new Error("Timed out waiting for page clipboard write result"))},5e3);$.set(i.requestId,{resolve:n,reject:s,timer:a}),window.postMessage(i,window.location.origin)})};try{await e(!1)}catch(t){await e(!0).catch(i=>{throw new Error(`Clipboard write failed (raw + sanitized). First: ${String(t)}. Second: ${String(i)}`)})}},yt=()=>w||(w=new tt({onInsert:async r=>{try{await ft(r),g(`Loaded favorite: ${r.name}. Press Cmd/Ctrl+V to paste.`)}catch(e){console.error("[BPKeys] Failed to write favorite payload",e);const t=e instanceof Error?e.message:String(e);g(`Clipboard write failed: ${t.slice(0,120)}`)}},onDelete:async r=>{const e=await Ye(r.id);w?.refreshFavorites(e),g(`Deleted favorite: ${r.name}`)},onMove:async(r,e)=>{const t=await Je(r.id,e);w?.refreshFavorites(t)},onClose:()=>{}}),w),kt=r=>({none:"None",send:"Send",receive:"Receive",script:"Script",service:"Service",user:"User",manual:"Manual","business-rule":"Business Rule"})[r],gt=()=>I||(I=new nt({onApply:async r=>{try{const e=await ht(r,I?.getShapeId()??null);return e.ok?(g(`Changed task type to ${kt(r)}.`),!0):(g(e.error||"Unable to change task type."),!1)}catch(e){const t=e instanceof Error?e.message:String(e);return g(`Task type change failed: ${t.slice(0,120)}`),!1}},onClose:()=>{}}),I),xt=async()=>{const r=await le();if(!r){g("No copied Signavio snippet found yet.");return}const e=E(r.valueJson),t={name:$e(r.valueJson),content:e.contentText},i=await ot(t);if(!i)return;const n=i.name.trim();if(!n){g("Favorite name cannot be empty.");return}if(await Qe(n,r,{displayName:i.name,displayContent:i.content,defaultDisplayName:t.name,defaultDisplayContent:t.content}),w?.isOpen()){const s=await L();w.refreshFavorites(s)}g(`Saved favorite: ${n}`)},mt=async()=>{I?.isOpen()&&I.close();const r=await L();yt().toggle(r)},wt=async()=>{w?.isOpen()&&w.close();const r=gt();if(r.isOpen()){r.close();return}let e;try{e=await ut()}catch(t){const i=t instanceof Error?t.message:String(t);g(`Unable to inspect selection: ${i.slice(0,120)}`);return}if(!e.hasSelection){g("Select a task first.");return}if(e.selectedCount>1){g("Select a single task for quick type change.");return}if(!e.isTask){g("Quick type menu works on task elements only.");return}r.open(e)},bt=async r=>{if(r.type==="BPKEYS_SAVE_FAVORITE"){await xt();return}if(r.type==="BPKEYS_TOGGLE_OVERLAY"){await mt();return}r.type==="BPKEYS_TOGGLE_QUICK_MENU"&&await wt()},vt={matches:["*://*.signavio.com/*"],runAt:"document_idle",main(){ct(),(async()=>{const e=(await le())?.requestTemplate,t=e?void 0:(await L()).find(n=>n.requestTemplate)?.requestTemplate,i=e??t;i&&window.postMessage({source:D,type:"clipboard-template-bootstrap",template:i},window.location.origin)})(),window.addEventListener("message",async r=>{if(r.source!==window||r.origin!==window.location.origin)return;const e=r.data;if(!(!e||e.source!==st||typeof e.type!="string")){if(e.type==="clipboard-captured"&&at(e.payload)){await Ge(e.payload);return}if(e.type==="clipboard-write-result"&&Ze(e)){dt(e);return}(e.type==="editor-query-result"||e.type==="editor-action-result")&&pt(e,e.type==="editor-query-result"?"editor-query-result":"editor-action-result")}}),b.runtime.onMessage.addListener(r=>{if(!(!r||typeof r!="object"||!("type"in r)))return bt(r)})}};function z(r,...e){}const Ct={debug:(...r)=>z(console.debug,...r),log:(...r)=>z(console.log,...r),warn:(...r)=>z(console.warn,...r),error:(...r)=>z(console.error,...r)};var pe=class ue extends Event{static EVENT_NAME=Y("wxt:locationchange");constructor(e,t){super(ue.EVENT_NAME,{}),this.newUrl=e,this.oldUrl=t}};function Y(r){return`${b?.runtime?.id}:content:${r}`}const St=typeof globalThis.navigation?.addEventListener=="function";function Et(r){let e,t=!1;return{run(){t||(t=!0,e=new URL(location.href),St?globalThis.navigation.addEventListener("navigate",i=>{const n=new URL(i.destination.url);n.href!==e.href&&(window.dispatchEvent(new pe(n,e)),e=n)},{signal:r.signal}):r.setInterval(()=>{const i=new URL(location.href);i.href!==e.href&&(window.dispatchEvent(new pe(i,e)),e=i)},1e3))}}}var Tt=class N{static SCRIPT_STARTED_MESSAGE_TYPE=Y("wxt:content-script-started");id;abortController;locationWatcher=Et(this);constructor(e,t){this.contentScriptName=e,this.options=t,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return b.runtime?.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener("abort",e),()=>this.signal.removeEventListener("abort",e)}block(){return new Promise(()=>{})}setInterval(e,t){const i=setInterval(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearInterval(i)),i}setTimeout(e,t){const i=setTimeout(()=>{this.isValid&&e()},t);return this.onInvalidated(()=>clearTimeout(i)),i}requestAnimationFrame(e){const t=requestAnimationFrame((...i)=>{this.isValid&&e(...i)});return this.onInvalidated(()=>cancelAnimationFrame(t)),t}requestIdleCallback(e,t){const i=requestIdleCallback((...n)=>{this.signal.aborted||e(...n)},t);return this.onInvalidated(()=>cancelIdleCallback(i)),i}addEventListener(e,t,i,n){t==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(t.startsWith("wxt:")?Y(t):t,i,{...n,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),Ct.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(N.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),window.postMessage({type:N.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},"*")}verifyScriptStartedEvent(e){const t=e.detail?.contentScriptName===this.contentScriptName,i=e.detail?.messageId===this.id;return t&&!i}listenForNewerScripts(){const e=t=>{!(t instanceof CustomEvent)||!this.verifyScriptStartedEvent(t)||this.notifyInvalidated()};document.addEventListener(N.SCRIPT_STARTED_MESSAGE_TYPE,e),this.onInvalidated(()=>document.removeEventListener(N.SCRIPT_STARTED_MESSAGE_TYPE,e))}};function Nt(){}function P(r,...e){}const It={debug:(...r)=>P(console.debug,...r),log:(...r)=>P(console.log,...r),warn:(...r)=>P(console.warn,...r),error:(...r)=>P(console.error,...r)};return(async()=>{try{const{main:r,...e}=vt;return await r(new Tt("content",e))}catch(r){throw It.error('The content script "content" crashed on startup!',r),r}})()})();
content;