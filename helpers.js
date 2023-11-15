const { SignatureV4 } = require("@smithy/signature-v4");
const { Sha256 } = require("@aws-crypto/sha256-js");

const { EKS_SERVICE_URL } = require("./consts");

function isObjectEmpty(ob) {
  return !!ob && Object.values(ob).filter(Boolean).length === 0;
}

function roleFilter({ RoleName, AssumeRolePolicyDocument }) {
  let policy;
  try {
    policy = JSON.parse(decodeURIComponent(AssumeRolePolicyDocument));
  } catch {
    throw new Error(`Failed to parse role policy for role "${RoleName}".`);
  }

  return policy.Statement.some(
    (item) => item.Principal.Service.includes(EKS_SERVICE_URL),
  );
}

function getTokenConfig(parameters) {
  if (!parameters.accessKeyId || !parameters.secretAccessKey) {
    throw new Error("Access Key ID and Secret Access Key are required parameters. Please specify them in the plugin account.");
  }

  return {
    accessKeyId: parameters.accessKeyId,
    secretAccessKey: parameters.secretAccessKey,
    // sessionToken: 'SESSION [Optional]',
    region: parameters.region || "us-east-1",
  };
}

async function fetchToken(params) {
  const { clusterName } = params;
  const tokenConfig = getTokenConfig(params);

  const signer = new SignatureV4({
    credentials: tokenConfig,
    region: tokenConfig.region,
    service: "sts",
    sha256: Sha256,
  });

  const request = await signer.presign(
    {
      headers: {
        host: `sts.${tokenConfig.region}.amazonaws.com`,
        "x-k8s-aws-id": clusterName,
      },
      hostname: `sts.${tokenConfig.region}.amazonaws.com`,
      method: "GET",
      path: "/",
      protocol: "https:",
      query: {
        Action: "GetCallerIdentity",
        Version: "2011-06-15",
      },
    },
    { expiresIn: 0 },
  );
  const query = Object.keys(request?.query ?? {})
    .map(
      (q) => `${encodeURIComponent(q)}=${encodeURIComponent(request.query?.[q])}`,
    )
    .join("&");
  const url = `https://${request.hostname}${request.path}?${query}`;
  const token = `k8s-aws-v1.${Buffer.from(url).toString("base64url")}`;

  return token;
}

module.exports = {
  isObjectEmpty,
  fetchToken,
  roleFilter,
};
