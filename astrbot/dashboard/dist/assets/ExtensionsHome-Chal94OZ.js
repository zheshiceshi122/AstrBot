import{P as u}from"./PageToolbar-Cbsph9LJ.js";import{d as _,E as v,c as b,a as c,b as p,w as k,F as l,b3 as d,l as e,t as r,e as a,b5 as g,A as o,a1 as h,b7 as x}from"./index-ieQT2KrJ.js";/* empty css                       */import{C as M}from"./chevron-right-XUhuZGf6.js";import{H as f}from"./heart-CH7t_GKJ.js";import{c as s}from"./createLucideIcon-BS-WnYjN.js";import{P as w}from"./puzzle-CQHOVo37.js";import"./chevron-left-pDDwFoUM.js";/**
 * @license @lucide/vue v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M11 22H5.5a1 1 0 0 1 0-5h4.501",key:"mcbepb"}],["path",{d:"m21 22-1.879-1.878",key:"12q7x1"}],["path",{d:"M3 19.5v-15A2.5 2.5 0 0 1 5.5 2H18a1 1 0 0 1 1 1v8",key:"olfd5n"}],["circle",{cx:"17",cy:"18",r:"3",key:"82mm0e"}]],C=s("book-search",z);/**
 * @license @lucide/vue v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["path",{d:"M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z",key:"trhst0"}],["path",{d:"M17 21v-2",key:"ds4u3f"}],["path",{d:"M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10",key:"1mo9zo"}],["path",{d:"M21 21v-2",key:"eo0ou"}],["path",{d:"M3 5V3",key:"1k5hjh"}],["path",{d:"M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z",key:"1dd30t"}],["path",{d:"M7 5V3",key:"1t1388"}]],N=s("cable",H);/**
 * @license @lucide/vue v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=[["path",{d:"M13 5h8",key:"a7qcls"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 19h8",key:"c3s6r1"}],["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}]],$=s("list-checks",V);/**
 * @license @lucide/vue v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=[["path",{d:"M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",key:"1s2grr"}],["path",{d:"M20 2v4",key:"1rf3ol"}],["path",{d:"M22 4h-4",key:"gwowj6"}],["circle",{cx:"4",cy:"20",r:"2",key:"6kqj1y"}]],j=s("sparkles",B);/**
 * @license @lucide/vue v1.23.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["path",{d:"M16 3.128a4 4 0 0 1 0 7.744",key:"16gr8j"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}]],L=s("users",q),T={class:"workspace-home"},E={class:"workspace-menu__group"},P={class:"workspace-menu"},Q=_({__name:"ExtensionsHome",setup(R){const{t:n}=v(),y=b(()=>[{title:"dialogue",items:[{to:"/persona",key:"persona",icon:f},{to:"/knowledge-base",key:"knowledgeBase",icon:C}]},{title:"tools",items:[{to:"/extension/plugins",key:"extension",icon:w},{to:"/extension/mcp",key:"extensionTabs.mcp",icon:N},{to:"/extension/skills",key:"extensionTabs.skills",icon:j},{to:"/extension/components",key:"extensionTabs.components",icon:$},{to:"/subagent",key:"subagent",icon:L}]}]);return(S,A)=>{const m=g("RouterLink");return o(),c("div",T,[p(u,{class:"workspace-home__header"},{default:k(()=>[e("h1",null,r(a(n)("core.navigation.mobileExtensions")),1)]),_:1}),(o(!0),c(l,null,d(y.value,i=>(o(),c(l,{key:i.title},[e("h2",E,r(a(n)(`core.navigation.hubGroups.${i.title}`)),1),e("div",P,[(o(!0),c(l,null,d(i.items,t=>(o(),h(m,{key:t.to,to:t.to,class:"workspace-menu__item"},{default:k(()=>[(o(),h(x(t.icon),{size:20,"aria-hidden":"true"})),e("span",null,[e("strong",null,r(a(n)(`core.navigation.${t.key}`)),1),e("small",null,r(a(n)(`core.navigation.hubHints.${t.key.replace("extensionTabs.","")}`)),1)]),p(a(M),{size:16,"aria-hidden":"true"})]),_:2},1032,["to"]))),128))])],64))),128))])}}});export{Q as default};
