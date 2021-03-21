# kaholo-plugin-aws-eks
AWS EKS plugin for Kaholo.
*Only one method: Get Token

## Settings
1. Access Key ID(string)
2. Secret Access key(vault)

## Method Get Token
Generate an authentication token for aws eks cluster using a specific user.

### Parameters
1. Access Key ID(string)
2. Secret Access key(vault)
3. AWS Region(autocomplete string)
4. EKS Cluster Name(string)
5. Token Expires(int) - Time in seconds until expiration of token. Default is 60.