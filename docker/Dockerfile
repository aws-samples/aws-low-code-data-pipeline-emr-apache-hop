ARG ECR_ACCOUNT="755674844232"
ARG ECR_REGION="us-east-1"
ARG CONTAINER_TYPE="spark"
ARG CONTAINER_IMAGE="emr-6.8.0:latest"

FROM ${ECR_ACCOUNT}.dkr.ecr.${ECR_REGION}.amazonaws.com/${CONTAINER_TYPE}/${CONTAINER_IMAGE}
USER root
RUN amazon-linux-extras install java-openjdk11
RUN yum install -y java-11-openjdk-devel
RUN update-alternatives --set java /usr/lib/jvm/java-11-openjdk-$(yum list | grep "java-11-openjdk.x86_64" | awk '{ print substr($2,3) }').x86_64/bin/java
RUN update-alternatives --set javac /usr/lib/jvm/java-11-openjdk-$(yum list | grep "java-11-openjdk.x86_64" | awk '{ print substr($2,3) }').x86_64/bin/javac
ENV JAVA_HOME /etc/alternatives/java_sdk_11_openjdk
RUN export JAVA_HOME
USER hadoop:hadoop
CMD ["/bin/bash"]