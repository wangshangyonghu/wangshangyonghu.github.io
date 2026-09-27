
// 等待页面DOM加载完毕
document.addEventListener('DOMContentLoaded', function(){
    // 获取全部a标签
    const allA = document.querySelectorAll('a');
    allA.forEach(function(a){
        // 设置新窗口打开
        a.target = '_blank';
        // 安全属性
        a.rel = 'noopener noreferrer';
    })
})

