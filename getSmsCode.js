const request = require('request');
const co = require('co');
const Promise = require('promise');
const log4js = require('log4js');
const config = require('./config');

const logger  = log4js.getLogger();
const { cookie } = config;

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

co(function* () {
  yield getSmsCode();
}).catch(error => {
  logger.error(error.message);
});
