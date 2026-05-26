/*
SEO独立加载调用文件
全局核心关键词统一管理
任意位置引入脚本均可正常生效
后期更换网站主词只修改seo.html
*/
(function(){
    const seoFile = '/a/js/seo.html';
    fetch(seoFile)
    .then(res => res.text())
    .then(htmlStr => {
        document.head.insertAdjacentHTML('beforeend',htmlStr);
    })
    .catch(error=>{
        console.log('SEO配置加载异常');
    });
})();