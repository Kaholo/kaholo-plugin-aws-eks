const dayjs = require("dayjs");
const EKSToken = require("aws-eks-token");
const autocomplete = require("./autocomplete");
const { CLUSTER_REQUIRED_MESSAGE, EXPIRES_INVALID_MESSAGE } = require("./consts");
const parsers = require("./parsers");
const { getEKS, isObjectEmpty } = require("./helpers");

async function getToken({ params }, settings) {
  const clusterName = parsers.string(params.clusterName);
  const region = parsers.autocomplete(params.region);
  const expires = parsers.integer(params.expires) || 60;
  const secretAccessKey = parsers.string(params.secretAccessKey || settings.secretAccessKey);
  const accessKeyId = parsers.string(params.accessKeyId || settings.accessKeyId);

  if (!clusterName) {
    throw new Error(CLUSTER_REQUIRED_MESSAGE);
  }
  if (!Number.isInteger(expires)) {
    throw new Error(EXPIRES_INVALID_MESSAGE);
  }

  const config = { secretAccessKey, accessKeyId, region };
  const eks = getEKS(config);
  EKSToken.config = config;
  const reqTime = dayjs();
  const dateFormat = "YYYY-MM-DDTHH:mm:ss[Z]";

  const token = await EKSToken.renew(
    clusterName,
    expires,
    reqTime.utc().format(dateFormat),
  );
  const { cluster } = await eks.describeCluster({ name: clusterName }).promise();
  const expirationTime = reqTime.add(expires, "s").utc().format(dateFormat);
  return {
    expirationTimestamp: expirationTime,
    token,
    clusterHost: cluster.endpoint,
    clusterCA: cluster.certificateAuthority.data,
  };
}

async function createCluster({ params }, settings) {
  const clusterName = parsers.string(params.clusterName);
  const region = parsers.autocomplete(params.region);
  const accessKeyId = parsers.string(params.accessKeyId) || settings.accessKeyId;
  const secretAccessKey = parsers.string(params.secretAccessKey) || settings.secretAccessKey;
  const roleArn = parsers.autocomplete(params.roleArn);
  const kubernetesVersion = parsers.string(params.kubernetesVersion);
  const resourcesVpcConfig = {
    subnetIds: parsers.array(params.vpcSubnets),
    securityGroupIds: parsers.array(params.vpcSecurityGroups),
    endpointPrivateAccess: parsers.boolean(params.endpointPrivateAccess),
    endpointPublicAccess: parsers.boolean(params.endpointPublicAccess),
  };
  if (params.publicAccessCidrs) {
    resourcesVpcConfig.publicAccessCidrs = parsers.array(params.publicAccessCidrs);
  }
  const kubernetesNetworkConfig = {
    ipFamily: parsers.string(params.kubernetesIpFamily),
    serviceIpv4Cidr: parsers.string(params.kubernetesServiceIpv4Cidr),
  };
  const logs = {
    api: parsers.boolean(params.apiLogs),
    audit: parsers.boolean(params.auditLogs),
    authenticator: parsers.boolean(params.authenticatorLogs),
    controllerManager: parsers.boolean(params.controllerManagerLogs),
    scheduler: parsers.boolean(params.schedulerLogs),
  };
  const tags = parsers.object(params.tags);
  const encryption = {
    resources: parsers.array(params.encryptionResources),
    provider: {
      keyArn: parsers.string(params.encryptionResources),
    },
  };

  const clusterParams = {
    name: clusterName,
    roleArn,
  };
  if (kubernetesVersion) {
    clusterParams.version = kubernetesVersion;
  }
  if (!isObjectEmpty(resourcesVpcConfig)) {
    clusterParams.resourcesVpcConfig = resourcesVpcConfig;
  }
  if (!isObjectEmpty(kubernetesNetworkConfig)) {
    clusterParams.kubernetesNetworkConfig = kubernetesNetworkConfig;
  }
  if (!isObjectEmpty(logs)) {
    const keys = Object.keys(logs).filter((key) => !!logs[key]);
    clusterParams.logging = {
      clusterLogging: [
        {
          enabled: true,
          types: keys,
        },
      ],
    };
  }
  if (!isObjectEmpty(tags)) {
    clusterParams.tags = tags;
  }
  if (encryption.resources && !isObjectEmpty(encryption.provider)) {
    clusterParams.encryptionConfig = [encryption];
  }

  const eks = getEKS({ secretAccessKey, accessKeyId, region });
  const { cluster } = await eks.createCluster(clusterParams).promise();
  return cluster;
}

module.exports = {
  getToken,
  createCluster,
  ...autocomplete,
};
