/**
 * Sample Kubernetes multi-document YAML manifest for the K8s Analyzer.
 *
 * Pre-loaded in the editor UI (Phase 45) as a starting point.
 * Includes valid resources alongside deliberate issues that trigger
 * multiple diagnostic rules — educational and realistic.
 *
 * Triggers: KA-S005 (schema), KA-S006 (deprecated), KA-S008 (name),
 * KA-S009 (labels), KA-S010 (empty document), KA-C001 (privileged),
 * KA-C006 (hostPID), KA-C008 (hostNetwork), KA-C015 (docker socket),
 * KA-C018 (secrets in env), KA-C019 (default namespace).
 */

export const SAMPLE_K8S_MANIFEST = `# Kubernetes Manifest — Online Store Example
# Demonstrates common resource types with a few deliberate issues

apiVersion: v1
kind: Namespace
metadata:
  name: online-store
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: online-store
data:
  DATABASE_HOST: "postgres.online-store.svc.cluster.local"
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: online-store
type: Opaque
data:
  DB_PASSWORD: cGFzc3dvcmQxMjM=
  API_KEY: c2VjcmV0LWFwaS1rZXk=
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-frontend
  namespace: online-store
  labels:
    app: web-frontend
    tier: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-frontend
  template:
    metadata:
      labels:
        app: web-frontend
        tier: frontend
    spec:
      containers:
        - name: nginx
          image: nginx:1.25
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: web-frontend-svc
  namespace: online-store
spec:
  selector:
    app: web-frontend
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web-ingress
  namespace: online-store
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: store.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web-frontend-svc
                port:
                  number: 80
---
# Issue: Schema error — replicas should be integer, not string (triggers KA-S005)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-backend
  namespace: online-store
spec:
  replicas: "three"
  selector:
    matchLabels:
      app: api-backend
  template:
    metadata:
      labels:
        app: api-backend
    spec:
      containers:
        - name: api
          image: myapp/api:2.1
          ports:
            - containerPort: 8080
---
# Issue: Deprecated API version (triggers KA-S006)
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: legacy-api
  namespace: online-store
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: api
          image: myapp/api:latest
---
# Issue: Invalid label key with spaces (triggers KA-S009)
apiVersion: v1
kind: ConfigMap
metadata:
  name: bad-labels-config
  namespace: online-store
  labels:
    "app name": web-frontend
    tier: frontend
data:
  KEY: value
---
# Issue: Invalid metadata.name with uppercase (triggers KA-S008)
apiVersion: v1
kind: ConfigMap
metadata:
  name: My_Invalid_Name
  namespace: online-store
data:
  KEY: value
---
# Issue: Security violations — privileged container, no capabilities drop
apiVersion: apps/v1
kind: Deployment
metadata:
  name: insecure-app
  namespace: online-store
  labels:
    app: insecure-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: insecure-app
  template:
    metadata:
      labels:
        app: insecure-app
    spec:
      containers:
        - name: app
          image: myapp/insecure:1.0
          securityContext:
            privileged: true
            allowPrivilegeEscalation: true
          ports:
            - containerPort: 8080
      initContainers:
        - name: init
          image: busybox:1.36
          command: ["sh", "-c", "echo init"]
---
# Issue: Host namespace sharing and sensitive volume mount
apiVersion: v1
kind: Pod
metadata:
  name: debug-pod
  namespace: default
spec:
  hostPID: true
  hostNetwork: true
  containers:
    - name: debug
      image: alpine:3.19
      command: ["sleep", "3600"]
      env:
        - name: DB_PASSWORD
          value: "s3cr3t-passw0rd"
  volumes:
    - name: docker-sock
      hostPath:
        path: /var/run/docker.sock
---
` as const;
