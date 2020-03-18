<template>
  <div>
    <van-swipe class="my-swipe" :autoplay="3000" indicator-color="white">
      <van-swipe-item><span class="days">{{roysAge}}啦</span></van-swipe-item>
      <van-swipe-item><span class="days">{{kinderGartenTime}}</span> 天后幼儿园</van-swipe-item>
      <van-swipe-item><span class="days">{{primaryTime}} </span> 天后小学</van-swipe-item>
      <van-swipe-item><span class="days">{{middleTime}}</span> 天后初中</van-swipe-item>
      <van-swipe-item><span class="days">{{examDayLeft}}</span> 天后高考</van-swipe-item>
      <van-swipe-item><span class="days">好好学习 天天向上</span></van-swipe-item>
    </van-swipe>
  </div>
</template>
<script>
import { getStudyTime,getAge } from '../utils/day'

export default {
  name: 'Swipe',
  data() {
    return {
      examDayLeft: '',
      primaryTime: '',
      kinderGartenTime: '',
      middleTime: '',
      roysAge: ''
    }
  },
  created() {
    this.roysAge = getAge('2018-3-25')
    this.examDayLeft = getStudyTime('2036-06-07').day
    this.primaryTime = getStudyTime('2024-09-01').day
    this.kinderGartenTime = getStudyTime('2021-09-01').day
    this.middleTime = getStudyTime('2030-09-01').day
  }

}
</script>
<style lang="scss" scoped>
/deep/ .my-swipe .van-swipe-item {
  color: #fff;
  font-size: 20px;
  line-height: 200px;
  text-align: center;
  background-color: #39a9ed;
}
</style>