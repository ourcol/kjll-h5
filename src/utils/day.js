export const getBirthSlot = (date) => {
    let birthDay = new Date(date)
    let nowDate = new Date()
    let date1 = Date.parse(birthDay)
    let date2 = Date.parse(nowDate)
    let day = Math.ceil((date2 - date1) / (60 * 60 * 1000 * 24))
    let age = ''
    let year = Math.floor(day / 365)
    let y = day % 365
    let month = Math.floor(y / 30)
    let d = Math.floor(day % 365 % 30)
    age += year + '岁' + month + '个月'
    return age
  }
  export const getStudyTime = (val) => {
    let today = new Date()
    let goalDay = new Date(val)
    let date1 = Date.parse(today)
    let date2 = Date.parse(goalDay)
    let day = Math.ceil((date2 - date1) / (60 * 60 * 1000 * 24))
    let age = ''
    let year = Math.floor(day / 365)
    let y = day % 365
    let month = Math.floor(y / 30)
    let d = Math.floor(day % 365 % 30)
    age += year + '年' + month + '月' +  d + '天'
    return {day}
  }
