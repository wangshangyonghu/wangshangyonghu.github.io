

// 合并DOMContentLoaded：加载yj2.html页脚 + 修改标题（更早执行，只绑定一次事件）
window.addEventListener('DOMContentLoaded', function() {
    // 加载 yj2.html 页脚
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/a/js/yj2.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                document.body.insertAdjacentHTML('beforeend', xhr.responseText);
            }
        }
    };
    xhr.send();

    // 页面标题追加后缀 @网上用户
    setTimeout(function(){
        const suffix = '@网上用户';
        let title = document.title.trim();
        if(!title.endsWith(suffix)){
            document.title = title + suffix;
        }
    },100);
});
