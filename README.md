# Kaholo AWS EKS Plugin
Amazon Elastic Kubernetes Service (EKS) is a managed service and certified Kubernetes conformant to run Kubernetes on AWS and on-premises. This plugin extends Kaholo's capabilities to include creating EKS clusters and getting authentication tokens for the clusters using AWS credentials. Once the cluster exists and a token collected, the cluster can then be use by other Kaholo plugins such as the [Kaholo Kubernetes Plugin](https://github.com/Kaholo/kaholo-plugin-kubernetes/blob/main/README.md) and [Kaholo Helm Plugin](https://github.com/Kaholo/kaholo-plugin-helm/blob/main/README.md).

## Prerequisites
Creating an EKS cluster requires an Amazon Web Services account with sufficient access to create EKS clusters, create IAM roles, and add a node group to the cluster.

## Access and Authentication
AWS uses two parameters for access and authentication, these are stored in the Kaholo Vault and configured via a Kaholo Account.
* Access Key ID, e.g. `AKIA3LQJ67DU53G3DNEW`
* Access Key Secret, e.g. `Hw8Il3qOGpOflIbCaMb0SxLAB2zk4naTBKiybsNx`

Only the Access Key Secret is a genuine secret that should be guarded carefully to avoid abuse of your account. For security purposes the Kaholo plugin stores both the Access Key ID and the Secret Access Key in the Kaholo vault. This allows them to be used widely without ever appearing in configuration, logs, or output.

The Access Key ID and Secret Access Key are a matched set of credentials that will work in any Region, subject to the security configuration of the user account to which these keys belong.

