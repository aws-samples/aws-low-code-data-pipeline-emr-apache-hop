import * as cdk from 'aws-cdk-lib';
import { EmrEksStack } from '../lib/emreks';
import { DockerBuildStack } from '../lib/dockerbuild';
import { HopResourcesNestedStack } from '../lib/hopresources';

import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { EmrEksCluster, Autoscaler } from 'aws-analytics-reference-architecture';
import { Construct } from 'constructs';


const mockApp = new cdk.App({
  context:{
  "emr-on-eks-ecr-accounts": {
    "ap-northeast-1": "059004520145",
    "ap-northeast-2": "996579266876",
    "ap-south-1": "235914868574",
    "ap-southeast-1": "671219180197",
    "ap-southeast-2": "038297999601",
    "ca-central-1": "351826393999",
    "eu-central-1": "107292555468",
    "eu-north-1": "830386416364",
    "eu-west-1": "483788554619",
    "eu-west-2": "118780647275",
    "eu-west-3": "307523725174",
    "sa-east-1": "052806832358",
    "us-east-1": "755674844232",
    "us-east-2": "711395599931",
    "us-west-1": "608033475327",
    "us-west-2": "895885662937"
  },
  "cdk-project": "hop",
  "project=hop": {
    "eks-role-arn": "arn:aws:iam::444975673530:role/Admin",
    "job-config": [
      {
        "workload-name": "apache-hop-demo",
        "emr-version": "emr-6.9.0-latest",
        "docker-file": "Dockerfile",
        "spark-driver-instance-types": [
          "m5.xlarge",
          "c5.xlarge"
        ],
        "spark-executor-instance-types": [
          "m5.4xlarge",
          "c5.4xlarge"
        ],
        "iam-policy": ""
      }
    ]
  }
  
  }
});


Aspects.of(mockApp).add(new AwsSolutionsChecks({verbose:true}));
   const env = { account: '121212', region: 'us-east-1'};

    
    const docker = new DockerBuildStack(mockApp,`DockerBuildStack`, { env:env});
    
    const emreks = new EmrEksStack(mockApp, `EmrEksStack`, {
      env: env,
      managedEndpointImageUri: docker.dockerUri
    });




NagSuppressions.addResourceSuppressions(emreks,  [
  { id: 'CdkNagValidationFailure', reason: 'ARA Library is verified separately' }
]);

NagSuppressions.addResourceSuppressionsByPath(emreks,'/EmrEksStack/hop-HopResourcesStack/hop-samples/Resource',[
  {id: 'AwsSolutions-S1', reason: 'the bucket is used for demo'},
  {id: 'AwsSolutions-S3', reason: 'the bucket is used for demo'}
]);

NagSuppressions.addResourceSuppressionsByPath(emreks,'/EmrEksStack/hop-HopResourcesStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C1024MiB3072MiB/ServiceRole/Resource',[
  {id: 'AwsSolutions-IAM4', reason: 'built-in CDK component'},
  {id: 'AwsSolutions-IAM5', reason: 'built-in CDK component'},
]);

NagSuppressions.addResourceSuppressionsByPath(emreks,'/EmrEksStack/hop-HopResourcesStack/Custom::CDKBucketDeployment8693BB64968944B69AAFB0CC9EB8756C1024MiB3072MiB/ServiceRole/DefaultPolicy/Resource',[
  {id: 'AwsSolutions-IAM5', reason: 'built-in CDK component'}
]);



//@see https://github.com/aws-samples/aws-analytics-reference-architecture/blob/main/core/test/unit/cdk-nag/nag-emr-eks.test.ts
NagSuppressions.addStackSuppressions(emreks,[
  { id: 'AwsSolutions-IAM4', reason: 'ARA Library is verified separately' },
  { id: 'AwsSolutions-IAM5', reason: 'ARA Library is verified separately' },
  { id: 'AwsSolutions-L1', reason: 'ARA Library is verified separately' },
  { id: 'AwsSolutions-EC23', reason: 'ARA Library is verified separately' },
  { id: 'AwsSolutions-S1', reason: 'ARA Library is verified separately'},
  { id: 'AwsSolutions-EKS1', reason: 'ARA Library is verified separately'}
],true);






test('docker No unsuppressed Warnings', () => {
  const warnings = Annotations.fromStack(docker).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('docker No unsuppressed Errors', () => {
  const errors = Annotations.fromStack(docker).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});



test('emrEks No unsuppressed Warnings ARA', () => {
  const warnings = Annotations.fromStack(emreks).findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(warnings);
  expect(warnings).toHaveLength(0);
});

test('emrEks No unsuppressed Errors ARA', () => {
  const errors = Annotations.fromStack(emreks).findError('*', Match.stringLikeRegexp('AwsSolutions-.*'));
  console.log(errors);
  expect(errors).toHaveLength(0);
});

