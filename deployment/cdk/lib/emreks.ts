import { Construct } from 'constructs';
import { EmrEksCluster, Autoscaler } from 'aws-analytics-reference-architecture';
import { karpenterManifestSetup } from 'aws-analytics-reference-architecture/lib/emr-eks-platform/emr-eks-cluster-helpers';
import { NodegroupAmiType, TaintEffect, CapacityType, KubernetesVersion } from 'aws-cdk-lib/aws-eks';
import { InstanceType, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { ManagedPolicy, PolicyDocument, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Stack, ArnFormat, Aws,StackProps, CfnOutput } from 'aws-cdk-lib';
import { KubectlV24Layer } from '@aws-cdk/lambda-layer-kubectl-v24'; 
import { HopResourcesNestedStack } from './hopresources';
import * as AppConfig from './resources/app-config.json';

import { Bucket, IBucket } from 'aws-cdk-lib/aws-s3';

interface EmkEksProps extends StackProps {
   managedEndpointImageUri: {[key:string] :string}
}

interface appConfigProps {
   virtualClusterId: string,
   executionRoleArn: string,
   releaseLabel:string,
   s3DataBucketName:string,
   driverSelectorRole:string,
   executorSelectorRole:string,
   containerImage:string
}

export class EmrEksStack extends Stack {
  private project:string; 
  
  constructor(scope: Construct, id: string, props: EmkEksProps) {
    super(scope, id, props);
    
    const project = this.node.tryGetContext('cdk-project');
    this.project = `project-${props.env?.region}`;
    const projectSettings = this.node.tryGetContext(`project=${project}`);
    
    const clusterName = `${this.project}-cluster`;
    const emrClusterName = `${this.project}emrcluster`.replace(/[^a-z0-9]+/g,''); 
  
    
    // prepare S3bucket and copy data
    const hopresources = new HopResourcesNestedStack(this,`${this.project}-HopResourcesStack`);
    
    //S3 Bucket for Data
    const s3Bucket = hopresources.s3Bucket;  
    
    //EKS Cluster - 1 cluster per project
    const emrEksCluster = EmrEksCluster.getOrCreate(this,{ 
      eksAdminRoleArn: projectSettings["eks-role-arn"], 
      eksClusterName: clusterName, 
      defaultNodes: false,
      autoscaling: Autoscaler.KARPENTER,
      kubernetesVersion:KubernetesVersion.V1_24,
      kubectlLambdaLayer : new KubectlV24Layer(this, 'KubectlLayer')
    });
    
    
    const virtualCluster = emrEksCluster.addEmrVirtualCluster(this, {
     name: emrClusterName,
     createNamespace: true,
     eksNamespace: emrClusterName
    });


    // workspace can be linked to muiltiple users
    for ( let jobConfig of projectSettings["job-config"]){
      
        const endpointName = jobConfig["workload-name"];

        const subnets = emrEksCluster.eksCluster.vpc.selectSubnets({
            onePerAz: true,
            subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          }).subnets;

          subnets.forEach( (subnet, index) => {
            let driverManfifestYAML = karpenterManifestSetup(emrEksCluster.clusterName,`${__dirname}/resources/driver-provisioner.yml`, subnet);
            emrEksCluster.addKarpenterProvisioner(`karpenterNotebookDriverManifest-${endpointName}-${index}`, driverManfifestYAML);
        
            let executorManfifestYAML = karpenterManifestSetup(emrEksCluster.clusterName,`${__dirname}/resources/executor-provisioner.yml`, subnet);
            emrEksCluster.addKarpenterProvisioner(`karpenterNotebookExecutorManifest-${endpointName}-${index}`, executorManfifestYAML);
          })
        // IAM Policy 
        const iamPolicy = new ManagedPolicy(this, `${this.project}-${endpointName}-policy`,{
          document: jobConfig["iam-policy"] ? PolicyDocument.fromJson(jobConfig["iam-policy"]) : undefined,
          statements:[
            new PolicyStatement({
             resources: [
               Stack.of(this).formatArn({
                 account: Aws.ACCOUNT_ID,
                 region: Aws.REGION,
                 service: 'logs',
                 resource: '*',
                 arnFormat: ArnFormat.NO_RESOURCE_NAME,
               }),
            ],
            actions: [
            'logs:CreateLogGroup',
            'logs:PutLogEvents',
            'logs:CreateLogStream',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
            ],
          }),
          new PolicyStatement({
            resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*` ],
            actions: ['s3:ListBucket','s3:GetObject','s3:PutObject','s3:DeleteObject'],
          })
        
        ]});
        
        const role = emrEksCluster.createExecutionRole(this, `${this.project}-${endpointName}-ExecRole`,iamPolicy, emrClusterName, `${this.project}-${endpointName}-ExecRole`);
  
        const jobTemplate = emrEksCluster.addJobTemplate(this, `${this.project}-${endpointName}-jobtemplate`, {
          name:`${this.project}-${endpointName}-jobtemplate`,
          jobTemplateData:JSON.parse(JSON.stringify(AppConfig['jobTemplateData']))
        });
        
        const configCfn = new CfnOutput(this,`${this.project}-${endpointName}-submitJobTemplate`,{ 
          value: `aws emr-containers start-job-run --virtual-cluster-id=${virtualCluster.attrId} --job-template-id=${jobTemplate.ref} --job-template-parameters '{"executionRoleArn":"${role.roleArn}","emrReleaseLabel":"${jobConfig["emr-version"]}","s3DataBucket":"${s3Bucket.bucketName}","containerImage":"${props.managedEndpointImageUri[jobConfig["docker-file"]]}", "az":"${Aws.REGION}a"}'`
        });
        const roleCfn = new CfnOutput(this,`${this.project}-${endpointName}-execIamRoleArn`,{ value: role.roleArn});
        
    }
    const s3BucketCfn = new CfnOutput(this, `${this.project}-s3Bucket`, {value: s3Bucket.bucketName});
  }
  
}
