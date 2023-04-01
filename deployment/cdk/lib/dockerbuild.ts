import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as AppConfig from './resources/app-config.json';
import { CfnOutput, Aws } from 'aws-cdk-lib';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';

export class DockerBuildStack extends cdk.Stack {
  public dockerUri: {[key : string] : string} = {};
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);
    const project = scope.node.tryGetContext('cdk-project');
    const projectSettings = this.node.tryGetContext(`project=${project}`);
    const ecrAccounts = this.node.tryGetContext('emr-on-eks-ecr-accounts');
    
    for ( let jobConfig of projectSettings["job-config"]){

        const dockerFile = jobConfig["docker-file"];
        const emrVersion = jobConfig["emr-version"];
        
        //replace the image release format with container tag format emr-6.8.0-latest to emr-6.8.0:latest
        const containerImage = emrVersion.replace(/^(emr-\d+\.\d+\.\d+)-(\w+)$/, "$1:$2") 
        
        const region = (props.env?.region) ?  props.env.region : "us-east-1";
        if (dockerFile){

          const asset = new DockerImageAsset(this, `${project}-CustomImage-${dockerFile}`, {
            directory: path.join(__dirname, '../../../docker'),
            file: dockerFile,
            buildArgs:{
                ECR_ACCOUNT:ecrAccounts[region],
                ECR_REGION:region,
                CONTAINER_IMAGE:containerImage,
                CONTAINER_TYPE:"spark"
            }
          });
          this.dockerUri[dockerFile] = asset.imageUri
        }
          
      }
    
  }
  

}
