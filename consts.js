const EXPIRES_INVALID_MESSAGE = "\"Expires\" param must be an integer";
const CLUSTER_REQUIRED_MESSAGE = "Cluster name is required";
const MISSING_OR_INCORRECT_CREDENTIALS_ERROR = "Missing or incorrect credentials - please select valid access and secret keys first";
const CORRUPTED_ROLE_POLICY_TEXT = (roleName) => `Failed to parse role policy for role "${roleName}".`;

const EKS_SERVICE_URL = "eks.amazonaws.com";

module.exports = {
  EXPIRES_INVALID_MESSAGE,
  CLUSTER_REQUIRED_MESSAGE,
  MISSING_OR_INCORRECT_CREDENTIALS_ERROR,
  CORRUPTED_ROLE_POLICY_TEXT,
  EKS_SERVICE_URL,
};
