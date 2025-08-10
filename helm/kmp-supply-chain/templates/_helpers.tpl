{{/*
Expand the name of the chart.
*/}}
{{- define "kmp-supply-chain.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "kmp-supply-chain.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "kmp-supply-chain.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "kmp-supply-chain.labels" -}}
helm.sh/chart: {{ include "kmp-supply-chain.chart" . }}
{{ include "kmp-supply-chain.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: kmp-supply-chain
{{- end }}

{{/*
Selector labels
*/}}
{{- define "kmp-supply-chain.selectorLabels" -}}
app.kubernetes.io/name: {{ include "kmp-supply-chain.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "kmp-supply-chain.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "kmp-supply-chain.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Generate certificates for webhook admission controller
*/}}
{{- define "kmp-supply-chain.webhook-certs" -}}
{{- $altNames := list ( printf "%s.%s" (include "kmp-supply-chain.name" .) .Release.Namespace ) ( printf "%s.%s.svc" (include "kmp-supply-chain.name" .) .Release.Namespace ) -}}
{{- $ca := genCA "kmp-supply-chain-ca" 365 -}}
{{- $cert := genSignedCert ( include "kmp-supply-chain.name" . ) nil $altNames 365 $ca -}}
tls.crt: {{ $cert.Cert | b64enc }}
tls.key: {{ $cert.Key | b64enc }}
ca.crt: {{ $ca.Cert | b64enc }}
{{- end }}

{{/*
Database URL
*/}}
{{- define "kmp-supply-chain.databaseUrl" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "kmp-supply-chain.fullname" . }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
Redis URL
*/}}
{{- define "kmp-supply-chain.redisUrl" -}}
{{- if .Values.redis.enabled }}
redis://{{ include "kmp-supply-chain.fullname" . }}-redis-master:6379
{{- else }}
{{- .Values.externalRedis.url }}
{{- end }}
{{- end }} 