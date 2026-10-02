/* Camino 26 오프라인 실행용 서비스 워커
   같은 폴더의 camino26.html만 폰에 보관한다.
   통신이 되면 새 파일을 먼저 받고, 4초 안에 응답이 없거나 끊겨 있으면 보관본으로 연다.
   다른 요청은 건드리지 않는다. */
var SCOPE=new URL(self.registration.scope).pathname;
var CACHE="c26:"+SCOPE+":v1";
var PAGE=self.location.pathname.replace(/-sw\.js$/,".html");
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.add(PAGE)}).catch(function(){}));
  self.skipWaiting();
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){
      return k.indexOf("c26:"+SCOPE+":")===0&&k!==CACHE;
    }).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener("fetch",function(e){
  var req=e.request,u=new URL(req.url);
  if(req.method!=="GET"||u.origin!==self.location.origin)return;
  if(u.pathname!==PAGE)return;
  e.respondWith(new Promise(function(resolve){
    var done=false;
    function fromCache(){return caches.match(PAGE)}
    var t=setTimeout(function(){
      fromCache().then(function(r){if(!done&&r){done=true;resolve(r)}});
    },4000);
    fetch(req,{cache:"no-store"}).then(function(r){
      if(r&&r.ok&&r.type==="basic"){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(PAGE,cp)})}
      clearTimeout(t);if(!done){done=true;resolve(r)}
    }).catch(function(){
      clearTimeout(t);
      fromCache().then(function(r){if(!done){done=true;resolve(r||new Response("오프라인입니다. 통신이 되는 곳에서 한 번 열어 두십시오.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}}))}});
    });
  }));
});
