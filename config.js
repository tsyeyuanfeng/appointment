
const config = {
  // 用户Cookie
  cookie: '',

  // 预约目标相关
  hospitalId: '142', // 医院编号
  departmentId: '', // 科室编号
  dutyDate: '2017-04-18',  // 预约日期
  dutyCode: '1', // 预约时段：1-上午，2-下午

  // 预约表单呢相关
  smsVerifyCode: '', // 短信验证码
  patientId: '', // 患者编号
  hospitalCardId: '', // 就诊卡编号(选填)
  medicareCardId: '', // 医保卡编号（选填）
};

module.exports = config;
