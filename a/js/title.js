// 页面标题自动追加 @网上用户，等待DOM就绪再执行
document.addEventListener('DOMContentLoaded', function(){
    const suffix = '@网上用户';
    let title = document.title.trim();
    if(!title.endsWith(suffix)){
        document.title = title + suffix;
    }
});
