### 1. docker build ###
docker image build was done with the Dockerfile. the built image was tagged as the latest and pushed to my docker hub for deployment.

```shell
docker build -t ronald20065/nodemongo . &&  docker push ronald20065/nodemongo
```
### 2. Helm chart ###

sample helm chart was created using the below command
```shell
  helm create nodemongo
```
Changes done are as follows:

`values.yaml` file

docker image repository is dockhub and stored in "ronald20065/nodemongo". To proceed with the latest tag
 pullPolicy was updated to Always. It will do an image check and download to the local server whenever the helm update is run.
 
```yaml
image:
  repository: ronald20065/nodemongo
  pullPolicy: Always

```

Application will have a service with the below-mentioned values. 

```yaml
service:
  type: NodePort
  port: 8080
  NodePort: 8080
  exposePort: 30000
  targetPort: 8080
  portinternalPort: 3000

```

ingress is deployed to expose the service in a normal way with port 80. 'nodemongo.com' is set as the host
value. Once this is deployed application will be accessible through nodemongo.com URL locally.
  * nodemongo.com need to be added to the '/etc/host's file with the minikube ip
  * run (minikube addons enable ingress) to enable ingress addons if it is not enabled


basic values to start the mongodb was passed as follows. bitnamai mongo chart was used and values were
set according to the Read.me file. In order to make mongodb a statfulset, useStatefulSet is set to True
(clear text values used for simplicity of passwords rather than using secrets)

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

Below initContainer was created to start the application just after mongo service is up.
```yaml
 initContainers:
   - name: init-nodemongo
     image: busybox
     command: ['sh', '-c', 'until nslookup nodemongo-mongodb; do echo waiting for mongodb serrvicemeld; sleep 3; done;']
```
 
Two dependencies were included in `chart.yaml` file as follows. 

```yaml
dependencies:
- name: nginx-ingress
  version: 1.41.2
  repository: https://charts.helm.sh/stable
- name: mongodb
  version: 10.3.3
  repository: https://charts.bitnami.com/bitnami
  alias: mongodb
  condition: mongodb.enabled
```

To include the dependencies run the following command.
```shell
  helm dep update ./nodemongo/
```
`deployment.yaml`

docker image needs environment variables to start the image, as it is mentioned in the server.js.
these vaules are fetched from `values.yaml` content to the below variables.

liveness-probe and rediness-probes were set to the /healthcheck 
```yaml
          env:
            - name: DB_HOST
              value: {{ .Release.Name }}-{{ .Values.mongodb.service.name }}
            - name: DB_PORT
              value: {{ .Values.mongodb.service.port | quote }}
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
kubectl get all
```

### 3. CI/CD ###
I have added helmcidi.yml for CI/CD which is a GitHub work flow. It will be triggered on a commit to any file in /src/ directory. 
* DOCKERPW and KUBECONFIG are stored as secrets in github
* pipeline will build the image and push it to dockerhub as the latest tab
* Next step is to update the helm dependencies with will download charts for nginx-ingress and mongodb
* helm will install the chart to the k8s cluster defined in KUBECONFIG



### 4. RDS - AWS ###

Files are in rds directory.
The solution was coded using Terraform v0.12.21 version. the state file is by default will be saved locally. (mock values were inserted for vpc/subnet ). 
aws credentials were passed through a profile set in the provider section. Resources created are-
* mysql security group
* mysql db instance
* db subnet group


```shell
terraform plan -var-file="vars.tfvar"
```
