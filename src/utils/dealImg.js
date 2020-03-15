export function getBase64Image(img) {
  var demoCanvas = document.getElementById("demoCanvas");
  demoCanvas.width = img.width;
  demoCanvas.height = img.height;
  var ctx = demoCanvas.getContext("2d");
  ctx.drawImage(img, 0, 0, 300, 150);
  var ext = img.src.substring(img.src.lastIndexOf(".") + 1).toLowerCase();
  var dataURL = demoCanvas.toDataURL("image/" + ext);
  return {
    dataURL: dataURL,
    type: "image/" + ext
  };
}

export function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function file2Base64(file) {
  return new Promise(function(resolve, reject) {
    let reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function(ev) {
      resolve(ev.target.result);
    };
  });
}

// 压缩处理选中的方法
export function best4Photo(resultBase64, Orientation, num, w) {
  return new Promise(function(resolve, reject) {
    let image = new Image();
    image.src = resultBase64;
    image.onload = function() {
      let imgWidth = this.width,
        imgHeight = this.height; //获取图片宽高
      // var imgWidth = w,
      //   imgHeight = w * this.height / this.width; //获取图片宽高
      var canvas = document.createElement("canvas");
      var ctx = canvas.getContext("2d");
      canvas.width = imgWidth;
      canvas.height = imgHeight;
      if (Orientation && Orientation != 1) {
        switch (Orientation) {
          case 6: // 旋转90度
            canvas.width = imgHeight;
            canvas.height = imgWidth;
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(this, 0, -imgHeight, imgWidth, imgHeight);
            console.log(canvas);
            break;
          case 3: // 旋转180度
            ctx.rotate(Math.PI);
            ctx.drawImage(this, -imgWidth, -imgHeight, imgWidth, imgHeight);
            break;
          case 8: // 旋转-90度
            canvas.width = imgHeight;
            canvas.height = imgWidth;
            ctx.rotate((3 * Math.PI) / 2);
            ctx.drawImage(this, -imgWidth, 0, imgWidth, imgHeight);
            break;
        }
      } else {
        ctx.drawImage(this, 0, 0, imgWidth, imgHeight);
      }
      const result = canvas.toDataURL("image/jpeg", num);
      console.log(result);
      resolve(result);
    };
  });
}
