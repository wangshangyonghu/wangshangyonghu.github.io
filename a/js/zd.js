// zd.js 置顶按钮
window.addEventListener('load', function(){
    const topBtn = document.createElement('button');
    topBtn.id = "goTopBtn";
    topBtn.innerText = "回到顶部";
    document.body.appendChild(topBtn);

    // 点击置顶
    topBtn.onclick = function(){
        window.scrollTo({top:0,behavior:"smooth"});
    }

    // 滚动控制显示隐藏
    window.addEventListener('scroll',function(){
        if(window.scrollY > 200){
            topBtn.style.display = "block";
        }else{
            topBtn.style.display = "none";
        }
    })
})
