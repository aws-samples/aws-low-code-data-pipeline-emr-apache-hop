## Low Code Data pipelines on EMR using Apache Hop

Customers are often struggling with complexity of modern data processing frameworks such as Apache Spark or Flink. AWS-native low-code solutions GlueStudio or Glue DataBrew are able to cover some of the use-cases but they support small number of connectors. It is also a cumbersome and complicated process to do local development with AWS-native tools. The idea is to a blog post for Apache Hop - a data integration tool, supporting the local development and debugging and running the pipelines on AWS managed Spark (EMR, EMR on EKS, EMR Serverless) and Flink(EMR) services. Apache Hop can also be used for batched and streaming ETL workloads and can facilitate the data migration from other cloud providers because of built-in connectors for GCP and Azure.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Installation

We recommend using cloud9 instance to install the project.


1. Switch to `deployment/cdk` folder. 

```
$ cd deployment/cdk/

```

Open `deployment/cdk/cdk.context.json` located in cdk folder to confgure your deployment. CDK configuration allows you to create multiple independent projects using `cdk-project` parameter 
to set the active project name you want to deploy and `project=<cdk-project>` object to specify the project specific configuration. By default a single project named `hop` is created and you 
have to change a few parameters before deploying it in your environment.
    * `project=hop.eks-role-arn` should contain IAM role you assume when accessing your EKS cluster. Usually you would use different IAM Role to run your CDK deployment, so when new EKS cluster is created by CDK only CDK role will be added 
as a master role in EKS. 
    * [Optional] Change `project=hop.job-config[0].iam-policy` IAM policy to configure access to data and other AWS services your Hop pipelines needs to be able to connect to. Existing default policy only grants access to automcatically created S3 bucket (see `hop-s3Bucket` output variable in cloudformation template)

2. [Optional] Review and change `docker/Dockerfile` to include any additional python packages required for your workload. 

3. [Important] You need to generate `fatjar.jar` and upload it to `hop` folder. You can either install the standalone Hop GUI client and follow the instructions here https://hop.apache.org/manual/2.2.0/pipeline/beam/running-the-beam-samples.html. Alternatively you can use hop web docker image as below

```
docker run --name hop_latest -d -p 8080:8080  apache/hop-web:2.2.0-beam

```
Once container is started you can copy the fatjar into `hop` folder in the project like this (assuming your current folder is `development/cdk` )

```

docker cp hop_latest:/root/hop-fatjar.jar ../../hop/fatjar.jar

```
 
3. Deploy CDK template using bash script provided. Replace `<ACCOUNT_ID>` and `<REGION>` in the snippet below with your actual AWS account and deployed region.

```
$ bash ./deployment.sh <ACCOUNT_ID> <REGION>
```


4. During deployment the following resources will be provisioned 
    - EKS Cluster
    - EMR Virtual Cluster
    - S3 Bucket with Hop beam samples and `metadata.json` and `fatjar.jar` uploaded so then can be used to run pipeline. 
    - Relevant IAM roles and permissions
    - EMR Job Run Template with `/beam/pipelines/complex.tpl` as default pipeline to run. 

5. Open Cloudformation, select `hop-EmrEksStack` and switch to the `Outputs` tab. `hopapachehopdemosubmitJobTemplate` parameter contains AWS CLI command which you can copy and run using AWS Cloudshell or Cloud9 terminal. You can choose what pipeline to run by setting `beamPipeline` parameter as below:

```
aws emr-containers start-job-run --virtual-cluster-id=<POPULATED_BY_CFN> --job-template-id=<POPULATED_BY_CFN> --job-template-parameters '{"executionRoleArn":"<POPULATED_BY_CFN>","emrReleaseLabel":"<POPULATED_BY_CFN>","s3DataBucket":"<POPULATED_BY_CFN>",containerImage":"<POPULATED_BY_CFN>", "beamPipeline":"/beam/pipelines/input-process-output.tpl", "az":"<REGION>a"}'

``` 

 
