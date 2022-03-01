const aws = require("aws-sdk");
const parsers = require("./parsers");

const getServiceCreator = (serviceName) => (params, settings = {}) => new aws[serviceName]({
  credentials: {
    accessKeyId: params.accessKeyId || settings.accessKeyId,
    secretAccessKey: params.secretAccessKey || settings.secretAccessKey,
  },
  region: parsers.autocomplete(params.region) || settings.region,
});

function isObjectEmpty(ob) {
  return Object.values(ob).filter(Boolean).length === 0;
}

module.exports = {
  getEc2: getServiceCreator("EC2"),
  getLightsail: getServiceCreator("Lightsail"),
  getEKS: getServiceCreator("EKS"),
  getIAM: getServiceCreator("IAM"),
  isObjectEmpty,
};
