import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as metadataTemplate from './resources/metadata-template.json';
import * as fs from 'fs';
import { StackProps, Size } from 'aws-cdk-lib';
import { IBucket, Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';


export class HopResourcesNestedStack extends cdk.NestedStack {
  public s3Bucket:Bucket;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const project = scope.node.tryGetContext('cdk-project');
    this.s3Bucket = new Bucket(this,`${project}-samples`, {blockPublicAccess:BlockPublicAccess.BLOCK_ALL});
    
    metadataTemplate["pipeline-run-configuration"][0]["configurationVariables"][0]["value"] = 's3:\/\/'+this.s3Bucket.bucketName;

    const deployment = new BucketDeployment(this, 'DeployHopResources', {
      sources: [Source.asset('../../hop'), Source.jsonData('metadata.json', metadataTemplate)],
      destinationBucket: this.s3Bucket,
      retainOnDelete: false,
      ephemeralStorageSize:Size.gibibytes(3), 
      memoryLimit:1024
    });
  }
  

}
