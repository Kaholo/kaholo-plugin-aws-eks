const EXPIRES_INVALID_MESSAGE = "\"Expires\" param must be an integer";
const CLUSTER_REQUIRED_MESSAGE = "Cluster name is required";
const MISSING_OR_INCORRECT_CREDENTIALS_ERROR = "Missing or incorrect credentials - please select valid access and secret keys first";
const ARN_REQUIRED_MESSAGE = "ARN is required.";
const VPC_SUBNETS_REQUIRED_MESSAGE = "VPC Subnet IDs are required. Please specify at least two.";
const VPC_SECURITY_GROUPS_REQUIRED_MESSAGE = "VPC Security Group IDs are required.";
const CORRUPTED_ROLE_POLICY_TEXT = (roleName) => `Failed to parse role policy for role "${roleName}".`;

const EKS_SERVICE_URL = "eks.amazonaws.com";

module.exports = {
  EXPIRES_INVALID_MESSAGE,
  CLUSTER_REQUIRED_MESSAGE,
  MISSING_OR_INCORRECT_CREDENTIALS_ERROR,
  ARN_REQUIRED_MESSAGE,
  VPC_SUBNETS_REQUIRED_MESSAGE,
  VPC_SECURITY_GROUPS_REQUIRED_MESSAGE,
  CORRUPTED_ROLE_POLICY_TEXT,
  EKS_SERVICE_URL,
};
