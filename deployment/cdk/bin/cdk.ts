#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EmrEksStack } from '../lib/emreks';
import { DockerBuildStack } from '../lib/dockerbuild';
import { HopResourcesNestedStack } from '../lib/hopresources';



const app = new cdk.App();
// env: { account: '123456789012', region: 'us-east-1' },
const env = { account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION };
const project = app.node.tryGetContext('cdk-project');

const docker = new DockerBuildStack(app,`${project}-DockerBuildStack`, { env:env});

const emreks = new EmrEksStack(app, `${project}-EmrEksStack`, {
  env: env,
  managedEndpointImageUri: docker.dockerUri
});
emreks.addDependency(docker);
