// 样式自动注入
(function(){
    let style = document.createElement('style');
    style.innerHTML = `
        .modal {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 420px;
            height: auto;
            background: rgba(0, 0, 0, 0.8);
            z-index: 999;
            justify-content: center;
            align-items: center;
            padding: 10px;
            border-radius: 8px;
        }
        .modal-content {
            width: 100%;
            height: auto;
            display: block;
        }
        .close {
            position: absolute;
            top: -10px;
            right: 10px;
            color: white;
            font-size: 30px;
            cursor: pointer;
            z-index: 10;
        }
    `;
    document.head.appendChild(style);

    // 插入弹窗DOM结构
    if(!document.getElementById('imageModal')){
        let div = document.createElement('div');
        div.id = 'imageModal';
        div.className = 'modal';
        div.innerHTML = `
            <span class="close" onclick="toggleModal()">&times;</span>
            <img src="http://192.168.0.188:223/aa/sc/1.jpg" class="modal-content">
        `;
        document.body.appendChild(div);
    }

    // 切换弹窗函数
    window.modal = document.getElementById("imageModal");
    window.toggleModal = function() {
        modal.style.display = modal.style.display === "flex" ? "none" : "flex";
    }
})();