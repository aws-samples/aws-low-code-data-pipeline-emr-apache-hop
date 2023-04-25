#!/bin/sh
set -e

if [[ $# -ne 2 ]]; then
    echo "usage: bash build.sh AWS_ACCOUNT_ID REGION"
    exit
fi

# AWS Account you deploy the solution
ACCOUNT=$1

#Region to deploy
REGION=$2

export CDK_DEPLOY_ACCOUNT=$ACCOUNT
export CDK_DEPLOY_REGION=$REGION

npm install 

cdk bootstrap aws://${CDK_DEPLOY_ACCOUNT}/${CDK_DEPLOY_REGION}


cdk  deploy --all --require-approval=never
