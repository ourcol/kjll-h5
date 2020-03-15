<template>
  <div class="home">
    <van-pull-refresh v-model="isLoading" @refresh="onRefresh">
      <Swipe />
      <p class="shift-mode"><span>{{mode}}</span>
        <van-switch v-model="checked" size="24px" />
      </p>
      <van-grid :border="false" :column-num="3">
        <van-grid-item v-for="(img,index) in imageList" :key="index">
          <van-image @click="preview(index)" :src="img" fit="contain" />
        </van-grid-item>
      </van-grid>
      <van-divider />
      <van-uploader v-model="fileList" :before-read="beforeRead" multiple />
    </van-pull-refresh>
    <div class="save">
      <van-button color="linear-gradient(to right, #4bb0ff, #6149f6)" v-if="saveBtn" @click="saveFiles">保存至服务器</van-button>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { ImagePreview } from 'vant';
import EXIF from "exif-js"
import axios from 'axios'
import qs from 'qs'

import Swipe from '../components/Swipe.vue'
export default {
  name: 'Home',
  components: {    Swipe
  },
  data() {
    return {
      current: 0,
      fileList: [],
      saveBtn: false,
      count: 0,
      isLoading: false,
      show: false,
      index: 0,
      formData: null,
      imageList: [],
      dealedFile: [],//被转换后的file格式
      width: '',//原图片宽度
      height: '',//原图片高度
      checked: false,//切花极速和原图
      mode: '极速'//模式
    }
  },
  watch: {
    fileList(val) {
      if (val.length > 0) {
        this.saveBtn = true;
      } else {
        this.saveBtn = false;
      }
    },
    checked(val) {
      if (val) this.mode = '原图'
      if (!val) this.mode = '极速'
    }
  },
  methods: {
    onChange(index) {
      this.current = index;
    },
    onChangeImagePreview(index) {
      this.index = index + 1;
    },
    async beforeRead(file) {
      console.log(file.length)
      let that = this;
      //
      if (!file.length) {//上传一张
        this.dealedFile = '';
        if (file.type !== 'image/jpeg') {
          this.toast('请上传 jpg 格式图片');
          return false;
        }

        console.log(await this.isNeedFixPhoto(file))
        if ((await this.isNeedFixPhoto(file)).flag) {
          this.dealedFile = await this.repairPhoto(file, 1, that.width)
          console.log(this.dealedFile)
          this.formData = new FormData();
          this.formData.append('photos', this.dealedFile)
          return true
        } else {
          this.dealedFile = file;
          // this.formData=''
          this.formData = new FormData();
          this.formData.append('photos', file)
          // alert(1)
          // return true
        }

      } else {//上传多张
        this.formData = new FormData();
        this.dealedFile = [];
        console.log(file.length)
        file.map(async (item, index, arr) => {
          if (item.type !== 'image/jpeg') {
            this.toast('请上传 jpg 格式图片');
            return false;
          }
          console.log(await this.isNeedFixPhoto(item))
          if ((await this.isNeedFixPhoto(item)).flag) {
            this.dealedFile.push(await this.repairPhoto(item, 1, that.width))
            this.formData.append('photos', await this.repairPhoto(item, 1, that.width))
            console.log(this.formData);
          } else {
            this.dealedFile.push(item);
            this.formData.append('photos', item)
          }
        })

      }
    },
    onRefresh() {
      this.queryImageList();
    },
    preview(index) {
      ImagePreview({
        images: this.imageList,
        startPosition: index,
        closeable: true
      });
    },
    saveFiles() {
      let _ = this;
      this.toast.loading({
        message: '请稍后...',
        forbidClick: true
      });
      axios({
        // url: 'http://www.ourcol.com/profile',
        url: 'http://www.ourcol.com/upload',
        method: 'post',
        data: this.formData,
        'Content-Type': 'multipart/form-data'
      })
        .then(response => {
          this.toast.clear();
          console.log(response)
          this.fileList = [];
          this.toast.success('上传成功');
          _.queryImageList();
        })
        .catch(() => {
          _.toast.clear();
          _.fileList = [];
          _.toast.success('上传成功');
          _.queryImageList();
        })
    },
    queryImageList() {

      axios({
        url: 'http://www.ourcol.com/getImageList',
        method: 'get',
        data: qs.stringify({}),
      })
        .then(res => {
          this.toast.clear();
          console.log(res)
          this.isLoading = false;
          if (res.data.success) {
            let imageList = res.data.result.imageList;
            this.imageList = [];
            imageList.map((current, index) => {
              this.$set(this.imageList, index, 'http://www.ourcol.com/uploads/' + current)

            })
          }
        })
        .catch(() => {
          this.toast.clear();
        })
    },
    isNeedFixPhoto(file) {
      let that = this
      return new Promise(function (resolve, reject) {
        EXIF.getData(file, function () {
          let Orientation = EXIF.getTag(this, 'Orientation');
          let PixelYDimension = EXIF.getTag(this, 'PixelYDimension');
          let PixelXDimension = EXIF.getTag(this, 'PixelXDimension');
          that.height = PixelYDimension;
          that.width = PixelXDimension;

          if (Orientation && Orientation != 1) {
            //图片角度不正确
            resolve({ flag: true, Orientation: Orientation })
          } else {
            //不需处理直接上传
            resolve({ flag: false, Orientation: Orientation })
          }
        });
      })
    },
    file2Base64(file) {
      return new Promise(function (resolve, reject) {
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function (ev) {
          resolve(ev.target.result);
        }
      })
    },
    async repairPhoto(file, num, w) {
      const result = await this.isNeedFixPhoto(file);
      const resultBase64 = await this.file2Base64(file);
      const Orientation = result.Orientation;
      const numb = num || 1;
      if (result.flag) {  // 处理旋转
        const resultFile = await this.best4Photo(resultBase64, Orientation, numb, w)
        console.log(this.dataURLtoFile(resultFile, 'photos'))
        return this.dataURLtoFile(resultFile, 'photos')
      } else {            // 不处理旋转
        return await this.best4Photo(resultBase64, 1, numb, w)
      }
    },
    // 压缩处理选中的方法
    best4Photo(resultBase64, Orientation, num, w) {
      return new Promise(function (resolve, reject) {
        let image = new Image();
        let that = this;
        image.src = resultBase64;
        image.onload = function () {
          let imgWidth = this.width,
            imgHeight = this.height; //获取图片宽高
          // var imgWidth = w,
          //   imgHeight = w * this.height / this.width; //获取图片宽高
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext('2d');
          canvas.width = imgWidth;
          canvas.height = imgHeight;
          if (Orientation && Orientation != 1) {
            switch (Orientation) {
              case 6:     // 旋转90度
                canvas.width = imgHeight;
                canvas.height = imgWidth;
                ctx.rotate(Math.PI / 2);
                ctx.drawImage(this, 0, -imgHeight, imgWidth, imgHeight);
                console.log(canvas)
                break;
              case 3:// 旋转180度
                ctx.rotate(Math.PI);
                ctx.drawImage(this, -imgWidth, -imgHeight, imgWidth, imgHeight);
                break;
              case 8:     // 旋转-90度
                canvas.width = imgHeight;
                canvas.height = imgWidth;
                ctx.rotate(3 * Math.PI / 2);
                ctx.drawImage(this, -imgWidth, 0, imgWidth, imgHeight);
                break;
            }
          } else {
            ctx.drawImage(this, 0, 0, imgWidth, imgHeight);
          }
          const result = canvas.toDataURL("image/jpeg", num);
          console.log(result)
          resolve(result)
        }
      })
    },
    dataURLtoFile(dataurl, filename) {
      var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    }
  },
  created() {
    this.queryImageList();

  },
  mounted() {

  }
}
</script>
<style lang="scss" scoped>
.home {
  height: 100%;
  position: relative;
  .van-pull-refresh {
    height: 100%;
  }
  .days {
    font-weight: 600;
  }
  .shift-mode {
    display: flex;
    align-items: center;
    margin-left: 1em;
    margin-bottom: 0;
    span {
      padding-right: 0.4em;
      font-weight: 200;
    }
  }
}
/deep/ .save {
  position: fixed;
  bottom: 24px;
  width: 100%;
}
/deep/ .van-uploader {
  justify-content: center;
  margin-top: 20px;
  padding-bottom: 80px;
}
/deep/ .van-uploader__wrapper {
  justify-content: center;
}
/* /deep/ .van-image__img,
.van-image__loading {
  // height: 200px !important;
}
/deep/ .van-image__img {
  max-height: 200px;
}
*/
</style>

