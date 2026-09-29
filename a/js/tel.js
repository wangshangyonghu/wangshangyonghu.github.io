 const regPhone = /(1[3-9]\d{9})/g;
 function phoneToLink(text){
   return text.replace(regPhone, '<a href="tel:$1">$1</a>');
 }
 function scanAndReplace(rootEl){
   const childNodes = rootEl.childNodes;
   for(let i = childNodes.length -1; i >=0; i--){
     const node = childNodes[i];
     if(node.nodeType === 3){
       const txt = node.textContent;
       if(regPhone.test(txt)){
         const wrap = document.createElement('span');
         wrap.innerHTML = phoneToLink(txt);
         node.parentNode.replaceChild(wrap, node);
       }
     }else if(node.nodeType === 1){
       if(node.tagName !== 'A'){
         scanAndReplace(node);
       }
     }
   }
 }
 window.onload = function(){
   scanAndReplace(document.body);
 }