By default, only the AWS account (root or IAM) that *created* an EKS cluster can get a token to access and use the cluster. If using a combination of console login and service account CLI credentials, this can cause perplexing problems. Also, if other IAM users are to be granted access to get tokens and use the EKS cluster, there are additional steps to grant them such access. For that please consult the [AWS EKS documentation](https://docs.aws.amazon.com/eks/latest/userguide/add-user-role.html).

## Plugin Settings
There is one Plugin setting, Default AWS Region. Region simply determines the geographical location of the AWS data center where the underlying hardware actually runs, and to a degree which features are available and the price of the services. For example `ap-southeast-1` is AWS's data center in Singapore.

Any new AWS CLI plugin action created will by default have (if configured) this Default AWS Region. If the action requires another region or no region it can be changed after the action is created.

## Plugin Installation
For download, installation, upgrade, downgrade and troubleshooting of plugins in general, see [INSTALL.md](./INSTALL.md).

## EKS Cluster Creation Steps
Creating an EKS Cluster involves a multistep process, and may be accomplished in at least three different ways:
* This Kaholo Plugin - which uses npm package `aws-sdk` and has caveats, for example method "Create Node Group" has not yet been implemented.
* Using the AWS CLI or the [Kaholo AWS CLI Plugin](https://github.com/Kaholo/kaholo-plugin-aws-cli/blob/main/README.md)
* Using a CLI tool named `https://eksctl.io`, which can be installed and run on a Kaholo agent using the [Kaholo Command Line Plugin](https://github.com/Kaholo/kaholo-plugin-cmd/blob/master/README.md). If `eksctl` is your preferred method and a Kaholo EKSCTL Plugin would be helpful, please do [let us know](https://kaholo.io/contact/).

### Cluster Create Example
As an example to illustrate a complete process for EKS Cluster creation and use in Kaholo, the process involves the following steps:
1. Create an EKS Cluster (Kubernetes backplane only)
1. Create an IAM role for Node Groups
1. Assign sufficient policies to the IAM role
1. Create one or more Node Groups
1. Get a token
1. Use Kuberetes to deploy applications

Not all of these steps are implemented completely in this plugin. Often the creation and managment of an EKS cluster would be automated using AWS CloudFormation or an infrastructure management tool like Terraform, and possibly by a different group than those automating application deployment with Kaholo. If you would like to see one or more of these steps implemented in full in this plugin or the Kaholo AWS IAM Plugin, please [let us know](https://kaholo.io/contact/). For this example we'll use only what is currently available as of Q4 2023. Also if using Terraform, there is a [Kaholo Terraform Plugin](https://github.com/Kaholo/kaholo-plugin-terraform-cli/blob/master/README.md) that does the job nicely.

The first step and getting a token can be done using this plugin, methods "Create New Cluster" and "Get Token", respectively. For the steps to create IAM role, assign policies, and create one or more node groups, we'll use the [Kaholo AWS CLI Plugin](https://github.com/Kaholo/kaholo-plugin-aws-cli/blob/main/README.md) with the following example commands.

Create IAM role for Node Groups:

    aws iam create-role --role-name AmazonEKSNodeRole --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

Assign AWS-managed polices to Node Group role:

    aws iam attach-role-policy --role-name AmazonEKSNodeRole --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly

    aws iam attach-role-policy --role-name AmazonEKSNodeRole --policy-arn arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy

Create a Node Group

    aws eks create-nodegroup --cluster-name myCluster --nodegroup-name AmazonEKSNodeRole --subnets subnet-0de2example121c subnet-0290exampleb818 --instance-types t3.medium --ami-type AL2_x86_64 --node-role arn:aws:iam::123456789012:role/AmazonEKSNodeRole --scaling-config minSize=1,maxSize=2,desiredSize=1

## Method: Create New Cluster
Create a new EKS Cluster, specifically a kubernetes backplane without node groups or nodes.

### Parameter: Cluster Name
A name for the EKS cluster to create, e.g. `mynewcluster`

### Parameter: AWS Region
The AWS Region in which to create a cluster. Select a region from the autocomplete drop-down, e.g. `eu-central-1`.

### Parameter: ARN Role
The role that permits the EKS Kuberentes backplane to make calls to other EKS web services. Amazon supplies a preconfigured role named `AWSServiceRoleForAmazonEKS` for this if there is no custom role designed for your cluster.

### Parameter: VPC Subnet IDs
The VPC subnets the cluster should use, listed one per line, for example:

    subnet-0de2123456784121c
    subnet-029012345678fb818

### Parameter: VPC Security Group IDs
The EC2 security group(s) that should apply to grant/restrict access to the cluster, for example:

    sg-041612345678114be

### Parameter: Public Access
Enable this parameter to allow the EKS cluster endpoint to be reached from outside the VPC.

### Parameter: Private Access
Enable this parameter to allow the EKS cluster endpoint to be reached from within the VPC.

### Parameter: Public Access CIDRs
Provide CIDR notation IP address range(s) if restricting public access to the range(s) is required. Leave empty to default to `0.0.0.0/0`, i.e. all IP addresses allowed access. Note that network access alone does not provide useful access to kubernetes - a token is also required to gain useful access.

### Parameter: Kubernetes Service IPv4 CIDR
Specify a CIDR address range for kubernetes services to use, if a specific range is needed. Leave empty for kubernetes to arbitrarily choose its own range.

### Parameter: Kubernetes IP Family
Choose whether the cluster should use IPv4 or IPv6.

### Parameter: API Logs
Enable/Disable API logging feature for the EKS cluster.

### Parameter: Audit Logs
Enable/Disable Audit logging feature for the EKS cluster.

### Parameter: Authenticator Logs
Enable/Disable Authenticator logging feature for the EKS cluster.

### Parameter: Controller Manager Logs
Enable/Disable Controller Manager logging feature for the EKS cluster.

### Parameter: Scheduler Logs
Enable/Disable Scheduler logging feature for the EKS cluster.

### Parameter: Kubernetes Version
Specify which version of Kubernetes to use, or leave empty for the latest stable version.

### Parameter: Tags
Tag the EKS cluster if required as any AWS resource may be tagged.

### Parameter: Cluster Encryption Resources
Specify "secrets" if those are to be encrypted.

### Parameter: Cluster Encryption Provider Key
Provide the Amazon Resource Name (ARN) or alias of the KMS key if secrets are to be encrypted.

## Method: Get Token
This method gets a JWT token for an EKS cluster. The Final Result returns the expiry, token, end point, and CA certificate of the cluster. For example:

    {
    "expirationTimestamp": "2023-09-13T07:30:43Z",
    "token": "k8s-aws-v1.aHR0cHM6Ly9zdHMuYXAtc291dGhlYXN0LTEuYW1hem9uYXdzLmNvbS8_QWN0aW9uPUdldENhbGxlcklkZW50aXR5JlZlcnNpb249MjAxMS0wNi0xNSZYLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUEzTFFKNjdEVVpUQzRUUFA1JTJGMjAyMy0wOS0lMkZhcC1zb3V0aGVhc3QtMSUyRnN0cyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjMtMDktMTNUMDU6NTA6NDNaJlgtQW16LUV4cGlyZXM9NjAwMCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QlM0J4LWs4cy1hd3MtaWQmWC1BbXotU2lnbmF0dXJlPTg4NDc5YTNkZjQ4YmY5NmZlMDI2YjEyZWNjZDcwNzZmYWMxNWE3ODE3NmJkZWJlNmI3NWM0ZDBlY2EzYmZmYmU",
    "clusterHost": "https://5AA439DC12D626AC5947F7C37A406285.gr7.ap-southeast-1.eks.amazonaws.com",
    "clusterCA": "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURCVENDQWUyZ0F3SUJBZ0lJSFo2OTJaOE9QRkV3RFFZSktvWklodmNOQVFFTEJRQXdGVEVUTUJFR0ExVUUKQXhNS2EzVmlaWEp1WlhSbGN6QWVGdzB5TXpBNU1UTXdOVE16TkRWYUZ3MHpNekE1TVRBd05UTXpORFZhTUJVeApFekFSQmdOVkJBTVRDbXQxWW1WeWJtVjBaWE13Z2dFaU1BMEdDU3FHU0liM0RRRUJBUVVBQTRJQkR3QXdnZ0VLCkFvSUJBUURJekRsMHRyNU1VOW1WUUFHNUpFNVV0ZVF3dTd6WklKNjRSOTlnSmNEbFE3SDlzbmFpYUQ1N1hzNzIKd2dVL1BkdDA3NDZwdFQ5NVB4NUJrQ0JXaHJNY1BLS0pnbk9pL1hlVFZsdUNHVnNYLzJUSDBwZ2tIeXJYbTBvMgpjd2QxUDN3a01mR0JvRHhtUFhtRUx6c05UR1p1NUFFS3FKemp4bUVPU3RNSE1LK0hxc2g0N2ZnSFpBYXhQSDVoCkpSRFZ1b3Foa2x2Rlg1V0hsT01LbW9JSnU3UEh0ZllOV0VpaFJtMWw1ZUY0NGhLTWpobTBWbk1adFY4Tmcva0kKN2N3cENjMlZtd0FpTGlHbytpeDhzVHlRZ1hKbWNrUnhpMDlSR2hMTU5kanBObGx2WG10amdSMVplSSs4aXQvNApsT1dMaEViYUk2TGF5YmFsbXYrOUErS2o0Y1pYQWdNQkFBR2pXVEJYTUE0R0ExVWREd0VCL3dRRUF3SUNwREFQCkJnTlZIUk1CQWY4RUJUQURBUUgvTUIwR0ExVWREZ1FXQkJRK29uR3ZRd2JRQU02MU44WCtIWHUySVcyTnN6QVYKQmdOVkhSRUVEakFNZ2dwcmRXSmxjbTVsZEdWek1BMEdDU3FHU0liM0RRRUJDd1VBQTRJQkFRQ0J5RHhoTUdwcQpPemxINTd2MzFJc2ltazNFdHozU1ptZmlkWWNSYUEvSnMyK09tZVRHV2JwTDV0THRISGNySHByaHBkUzZ1WVRZCkpFRktnb3Q5RDFZWVg0Y0ZIQU9ONnRORmlpbklFZDBEV00wSUN3cGhiVVBxR2lTbmZZUzdzQmNFYnlPUzN6azcKZFhEdzRvN2JCMm5CYlNWd3kwNHBqNkdZL3lxaldPTjdtV0YyTFlaQ0VoZDNEUzUrbXZ5Zk9LRkZBbjVVcTI5OQpqam42VTVtcVhxU0pja3BFeE5SUzg5YWtxN1hJd04vdUk1aU1uNmhkQUk2Mk45aGhMU1BWMk5Kb3M2MS9iT3c2ClZvRkduUWhza3lCRXpBWUJJTno2TklETVFwVWEzdlQ4a0h1ODd1cnVYVzlhQTdFSmVCWE9YQ3daM0daL1UwWTYKa0Q0Z3hKRmlyVVovCi0tLS0tRU5EIENFUlRJRklDQVRFLS0tLS0K"
    }

Note the default expiry for an EKS token is short - one hour - and the maximum configurable expiry is seven days. This forces users to continuously provide AWS credentials in order to continue using the cluster, which is good for security but not automation. Using the recommended AWS methods would leave AWS credentials exposed on the Kaholo Agent.

As of Q4 2023, to use EKS a Kaholo user must run this method to get a valid token, copy the token into the Kaholo vault, and then create or reconfigure a plugin account for the Kubernetes or Helm plugin to use that token before it expires.

A more ideal way to manage the token would be a customized EKS-Kubernetes plugin that uses AWS credentials to get a token and then use the token to operate Kuberentes in a single method - effectively getting a new token with each action. If there is interest in such a plugin, please [let us know](https://kaholo.io/contact/).

### Parameter: EKS Cluster Name
The name of the EKS Cluster for which a token is requested.

### Parameter: AWS Region
The AWS Region in which the cluster can be found.
