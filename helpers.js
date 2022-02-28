const aws = require("aws-sdk");
const parsers = require("./parsers");

function getEc2(params, settings) {
  return new aws.EC2({
    region: parsers.autocomplete(params.region) || settings.region,
    accessKeyId: params.accessKeyId || settings.accessKeyId,
    secretAccessKey: params.secretAccessKey || settings.secretAccessKey,
  });
}

function getLightsail(params, settings) {
  return new aws.Lightsail({
    region: parsers.autocomplete(params.region) || settings.region,
    accessKeyId: params.accessKeyId || settings.accessKeyId,
    secretAccessKey: params.secretAccessKey || settings.secretAccessKey,
  });
}

module.exports = {
  getEc2,
  getLightsail,
};
