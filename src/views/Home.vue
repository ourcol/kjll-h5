<template>
  <div class="home">
    <van-pull-refresh v-model="pullLoading" @refresh="onRefresh">
      <Swipe />
      <p class="shift-mode"><span>{{mode}}</span>
        <van-switch v-model="checked" size="24px" @change="changeSwitch" />
      </p>
      <van-divider />
      <div class="van-clearfix">
        <van-list v-model="listLoading" :finished="finished" finished-text="没有更多了" @load="queryImageList()">
          <van-grid :border="false" :column-num="3" v-if="mode=='极速'">
            <van-grid-item v-for="(item,index) in imageList" :key="index">
              <van-image @click="preview(index,resizedList)" :src="item.resizedUrl" fit="contain" height="10rem" />
              <span class="shot-time" v-if="item.dateTime">拍摄于<br />{{item.dateTime}}</span>
            </van-grid-item>
          </van-grid>
          <van-grid :border="false" :column-num="3" v-if="mode=='原图'">
            <van-grid-item v-for="(item,index) in imageList" :key="index">
              <van-image @click="preview(index,originalList)" :src="item.originalUrl" fit="contain" height="10rem" />
              <span class="shot-time" v-if="item.dateTime">拍摄于<br />{{item.dateTime}}</span>
            </van-grid-item>
          </van-grid>
        </van-list>
      </div>
      <van-divider />
      <van-uploader v-model="fileList" :before-read="beforeRead" :before-delete="beforeDelete" multiple />
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
      pullLoading: false,
      index: 0,
      formData: null,
      resizedList: [],
      originalList: [],
      dealedFile: [],//被转换后的file格式
      width: '',//原图片宽度
      height: '',//原图片高度
      checked: false,//切花极速和原图
      mode: '极速',//模式
      listLoading: false,//列表loading
      finished: false,//列表
      dateTime: [],//时间
      imageList: [],
      fileNameList: [],//待上传图片名称列表
      pageNo: 0,
      pageSize: 9
    }
  },
  watch: {
    async fileList(val) {
      if (val.length > 0) {
        this.saveBtn = true;
      } else {
        this.saveBtn = false;
      }
      console.log(val)
    },
    checked(val) {
      if (val) this.mode = '原图'
      if (!val) this.mode = '极速'
      this.resizedList = [];
      this.originalList = [];
      this.imageList = [];
    }
  },
  created() {
    this.toast.loading({
      message: '加载中...',
      forbidClick: true
    });
  },
  mounted() {

  },
  methods: {
    onChange(index) {
      this.current = index;
    },
    changeSwitch() {
      this.pageNo = 0;
      this.toast.loading({
        message: '加载中...',
        forbidClick: true
      });
      this.queryImageList()
    },
    onChangeImagePreview(item, index) {
      this.index = index + 1;
    },
    async beforeRead(file) {
      let that = this;
      if (!file.length) {//上传一张
        this.fileNameList.push(file)
        let DateTime = (await this.isNeedFixPhoto(file)).DateTime;
        this.dateTime.push(DateTime);
        this.dealedFile = '';
        if (file.type !== 'image/jpeg') {
          this.toast('请上传 jpg 格式图片');
          return false;
        }
        // console.log(await this.isNeedFixPhoto(file))
        if ((await this.isNeedFixPhoto(file)).flag) {//需要旋转
          this.dealedFile = await this.repairPhoto(file, 1, that.width)
          // console.log(this.dealedFile)
          this.formData = new FormData();
          this.formData.append('photos', this.dealedFile)
          return true
        } else {
          this.dealedFile = file;
          this.formData = new FormData();
          this.formData.append('photos', file)
        }
        console.log(await this.isNeedFixPhoto(file).DateTime)
      } else {//上传多张
        this.formData = new FormData();
        this.dealedFile = [];
        console.log(file.length)
        let DateTime
        file.map(async (item, index, arr) => {
          if (item.type !== 'image/jpeg') {
            this.toast('请上传 jpg 格式图片');
            return false;
          }
          DateTime = (await this.isNeedFixPhoto(item)).DateTime;
          this.dateTime.push(DateTime);
          if ((await this.isNeedFixPhoto(item)).flag) {//需要旋转
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
    beforeDelete(file) {
      console.log('delete', file.file.name)
      console.log(this.fileNameList)
      console.log(this.dateTime)
      let index
      this.fileNameList.map((item, ind, arr) => {
        console.log(item.name)
        if (item.name == file.file.name) {
          index = ind
          return
        }
      })
      this.dateTime.splice(index, 1)
      return true
    },
    onRefresh() {
      this.pageNo = 0;
      this.finished = true;//清空列表数据
      this.listLoading = false;//隐藏列表的加载中
      this.resizedList = [];
      this.originalList = [];
      this.imageList = [];
      this.fileList = [];
      this.queryImageList('first');
    },
    preview(index, list) {
      ImagePreview({
        images: list,
        startPosition: index,
        closeable: true
      });
    },
    saveFiles() {
      this.fileNameList = []
      let _ = this;
      this.toast.loading({
        message: '加载中...',
        forbidClick: true
      });
      axios({
        // url: 'http://www.ourcol.com/profile',
        url: 'http://www.ourcol.com/upload',
        method: 'post',
        data: this.formData,
        params: { dateTime: this.dateTime },
        'Content-Type': 'multipart/form-data'
      })
        .then(response => {
          this.toast.clear();
          console.log(response)
          this.fileList = [];
          this.pageNo = 1;
          this.resizedList = [];
          this.originalList = [];
          this.imageList = [];
          this.dateTime = [];
          _.queryImageList('first');
        })
        .catch(() => {
          _.toast.clear();
          _.fileList = [];
          _.toast.success('上传成功');
          this.pageNo = 1;
          this.dateTime = [];
          _.queryImageList('first')
        })
      this.dateTime = [];
    },
    queryImageList(first) {
      // let pageNo = this.pageNo;
      // if (!first) 
      this.pageNo++;
      if (first) {
        this.pageNo = 1;
        this.resizedList = [];
        this.originalList = [];
        this.imageList = [];
      }
      axios({
        url: 'http://www.ourcol.com/getImageList',
        method: 'get',
        params: { pageNo: this.pageNo, pageSize: this.pageSize },
      })
        .then(res => {
          if (res.data.success) {
            this.pullLoading = false;
            res.data.result.imageList.map((item, index, arr) => {
              this.imageList.push(item)
              this.originalList.push(item.originalUrl);
              this.resizedList.push(item.resizedUrl);
            })
            if (res.data.result.imageList.length < 9) {
              this.finished = true;
              return
            } else {
              this.finished = false;
            }
            this.listLoading = false;
            this.toast.clear();
          }
        })
        .catch(() => {
          this.toast.clear();
          this.pullLoading = false;

        })
    },
    isNeedFixPhoto(file) {
      let that = this
      return new Promise(function (resolve, reject) {
        EXIF.getData(file, function () {
          let Orientation = EXIF.getTag(this, 'Orientation');
          let PixelYDimension = EXIF.getTag(this, 'PixelYDimension');
          let PixelXDimension = EXIF.getTag(this, 'PixelXDimension');
          let DateTime = EXIF.getTag(this, 'DateTime') ? EXIF.getTag(this, 'DateTime') : null
          that.height = PixelYDimension;
          that.width = PixelXDimension;
          if (Orientation && Orientation != 1) {
            //图片角度不正确
            resolve({ flag: true, Orientation: Orientation, DateTime: DateTime })
          } else {
            //不需处理直接上传
            resolve({ flag: false, Orientation: Orientation, DateTime: DateTime })
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
        // console.log(this.dataURLtoFile(resultFile, 'photos'))
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
/deep/ .van-divider {
  margin-bottom: 0;
}
.shot-time {
  font-size: 12px;
  color: darkgray;
}
</style>

