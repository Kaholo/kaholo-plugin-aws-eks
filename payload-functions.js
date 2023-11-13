const { isObjectEmpty } = require("./helpers");

function prepareCreateClusterPayload(params) {
  const resourcesVpcConfig = {
    subnetIds: params.vpcSubnets,
    securityGroupIds: params.vpcSecurityGroups,
    endpointPrivateAccess: params.endpointPrivateAccess,
    endpointPublicAccess: params.endpointPublicAccess,
  };

  if (params.publicAccessCidrs) {
    resourcesVpcConfig.publicAccessCidrs = params.publicAccessCidrs;
  }
  const kubernetesNetworkConfig = {
    ipFamily: params.kubernetesIpFamily,
    serviceIpv4Cidr: params.kubernetesServiceIpv4Cidr,
  };
  const logs = {
    api: params.apiLogs,
    audit: params.auditLogs,
    authenticator: params.authenticatorLogs,
    controllerManager: params.controllerManagerLogs,
    scheduler: params.schedulerLogs,
  };
  const { tags } = params;
  const encryption = {
    resources: params.encryptionResources,
    provider: {
      keyArn: params.encryptionKey,
    },
  };

  const clusterParams = {
    name: params.clusterName,
    roleArn: params.roleArn,
  };
  if (params.kubernetesVersion) {
    clusterParams.version = params.kubernetesVersion;
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
  prepareCreateClusterPayload,
};
