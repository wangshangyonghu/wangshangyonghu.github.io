// pl.js 畅言评论自适应加载
function loadChangyan(containerId, appid, conf) {
    var width = window.innerWidth || document.documentElement.clientWidth;
    var head = document.getElementsByTagName('head')[0] || document.head || document.documentElement;

    if (width < 1000) {
        if (!document.getElementById('changyan_mobile_js')) {
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.charset = 'utf-8';
            script.id = 'changyan_mobile_js';
            script.src = 'https://cy-cdn.kuaizhan.com/upload/mobile/wap-js/changyan_mobile.js?client_id=' + appid + '&conf=' + conf;
            head.appendChild(script);
        }
    } else {
        function loadJs(d, a) {
            var c = head;
            var b = document.createElement("script");
            b.setAttribute("type", "text/javascript");
            b.setAttribute("charset", "UTF-8");
            b.setAttribute("src", d);
            if (typeof a === "function") {
                if (window.attachEvent) {
                    b.onreadystatechange = function () {
                        var e = b.readyState;
                        if (e === "loaded" || e === "complete") {
                            b.onreadystatechange = null;
                            a();
                        }
                    }
                } else {
                    b.onload = a;
                }
            }
            c.appendChild(b);
        }
        loadJs("https://cy-cdn.kuaizhan.com/upload/changyan.js", function () {
            window.changyan.api.config({ appid: appid, conf: conf });
        });
    }
}