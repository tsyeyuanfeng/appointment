
const config = {
  // 用户Cookie
  cookie: 'SESSION_COOKIE=3cab1829cea36edbceb07f7e; JSESSIONID=70F34DDDA61356F65DCE1E76460E309D; Hm_lvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1491913111,1491913235; Hm_lpvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1491916405',

  // 预约目标相关
  hospitalId: '142', // 医院编号
  departmentId: '200039608', // 科室编号
  dutyDate: '2017-04-17',  // 预约日期
  dutyCode: '1', // 预约时段：1-上午，2-下午

  // 预约表单相关  
  patientId: '219295248', // 患者编号
  hospitalCardId: '', // 就诊卡编号(选填)
  medicareCardId: '', // 医保卡编号（选填）
};

module.exports = config;
