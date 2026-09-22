// 第一段：你原来的页脚加载代码，完全原样保留
window.addEventListener('load', function() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/a/js/yj.html', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.body.insertAdjacentHTML('beforeend', xhr.responseText);
    }
  };
  xhr.send();
});


// 第一段：你原来的页脚加载代码，完全原样保留
window.addEventListener('load', function() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/a/js/yj2.html', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.body.insertAdjacentHTML('beforeend', xhr.responseText);
    }
  };
  xhr.send();
});



// 第二段：单独新增，页面load之后，延迟修改标题
window.addEventListener('load', function() {
  setTimeout(function(){
    const suffix = '@网上用户';
    let title = document.title.trim();
    if(!title.endsWith(suffix)){
      document.title = title + suffix;
    }
  },100);
});
