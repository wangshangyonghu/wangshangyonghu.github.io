// ========= DNS预解析（多个域名） =========
const dnsList = [
  "//wangshangyonghu.github.io",
  "//wangshangyonghu.web1337.net"
];
dnsList.forEach(host=>{
  // 防止重复添加link标签
  if(!document.querySelector(`link[rel="dns-prefetch"][href="${host}"]`)){
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = host;
    document.head.appendChild(link);
  }
});

// ========= 图片预加载（多张图片） =========
const imgPreload = [
  "/tu/jpg1/57.jpg",
  "/tu/jpg1/1.jpg"
];
imgPreload.forEach(href=>{
  if(!document.querySelector(`link[rel="preload"][href="${href}"][as="image"]`)){
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = "image";
    link.type = "image/jpeg";
    document.head.appendChild(link);
  }
});
