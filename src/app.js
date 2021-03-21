const { getRegions } = require("./autocomplete")
const dayjs = require('dayjs');

async function getToken(action, settings){
  const EKSToken = require('aws-eks-token');
  if (!action.params.clusterName){
    throw "not given cluster name";
  }
  const expires = action.params.expires || "60";
  if (!Number.isInteger(parseFloat(expires))){
    throw "expires must be an integer";
  }
  
  EKSToken.config = {
    accessKeyId:  action.params.accessKeyId || settings.accessKeyId,
    secretAccessKey: action.params.secretAccesKey || settings.secretAccesKey,
    region: action.params.region
  }

  const reqTime = dayjs();
  const token = await EKSToken.renew(action.params.clusterName, expires, 
    reqTime.utc().format('YYYYMMDDTHHmmss[Z]'));
  const expirationTime = reqTime.add(parseInt(expires), "s").utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
  return {
    "expirationTimestamp": expirationTime,
    "token": token
  }
}

module.exports = {
  getToken,
  // autocomplete
  getRegions
};

