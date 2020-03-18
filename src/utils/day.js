
export const getAge = str => {
  var r = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
  if (r == null) return false;
  var d = new Date(r[1], r[3] - 1, r[4]);
  if (d.getFullYear() == r[1] && d.getMonth() + 1 == r[3] && d.getDate() == r[4]) {
    var Y = new Date().getFullYear();
    return "年龄   =   " + (Y - r[1]) + "   周岁";
  }
  return "输入的日期格式错误！";
};
export const getStudyTime = val => {
  let today = new Date();
  let goalDay = new Date(val);
  let date1 = Date.parse(today);
  let date2 = Date.parse(goalDay);
  let day = Math.ceil((date2 - date1) / (60 * 60 * 1000 * 24));
  let age = "";
  let year = Math.floor(day / 365);
  let y = day % 365;
  let month = Math.floor(y / 30);
  let d = Math.floor((day % 365) % 30);
  age += year + "年" + month + "月" + d + "天";
  return { day };
};
