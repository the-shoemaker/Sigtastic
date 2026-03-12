var content=(function(){"use strict";const g=globalThis.browser?.runtime?.id?globalThis.browser:globalThis.chrome;function Qe(t){return t}const J=180,Z=180,X=260,Q=190,h=t=>typeof t=="object"&&t!==null,b=t=>!h(t)||!h(t.stencil)||typeof t.stencil.id!="string"?"":t.stencil.id,T=t=>{const e=t.toLowerCase();return e.includes("flow")||e.includes("association")||e.includes("connection")||e.includes("link")},L=t=>!h(t)||!Array.isArray(t.childShapes)?[]:t.childShapes,ee=t=>{const e=[],r=[...t];for(;r.length>0;){const n=r.pop();if(h(n)&&(e.push(n),Array.isArray(n.childShapes)))for(const i of n.childShapes)r.push(i)}return e},A=t=>structuredClone(t),O=t=>{const e=new Set;for(const r of t)typeof r.resourceId=="string"&&r.resourceId.trim()&&e.add(r.resourceId);return e},te=t=>{const e=new Map;for(const r of t){const n=crypto.randomUUID().replace(/-/g,"").slice(0,12);e.set(r,`sid-${n}`)}return e},$=(t,e)=>{if(Array.isArray(t))return t.map(n=>$(n,e));if(!h(t))return t;const r={};for(const[n,i]of Object.entries(t)){if(n==="resourceId"&&typeof i=="string"&&e.has(i)){r[n]=e.get(i);continue}r[n]=$(i,e)}return r},re=t=>{if(!Array.isArray(t.childShapes))return;let e=0;for(const r of t.childShapes){if(!h(r))continue;const n=b(r);if(T(n)||!h(r.bounds))continue;const i=r.bounds;if(!h(i.upperLeft)||!h(i.lowerRight))continue;const s=i.upperLeft,a=i.lowerRight,o=typeof a.x=="number"&&typeof s.x=="number"?Math.max(40,a.x-s.x):120,l=typeof a.y=="number"&&typeof s.y=="number"?Math.max(40,a.y-s.y):80,c=J+e%3*X,d=Z+Math.floor(e/3)*Q;i.upperLeft={x:c,y:d},i.lowerRight={x:c+o,y:d+l},e+=1}},ne=t=>{const e=L(t).filter(h);return e.length===0?null:e.find(n=>!T(b(n)))??e[0]??null},ie=t=>!t||!h(t.properties)?null:t.properties,se=["name","title","text","documentation","description","conditionexpression","conditionExpression","condition","taskname","subject","label","caption"],oe=t=>t.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim(),ae=new Set(["task","usertask","manualtask","servicetask","webservice","scripttask","sendtask","receivetask","businessruletask","callactivity","automatic","bpmn"]),le=t=>t.toLowerCase().replace(/[^a-z0-9]/g,""),ce=t=>{const e=le(t);return ae.has(e)},de=t=>{if(!t)return"";for(const e of se){const r=t[e];if(typeof r=="string"){const n=oe(r);if(n.length>0&&!ce(n))return n}}return""},pe=(t,e)=>{if(!t)return"";for(const r of e){const n=t[r];if(typeof n=="string"&&n.trim())return n.trim()}return""},ue=(t,e)=>{if(!t)return null;for(const r of e){const n=t[r];if(typeof n=="boolean")return n;if(typeof n=="number")return n!==0;if(typeof n=="string"){const i=n.trim().toLowerCase();if(["true","yes","1"].includes(i))return!0;if(["false","no","0"].includes(i))return!1}}return null},he=(t,e)=>{const r=t.toLowerCase(),n=pe(e,["tasktype","type","activitytype","implementation","trigger"]).toLowerCase(),i=`${r} ${n}`;return i.includes("callactivity")||i.includes("call activity")?"call-activity":i.includes("servicetask")||i.includes("service task")||i.includes("service")||i.includes("webservice")?"service":i.includes("usertask")||i.includes("user task")||i.includes("user")?"user":i.includes("manualtask")||i.includes("manual task")||i.includes("manual")?"manual":i.includes("scripttask")||i.includes("script task")||i.includes("script")?"script":i.includes("sendtask")||i.includes("send task")||i.includes("send")?"send":i.includes("receivetask")||i.includes("receive task")||i.includes("receive")?"receive":i.includes("businessruletask")||i.includes("business rule")||i.includes("decision")?"business-rule":i.includes("automatic")||i.includes("auto")?"automatic":"default"},fe=t=>u(t,["timer"])?"Timer":u(t,["message"])?"Message":u(t,["signal"])?"Signal":u(t,["conditional"])?"Conditional":u(t,["linkevent"," link "])?"Link":u(t,["multiple"])?"Multiple":u(t,["escalation"])?"Escalation":u(t,["error"])?"Error":u(t,["compensation"])?"Compensation":u(t,["terminate"])?"Terminate":u(t,["cancel"])?"Cancel":"",ye=(t,e,r)=>{const n=t.toLowerCase(),i=Object.values(r??{}).filter(o=>typeof o=="string").join(" ").toLowerCase(),s=`${n} ${i}`,a=fe(s);return n.includes("transaction")?"Transaction":n.includes("subprocess")?"Subprocess":n.includes("parallelgateway")?"Parallel Gateway":n.includes("inclusivegateway")?"Inclusive Gateway":n.includes("eventbasedgateway")?"Event-Based Gateway":n.includes("complexgateway")?"Complex Gateway":n.includes("gateway")?"Exclusive Gateway":n.includes("startevent")?a?`Start ${a} Event`:"Start Event":n.includes("endevent")?a?`End ${a} Event`:"End Event":n.includes("boundaryevent")?a?`Boundary ${a} Event`:"Boundary Event":n.includes("intermediate")||n.includes("event")?a?`Intermediate ${a} Event`:"Intermediate Event":n.includes("messageflow")?"Message Flow":n.includes("sequenceflow")?"Sequence Flow":n.includes("association")?"Association":n.includes("dataobject")?"Data Object":n.includes("datastore")?"Data Store":n.includes("annotation")?"Text Annotation":n.includes("group")?"Group":n.includes("pool")||n.includes("lane")||n.includes("participant")?"Pool/Lane":n.includes("task")||n.includes("activity")||n.includes("callactivity")?e==="service"?"Service Task":e==="user"?"User Task":e==="manual"?"Manual Task":e==="script"?"Script Task":e==="send"?"Send Task":e==="receive"?"Receive Task":e==="business-rule"?"Business Rule Task":e==="call-activity"?"Call Activity":e==="automatic"?"Automatic Task":"Task":"Component"},xe=(t,e)=>(t.match(/[^\s]+/g)??[]).slice(0,e).join(" ").trim(),u=(t,e)=>e.some(r=>t.includes(r)),ke=t=>{const e=new Set,r=[];for(const n of t)e.has(n)||(e.add(n),r.push(n));return r},P=t=>{const e=L(t).filter(h);let r=0;for(const n of e)T(b(n))||(r+=1);return r};function ge(t,e=3){const r=L(t).filter(h),n=[];for(const i of r){const s=b(i);if(!(!s||T(s))&&(n.push(s),n.length>=e))break}return n}function v(t){const e=ne(t),r=b(e),n=ie(e),i=de(n),s=i.length>0,a=he(r,n),o=ye(r,a,n);return{stencilId:r,hasContent:s,contentText:i,taskVariant:a,typeName:o,properties:n}}function V(t){const e=v(t),r=[],n=e.stencilId.toLowerCase(),i=Object.values(e.properties??{}).filter(o=>typeof o=="string").join(" ").toLowerCase(),s=`${n} ${i}`;return e.hasContent&&r.push("content"),P(t)>1&&r.push("multi-element"),u(s,["timer"])&&r.push("timer"),u(s,["message"])&&r.push("message"),u(s,["conditional"])&&r.push("conditional"),u(s,["linkevent"," link "])&&r.push("link"),u(s,["multiple"])&&r.push("multiple"),u(s,["multi","multiple"])&&(u(s,["parallel"])&&r.push("mi-parallel"),u(s,["sequential","serial"])&&r.push("mi-sequential")),u(s,["loop"])&&r.push("loop"),u(s,["adhoc","ad hoc"])&&r.push("adhoc"),u(s,["transaction"])&&r.push("transaction"),(ue(e.properties,["isinterrupting","interrupting"])===!1||u(s,["noninterrupting","non-interrupting"]))&&r.push("non-interrupting"),ke(r)}function me(t){const e=v(t).taskVariant;return e==="default"?null:e}const R=(t,e,r)=>{if(Array.isArray(t)){for(const n of t)R(n,e,r);return}if(h(t)&&!r.has(t)){r.add(t),typeof t.resourceId=="string"&&h(t.stencil)&&typeof t.stencil.id=="string"&&e.push(t);for(const n of Object.values(t))R(n,e,r)}},N=(t,e,r)=>{if(typeof t=="string")return e.has(t);if(Array.isArray(t))return t.some(n=>N(n,e,r));if(!h(t)||r.has(t))return!1;r.add(t);for(const n of Object.values(t))if(N(n,e,r))return!0;return!1},we=t=>{if(!Array.isArray(t.childShapes)||!h(t.linked))return;const e=t.childShapes.filter(h),r=O(e),n=[];if(R(t.linked,n,new WeakSet),n.length===0)return;const i=n.filter(l=>b(l).toLowerCase().includes("annotation")),s=new Set;for(const l of i)typeof l.resourceId=="string"&&l.resourceId.trim()&&s.add(l.resourceId);const a=n.filter(l=>b(l).toLowerCase().includes("association")),o=[];for(const l of i)o.push(l);for(const l of a){const c=N(l,s,new WeakSet),d=N(l,r,new WeakSet);(c||d)&&o.push(l)}for(const l of o)typeof l.resourceId!="string"||!l.resourceId.trim()||r.has(l.resourceId)||(t.childShapes.push(A(l)),r.add(l.resourceId))};function H(t){if(!h(t)||!Array.isArray(t.childShapes))return A(t);const e=A(t);return we(e),e}function be(t){const e=v(t),r=P(t);let n=e.typeName||"Favorite snippet";if(e.hasContent){const i=xe(e.contentText,2);i&&(n=`${e.typeName}: ${i}`)}return r>1?`${n}, more...`:n}function ve(t){if(!h(t)||!Array.isArray(t.childShapes))return A(t);const e=H(t),r=ee(L(e)),n=O(r),i=te(n),s=$(e,i);return h(s)&&(s.useOffset=!1,re(s)),s}const _="favorites",G="lastCapture",W=t=>structuredClone(t),m=t=>t.trim().replace(/\s+/g," "),Ce=t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),Se=(t,e)=>{const r=m(t);if(!r)return"Favorite";if(!e.some(c=>m(c.name).toLowerCase()===r.toLowerCase()))return r;const i=r.match(/^(.*?)(?:\s+(\d+))?$/),s=m(i?.[1]??r),a=new RegExp(`^${Ce(s)}(?:\\s+(\\d+))?$`,"i"),o=new Set;for(const c of e){const p=m(c.name).match(a);p&&p[1]&&o.add(Number(p[1]))}let l=1;for(;o.has(l);)l+=1;return`${s} ${l}`},Ee=t=>[...t].sort((e,r)=>e.order!==r.order?e.order-r.order:e.createdAt-r.createdAt),Ie=t=>Ee(t).map((e,r)=>({...e,order:r}));async function C(){const t=await g.storage.local.get(_),e=Array.isArray(t.favorites)?t.favorites:[];return Ie(e)}async function z(t){const e=t.map((r,n)=>({...r,order:n}));return await g.storage.local.set({[_]:e}),e}async function U(){const t=await g.storage.local.get(G);return t.lastCapture?W(t.lastCapture):null}async function Te(t){await g.storage.local.set({[G]:W(t)})}async function Le(t,e,r){const n=await C(),i=Date.now(),s=Se(t,n),a=m(r?.defaultDisplayName??""),o=m(r?.defaultDisplayContent??""),l=(r?.displayName??a)||t||s,c=m(l),d=m(r?.displayContent??o),p=c.length>0&&a.length>0?c.toLowerCase()!==a.toLowerCase():c.length>0,y=d.length>0&&o.length>0?d.toLowerCase()!==o.toLowerCase():d.length>0,f={id:crypto.randomUUID(),name:s,displayName:c,displayNameCustom:p,displayContent:d,displayContentCustom:y,payload:H(e.valueJson),namespace:e.namespace,requestTemplate:e.requestTemplate?W(e.requestTemplate):void 0,order:n.length,createdAt:i,updatedAt:i};return n.unshift(f),await z(n),f}async function Ae(t){const e=await C(),r=e.filter(n=>n.id!==t);return r.length===e.length?e:z(r)}async function Ne(t,e){const r=await C(),n=r.findIndex(c=>c.id===t);if(n===-1)return r;const i=e==="up"?n-1:n+1;if(i<0||i>=r.length)return r;const s=[...r],a=s[n],o=s[i];if(!a||!o)return r;s[n]=o,s[i]=a;const l=Date.now();return s[n]={...o,updatedAt:l},s[i]={...a,updatedAt:l},z(s)}const j="signavio-bpkeys-content";function Me(t){if(typeof t!="object"||t===null)return!1;const e=t;return e.source==="signavio-bpkeys-hook"&&e.type==="clipboard-write-result"&&typeof e.requestId=="string"&&typeof e.ok=="boolean"}function Fe(t,e){const r=crypto.randomUUID(),n=e?.sanitize??!0;return{source:j,type:"clipboard-write-request",requestId:r,payload:{valueJson:n?ve(t.payload):t.payload,namespace:t.namespace,requestTemplate:t.requestTemplate}}}const De=172;class $e{host;root;wrapper;searchInput;listWrap;grid;emptyState;hintText;actions;favorites=[];filtered=[];selectedId=null;opened=!1;query="";mode="search";cardById=new Map;typeLabelFitFrame=null;selectedScrollFrame=null;constructor(e){this.actions=e,this.host=document.createElement("div"),this.host.id="bpkeys-overlay-host",this.root=this.host.attachShadow({mode:"open"});const r=document.createElement("style");r.textContent=this.getStyles(),this.wrapper=document.createElement("div"),this.wrapper.className="bpkeys-wrapper",this.wrapper.tabIndex=-1;const n=document.createElement("div");n.className="bpkeys-scrim",n.addEventListener("click",()=>this.close());const i=document.createElement("section");i.className="bpkeys-panel",i.addEventListener("click",p=>{p.stopPropagation()});const s=document.createElement("div");s.className="bpkeys-top-row";const a=document.createElement("div");a.className="bpkeys-search-shell";const o=document.createElement("span");o.className="bpkeys-search-icon",o.setAttribute("aria-hidden","true"),o.innerHTML='<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6.8" stroke="currentColor" stroke-width="1.8"/><path d="M16.1 16.1L21 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',this.searchInput=document.createElement("input"),this.searchInput.className="bpkeys-search",this.searchInput.type="text",this.searchInput.placeholder="Search Components",this.searchInput.setAttribute("aria-label","Search components"),this.searchInput.addEventListener("focus",()=>{this.mode="search"}),this.searchInput.addEventListener("pointerdown",()=>{this.mode="search"}),this.searchInput.addEventListener("input",()=>{this.mode="search",this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid()}),a.append(o,this.searchInput),s.append(a);const l=document.createElement("div");l.className="bpkeys-divider";const c=document.createElement("div");c.className="bpkeys-list-wrap",this.listWrap=c,this.grid=document.createElement("div"),this.grid.className="bpkeys-grid",this.emptyState=document.createElement("div"),this.emptyState.className="bpkeys-empty",c.append(this.grid,this.emptyState);const d=document.createElement("div");d.className="bpkeys-footer-divider",this.hintText=document.createElement("div"),this.hintText.className="bpkeys-hints",this.hintText.replaceChildren(this.createHintItem("Close","Esc"),this.createHintSeparator(),this.createHintItem("Insert","Enter"),this.createHintSeparator(),this.createHintItem("Remove","Option+Delete"),this.createHintSeparator(),this.createHintItem("Reorder","Option+Up/Down")),i.append(s,l,c,d,this.hintText),this.wrapper.append(n,i),this.root.append(r,this.wrapper),window.addEventListener("keydown",this.onKeyDown,!0),window.addEventListener("resize",this.onResize,{passive:!0}),document.documentElement.appendChild(this.host),this.renderGrid()}isOpen(){return this.opened}open(e){this.opened=!0,this.wrapper.classList.add("open"),this.query="",this.mode="search",this.searchInput.value="",this.setFavorites(e),this.searchInput.focus()}close(){this.opened&&(this.opened=!1,this.wrapper.classList.remove("open"),this.actions.onClose())}toggle(e){if(this.opened){this.close();return}this.open(e)}refreshFavorites(e){this.setFavorites(e),this.scheduleSelectedVisibilityScroll()}setFavorites(e){this.favorites=[...e].sort((r,n)=>r.order-n.order),!this.selectedId&&this.favorites.length>0&&(this.selectedId=this.favorites[0]?.id??null),this.applyFilter(),this.renderGrid()}applyFilter(){if(this.query?this.filtered=this.favorites.filter(e=>{const r=v(e.payload),n=this.getVisualDisplayName(e,r),i=this.getVisualDisplayContent(e,r);return`${e.name} ${n} ${i} ${r.typeName} ${r.contentText}`.toLowerCase().includes(this.query)}):this.filtered=[...this.favorites],this.filtered.length===0){this.selectedId=null;return}(!this.selectedId||!this.filtered.some(e=>e.id===this.selectedId))&&(this.selectedId=this.filtered[0]?.id??null)}getSelectedFavorite(){return this.selectedId?this.filtered.find(e=>e.id===this.selectedId)??null:null}enterSearchMode(e){this.mode="search",this.searchInput.focus(),e&&(this.searchInput.value+=e,this.query=this.searchInput.value.trim().toLowerCase(),this.applyFilter(),this.renderGrid())}enterListMode(){this.mode="list",this.searchInput.blur(),this.wrapper.focus()}renderGrid(){this.cardById.clear(),this.grid.innerHTML="";const e=this.filtered;if(this.emptyState.style.display=e.length===0?"block":"none",this.favorites.length===0){this.emptyState.textContent="No favorites yet. Copy a shape in Signavio and use Option+Shift+S to save one.",this.hintText.style.opacity="0.75";return}if(e.length===0){this.emptyState.textContent="No favorites match your search.",this.hintText.style.opacity="0.85";return}this.hintText.style.opacity="1";const r=this.getDuplicateSignatureCounts();for(const n of e){const i=document.createElement("button");i.className="bpkeys-card",i.type="button",i.dataset.favoriteId=n.id,i.title=n.name;const s=v(n.payload),a=V(n.payload),o=me(n.payload),l=this.getVisualDisplayName(n,s),c=this.getVisualDisplayContent(n,s),d=this.getFavoriteSignature(s,l,c,a),p=(r.get(d)??0)>1;i.addEventListener("click",()=>{this.selectedId=n.id,this.enterListMode(),this.updateSelectedCardClasses()}),i.addEventListener("dblclick",()=>{this.close(),this.actions.onInsert(n)});const y=this.createPreview(n,s,l,a,o,p),f=document.createElement("div");f.className="bpkeys-card-label",f.textContent=c,i.append(y,f),this.grid.appendChild(i),this.cardById.set(n.id,i)}this.updateSelectedCardClasses(),this.scheduleTypeLabelFit()}updateSelectedCardClasses(){for(const[e,r]of this.cardById.entries())r.classList.toggle("selected",e===this.selectedId)}getVisualDisplayName(e,r){const n=e.displayName?.trim()||"";return e.displayNameCustom&&n?n:r.typeName||"Component"}getVisualDisplayContent(e,r){const n=e.displayContent?.trim()||"";return e.displayContentCustom&&n?n:r.hasContent?r.contentText:"Empty"}middleEllipsis(e,r=24){const n=e.trim();if(n.length<=r)return n;if(r<=4)return`${n.slice(0,1)}...`;const i=r-3,s=Math.ceil(i/2),a=Math.floor(i/2);return`${n.slice(0,s)}...${n.slice(n.length-a)}`}scheduleTypeLabelFit(){this.typeLabelFitFrame!==null&&window.cancelAnimationFrame(this.typeLabelFitFrame),this.typeLabelFitFrame=window.requestAnimationFrame(()=>{this.typeLabelFitFrame=null,this.fitTypeLabelsToWidth()})}scheduleSelectedVisibilityScroll(){this.selectedScrollFrame!==null&&window.cancelAnimationFrame(this.selectedScrollFrame),this.selectedScrollFrame=window.requestAnimationFrame(()=>{this.selectedScrollFrame=null,this.scrollSelectedCardToTopIfOutOfView()})}fitTypeLabelsToWidth(){const e=this.grid.querySelectorAll(".bpkeys-type-inline");for(const r of e){const n=r.dataset.fullText?.trim()??"";if(!n){r.textContent="";continue}r.textContent=n;const i=r.clientWidth;if(i<=0||r.scrollWidth<=i)continue;let s=5,a=n.length,o=`${n.slice(0,1)}...`;for(;s<=a;){const l=Math.floor((s+a)/2),c=this.middleEllipsis(n,l);r.textContent=c,r.scrollWidth<=i?(o=c,s=l+1):a=l-1}r.textContent=o}}getFavoriteSignature(e,r,n,i){return[e.typeName.toLowerCase(),r.trim().toLowerCase(),n.trim().toLowerCase(),[...i].sort().join(",")].join("::")}getDuplicateSignatureCounts(){const e=new Map;for(const r of this.favorites){const n=v(r.payload),i=V(r.payload),s=this.getVisualDisplayName(r,n),a=this.getVisualDisplayContent(r,n),o=this.getFavoriteSignature(n,s,a,i);e.set(o,(e.get(o)??0)+1)}return e}createHintItem(e,r){const n=document.createElement("span");n.className="bpkeys-hint-item";const i=document.createElement("span");i.className="bpkeys-hint-action",i.textContent=e;const s=document.createElement("span");return s.className="bpkeys-hint-key",s.textContent=r,n.append(i,s),n}createHintSeparator(){const e=document.createElement("span");return e.className="bpkeys-hint-separator",e.textContent="|",e}createPreview(e,r,n,i,s,a){const o=document.createElement("div");o.className="bpkeys-preview";const l=r.stencilId.toLowerCase(),c=this.getIconKind(l,r),d=ge(e.payload,3).map(x=>x.toLowerCase()),p=d.length>0?d.map(x=>this.getIconKind(x)):[c];if(this.hasRoundedBackground(c)?o.classList.add("rounded-bg"):o.classList.add("shape-only"),o.classList.add(r.hasContent?"has-content":"is-empty"),p.length>1){const x=document.createElement("div");x.className=`bpkeys-preview-stack count-${Math.min(3,p.length)}`,p.slice(0,3).forEach((k,Ze)=>{const B=document.createElement("div");B.className=`bpkeys-preview-bubble slot-${Ze+1}`,B.appendChild(this.createIconSvgNode(k,"bpkeys-preview-bubble-svg")),x.appendChild(B)}),o.appendChild(x)}else o.appendChild(this.createIconSvgNode(c,"bpkeys-preview-svg"));s&&o.appendChild(this.getTypeBadge(s));const f=document.createElement("div");f.className="bpkeys-type-inline",f.dataset.fullText=n,f.textContent=n,f.setAttribute("title",n),o.appendChild(f);const E=[...i];if(a&&E.push("duplicate"),E.length>0){const x=document.createElement("div");x.className="bpkeys-badge-row";for(const k of E)x.appendChild(this.getBadge(k));o.appendChild(x)}return o}createIconSvgNode(e,r){const n=document.createElementNS("http://www.w3.org/2000/svg","svg");return n.setAttribute("viewBox","-4 -4 148 112"),n.classList.add(r),e.startsWith("gateway-")&&(n.style.height="75%"),n.innerHTML=this.getIconSvg(e),n}getBadge(e){const r=document.createElement("span");r.className="bpkeys-badge";const n={content:'<text x="12" y="15.5" text-anchor="middle" font-size="12" font-weight="700" fill="currentColor" font-family="Segoe UI, sans-serif">T</text>',"multi-element":'<line x1="8.5" y1="8.5" x2="15.5" y2="8.5" stroke="currentColor" stroke-width="1.8"/><line x1="8.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><line x1="15.5" y1="8.5" x2="12" y2="14.8" stroke="currentColor" stroke-width="1.8"/><circle cx="8.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="15.5" cy="8.5" r="2.3" fill="currentColor"/><circle cx="12" cy="14.8" r="2.3" fill="currentColor"/>',duplicate:'<rect x="5.5" y="5.5" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="9" y="9" width="9.5" height="9.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>',timer:'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="12" y2="7" stroke="currentColor" stroke-width="2"/><line x1="12" y1="12" x2="16" y2="14" stroke="currentColor" stroke-width="2"/>',message:'<rect x="4" y="6" width="16" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 8 L12 13 L20 8" fill="none" stroke="currentColor" stroke-width="1.8"/>',conditional:'<rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" stroke-width="1.8"/><line x1="8" y1="14" x2="16" y2="14" stroke="currentColor" stroke-width="1.8"/>',link:'<path d="M8 12 C8 9 10 7 13 7 H16" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 7 L14 5 M16 7 L14 9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 12 C16 15 14 17 11 17 H8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 17 L10 15 M8 17 L10 19" fill="none" stroke="currentColor" stroke-width="2"/>',multiple:'<circle cx="8" cy="12" r="2.2" fill="currentColor"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><circle cx="16" cy="12" r="2.2" fill="currentColor"/>',loop:'<path d="M17 10 A6 6 0 1 0 18 13" fill="none" stroke="currentColor" stroke-width="2"/><polygon points="18,8 21,10 18,12" fill="currentColor"/>',"mi-parallel":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="7" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="7" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',"mi-sequential":'<line x1="7" y1="7" x2="7" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="12" y1="9" x2="12" y2="17" stroke="currentColor" stroke-width="2.4"/><line x1="17" y1="11" x2="17" y2="17" stroke="currentColor" stroke-width="2.4"/>',adhoc:'<path d="M4 14 C6 10 8 18 10 14 C12 10 14 18 16 14 C18 10 20 18 22 14" fill="none" stroke="currentColor" stroke-width="2"/>',"non-interrupting":'<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="2.5 2.5"/>',transaction:'<rect x="5" y="5" width="14" height="14" rx="3" fill="none" stroke="currentColor" stroke-width="2.4"/><rect x="8" y="8" width="8" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>'};return r.setAttribute("title",e),r.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${n[e]}</svg>`,r}getTypeBadge(e){const r=document.createElement("div");r.className="bpkeys-type-badge-center";const n={user:'<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M4.8 20 C4.8 15.4 8 13 12 13 C16 13 19.2 15.4 19.2 20" fill="currentColor"/>',service:'<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2.1"/><circle cx="12" cy="12" r="2.3" fill="currentColor"/><line x1="12" y1="3.6" x2="12" y2="6.1" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17.9" x2="12" y2="20.4" stroke="currentColor" stroke-width="2"/><line x1="3.6" y1="12" x2="6.1" y2="12" stroke="currentColor" stroke-width="2"/><line x1="17.9" y1="12" x2="20.4" y2="12" stroke="currentColor" stroke-width="2"/>',manual:'<path d="M6 19 V11 C6 9.6 7 8.8 8.2 8.8 C9.3 8.8 10.2 9.6 10.2 11.1 V14.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10.2 14.2 V8 C10.2 6.9 11 6.1 12.1 6.1 C13.2 6.1 14 6.9 14 8 V14.4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 12 C15 11.6 16.1 12.3 16.4 13.4 L17.8 18.4" fill="none" stroke="currentColor" stroke-width="2"/>',script:'<path d="M6 4.6 H13.8 L18 8.8 V19.4 H6 Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" stroke-width="1.9"/><line x1="8.5" y1="15.5" x2="14.2" y2="15.5" stroke="currentColor" stroke-width="1.9"/>',send:'<rect x="3.8" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.8 8.1 L10.4 12.5 L17 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="16.8" y1="11.7" x2="22" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="22,11.7 18.9,9.5 18.9,13.9" fill="currentColor"/>',receive:'<rect x="7" y="6.8" width="13.2" height="9.8" rx="2.1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 8.1 L13.6 12.5 L20.2 8.1" fill="none" stroke="currentColor" stroke-width="1.7"/><line x1="2" y1="11.7" x2="7.2" y2="11.7" stroke="currentColor" stroke-width="2"/><polygon points="2,11.7 5.1,9.5 5.1,13.9" fill="currentColor"/>',"business-rule":'<rect x="4" y="5" width="16" height="14" fill="none" stroke="currentColor" stroke-width="2"/><line x1="4" y1="10" x2="20" y2="10" stroke="currentColor" stroke-width="2"/><line x1="9.2" y1="5" x2="9.2" y2="19" stroke="currentColor" stroke-width="2"/>',"call-activity":'<rect x="4" y="6" width="16" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-width="2.6"/><rect x="7" y="9" width="10" height="6" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.8"/>',automatic:'<polygon points="8,4 5,12.5 10,12.5 8.2,20 18.4,9.4 12.8,9.4 14.4,4" fill="currentColor"/>'};return r.setAttribute("title",e),r.innerHTML=`<svg viewBox="0 0 24 24" fill="none">${n[e]}</svg>`,r}getIconKind(e,r){const n=Object.values(r?.properties??{}).filter(a=>typeof a=="string").join(" ").toLowerCase(),i=`${e} ${n}`,s=this.getEventFlavor(i);return e.includes("usertask")?"task-user":e.includes("servicetask")||e.includes("service")?"task-service":e.includes("manualtask")||e.includes("manual")?"task-manual":e.includes("scripttask")||e.includes("script")?"task-script":e.includes("sendtask")?"task-send":e.includes("receivetask")?"task-receive":e.includes("businessruletask")||e.includes("decision")?"task-business-rule":e.includes("automatic")?"task-automatic":e.includes("transaction")?"transaction":e.includes("callactivity")?"call-activity":e.includes("subprocess")?"subprocess":e.includes("parallelgateway")?"gateway-parallel":e.includes("inclusivegateway")?"gateway-inclusive":e.includes("eventbasedgateway")?"gateway-event":e.includes("complexgateway")?"gateway-complex":e.includes("gateway")?"gateway-exclusive":e.includes("boundaryevent")?s?`event-boundary-${s}`:"event-boundary":e.includes("startevent")?s?`event-start-${s}`:"event-start":e.includes("endevent")?s?`event-end-${s}`:"event-end":e.includes("event")?s?`event-intermediate-${s}`:"event-intermediate":e.includes("messageflow")?"message-flow":e.includes("sequenceflow")?"sequence-flow":e.includes("association")?"association":e.includes("dataobject")?"data-object":e.includes("datastore")?"data-store":e.includes("group")?"group":e.includes("conversation")?"conversation":e.includes("choreography")?"choreography-task":e.includes("pool")||e.includes("lane")||e.includes("participant")?"pool-lane":e.includes("annotation")?"annotation":e.includes("message")?"message":e.includes("task")||e.includes("activity")||e.includes("callactivity")?"task":"generic"}getEventFlavor(e){return e.includes("timer")?"timer":e.includes("message")?"message":e.includes("signal")?"signal":e.includes("conditional")?"conditional":e.includes("linkevent")||e.includes(" link ")?"link":e.includes("multiple")?"multiple":e.includes("error")?"error":e.includes("compensation")?"compensation":e.includes("escalation")?"escalation":e.includes("terminate")?"terminate":""}hasRoundedBackground(e){return!1}getIconSvg(e){const r='<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';if(e.startsWith("event-start-"))return this.getEventSvg("start",e.replace("event-start-",""));if(e.startsWith("event-intermediate-"))return this.getEventSvg("intermediate",e.replace("event-intermediate-",""));if(e.startsWith("event-end-"))return this.getEventSvg("end",e.replace("event-end-",""));if(e.startsWith("event-boundary-"))return this.getEventSvg("boundary",e.replace("event-boundary-",""));switch(e){case"task":return r;case"task-user":return this.getTaskWithGlyph('<circle cx="70" cy="45" r="9" fill="#5f5f5f"/><path d="M52 67 C52 57 60 52 70 52 C80 52 88 57 88 67" fill="#5f5f5f"/>');case"task-service":return this.getTaskWithGlyph('<circle cx="70" cy="52" r="13" fill="none" stroke="#5f5f5f" stroke-width="2.6"/><circle cx="70" cy="52" r="4" fill="#5f5f5f"/><line x1="70" y1="36" x2="70" y2="40" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="64" x2="70" y2="68" stroke="#5f5f5f" stroke-width="2.2"/><line x1="54" y1="52" x2="58" y2="52" stroke="#5f5f5f" stroke-width="2.2"/><line x1="82" y1="52" x2="86" y2="52" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-manual":return this.getTaskWithGlyph('<path d="M58 66 V50 C58 48 59.2 46.8 61 46.8 C62.8 46.8 64 48 64 50 V56" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M64 56 V45 C64 42.8 65.4 41.4 67.4 41.4 C69.3 41.4 70.8 42.8 70.8 45 V56.5" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M70.8 54.8 C72.5 53.8 74.8 54.4 75.8 56.2 L79.2 62" fill="none" stroke="#5f5f5f" stroke-width="2.4"/>');case"task-script":return this.getTaskWithGlyph('<path d="M59 37 H77 L84 44 V67 H59 Z" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><line x1="63" y1="50" x2="80" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><line x1="63" y1="57" x2="78" y2="57" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-send":return this.getTaskWithGlyph('<rect x="56" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M56 44 L67 51 L78 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="78" y1="50" x2="88" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="88,50 82,46.2 82,53.8" fill="#5f5f5f"/>');case"task-receive":return this.getTaskWithGlyph('<rect x="62" y="42" width="22" height="16" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.4"/><path d="M62 44 L73 51 L84 44" fill="none" stroke="#5f5f5f" stroke-width="2"/><line x1="52" y1="50" x2="62" y2="50" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="52,50 58,46.2 58,53.8" fill="#5f5f5f"/>');case"task-business-rule":return this.getTaskWithGlyph('<rect x="56" y="39" width="28" height="22" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="56" y1="48" x2="84" y2="48" stroke="#5f5f5f" stroke-width="2.2"/><line x1="65" y1="39" x2="65" y2="61" stroke="#5f5f5f" stroke-width="2.2"/>');case"task-automatic":return this.getTaskWithGlyph('<polygon points="66,36 60,52 68,52 65,67 82,46 74,46 77,36" fill="#5f5f5f"/>');case"subprocess":return'<rect x="20" y="18" width="100" height="68" rx="15" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="64" y1="74" x2="76" y2="74" stroke="#666" stroke-width="2.4"/><line x1="70" y1="68" x2="70" y2="80" stroke="#666" stroke-width="2.4"/>';case"call-activity":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#505050" stroke-width="4"/><rect x="22" y="24" width="96" height="56" rx="12" fill="none" stroke="#646464" stroke-width="2"/>';case"transaction":return'<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="24" y="26" width="92" height="52" rx="10" fill="none" stroke="#666" stroke-width="2.2"/>';case"gateway-exclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="55" y1="38" x2="85" y2="66" stroke="#636363" stroke-width="3"/><line x1="85" y1="38" x2="55" y2="66" stroke="#636363" stroke-width="3"/>';case"gateway-parallel":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="33" x2="70" y2="71" stroke="#636363" stroke-width="3.2"/><line x1="51" y1="52" x2="89" y2="52" stroke="#636363" stroke-width="3.2"/>';case"gateway-inclusive":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="17" fill="none" stroke="#666" stroke-width="3"/>';case"gateway-event":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="14" fill="none" stroke="#666" stroke-width="2.6"/><polygon points="70,38 76,50 70,64 64,50" fill="#666"/>';case"gateway-complex":return'<polygon points="70,12 120,52 70,92 20,52" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="70" y1="32" x2="70" y2="72" stroke="#666" stroke-width="2.6"/><line x1="50" y1="52" x2="90" y2="52" stroke="#666" stroke-width="2.6"/><line x1="55" y1="37" x2="85" y2="67" stroke="#666" stroke-width="2.4"/><line x1="85" y1="37" x2="55" y2="67" stroke="#666" stroke-width="2.4"/>';case"event-start":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"event-end":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#4d4d4d" stroke-width="5"/>';case"event-intermediate":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>';case"event-boundary":return'<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/><circle cx="70" cy="52" r="6" fill="#737373"/>';case"sequence-flow":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#5a5a5a" stroke-width="4" stroke-linecap="round"/><polygon points="120,52 102,42 102,62" fill="#5a5a5a"/>';case"message-flow":return'<line x1="16" y1="52" x2="120" y2="52" stroke="#6a6a6a" stroke-width="3" stroke-dasharray="7 6" stroke-linecap="round"/><polygon points="120,52 103,42 103,62" fill="#6a6a6a"/><rect x="52" y="35" width="34" height="24" rx="2" fill="#f6f4d4" stroke="#666" stroke-width="2"/>';case"association":return'<line x1="18" y1="52" x2="120" y2="52" stroke="#737373" stroke-width="3" stroke-dasharray="5 5" stroke-linecap="round"/>';case"data-object":return'<path d="M32 18 H90 L108 36 V86 H32 Z" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M90 18 V36 H108" fill="none" stroke="#575757" stroke-width="3"/>';case"data-store":return'<ellipse cx="70" cy="28" rx="34" ry="11" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M36 28 V76 C36 83 51 88 70 88 C89 88 104 83 104 76 V28" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><ellipse cx="70" cy="28" rx="23" ry="7" fill="none" stroke="#666" stroke-width="1.8"/><path d="M40 48 C40 54 54 58 70 58 C86 58 100 54 100 48" fill="none" stroke="#666" stroke-width="1.8"/>';case"pool-lane":return'<rect x="16" y="16" width="108" height="72" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><line x1="42" y1="16" x2="42" y2="88" stroke="#666" stroke-width="2.6"/><line x1="42" y1="52" x2="124" y2="52" stroke="#666" stroke-width="2.2"/>';case"annotation":return'<path d="M34 20 H94 L108 34 V84 H34 Z" fill="#f6f4d4" stroke="#666" stroke-width="3"/><path d="M94 20 V34 H108" fill="none" stroke="#666" stroke-width="3"/><line x1="42" y1="44" x2="97" y2="44" stroke="#777" stroke-width="2"/><line x1="42" y1="56" x2="97" y2="56" stroke="#777" stroke-width="2"/><line x1="42" y1="68" x2="85" y2="68" stroke="#777" stroke-width="2"/>';case"group":return'<rect x="18" y="18" width="104" height="68" rx="10" fill="none" stroke="#666" stroke-width="3" stroke-dasharray="7 6"/>';case"conversation":return'<polygon points="70,14 116,38 116,66 70,90 24,66 24,38" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>';case"choreography-task":return'<rect x="16" y="18" width="108" height="68" rx="10" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><rect x="16" y="18" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/><rect x="16" y="72" width="108" height="14" rx="10" fill="none" stroke="#666" stroke-width="2"/>';case"message":return'<rect x="24" y="24" width="92" height="56" rx="8" fill="#f6f4d4" stroke="#575757" stroke-width="3"/><path d="M24 28 L70 58 L116 28" fill="none" stroke="#666" stroke-width="2.8"/>';default:return r}}getTaskWithGlyph(e){return`<rect x="16" y="18" width="108" height="68" rx="16" fill="#f6f4d4" stroke="#575757" stroke-width="3"/>${e}`}getEventSvg(e,r){let i=`<circle cx="70" cy="52" r="31" fill="#f6f4d4" stroke="#575757" stroke-width="${e==="end"?"5":"3"}"/>`;return(e==="intermediate"||e==="boundary")&&(i+='<circle cx="70" cy="52" r="24" fill="none" stroke="#666" stroke-width="2"/>'),e==="boundary"&&(i+='<circle cx="70" cy="52" r="31" fill="none" stroke="#575757" stroke-width="2" stroke-dasharray="3.5 2.8"/>'),`${i}${this.getEventFlavorSymbol(r)}`}getEventFlavorSymbol(e){switch(e){case"timer":return'<circle cx="70" cy="52" r="12" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><line x1="70" y1="52" x2="76" y2="55" stroke="#5f5f5f" stroke-width="2.2"/>';case"message":return'<rect x="58" y="43" width="24" height="18" rx="3" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M58 45 L70 53 L82 45" fill="none" stroke="#5f5f5f" stroke-width="1.9"/>';case"signal":return'<path d="M57 57 C60 51 64 49 70 49 C76 49 80 51 83 57" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M60 61 C63 57 66 55.5 70 55.5 C74 55.5 77 57 80 61" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><circle cx="70" cy="64" r="2.3" fill="#5f5f5f"/>';case"conditional":return'<rect x="58" y="41" width="24" height="22" rx="2.5" fill="none" stroke="#5f5f5f" stroke-width="2.1"/><line x1="62" y1="48" x2="78" y2="48" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="54" x2="78" y2="54" stroke="#5f5f5f" stroke-width="2"/><line x1="62" y1="60" x2="74" y2="60" stroke="#5f5f5f" stroke-width="2"/>';case"link":return'<path d="M62 52 C62 49 64 47 67 47 H72" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M72 47 L69.5 44.6 M72 47 L69.5 49.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M78 52 C78 55 76 57 73 57 H68" fill="none" stroke="#5f5f5f" stroke-width="2.2"/><path d="M68 57 L70.5 54.6 M68 57 L70.5 59.4" fill="none" stroke="#5f5f5f" stroke-width="2.2"/>';case"multiple":return'<circle cx="64" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="70" cy="52" r="2.6" fill="#5f5f5f"/><circle cx="76" cy="52" r="2.6" fill="#5f5f5f"/>';case"error":return'<line x1="62" y1="44" x2="78" y2="60" stroke="#5f5f5f" stroke-width="2.5"/><line x1="78" y1="44" x2="62" y2="60" stroke="#5f5f5f" stroke-width="2.5"/>';case"compensation":return'<polygon points="70,52 78,47 78,57" fill="#5f5f5f"/><polygon points="62,52 70,47 70,57" fill="#5f5f5f"/>';case"escalation":return'<line x1="70" y1="60" x2="70" y2="45" stroke="#5f5f5f" stroke-width="2.2"/><polygon points="70,42 77,49 63,49" fill="#5f5f5f"/>';case"terminate":return'<rect x="63" y="45" width="14" height="14" fill="#5f5f5f"/>';default:return""}}moveSelectionByKey(e){const r=this.filtered.findIndex(s=>s.id===this.selectedId);if(r<0)return;const n=this.getColumnCount();let i=r;e==="ArrowLeft"?i=r-1:e==="ArrowRight"?i=r+1:e==="ArrowUp"?i=r-n:e==="ArrowDown"&&(i=r+n),i=Math.max(0,Math.min(this.filtered.length-1,i)),this.selectedId=this.filtered[i]?.id??this.selectedId,this.updateSelectedCardClasses(),this.scrollSelectedCardToTopIfOutOfView()}scrollSelectedCardToTopIfOutOfView(){if(!this.selectedId)return;const e=this.cardById.get(this.selectedId);if(!e)return;const r=this.listWrap.getBoundingClientRect(),n=e.getBoundingClientRect(),i=10;if(!(n.top<r.top+i||n.bottom>r.bottom))return;const a=n.top-r.top,o=this.listWrap.scrollTop+a-i;this.listWrap.scrollTo({top:Math.max(0,o),behavior:"smooth"})}moveSelectionToLeftNeighborOnDelete(){const e=this.filtered.findIndex(r=>r.id===this.selectedId);if(!(e<0)){if(e>0){this.selectedId=this.filtered[e-1]?.id??null;return}this.selectedId=this.filtered[1]?.id??null}}onKeyDown=e=>{if(!this.opened)return;if(e.stopPropagation(),e.key==="Escape"){e.preventDefault(),this.close();return}const r=this.getSelectedFavorite();if(e.altKey&&(e.key==="Delete"||e.key==="Backspace")){e.preventDefault(),r&&(this.enterListMode(),this.moveSelectionToLeftNeighborOnDelete(),this.actions.onDelete(r));return}const n=["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key),i=e.key.length===1&&!e.metaKey&&!e.ctrlKey&&!e.altKey;if(this.mode==="search"){if(e.key==="Delete"||e.key==="Backspace")return;if(n||e.key==="Enter"){if(e.preventDefault(),this.enterListMode(),n){this.moveSelectionByKey(e.key);return}r&&(this.close(),this.actions.onInsert(r));return}return}if(i){e.preventDefault(),this.enterSearchMode(e.key);return}if(r){if(e.key==="Enter"){e.preventDefault(),this.close(),this.actions.onInsert(r);return}if(e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();const s=e.key==="ArrowUp"?"up":"down";this.actions.onMove(r,s);return}if(e.key==="Delete"||e.key==="Backspace"){e.preventDefault();return}n&&(e.preventDefault(),this.moveSelectionByKey(e.key))}};onResize=()=>{this.opened&&this.scheduleTypeLabelFit()};getColumnCount(){const e=this.grid.clientWidth;return e<=0?4:Math.max(1,Math.floor(e/De))}getStyles(){return`
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
    `}}const Re="signavio-bpkeys-hook";let w=null;const M=new Map,S=(()=>{let t=null,e=null;return r=>{t||(t=document.createElement("div"),t.style.position="fixed",t.style.right="20px",t.style.bottom="20px",t.style.zIndex="2147483647",t.style.padding="10px 14px",t.style.background="rgba(31, 31, 31, 0.92)",t.style.color="#f3f3f3",t.style.border="1px solid rgba(255, 255, 255, 0.2)",t.style.borderRadius="12px",t.style.fontFamily="system-ui, sans-serif",t.style.fontSize="13px",t.style.boxShadow="0 8px 28px rgba(0, 0, 0, 0.35)",t.style.backdropFilter="blur(3px)",document.body.appendChild(t)),t.textContent=r,t.style.opacity="1",e&&window.clearTimeout(e),e=window.setTimeout(()=>{t&&(t.style.opacity="0")},2500)}})(),We=t=>new Promise(e=>{const r=document.createElement("div");r.style.position="fixed",r.style.inset="0",r.style.zIndex="2147483647",r.style.display="grid",r.style.placeItems="center";const n=document.createElement("div");n.style.position="absolute",n.style.inset="0",n.style.background="rgba(10, 12, 14, 0.4)",n.style.backdropFilter="blur(3px)";const i=document.createElement("div");i.style.position="relative",i.style.width="min(720px, calc(100vw - 32px))",i.style.maxWidth="100%",i.style.maxHeight="calc(100vh - 32px)",i.style.overflow="auto",i.style.boxSizing="border-box",i.style.padding="16px",i.style.borderRadius="16px",i.style.background="rgba(26, 28, 33, 0.92)",i.style.border="1px solid rgba(255, 255, 255, 0.2)",i.style.boxShadow="0 22px 54px rgba(0, 0, 0, 0.62)",i.style.display="grid",i.style.gap="12px",i.style.fontFamily='"Avenir Next", "Segoe UI", sans-serif',i.addEventListener("click",k=>k.stopPropagation());const s=document.createElement("div");s.textContent="Save Favorite",s.style.fontSize="18px",s.style.fontWeight="700",s.style.color="#f3f3f3";const a=document.createElement("label");a.textContent="Name",a.style.fontSize="12px",a.style.fontWeight="600",a.style.color="rgba(243,243,243,0.86)",a.style.display="grid",a.style.gap="6px",a.style.minWidth="0";const o=document.createElement("input");o.type="text",o.value=t.name,o.style.display="block",o.style.width="100%",o.style.maxWidth="100%",o.style.minWidth="0",o.style.boxSizing="border-box",o.style.padding="9px 11px",o.style.borderRadius="10px",o.style.border="1px solid rgba(255,255,255,0.18)",o.style.background="rgba(255,255,255,0.08)",o.style.color="#ececec",o.style.fontSize="15px",o.style.outline="none";const l=document.createElement("label");l.textContent="Content",l.style.fontSize="12px",l.style.fontWeight="600",l.style.color="rgba(243,243,243,0.86)",l.style.display="grid",l.style.gap="6px",l.style.minWidth="0";const c=document.createElement("input");c.type="text",c.value=t.content,c.style.display="block",c.style.width="100%",c.style.maxWidth="100%",c.style.minWidth="0",c.style.boxSizing="border-box",c.style.padding="9px 11px",c.style.borderRadius="10px",c.style.border="1px solid rgba(255,255,255,0.18)",c.style.background="rgba(255,255,255,0.08)",c.style.color="#ececec",c.style.fontSize="15px",c.style.outline="none",a.append(o),l.append(c);const d=document.createElement("div");d.style.display="flex",d.style.justifyContent="flex-end",d.style.gap="8px";const p=document.createElement("button");p.type="button",p.textContent="Cancel",p.style.padding="8px 12px",p.style.borderRadius="10px",p.style.border="1px solid rgba(255,255,255,0.2)",p.style.background="rgba(255,255,255,0.06)",p.style.color="#ececec",p.style.cursor="pointer";const y=document.createElement("button");y.type="button",y.textContent="Save",y.style.padding="8px 12px",y.style.borderRadius="10px",y.style.border="1px solid rgba(255,255,255,0.32)",y.style.background="rgba(255,255,255,0.16)",y.style.color="#f6f6f6",y.style.fontWeight="700",y.style.cursor="pointer",d.append(p,y),i.append(s,a,l,d),r.append(n,i),document.body.append(r);const f=k=>{document.removeEventListener("keydown",x,!0),r.remove(),e(k)},E=()=>{f({name:o.value.trim(),content:c.value.trim()})},x=k=>{if(k.key==="Escape"){k.preventDefault(),f(null);return}k.key==="Enter"&&(k.preventDefault(),E())};n.addEventListener("click",()=>f(null)),p.addEventListener("click",()=>f(null)),y.addEventListener("click",E),document.addEventListener("keydown",x,!0),window.setTimeout(()=>{o.focus(),o.select()},0)}),ze=t=>{if(typeof t!="object"||t===null)return!1;const e=t,r=!("requestTemplate"in e)||e.requestTemplate===void 0||typeof e.requestTemplate=="object"&&e.requestTemplate!==null;return typeof e.namespace=="string"&&typeof e.capturedAt=="number"&&(e.source==="fetch"||e.source==="xhr"||e.source==="manual")&&"valueJson"in e&&r},qe=()=>{if(document.getElementById("bpkeys-clipboard-hook"))return;const t=document.createElement("script");t.id="bpkeys-clipboard-hook",t.src=g.runtime.getURL("clipboard-hook.js"),t.async=!1,t.onload=()=>{t.remove()},(document.head||document.documentElement).appendChild(t)},Be=t=>{const e=M.get(t.requestId);if(e){if(window.clearTimeout(e.timer),M.delete(t.requestId),t.ok){e.resolve();return}e.reject(new Error(t.error||`Clipboard write failed (${t.status??"unknown"})`))}},Oe=async t=>{const e=async r=>{const n=Fe({payload:t.payload,namespace:t.namespace,requestTemplate:t.requestTemplate},{sanitize:r});await new Promise((i,s)=>{const a=window.setTimeout(()=>{M.delete(n.requestId),s(new Error("Timed out waiting for page clipboard write result"))},5e3);M.set(n.requestId,{resolve:i,reject:s,timer:a}),window.postMessage(n,window.location.origin)})};try{await e(!1)}catch(r){await e(!0).catch(n=>{throw new Error(`Clipboard write failed (raw + sanitized). First: ${String(r)}. Second: ${String(n)}`)})}},Pe=()=>w||(w=new $e({onInsert:async t=>{try{await Oe(t),S(`Loaded favorite: ${t.name}. Press Cmd/Ctrl+V to paste.`)}catch(e){console.error("[BPKeys] Failed to write favorite payload",e);const r=e instanceof Error?e.message:String(e);S(`Clipboard write failed: ${r.slice(0,120)}`)}},onDelete:async t=>{const e=await Ae(t.id);w?.refreshFavorites(e),S(`Deleted favorite: ${t.name}`)},onMove:async(t,e)=>{const r=await Ne(t.id,e);w?.refreshFavorites(r)},onClose:()=>{}}),w),Ve=async()=>{const t=await U();if(!t){S("No copied Signavio snippet found yet.");return}const e=v(t.valueJson),r={name:be(t.valueJson),content:e.contentText},n=await We(r);if(!n)return;const i=n.name.trim();if(!i){S("Favorite name cannot be empty.");return}if(await Le(i,t,{displayName:n.name,displayContent:n.content,defaultDisplayName:r.name,defaultDisplayContent:r.content}),w?.isOpen()){const s=await C();w.refreshFavorites(s)}S(`Saved favorite: ${i}`)},He=async()=>{const t=await C();Pe().toggle(t)},_e=async t=>{if(t.type==="BPKEYS_SAVE_FAVORITE"){await Ve();return}t.type==="BPKEYS_TOGGLE_OVERLAY"&&await He()},Ge={matches:["*://*.signavio.com/*"],runAt:"document_idle",main(){qe(),(async()=>{const e=(await U())?.requestTemplate,r=e?void 0:(await C()).find(i=>i.requestTemplate)?.requestTemplate,n=e??r;n&&window.postMessage({source:j,type:"clipboard-template-bootstrap",template:n},window.location.origin)})(),window.addEventListener("message",async t=>{if(t.source!==window||t.origin!==window.location.origin)return;const e=t.data;if(!(!e||e.source!==Re||typeof e.type!="string")){if(e.type==="clipboard-captured"&&ze(e.payload)){await Te(e.payload);return}e.type==="clipboard-write-result"&&Me(e)&&Be(e)}}),g.runtime.onMessage.addListener(t=>{if(!(!t||typeof t!="object"||!("type"in t)))return _e(t)})}};function F(t,...e){}const Ue={debug:(...t)=>F(console.debug,...t),log:(...t)=>F(console.log,...t),warn:(...t)=>F(console.warn,...t),error:(...t)=>F(console.error,...t)};var K=class Y extends Event{static EVENT_NAME=q("wxt:locationchange");constructor(e,r){super(Y.EVENT_NAME,{}),this.newUrl=e,this.oldUrl=r}};function q(t){return`${g?.runtime?.id}:content:${t}`}const je=typeof globalThis.navigation?.addEventListener=="function";function Ke(t){let e,r=!1;return{run(){r||(r=!0,e=new URL(location.href),je?globalThis.navigation.addEventListener("navigate",n=>{const i=new URL(n.destination.url);i.href!==e.href&&(window.dispatchEvent(new K(i,e)),e=i)},{signal:t.signal}):t.setInterval(()=>{const n=new URL(location.href);n.href!==e.href&&(window.dispatchEvent(new K(n,e)),e=n)},1e3))}}}var Ye=class I{static SCRIPT_STARTED_MESSAGE_TYPE=q("wxt:content-script-started");id;abortController;locationWatcher=Ke(this);constructor(e,r){this.contentScriptName=e,this.options=r,this.id=Math.random().toString(36).slice(2),this.abortController=new AbortController,this.stopOldScripts(),this.listenForNewerScripts()}get signal(){return this.abortController.signal}abort(e){return this.abortController.abort(e)}get isInvalid(){return g.runtime?.id==null&&this.notifyInvalidated(),this.signal.aborted}get isValid(){return!this.isInvalid}onInvalidated(e){return this.signal.addEventListener("abort",e),()=>this.signal.removeEventListener("abort",e)}block(){return new Promise(()=>{})}setInterval(e,r){const n=setInterval(()=>{this.isValid&&e()},r);return this.onInvalidated(()=>clearInterval(n)),n}setTimeout(e,r){const n=setTimeout(()=>{this.isValid&&e()},r);return this.onInvalidated(()=>clearTimeout(n)),n}requestAnimationFrame(e){const r=requestAnimationFrame((...n)=>{this.isValid&&e(...n)});return this.onInvalidated(()=>cancelAnimationFrame(r)),r}requestIdleCallback(e,r){const n=requestIdleCallback((...i)=>{this.signal.aborted||e(...i)},r);return this.onInvalidated(()=>cancelIdleCallback(n)),n}addEventListener(e,r,n,i){r==="wxt:locationchange"&&this.isValid&&this.locationWatcher.run(),e.addEventListener?.(r.startsWith("wxt:")?q(r):r,n,{...i,signal:this.signal})}notifyInvalidated(){this.abort("Content script context invalidated"),Ue.debug(`Content script "${this.contentScriptName}" context invalidated`)}stopOldScripts(){document.dispatchEvent(new CustomEvent(I.SCRIPT_STARTED_MESSAGE_TYPE,{detail:{contentScriptName:this.contentScriptName,messageId:this.id}})),window.postMessage({type:I.SCRIPT_STARTED_MESSAGE_TYPE,contentScriptName:this.contentScriptName,messageId:this.id},"*")}verifyScriptStartedEvent(e){const r=e.detail?.contentScriptName===this.contentScriptName,n=e.detail?.messageId===this.id;return r&&!n}listenForNewerScripts(){const e=r=>{!(r instanceof CustomEvent)||!this.verifyScriptStartedEvent(r)||this.notifyInvalidated()};document.addEventListener(I.SCRIPT_STARTED_MESSAGE_TYPE,e),this.onInvalidated(()=>document.removeEventListener(I.SCRIPT_STARTED_MESSAGE_TYPE,e))}};function et(){}function D(t,...e){}const Je={debug:(...t)=>D(console.debug,...t),log:(...t)=>D(console.log,...t),warn:(...t)=>D(console.warn,...t),error:(...t)=>D(console.error,...t)};return(async()=>{try{const{main:t,...e}=Ge;return await t(new Ye("content",e))}catch(t){throw Je.error('The content script "content" crashed on startup!',t),t}})()})();
content;