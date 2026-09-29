// zd.js 悬浮置顶按钮，固定在屏幕最底部，不遮挡页面正文
window.addEventListener('load', function(){
    const topBtn = document.createElement('button');
    topBtn.id = "goTopBtn";
    topBtn.innerText = "回到顶部";
    document.body.appendChild(topBtn);

    topBtn.onclick = function(){
        window.scrollTo({top:0,behavior:"smooth"});
    }

    window.addEventListener('scroll',function(){
        if(window.scrollY > 200){
            topBtn.style.display = "block";
        }else{
            topBtn.style.display = "none";
        }
    })
})
