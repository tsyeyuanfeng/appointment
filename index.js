const readlineSync = require('readline-sync');
const request = require('request');
const co = require('co');
const Promise = require('promise');
const log4js = require('log4js');
const config = require('./config');

const logger  = log4js.getLogger();
const {
  cookie,
  hospitalId,
  departmentId,
  dutyDate,
  dutyCode,
  patientId,
  hospitalCardId,
  medicareCardId
} = config;

/**
 * 获取短信验证码
 * @return {Promise}
 */
function getSmsCode() {
  const promise = new Promise((resolve, reject) => {
    const options = {
      uri: 'http://www.bjguahao.gov.cn/v/sendorder.htm',
      method: 'POST',
      headers: {
        Cookie: cookie
      }
    };
    request(options, (error, response, body) => {
      if(error) {
        reject(error);
      }
      else if(response.statusCode >= 200 && response.statusCode < 300){
        body = JSON.parse(body);
        if(body.code !== 200) {
          reject(new Error(`返回业务状态码不正确：${body.code}-${body.msg}`));
        }
        else {
          resolve();
        }
      }
      else {
        reject(new Error(`返回HTTP状态码不正确：${response.statusCode}`));
      }
    });
  });
  return promise;
}

/**
 * 获取值班列表数据
 * @param {String} hospitalId 医院编号
 * @param {String} departmentId 科室编号
 * @param {String} dutyCode 值班码：上午 - 1，下午 - 2
 * @param {String} dutyDate 值班日期, 如'2017-03-17'
 * @return {Promise}
 */
function getDutySources(hospitalId, departmentId, dutyCode, dutyDate) {
  const promise = new Promise((resolve, reject) => {
    const options = {
      uri: 'http://www.bjguahao.gov.cn/dpt/partduty.htm',
      method: 'POST',
      headers: {
        Cookie: cookie,
      },
      form: {
          hospitalId: hospitalId,
          departmentId: departmentId,
          dutyCode: dutyCode,
          dutyDate: dutyDate,
          isAjax: 'true'
      }
    };
    request(options, (error, response, body) => {
      if(error) {
        reject(error);
      }
      else if(response.statusCode >= 200 && response.statusCode < 300){
        body = JSON.parse(body);
        if(body.code !== 200) {
          reject(new Error(`返回业务状态码不正确：${body.code}-${body.msg}`));
        }
        else {
          resolve(body.data);
        }
      }
      else {
        reject(new Error(`返回HTTP状态码不正确：${response.statusCode}`));
      }
    });
  });
  return promise;
}

/**
 * 访问下单页面(提交订单之前执行)
 * @param {Object} dutySource
 * @return {Promise}
 */
function visitOrderPage(dutySource) {
  const { dutySourceId, hospitalId, departmentId, doctorId } = dutySource;
  const promise = new Promise((resolve, reject) => {
    const options = {
      uri: `http://www.bjguahao.gov.cn/order/confirm/${hospitalId}-${departmentId}-${doctorId}-${dutySourceId}.htm`,
      method: 'GET',
      headers: {
        Cookie: cookie,
      }
    };

    request(options, (error, response, body) => {
      if(error) {
        reject(error);
      }
      else if(response.statusCode >= 200 && response.statusCode < 300){
        resolve(body);
      }
      else {
        reject(new Error(`返回HTTP状态码不正确：${response.statusCode}`));
      }
    });
  });
  return promise;
}

/**
 * 预约
 * @param {Object} dutySource
 * @param {String} patientId 患者编号
 * @param {String} hospitalCardId 就诊卡编号
 * @param {String} medicareCardId 医保卡编号
 * @param {String} reimbursementType 报销类型
 * @return {Promise}
 */
function makeAppointment(smsVerifyCode, dutySource, patientId, hospitalCardId, medicareCardId, reimbursementType = '1') {
  const { dutySourceId, hospitalId, departmentId, doctorId } = dutySource;
  const promise = new Promise((resolve, reject) => {
    const options = {
      uri: `http://www.bjguahao.gov.cn/order/confirm.htm`,
      method: 'POST',
      headers: {
        Cookie: cookie,
      },
      form: {
          dutySourceId,
          hospitalId,
          departmentId,
          doctorId,
          patientId,
          hospitalCardId,
          medicareCardId,
          reimbursementType,
          smsVerifyCode,
          childrenBirthday: '',
          isAjax: 'true'
      }
    };

    request(options, (error, response, body) => {
      if(error) {
        reject(error);
      }
      else if(response.statusCode >= 200 && response.statusCode < 300){
        body = JSON.parse(body);
        if(body.code !== 200) {
          reject(new Error(`返回业务状态码不正确：${body.code}-${body.msg}`));
        }
        else {
          resolve(body.data);
        }
      }
      else {
        reject(new Error(`返回HTTP状态码不正确：${response.statusCode}`));
      }
    });
  });
  return promise;
}

/**
 * 延迟
 * @param {Number} milliseconds
 * @return {Promise}
 */
function delay(milliseconds) {
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, milliseconds);
  });
  return promise;
}

co(function* () {
  var dutySources;
  for(;;) {
    logger.info('尝试获取值班列表');
    dutySources = yield getDutySources(hospitalId, departmentId, dutyCode, dutyDate);
    if(dutySources.length > 0) break;
    logger.info(`值班列表为空，延迟100ms`);
    yield delay(5000);
  }

  const availableDutySources = dutySources.filter(dutySource => dutySource.remainAvailableNumber > 0);
  if(availableDutySources.length > 0) {
    logger.info('获取到可预约的值班列表');
    const visitOrderPageResult = yield visitOrderPage(dutySources[0]);
    logger.info('进入下单页，发送短信验证码...');
    yield getSmsCode();
    logger.info('短信验证码发送成功');
    const smsVerifyCode = readlineSync.question('输入短信验证码：');
    logger.info('开始预约');
    const result = yield makeAppointment(smsVerifyCode, dutySources[0], patientId, hospitalCardId, medicareCardId, 1);
    logger.info(`预约成功`);
  }
  else {
    logger.info('没有可预约的号了');
  }
}).catch(error => {
  logger.error(error.message);
});
