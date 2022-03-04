const { isObjectEmpty } = require("./helpers");
const parsers = require("./parsers");

function createPayloadForGetToken(params) {
  const clusterName = parsers.string(params.clusterName);
  const expires = parsers.integer(params.expires);
  return { clusterName, expires };
}

function createPayloadForCreateCluster(params) {
  const clusterName = parsers.string(params.clusterName);
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
  return clusterParams;
}

module.exports = {
  createPayloadForCreateCluster,
  createPayloadForGetToken,
};
