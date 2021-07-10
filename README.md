### 1. docker build ###
docker image build was done with the Dockerfile. built image was tagged as the latest and pushed to my dockerhub for deployment.

```shell
docker build -t ronald20065/nodemongo . &&  docker push ronald20065/nodemongo
```
### 2. Helm chart ###

sample helm chart was created,
```shell
  helm create nodemongo
```
Changes done are as follows:

values.yaml file

docker image repository is dockhub and stored in "ronald20065/nodemongo". To proceed with latest tag
 pullPolicy was updated to Always. It will do image check and download to local server when ever the helm update is run.
 
```yaml
image:
  repository: ronald20065/nodemongo
  pullPolicy: Always

```

Application will have a service with below mentioned values. 

```yaml
service:
  type: NodePort
  port: 8080
  NodePort: 8080
  exposePort: 30000
  targetPort: 8080
  portinternalPort: 3000

```

ingress is deploied to exporse the service in normal way with port 80. nodemongo.com is set as the host
 value. Once this is deployed application will be accessible through nodemongo.com url locally.
  -nodemongo.com need to be added to the /etc/hosts file with the minikube ip
  - run (minikube addons enable ingress) to enable ingree addons if it is not enabled


basic values to start the mongodb was passed as follows. bitnamai mongo cahrd was used and values were
 set according to the Read.me file. Inorder to make mongodb a statfulset, useStatefulSet is set to True
(clear text values used for simplisity)

```yaml
mongodb:
  enabled: true
  type: provided
  useStatefulSet: true
  auth:
    username: newuser
    password: newuserpass
    database: nodemongodb
    rootPassword: rootpassword
  service:
    name: mongodb
    port: 27017
```

Chart.yaml 
2 dependancies were included in chart.yaml file as follows. 

```yaml
dependencies:
- name: nginx-ingress
  version: 1.41.2
  repository: alias:stable
- name: mongodb
  version: 10.3.3
  repository: alias:bitnami
  alias: mongodb
  condition: mongodb.enabled
```

below tow repos are used to get the dependancy charts. to add/update and include the dependancies 
run following commands.
```shell
  helm repo add stable https://charts.helm.sh/stable
  helm repo add bitnami https://charts.bitnami.com/bitnami
  helm repo update
  helm dep update ./nodemongo/
```
deployment.yaml

docker image needs environment variables to start the image, as it is mentioned in the server.js.
these vaules are fetched from values.yaml contect to below variables.

liveness-probe and rediness-probes were set to the /healthcheck 
```yaml
          env:
            - name: DB_HOST
              value: {{ .Release.Name }}-mongodb
            - name: DB_PORT
              value: "27017"
            - name: DB_NAME
              value: {{ .Values.mongodb.auth.database | quote }}
            - name: DB_USER
              value: {{ .Values.mongodb.auth.username }}
            - name: DB_PASSWORD
              value: {{ .Values.mongodb.auth.password }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          livenessProbe:
            httpGet:
              path: /healthcheck
              port: 8080
          readinessProbe:
            httpGet:
              path: /healthcheck
              port: 8080
```

to run the helm chart : 
```shell
helm install nodemongo ./nodemongo/
verify: kubectl get all
```

### 3. CI/CD ###
I have added helmcidi.yml for CI/CD which is a github work flow. It will be trigured on a commit to any file in /src/ directory. 
* DOCKERPW and KUBECONFIG are stored as secrets in github
* pipeline will build the image and push it to dockerhub as the latest tab
* next step is to update the helm dependancies with will download charts for nginx-ingress and mongodb
* helm will install the chart to the k8s cluster defined in KUBECONFIG



### 4. RDS - AWS ###

Files are in rds directory.
Solusioin was coded using Terraform v0.12.21 version. state file is by defualt will be saved locally. (mock values were insereted for vpc/subnet ). 
aws credentials were passed through a profile set in provider section. Resources created are-
* mysql security group
* mysql db instance
* db subnet group


```shell
terraform plan -var-file="vars.tfvar"
```
